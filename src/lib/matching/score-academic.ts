import type {
  MatchDimensionResult,
  MatchUserProfile,
  ProgrammeWithDetails,
} from "./types";
import { MATCH_DIMENSION_LABELS } from "./types";
import type { MatchMessage } from "./messages";
import { rawMessage, translated } from "./messages";
import { roundScore } from "./utils";

/**
 * Academic Fit compares the user's GPA against the programme's minimum, on
 * a normalized 0–1 scale (gpa / gpa_scale) so different grading systems
 * (4.0, 5.0, 100-point, ...) compare fairly.
 *
 * Required subjects and entrance exams are surfaced as concerns rather
 * than scored numerically — the schema doesn't capture which subjects a
 * user has studied, so the engine can't verify either against the user's
 * data. Asserting a score there would be a guess dressed up as a
 * percentage, which is exactly what the product spec's explainability
 * requirement rules out. A field-of-study preference match is likewise
 * surfaced as a reason only, not scored — it signals relevance of
 * interest, not academic readiness.
 */
export function scoreAcademicFit(
  profile: MatchUserProfile,
  programme: ProgrammeWithDetails,
): MatchDimensionResult {
  const reasons: MatchMessage[] = [];
  const concerns: MatchMessage[] = [];
  const requirement = programme.academic_requirements;

  let score: number | null;

  if (!requirement || requirement.min_gpa == null || requirement.gpa_scale == null) {
    score = 100;
  } else if (profile.current_gpa == null || profile.current_gpa_scale == null) {
    score = null;
    concerns.push(translated("academic.missingGpa"));
  } else {
    const normalizedUser = profile.current_gpa / profile.current_gpa_scale;
    const normalizedRequired = requirement.min_gpa / requirement.gpa_scale;
    const ratio =
      normalizedRequired > 0 ? normalizedUser / normalizedRequired : 1;
    score = roundScore(ratio * 100);

    if (score >= 100) {
      reasons.push(translated("academic.meetsGpa"));
    } else if (score >= 70) {
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

  return {
    key: "academic",
    label: MATCH_DIMENSION_LABELS.academic,
    score,
    applicable: score != null,
    reasons,
    concerns,
  };
}
