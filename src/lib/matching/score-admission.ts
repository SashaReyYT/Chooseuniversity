import type { MatchDimensionResult, ProgrammeWithDetails } from "./types";
import { MATCH_DIMENSION_LABELS } from "./types";
import type { MatchMessage } from "./messages";
import { translated } from "./messages";
import { roundScore } from "./utils";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/**
 * Admission Fit reflects how demanding the application itself is: an
 * entrance exam requirement, and how close the deadline is. Unlike the
 * other dimensions this one doesn't depend on the user's profile — it's
 * an objective property of the programme's process — so it's always
 * applicable.
 *
 * `now` is a parameter (defaulting to the real clock) rather than reading
 * `new Date()` internally, so deadline-proximity logic is deterministic
 * and testable.
 *
 * The deadline is passed as a raw `Date` in the message params, not a
 * pre-formatted string — this function previously hardcoded
 * `toLocaleDateString("en-GB", ...)`, which meant every user saw a
 * British-formatted date regardless of the UI locale. next-intl's
 * `{date, date, long}` ICU formatting at render time now formats it
 * correctly per the active locale instead.
 */
export function scoreAdmissionFit(
  programme: ProgrammeWithDetails,
  now: Date = new Date(),
): MatchDimensionResult {
  const reasons: MatchMessage[] = [];
  const concerns: MatchMessage[] = [];
  let score = 100;

  if (programme.academic_requirements?.entrance_exam_required) {
    score -= 20;
    concerns.push(translated("admission.entranceExamRequired"));
  } else if (programme.academic_requirements) {
    // Only claim "no entrance exam" when we actually have a requirements
    // row to base that on — absence of a row means unknown, not "no exam".
    reasons.push(translated("admission.noEntranceExam"));
  }

  if (programme.application_deadline) {
    const deadline = new Date(programme.application_deadline);
    const daysUntil = Math.floor(
      (deadline.getTime() - now.getTime()) / MS_PER_DAY,
    );

    if (daysUntil < 0) {
      score -= 40;
      concerns.push(translated("admission.deadlinePassed", { date: deadline }));
    } else if (daysUntil < 30) {
      score -= 15;
      concerns.push(translated("admission.deadlineSoon", { date: deadline }));
    } else {
      reasons.push(translated("admission.deadlineInfo", { date: deadline }));
    }
  }

  return {
    key: "admission",
    label: MATCH_DIMENSION_LABELS.admission,
    score: roundScore(score),
    applicable: true,
    reasons,
    concerns,
  };
}
