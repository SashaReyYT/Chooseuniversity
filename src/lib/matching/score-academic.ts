import type {
  MatchDimensionResult,
  MatchUserProfile,
  ProgrammeWithDetails,
} from "./match-types";
import { MATCH_DIMENSION_LABELS } from "./match-types";
import type { MatchMessage } from "./messages";
import { rawMessage, translated } from "./messages";
import { roundScore } from "./utils";

/**
 * Academic Fit compares the user's GPA against the programme's minimum, on
 * a normalized 0–1 scale (gpa / gpa_scale) so different grading systems
 * (4.0, 5.0, 100-point, ...) compare fairly, and checks the programme's
 * non-language test requirements (NMT subjects, SAT/ACT, A-levels, ...)
 * against what the user actually has on file: `user_test_scores` results,
 * `user_qualifications` held certificates, and per-subject `user_nmt_scores`.
 *
 * Required subjects and entrance exams are surfaced as concerns rather
 * than scored numerically — the schema doesn't capture which subjects a
 * user has studied, so the engine can't verify either against the user's
 * data. Asserting a score there would be a guess dressed up as a
 * percentage, which is exactly what the product spec's explainability
 * requirement rules out. A field-of-study preference match is likewise
 * surfaced as a reason only, not scored — it signals relevance of
 * interest, not academic readiness.
 *
 * The numeric score averages the GPA signal with one signal per test
 * requirement (100 = met, 30 = evidence on file but below the threshold,
 * absent = no evidence yet). Unknown signals don't dilute known ones —
 * same pattern as Language Fit.
 */
export function scoreAcademicFit(
  profile: MatchUserProfile,
  programme: ProgrammeWithDetails,
): MatchDimensionResult {
  const reasons: MatchMessage[] = [];
  const concerns: MatchMessage[] = [];
  const requirement = programme.academic_requirements;

  let gpaSignal: number | null;

  if (!requirement || requirement.min_gpa == null || requirement.gpa_scale == null) {
    gpaSignal = 100;
  } else if (profile.current_gpa == null || profile.current_gpa_scale == null) {
    gpaSignal = null;
    concerns.push(translated("academic.missingGpa"));
  } else {
    const normalizedUser = profile.current_gpa / profile.current_gpa_scale;
    const normalizedRequired = requirement.min_gpa / requirement.gpa_scale;
    const ratio =
      normalizedRequired > 0 ? normalizedUser / normalizedRequired : 1;
    gpaSignal = roundScore(ratio * 100);

    if (gpaSignal >= 100) {
      reasons.push(translated("academic.meetsGpa"));
    } else if (gpaSignal >= 70) {
      concerns.push(translated("academic.gpaSlightlyBelow"));
    } else {
      concerns.push(translated("academic.gpaBelow"));
    }
  }

  if (requirement?.required_subjects?.length) {
    concerns.push(
      translated("academic.requiredSubjects", {
        subjects: requirement.required_subjects.join(", "),
      }),
    );
  }

  if (requirement?.entrance_exam_required) {
    concerns.push(
      requirement.entrance_exam_notes
        ? rawMessage(requirement.entrance_exam_notes)
        : translated("academic.entranceExamGeneric"),
    );
  }

  if (profile.preferred_field_of_study_ids?.includes(programme.field_of_study_id)) {
    reasons.push(
      translated("academic.fieldMatch", { field: programme.field_of_study.name }),
    );
  }

  // Test requirements outside the language category (§50 — language ones
  // are scored by Language Fit). Evidence for a requirement comes from
  // three places, checked in priority order:
  //   1. a recorded test score for the qualification (`user_test_scores`),
  //   2. a held certificate for the qualification (`user_qualifications`),
  //   3. an NMT subject result (`user_nmt_scores`) for requirements whose
  //      qualification is the NMT exam — matched on `subject`.
  const nonLanguageRequirements = programme.test_requirements.filter(
    (r) => r.qualification.category !== "language",
  );

  const userScoreForRequirement = (
    qualificationId: string,
    qualificationName: string,
  ) =>
    profile.testScores.find(
      (s) =>
        (s.qualification_id != null && s.qualification_id === qualificationId) ||
        (s.qualification_id == null &&
          s.test_type.toLowerCase() === qualificationName.toLowerCase()),
    );

  const heldQualificationFor = (qualificationId: string) =>
    profile.qualifications.some((q) => q.qualification_id === qualificationId);

  const nmtScoreForRequirement = (
    subject: string | null,
    qualificationCode: string,
  ) => {
    if (qualificationCode.toLowerCase() !== "nmt" || !subject) return null;
    return (
      profile.nmtScores.find(
        (s) => s.subject_code.toLowerCase() === subject.toLowerCase(),
      ) ?? null
    );
  };

  // Normalize both sides to a 0–1 fraction when the scales differ (e.g.
  // a legacy user score out of 100 vs a qualification max of 200); when
  // they match this is just a raw comparison.
  const meetsThreshold = (
    minScore: number,
    userScore: number,
    userMax: number,
    qualificationMax: number,
  ) => {
    const userFrac = userMax > 0 ? userScore / userMax : userScore;
    const reqFrac = qualificationMax > 0 ? minScore / qualificationMax : minScore;
    return userFrac >= reqFrac;
  };

  const testSignals: number[] = [];

  for (const r of nonLanguageRequirements) {
    const testScore = userScoreForRequirement(r.qualification_id, r.qualification.name);
    const held = heldQualificationFor(r.qualification_id);
    const nmtScore = nmtScoreForRequirement(r.subject, r.qualification.code);
    const minScore = r.minimum_score;
    const qualificationMax = r.qualification.max_score;

    if (testScore != null) {
      const meets =
        minScore == null ||
        meetsThreshold(minScore, testScore.score, qualificationMax ?? 0, qualificationMax ?? 0);
      testSignals.push(meets ? 100 : 30);
      if (meets) {
        reasons.push(
          translated("academic.meetsTestRequirement", {
            testType: r.subject
              ? `${r.qualification.name} ${r.subject}`
              : r.qualification.name,
            score: testScore.score,
            minScore: r.minimum_score_display ?? String(r.minimum_score ?? ""),
          }),
        );
      } else {
        concerns.push(
          translated("academic.belowTestRequirement", {
            testType: r.subject
              ? `${r.qualification.name} ${r.subject}`
              : r.qualification.name,
            score: testScore.score,
            minScore: r.minimum_score_display ?? String(r.minimum_score ?? ""),
          }),
        );
      }
    } else if (nmtScore != null) {
      const meets =
        minScore == null ||
        meetsThreshold(minScore, nmtScore.score, nmtScore.max_score, qualificationMax ?? 0);
      testSignals.push(meets ? 100 : 30);
      if (meets) {
        reasons.push(
          translated("academic.meetsTestRequirement", {
            testType: `${r.qualification.name} ${r.subject}`,
            score: nmtScore.score,
            minScore: r.minimum_score_display ?? String(r.minimum_score ?? ""),
          }),
        );
      } else {
        concerns.push(
          translated("academic.belowTestRequirement", {
            testType: `${r.qualification.name} ${r.subject}`,
            score: nmtScore.score,
            minScore: r.minimum_score_display ?? String(r.minimum_score ?? ""),
          }),
        );
      }
    } else if (held) {
      // A held certificate is positive signal, but it only satisfies a
      // threshold when the programme publishes none.
      if (r.minimum_score == null) {
        testSignals.push(100);
        reasons.push(
          translated("academic.hasQualification", {
            qualification: r.qualification.name,
          }),
        );
      } else {
        testSignals.push(30);
        concerns.push(
          translated("academic.qualificationUnverified", {
            qualification: r.qualification.name,
            minScore: r.minimum_score_display ?? String(r.minimum_score),
          }),
        );
      }
    } else {
      // No evidence for this requirement — known gap, not unknown.
      // Add a below-threshold signal so missing tests penalize the score.
      testSignals.push(30);
      concerns.push(
        translated("academic.missingTestRequirement", {
          testType: r.subject
            ? `${r.qualification.name} ${r.subject}`
            : r.qualification.name,
        }),
      );
    }
  }

  const signals = [gpaSignal, ...testSignals].filter((s): s is number => s != null);
  const score = signals.length > 0
    ? roundScore(signals.reduce((a, b) => a + b, 0) / signals.length)
    : null;

  return {
    key: "academic",
    label: MATCH_DIMENSION_LABELS.academic,
    score,
    applicable: score != null,
    reasons,
    concerns,
  };
}