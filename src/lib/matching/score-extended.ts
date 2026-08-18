import type {
  MatchDimensionResult,
  MatchUserProfile,
  ProgrammeWithDetails,
} from "./match-types";
import { MATCH_DIMENSION_LABELS } from "./match-types";
import type { MatchMessage } from "./messages";
import { translated } from "./messages";

/**
 * Extended dimensions from spec §27 (Career Fit, Study Format Fit,
 * Lifestyle Fit).
 *
 * As of V1 these are structurally present but not yet scored: the profile
 * form collects `career_priorities` and `preferred_study_format`, but
 * programmes don't yet carry career/lifestyle/format attributes in the
 * schema, and career priorities have no programme-side data to match
 * against. Per spec §29 (unknown ≠ satisfied, unknown ≠ failure), these
 * dimensions report `applicable: false` — excluded from the weighted
 * average, never silently scored as if the missing data meant a match.
 *
 * When the schema grows `programme_career_attributes` /
 * `programme_lifestyle_attributes` / a `study_format` column, these
 * scorers gain real logic without changing the engine's shape.
 */

/** Empty payload shared by all three currently-unknown extended dimensions. */
function unknownDimension(
  key: "career" | "format" | "lifestyle",
  concernKey: string,
): MatchDimensionResult {
  const concerns: MatchMessage[] = [translated(concernKey)];
  return {
    key,
    label: MATCH_DIMENSION_LABELS[key],
    score: null,
    applicable: false,
    reasons: [],
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
  return unknownDimension("career", "career.missingData");
}

/**
 * Study Format Fit — non-applicable until programmes carry a study format.
 * V1 catalog data is implicitly on-campus full-time; the profile's
 * `preferred_study_format` can't be scored against an attribute that
 * doesn't exist yet.
 */
export function scoreFormatFit(
  _profile: MatchUserProfile,
  _programme: ProgrammeWithDetails,
): MatchDimensionResult {
  return unknownDimension("format", "format.missingData");
}

/**
 * Lifestyle Fit — non-applicable until lifestyle data exists on either
 * side of the match.
 */
export function scoreLifestyleFit(
  _profile: MatchUserProfile,
  _programme: ProgrammeWithDetails,
): MatchDimensionResult {
  return unknownDimension("lifestyle", "lifestyle.missingData");
}