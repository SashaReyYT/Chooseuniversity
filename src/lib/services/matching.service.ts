import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { ProgrammesRepository } from "@/lib/repositories/programmes.repository";
import { UserProfileRepository } from "@/lib/repositories/user-profile.repository";
import { UserTestScoresRepository } from "@/lib/repositories/user-test-scores.repository";
import { computeMatchScore } from "@/lib/matching/engine";
import type {
  MatchResult,
  MatchUserProfile,
  ProgrammeWithDetails,
} from "@/lib/matching/types";

export interface RankedMatch {
  programme: ProgrammeWithDetails;
  match: MatchResult;
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
  private readonly userProfile: UserProfileRepository;
  private readonly userTestScores: UserTestScoresRepository;

  constructor(supabase: SupabaseClient<Database>) {
    this.programmes = new ProgrammesRepository(supabase);
    this.userProfile = new UserProfileRepository(supabase);
    this.userTestScores = new UserTestScoresRepository(supabase);
  }

  /**
   * Ranked matches for a user, best fit first. Programmes where the
   * engine couldn't compute any applicable dimension (overallScore is
   * null) are sorted last rather than dropped — the user should still be
   * able to see them and understand why no score is shown, per the
   * product's explainability principle.
   */
  async listMatchesForUser(userId: string): Promise<RankedMatch[]> {
    const [profileRow, testScores, programmes] = await Promise.all([
      this.userProfile.findByUserId(userId),
      this.userTestScores.listByUserId(userId),
      this.programmes.listWithDetails(),
    ]);

    if (!profileRow) {
      throw new Error(
        `No profile found for user ${userId} — complete onboarding before requesting matches.`,
      );
    }

    const profile: MatchUserProfile = {
      current_gpa: profileRow.current_gpa,
      current_gpa_scale: profileRow.current_gpa_scale,
      budget_min: profileRow.budget_min,
      budget_max: profileRow.budget_max,
      budget_currency: profileRow.budget_currency,
      preferred_degree_level: profileRow.preferred_degree_level,
      preferred_country_codes: profileRow.preferred_country_codes,
      preferred_cities: profileRow.preferred_cities,
      preferred_field_of_study_ids: profileRow.preferred_field_of_study_ids,
      preferred_language_codes: profileRow.preferred_language_codes,
      testScores: testScores.map((s) => ({
        test_type: s.test_type,
        score: s.score,
      })),
    };

    const ranked = programmes.map((programme) => ({
      programme,
      match: computeMatchScore(profile, programme),
    }));

    ranked.sort((a, b) => (b.match.overallScore ?? -1) - (a.match.overallScore ?? -1));

    return ranked;
  }

  /** Match result for a single programme — used on a programme's detail page rather than a full ranked list. */
  async getMatchForProgramme(
    userId: string,
    programmeId: string,
  ): Promise<RankedMatch | null> {
    const [profileRow, testScores, programme] = await Promise.all([
      this.userProfile.findByUserId(userId),
      this.userTestScores.listByUserId(userId),
      this.programmes.findById(programmeId),
    ]);

    if (!profileRow || !programme) return null;

    const profile: MatchUserProfile = {
      current_gpa: profileRow.current_gpa,
      current_gpa_scale: profileRow.current_gpa_scale,
      budget_min: profileRow.budget_min,
      budget_max: profileRow.budget_max,
      budget_currency: profileRow.budget_currency,
      preferred_degree_level: profileRow.preferred_degree_level,
      preferred_country_codes: profileRow.preferred_country_codes,
      preferred_cities: profileRow.preferred_cities,
      preferred_field_of_study_ids: profileRow.preferred_field_of_study_ids,
      preferred_language_codes: profileRow.preferred_language_codes,
      testScores: testScores.map((s) => ({
        test_type: s.test_type,
        score: s.score,
      })),
    };

    return { programme, match: computeMatchScore(profile, programme) };
  }
}
