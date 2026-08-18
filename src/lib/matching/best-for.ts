import type { MatchResult, MatchUserProfile } from "./match-types";

/**
 * Contextual recommendation labels (§34): "Best Overall", "Best Value",
 * etc. These are CALCULATED from the user's profile and the programme's
 * dimension scores at render time — never stored on, or permanently
 * assigned to, a university or programme. The same programme can be
 * "Best Value" for one student and carry no label for another.
 */
export type BestForLabel =
  | "Best Overall"
  | "Best Value"
  | "Best Academic"
  | "Best Admission Fit"
  | "Best Career Fit"
  | "Best Location Fit";

/**
 * Minimum dimension score (0–100) for a single-dimension label such as
 * "Best Academic". Kept as named constants so thresholds are tunable in
 * one place when product tunes the labels later.
 */
const SINGLE_DIMENSION_THRESHOLD = 90;

/**
 * "Best Overall" additionally requires breadth: a high weighted score
 * alone isn't enough if it's carried by a single dimension.
 */
const BEST_OVERALL_SCORE_THRESHOLD = 90;
const BEST_OVERALL_MIN_STRONG_DIMENSIONS = 3;
const BEST_OVERALL_STRONG_DIMENSION_SCORE = 80;

/**
 * Returns the most specific label this programme qualifies for given
 * this user, or null when nothing qualifies. Priority order is the
 * display order in the spec: overall first, then value, then the
 * single-dimension fits. Deterministic — same match + same profile
 * always yields the same label.
 */
export function determineBestForLabel(
  match: MatchResult,
  profile: MatchUserProfile | null,
): BestForLabel | null {
  if (!match.overallScore || !profile) return null;

  const dims = match.dimensions;
  const dimScore = (key: string): number | null => {
    const dim = dims.find((d) => d.key === key);
    return dim?.applicable ? dim.score : null;
  };

  const strongDimensions = dims.filter(
    (d) => d.applicable && d.score != null && d.score >= BEST_OVERALL_STRONG_DIMENSION_SCORE,
  ).length;

  if (
    match.overallScore >= BEST_OVERALL_SCORE_THRESHOLD &&
    strongDimensions >= BEST_OVERALL_MIN_STRONG_DIMENSIONS
  ) {
    return "Best Overall";
  }

  const candidates: [BestForLabel, number | null][] = [
    ["Best Value", dimScore("budget")],
    ["Best Academic", dimScore("academic")],
    ["Best Admission Fit", dimScore("admission")],
    ["Best Career Fit", dimScore("career")],
    ["Best Location Fit", dimScore("location")],
  ];

  for (const [label, score] of candidates) {
    if (score != null && score >= SINGLE_DIMENSION_THRESHOLD) return label;
  }

  return null;
}
