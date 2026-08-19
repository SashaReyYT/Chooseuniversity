import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { UserProfileRepository } from "@/lib/repositories/user-profile.repository";
import { UserNmtScoresRepository } from "@/lib/repositories/user-nmt-scores.repository";
import { UserQualificationsRepository } from "@/lib/repositories/user-qualifications.repository";
import { UserTestScoresRepository } from "@/lib/repositories/user-test-scores.repository";
import { UserLanguageProficiencyRepository } from "@/lib/repositories/user-language-proficiency.repository";
import { UserSubjectStrengthsRepository } from "@/lib/repositories/user-subject-strengths.repository";
import type { CefrLevel } from "@/types/database";

type UserProfileInsert =
  Database["public"]["Tables"]["user_profiles"]["Insert"];
type UserProfileUpdate =
  Database["public"]["Tables"]["user_profiles"]["Update"];

export interface NmtScoreInput {
  subjectCode: string;
  score: number;
  scoreIsExpected?: boolean;
}

export interface QualificationScoreInput {
  qualificationId: string;
  score: number | null;
  year: number | null;
}

export interface EnglishTestScoreInput {
  qualificationId: string | null;
  testType: string;
  score: number;
  scoreDisplay: string;
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
  private readonly languageProficiency: UserLanguageProficiencyRepository;
  private readonly subjectStrengths: UserSubjectStrengthsRepository;

  constructor(supabase: SupabaseClient<Database>) {
    this.userProfile = new UserProfileRepository(supabase);
    this.nmtScores = new UserNmtScoresRepository(supabase);
    this.qualifications = new UserQualificationsRepository(supabase);
    this.testScores = new UserTestScoresRepository(supabase);
    this.languageProficiency = new UserLanguageProficiencyRepository(supabase);
    this.subjectStrengths = new UserSubjectStrengthsRepository(supabase);
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
    const [profile, nmtScores, qualifications, testScores, languageProficiency, subjectStrengths] =
      await Promise.all([
        this.userProfile.findByUserId(userId),
        this.nmtScores.listByUserId(userId),
        this.qualifications.listByUserId(userId),
        this.testScores.listByUserId(userId),
        this.languageProficiency.listByUserId(userId),
        this.subjectStrengths.listByUserId(userId),
      ]);
    return { profile, nmtScores, qualifications, testScores, languageProficiency, subjectStrengths };
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
          score_is_expected: entry.scoreIsExpected ?? false,
        }),
      ),
    );
    await this.nmtScores.deleteNotIn(
      userId,
      scores.map((entry) => entry.subjectCode),
    );
  }

  /** Replaces the user's per-language proficiency answers (onboarding Q7). */
  async replaceLanguageProficiency(
    userId: string,
    entries: { languageCode: string; level: "good" | "average" | "poor" | "not_sure" }[],
  ) {
    await this.languageProficiency.replace(userId, entries);
  }

  /** Replaces the user's per-subject strength answers (onboarding Q9). */
  async replaceSubjectStrengths(
    userId: string,
    entries: { subjectCode: string; level: "good" | "average" | "poor" }[],
  ) {
    await this.subjectStrengths.replace(userId, entries);
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
}
