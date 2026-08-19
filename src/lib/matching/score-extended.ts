import type {
  MatchDimensionResult,
  MatchUserProfile,
  ProgrammeWithDetails,
} from "./match-types";
import { MATCH_DIMENSION_LABELS } from "./match-types";
import type { MatchMessage } from "./messages";
import { translated } from "./messages";
import { roundScore } from "./utils";

/**
 * Extended dimensions from spec §27 (Career Fit, Study Format Fit,
 * Lifestyle Fit).
 *
 * As of V1, Career Fit and Lifestyle Fit are structurally present but not
 * yet scored: the profile form collects `career_priorities`, but
 * programmes don't yet carry career/lifestyle attributes in the schema,
 * and career priorities have no programme-side data to match against. Per
 * spec §29 (unknown ≠ satisfied, unknown ≠ failure), those two dimensions
 * report `applicable: false` — excluded from the weighted average, never
 * silently scored as if the missing data meant a match.
 *
 * Study Format Fit IS scored since the schema carries `study_mode` on
 * programmes and `preferred_study_format` on profiles. Delivery-mode
 * labels live in the message JSON via ICU `select` (the engine passes raw
 * enum values as params, never pre-formatted UI strings).
 */

/**
 * Study Format Fit — compares the student's `preferred_study_format`
 * (full_time / part_time / either) against the programme's published
 * `study_mode` (full_time / part_time / distance / online / hybrid).
 *
 * Scoring:
 *  - `either` preference → 100 for any published mode (no constraint).
 *  - exact preference match → 100.
 *  - partial matches (hybrid/online/distance against full-time
 *    preference; distance/online/hybrid against part-time preference)
 *    score 75–90 — delivery differs but remains compatible with the
 *    student's scheduling intent.
 *  - outright mismatch (part-time programme vs full-time preference and
 *    vice versa) → 30, with an explicit concern: a mode conflict is a
 *    real signal, not a rounding error.
 *
 * Per spec §29, a programme with no published `study_mode`, or a profile
 * with no preference set, makes the dimension inapplicable (UNKNOWN)
 * rather than guessing a score.
 */
export function scoreFormatFit(
  profile: MatchUserProfile,
  programme: ProgrammeWithDetails,
): MatchDimensionResult {
  const preferred = profile.preferred_study_format;
  const mode = programme.study_mode;

  const concerns: MatchMessage[] = [];

  if (!mode) {
    concerns.push(translated("format.missingData"));
    return unknownDimension("format", concerns);
  }
  if (!preferred) {
    concerns.push(translated("format.missingPreference"));
    return unknownDimension("format", concerns);
  }

  if (preferred === "either") {
    return {
      key: "format",
      label: MATCH_DIMENSION_LABELS.format,
      score: 100,
      applicable: true,
      reasons: [translated("format.either")],
      concerns,
    };
  }

  type StudyMode = NonNullable<typeof mode>;
  const FORMAT_SCORES: Record<
    "full_time" | "part_time",
    Record<StudyMode, number>
  > = {
    full_time: { full_time: 100, part_time: 30, distance: 60, online: 60, hybrid: 80 },
    part_time: { part_time: 100, full_time: 30, distance: 90, online: 85, hybrid: 75 },
  };

  const score = FORMAT_SCORES[preferred][mode];

  const reasons: MatchMessage[] = [];
  if (score === 100) {
    reasons.push(
      translated(preferred === "full_time" ? "format.fullTimeMatch" : "format.partTimeMatch"),
    );
  } else if (score >= 70) {
    reasons.push(translated("format.partialMatch", { mode }));
  } else {
    reasons.push(translated("format.mismatch", { mode, preferred }));
    concerns.push(translated("format.modeConcern", { mode }));
  }

  return {
    key: "format",
    label: MATCH_DIMENSION_LABELS.format,
    score: roundScore(score),
    applicable: true,
    reasons,
    concerns,
  };
}

/**
 * Career Fit — non-applicable until programme career attributes exist.
 * The user's `career_priorities` are stored, but there is nothing on the
 * programme side to match them against yet.
 */
export function scoreCareerFit(
  _profile: MatchUserProfile,
  _programme: ProgrammeWithDetails,
): MatchDimensionResult {
  return unknownDimension("career", [translated("career.missingData")]);
}

/**
 * Lifestyle Fit — non-applicable until lifestyle data exists on either
 * side of the match.
 */
export function scoreLifestyleFit(
  _profile: MatchUserProfile,
  _programme: ProgrammeWithDetails,
): MatchDimensionResult {
  return unknownDimension("lifestyle", [translated("lifestyle.missingData")]);
}

/** UNKNOWN dimension payload shared by the not-yet-scorable extended dimensions. */
function unknownDimension(
  key: "career" | "format" | "lifestyle",
  concerns: MatchMessage[],
): MatchDimensionResult {
  return {
    key,
    label: MATCH_DIMENSION_LABELS[key],
    score: null,
    applicable: false,
    reasons: [],
    concerns,
  };
}