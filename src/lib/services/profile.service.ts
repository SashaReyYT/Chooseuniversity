import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { UserProfileRepository } from "@/lib/repositories/user-profile.repository";
import { UserNmtScoresRepository } from "@/lib/repositories/user-nmt-scores.repository";
import { UserQualificationsRepository } from "@/lib/repositories/user-qualifications.repository";
import { UserTestScoresRepository } from "@/lib/repositories/user-test-scores.repository";
import { UserSubjectStrengthsRepository } from "@/lib/repositories/user-subject-strengths.repository";
import {
  UserLanguageProficiencyRepository,
  type LanguageProficiencyInput,
} from "@/lib/repositories/user-language-proficiency.repository";
import type { CefrLevel } from "@/types/database";

/** Matches the `user_subject_strengths.level` check constraint — a plainer
 * 3-point subset of the `math_background` enum (`poor`, not `weak`), used
 * for the subject self-rating (onboarding Q9 and the profile form), not the
 * (currently unused) profile-level field. */
export type SubjectStrengthLevel = "good" | "average" | "poor";

type UserProfileInsert =
  Database["public"]["Tables"]["user_profiles"]["Insert"];
type UserProfileUpdate =
  Database["public"]["Tables"]["user_profiles"]["Update"];

export interface NmtScoreInput {
  subjectCode: string;
  score: number;
  maxScore?: number;
  testYear?: number | null;
  isExpected?: boolean;
}

export interface QualificationScoreInput {
  qualificationId: string;
  score: number | null;
  year: number | null;
}

export interface EnglishTestScoreInput {
  qualificationId: string;
  testType: string;
  score: number;
  scoreDisplay: string;
}

export interface SubjectStrengthInput {
  subjectCode: string;
  level: SubjectStrengthLevel;
}

/**
 * Wraps the profile repository with the one business rule onboarding
 * needs: create the profile on first submission, update it on any
 * resubmission (re-doing onboarding, or a future "edit preferences"
 * screen), rather than callers needing to know which case they're in.
 *
 * Also orchestrates the questionnaire's test/qualification data (spec
 * §20–§22), which lives in separate tables (`user_nmt_scores`,
 * `user_qualifications`, `user_test_scores`) rather than on
 * `user_profiles` itself, since a user can have any number of scores.
 */
export class ProfileService {
  private readonly userProfile: UserProfileRepository;
  private readonly nmtScores: UserNmtScoresRepository;
  private readonly qualifications: UserQualificationsRepository;
  private readonly testScores: UserTestScoresRepository;
  private readonly subjectStrengths: UserSubjectStrengthsRepository;
  private readonly languageProficiency: UserLanguageProficiencyRepository;

  constructor(supabase: SupabaseClient<Database>) {
    this.userProfile = new UserProfileRepository(supabase);
    this.nmtScores = new UserNmtScoresRepository(supabase);
    this.qualifications = new UserQualificationsRepository(supabase);
    this.testScores = new UserTestScoresRepository(supabase);
    this.subjectStrengths = new UserSubjectStrengthsRepository(supabase);
    this.languageProficiency = new UserLanguageProficiencyRepository(supabase);
  }

  getForUser(userId: string) {
    return this.userProfile.findByUserId(userId);
  }

  /**
   * Everything the questionnaire wizard needs to pre-fill an existing
   * user's answers, including the test/qualification tables that live
   * outside `user_profiles`.
   */
  async getFullProfileForUser(userId: string) {
    const [
      profile,
      nmtScores,
      qualifications,
      testScores,
      subjectStrengths,
      languageProficiency,
    ] = await Promise.all([
      this.userProfile.findByUserId(userId),
      this.nmtScores.listByUserId(userId),
      this.qualifications.listByUserId(userId),
      this.testScores.listByUserId(userId),
      this.subjectStrengths.listByUserId(userId),
      this.languageProficiency.listByUserId(userId),
    ]);
    return {
      profile,
      nmtScores,
      qualifications,
      testScores,
      subjectStrengths,
      languageProficiency,
    };
  }

  async upsert(
    userId: string,
    changes: Omit<UserProfileUpdate, "id">,
  ) {
    const existing = await this.userProfile.findByUserId(userId);

    if (existing) {
      return this.userProfile.update(userId, changes);
    }

    return this.userProfile.create({
      id: userId,
      ...changes,
    } as UserProfileInsert);
  }

  /**
   * Replaces the user's NMT (ЗНО/НМТ) subject scores with exactly the set
   * submitted (spec §20) — un-selecting a subject on a later run of the
   * questionnaire removes its stored score rather than leaving it stale.
   */
  async replaceNmtScores(userId: string, scores: NmtScoreInput[]) {
    await Promise.all(
      scores.map((entry) =>
        this.nmtScores.upsert({
          user_id: userId,
          subject_code: entry.subjectCode,
          score: entry.score,
          max_score: entry.maxScore ?? 200,
          test_year: entry.testYear ?? null,
          score_is_expected: entry.isExpected ?? false,
        }),
      ),
    );
    await this.nmtScores.deleteNotIn(
      userId,
      scores.map((entry) => entry.subjectCode),
    );
  }

  /**
   * Replaces the user's per-language self-assessed proficiency (onboarding
   * Q7) with exactly the set submitted.
   */
  async replaceLanguageProficiency(
    userId: string,
    entries: LanguageProficiencyInput[],
  ) {
    await this.languageProficiency.replace(userId, entries);
  }

  /**
   * Replaces the user's other qualifications (SAT/ACT/IB/etc, spec §21)
   * with exactly the set submitted.
   */
  async replaceQualifications(
    userId: string,
    entries: QualificationScoreInput[],
  ) {
    await Promise.all(
      entries.map((entry) =>
        this.qualifications.upsert({
          user_id: userId,
          qualification_id: entry.qualificationId,
          details: entry.score != null ? { score: entry.score } : {},
          year: entry.year,
        }),
      ),
    );
    await this.qualifications.deleteNotIn(
      userId,
      entries.map((entry) => entry.qualificationId),
    );
  }

  /**
   * Stores the user's English proficiency test result (spec §22), or
   * clears it if the questionnaire was resubmitted without one.
   */
  async setEnglishTestScore(
    userId: string,
    entry: EnglishTestScoreInput | null,
    cefrEquivalent: CefrLevel | null,
  ) {
    await this.testScores.deleteByTestTypes(
      userId,
      entry ? [entry.testType] : [],
    );
    if (!entry) return;

    await this.testScores.upsert({
      user_id: userId,
      test_type: entry.testType,
      qualification_id: entry.qualificationId,
      score: entry.score,
      score_display: entry.scoreDisplay,
      cefr_equivalent: cefrEquivalent,
    });
  }

  /**
   * Replaces the user's self-assessed subject strengths (asked instead of
   * NMT scores when `has_graduated` is false — a current school student has
   * no exam result to report yet, but can say how strong they are in a
   * subject). Reuses the `math_background` scale for consistency.
   */
  async replaceSubjectStrengths(userId: string, strengths: SubjectStrengthInput[]) {
    await Promise.all(
      strengths.map((entry) =>
        this.subjectStrengths.upsert({
          user_id: userId,
          subject_code: entry.subjectCode,
          level: entry.level,
        }),
      ),
    );
    await this.subjectStrengths.deleteNotIn(
      userId,
      strengths.map((entry) => entry.subjectCode),
    );
  }
}