import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { ProgrammesRepository } from "@/lib/repositories/programmes.repository";
import { ReferenceDataRepository } from "@/lib/repositories/reference-data.repository";
import { UserProfileRepository } from "@/lib/repositories/user-profile.repository";
import { UserTestScoresRepository } from "@/lib/repositories/user-test-scores.repository";
import { UserNmtScoresRepository } from "@/lib/repositories/user-nmt-scores.repository";
import { UserQualificationsRepository } from "@/lib/repositories/user-qualifications.repository";
import { UserMatchWeightsRepository } from "@/lib/repositories/user-match-weights.repository";
import { computeMatchScore } from "@/lib/matching/engine";
import { hasHardRequirementFailure } from "@/lib/matching/hard-requirements";
import {
  matchCacheKey,
  cacheGet,
  cacheSet,
} from "@/lib/matching/match-cache";
import type { CurrencyRateTable } from "@/lib/matching/currency";
import type {
  MatchResult,
  MatchUserProfile,
  ProgrammeWithDetails,
} from "@/lib/matching/match-types";

export interface RankedMatch {
  programme: ProgrammeWithDetails;
  match: MatchResult;
}

/**
 * Search/filter/sort params shared with `ProgrammesRepository.search`
 * (spec §35–36) — kept as its own type so `listMatchesForUser` doesn't
 * need to import the repository's param shape directly.
 */
export interface MatchSearchFilters {
  query?: string;
  fieldOfStudyId?: string;
  degreeLevel?: string;
  city?: string;
  universityId?: string;
  languageCode?: string;
  tuitionMax?: number;
  livingCostMax?: number;
  sortBy?: "best_match" | "lowest_tuition" | "highest_match" | "lowest_cost";
  countryCode?: string;
  programmeIds?: string[];
}

/**
 * Orchestrates matching for a user: loads their profile + test scores and
 * the programme catalog via the repository layer, then runs each
 * programme through the deterministic matching engine. Contains no
 * scoring logic itself — that all lives in `src/lib/matching` — this is
 * purely wiring + sorting.
 */
export class MatchingService {
  private readonly programmes: ProgrammesRepository;
  private readonly referenceData: ReferenceDataRepository;
  private readonly userProfile: UserProfileRepository;
  private readonly userTestScores: UserTestScoresRepository;
  private readonly userNmtScores: UserNmtScoresRepository;
  private readonly userQualifications: UserQualificationsRepository;
  private readonly userMatchWeights: UserMatchWeightsRepository;

  constructor(supabase: SupabaseClient<Database>) {
    this.programmes = new ProgrammesRepository(supabase);
    this.referenceData = new ReferenceDataRepository(supabase);
    this.userProfile = new UserProfileRepository(supabase);
    this.userTestScores = new UserTestScoresRepository(supabase);
    this.userNmtScores = new UserNmtScoresRepository(supabase);
    this.userQualifications = new UserQualificationsRepository(supabase);
    this.userMatchWeights = new UserMatchWeightsRepository(supabase);
  }

  /**
   * Loads `currency_rates` into the `{ currency: rate }` shape the
   * (deliberately DB-free) matching engine expects — see
   * `CurrencyRateTable` in `src/lib/matching/currency.ts`.
   */
  private async loadCurrencyRates(): Promise<CurrencyRateTable> {
    const rows = await this.referenceData.listCurrencyRates();
    const rates: CurrencyRateTable = {};
    for (const row of rows) {
      rates[row.currency] = row.rate_to_eur;
    }
    return rates;
  }

  /**
   * Loads the user's profile row, test scores, NMT scores, held
   * qualifications and match weights, mapped into the engine's
   * `MatchUserProfile` shape. Returns `profile: null` when the user
   * hasn't completed onboarding — callers decide how to handle that.
   */
  private async loadMatchData(userId: string): Promise<{
    profile: MatchUserProfile | null;
    weights: import("@/lib/matching/match-types").MatchWeights;
  }> {
    const [profileRow, testScores, nmtScores, qualifications, weights] = await Promise.all([
      this.userProfile.findByUserId(userId),
      this.userTestScores.listByUserId(userId),
      this.userNmtScores.listByUserId(userId),
      this.userQualifications.listByUserId(userId),
      this.userMatchWeights.findByUserId(userId),
    ]);

    if (!profileRow) {
      return { profile: null, weights: {} };
    }

    const profile: MatchUserProfile = {
      current_education_level: profileRow.current_education_level,
      current_gpa: profileRow.current_gpa,
      current_gpa_scale: profileRow.current_gpa_scale,
      budget_min: profileRow.budget_min,
      budget_max: profileRow.budget_max,
      budget_currency: profileRow.budget_currency,
      budget_mode: profileRow.budget_mode,
      preferred_degree_level: profileRow.preferred_degree_level,
      preferred_country_codes: profileRow.preferred_country_codes,
      preferred_cities: profileRow.preferred_cities,
      preferred_field_of_study_ids: profileRow.preferred_field_of_study_ids,
      preferred_language_codes: profileRow.preferred_language_codes,
      location_preference_type: profileRow.location_preference_type,
      preferred_ownership_type: profileRow.preferred_ownership_type,
      preferred_study_format: profileRow.preferred_study_format,
      support_preference: profileRow.support_preference,
      english_level: profileRow.english_level,
      math_background: profileRow.math_background,
      has_graduated: profileRow.has_graduated,
      career_priorities: profileRow.career_priorities ?? [],
      lifestyle_preferences: profileRow.lifestyle_preferences ?? [],
      testScores: testScores.map((s) => ({
        test_type: s.test_type,
        qualification_id: s.qualification_id,
        score: s.score,
        cefr_equivalent: s.cefr_equivalent,
      })),
      nmtScores: nmtScores.map((s) => ({
        subject_code: s.subject_code,
        score: s.score,
        max_score: s.max_score,
      })),
      qualifications: qualifications.map((q) => ({
        qualification_id: q.qualification_id,
        year: q.year,
      })),
    };

    return { profile, weights: weights ?? {} };
  }

  /**
   * Ranked matches for a user, best fit first. Programmes where the
   * engine couldn't compute any applicable dimension (overallScore is
   * null) are sorted last rather than dropped — the user should still be
   * able to see them and understand why no score is shown, per the
   * product's explainability principle.
   *
   * `filters` (spec §35–36 — search/filter/sort) are applied server-side
   * via `ProgrammesRepository.search`, the same query the no-profile
   * browse path uses — so a user with a completed profile gets the same
   * search/filter/sort controls as one who hasn't finished onboarding,
   * with their personalized Match Score layered on top rather than
   * replaced by it. Omitting `filters` (or passing `{}`) returns every
   * programme, matching the previous unfiltered behavior.
   */
  async listMatchesForUser(
    userId: string,
    filters: MatchSearchFilters = {},
  ): Promise<RankedMatch[]> {
    // Profile first: its updated_at is part of the cache key, so any edit
    // to the questionnaire naturally produces a fresh computation while
    // repeat visits within the TTL skip the heavy catalogue pass entirely.
    const profileRow = await this.userProfile.findByUserId(userId);
    if (!profileRow) {
      throw new Error(
        `No profile found for user ${userId} — complete onboarding before requesting matches.`,
      );
    }

    const cacheKey = matchCacheKey(userId, profileRow.updated_at, filters);
    const cached = cacheGet<RankedMatch[]>(cacheKey);
    if (cached) return cached;

    const [programmes, currencyRates, { profile, weights }] = await Promise.all([
      this.programmes.search(filters),
      this.loadCurrencyRates(),
      this.loadMatchData(userId),
    ]);

    if (!profile) {
      throw new Error(
        `No profile found for user ${userId} — complete onboarding before requesting matches.`,
      );
    }

    const ranked = programmes
      .map((programme) => ({
        programme,
        match: computeMatchScore(profile, programme, new Date(), weights, currencyRates),
      }))
      // Exclude programmes where the user clearly fails a hard requirement
      // (e.g. wrong degree level, wrong field of study, insufficient language).
      .filter((r) => !hasHardRequirementFailure(r.match.hardRequirements));

    sortRankedMatches(ranked, filters.sortBy);

    cacheSet(cacheKey, ranked);
    return ranked;
  }

  /** Match result for a single programme — used on a programme's detail page rather than a full ranked list. */
  async getMatchForProgramme(
    userId: string,
    programmeId: string,
  ): Promise<RankedMatch | null> {
    const [programme, currencyRates, { profile, weights }] = await Promise.all([
      this.programmes.findById(programmeId),
      this.loadCurrencyRates(),
      this.loadMatchData(userId),
    ]);

    if (!profile || !programme) return null;

    return {
      programme,
      match: computeMatchScore(profile, programme, new Date(), weights, currencyRates),
    };
  }
}

/**
 * Sorts ranked matches in place per the requested sort (spec §36):
 * lowest tuition / lowest estimated cost sort ascending on that field
 * (nulls last — an unknown cost shouldn't rank as "cheapest"), and
 * "best_match"/"highest_match"/unset falls back to the existing
 * highest-Match-Score-first behavior. Exported (not just used internally)
 * so it can be unit-tested without a Supabase client.
 *
 * Tie-breaking for best_match/highest_match (deterministic so the same
 * programme always lands at index 0 when several hit 100%):
 *  1. overallScore desc
 *  2. confidence desc (high > medium > low)
 *  3. failed hard requirements asc
 *  4. concerns count asc
 *  5. tuition_min asc (cheaper wins ties)
 *  6. university name asc (stable)
 */
export function sortRankedMatches(
  ranked: RankedMatch[],
  sortBy: MatchSearchFilters["sortBy"],
): void {
  switch (sortBy) {
    case "lowest_tuition":
      ranked.sort(
        (a, b) =>
          (a.programme.tuition_min ?? Number.POSITIVE_INFINITY) -
          (b.programme.tuition_min ?? Number.POSITIVE_INFINITY),
      );
      return;
    case "lowest_cost":
      ranked.sort(
        (a, b) =>
          (a.programme.estimated_living_cost_monthly ?? Number.POSITIVE_INFINITY) -
          (b.programme.estimated_living_cost_monthly ?? Number.POSITIVE_INFINITY),
      );
      return;
    case "best_match":
    case "highest_match":
    default:
      ranked.sort((a, b) => {
        const sa = a.match.overallScore ?? -1;
        const sb = b.match.overallScore ?? -1;
        if (sa !== sb) return sb - sa;

        const confidenceOrder = { high: 3, medium: 2, low: 1 };
        const ca = confidenceOrder[a.match.confidence] ?? 0;
        const cb = confidenceOrder[b.match.confidence] ?? 0;
        if (ca !== cb) return cb - ca;

        const failedA = a.match.hardRequirements.filter((r) => r.status === "fail").length;
        const failedB = b.match.hardRequirements.filter((r) => r.status === "fail").length;
        if (failedA !== failedB) return failedA - failedB;

        const concernsA = a.match.concerns.length;
        const concernsB = b.match.concerns.length;
        if (concernsA !== concernsB) return concernsA - concernsB;

        const tuitionA = a.programme.tuition_min ?? Number.POSITIVE_INFINITY;
        const tuitionB = b.programme.tuition_min ?? Number.POSITIVE_INFINITY;
        if (tuitionA !== tuitionB) return tuitionA - tuitionB;

        return a.programme.university.name.localeCompare(b.programme.university.name);
      });
  }
}