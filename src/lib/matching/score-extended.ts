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

const CAREER_TAGS = [
  "research",
  "software",
  "finance",
  "business",
  "medicine",
  "design",
  "public_sector",
  "startups",
  "academia",
] as const;

type CareerTag = (typeof CAREER_TAGS)[number];

const LIFESTYLE_TAGS = [
  "large_city",
  "student_city",
  "affordable",
  "vibrant_nightlife",
  "cultural_scene",
  "international_community",
  "safe_environment",
  "good_transport",
  "bike_friendly",
  "green_spaces",
] as const;

type LifestyleTag = (typeof LIFESTYLE_TAGS)[number];

/**
 * Career Fit — matches user's career priorities against programme career tags.
 * Both user profile and programme must have career data for this to be applicable.
 *
 * Scoring:
 * - For each matching tag: +30 points
 * - Maximum 100 (when all user priorities match programme tags)
 * - If user has no priorities or programme has no tags → not applicable
 */
export function scoreCareerFit(
  profile: MatchUserProfile,
  programme: ProgrammeWithDetails,
): MatchDimensionResult {
  const userPriorities = profile.career_priorities as CareerTag[] | undefined;
  const programmeTags = programme.career_tags as CareerTag[] | undefined;

  const concerns: MatchMessage[] = [];

  if (!userPriorities || userPriorities.length === 0) {
    concerns.push(translated("career.missingPriority"));
    return unknownDimension("career", concerns);
  }
  if (!programmeTags || programmeTags.length === 0) {
    concerns.push(translated("career.missingData"));
    return unknownDimension("career", concerns);
  }

  const matchingTags = userPriorities.filter((tag) => programmeTags.includes(tag));
  const matchCount = matchingTags.length;
  const maxPossible = userPriorities.length;

  // Score: each matching tag gives proportional points, max 100
  const score = roundScore((matchCount / maxPossible) * 100);

  const reasons: MatchMessage[] = [];
  if (matchCount > 0) {
    reasons.push(
      translated("career.match", {
        tags: matchingTags.map((t) => t.replace("_", " ")).join(", "),
      }),
    );
  }
  if (matchCount < userPriorities.length) {
    const missing = userPriorities.filter((tag) => !programmeTags.includes(tag));
    concerns.push(
      translated("career.partialMatch", {
        missing: missing.map((t) => t.replace("_", " ")).join(", "),
      }),
    );
  }

  return {
    key: "career",
    label: MATCH_DIMENSION_LABELS.career,
    score,
    applicable: true,
    reasons,
    concerns,
  };
}

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
 * Lifestyle Fit — matches user's lifestyle preferences against programme lifestyle tags.
 * Both user profile and programme must have lifestyle data for this to be applicable.
 *
 * Lifestyle tags represent city characteristics:
 * - large_city: Large international city, high student population, higher living costs
 * - student_city: Student-focused city, lower cost than capitals, strong university presence
 * - affordable: Low cost of living
 * - vibrant_nightlife: Active nightlife and entertainment
 * - cultural_scene: Rich cultural offerings (museums, theaters, events)
 * - international_community: Large international student population
 * - safe_environment: Low crime, safe for students
 * - good_transport: Excellent public transport
 * - bike_friendly: Good cycling infrastructure
 * - green_spaces: Parks, nature nearby
 *
 * Scoring: each matching tag gives proportional points, max 100
 */
export function scoreLifestyleFit(
  profile: MatchUserProfile,
  programme: ProgrammeWithDetails,
): MatchDimensionResult {
  const userPreferences = profile.lifestyle_preferences as LifestyleTag[] | undefined;
  const programmeTags = programme.lifestyle_tags as LifestyleTag[] | undefined;

  const concerns: MatchMessage[] = [];

  if (!userPreferences || userPreferences.length === 0) {
    concerns.push(translated("lifestyle.missingPriority"));
    return unknownDimension("lifestyle", concerns);
  }
  if (!programmeTags || programmeTags.length === 0) {
    concerns.push(translated("lifestyle.missingData"));
    return unknownDimension("lifestyle", concerns);
  }

  const matchingTags = userPreferences.filter((tag) => programmeTags.includes(tag));
  const matchCount = matchingTags.length;
  const maxPossible = userPreferences.length;

  // Score: each matching tag gives proportional points, max 100
  const score = roundScore((matchCount / maxPossible) * 100);

  const reasons: MatchMessage[] = [];
  if (matchCount > 0) {
    reasons.push(
      translated("lifestyle.match", {
        tags: matchingTags.map((t) => t.replace("_", " ")).join(", "),
      }),
    );
  }
  if (matchCount < userPreferences.length) {
    const missing = userPreferences.filter((tag) => !programmeTags.includes(tag));
    concerns.push(
      translated("lifestyle.partialMatch", {
        missing: missing.map((t) => t.replace("_", " ")).join(", "),
      }),
    );
  }

  return {
    key: "lifestyle",
    label: MATCH_DIMENSION_LABELS.lifestyle,
    score,
    applicable: true,
    reasons,
    concerns,
  };
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