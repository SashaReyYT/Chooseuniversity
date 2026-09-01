import type { Database } from "@/types/database";
import type { ProgrammeWithDetails } from "@/lib/repositories/programmes.repository";
import type { MatchMessage } from "./messages";

/**
 * The structured "who the student is" input the matching engine scores
 * programmes against. A subset of `user_profiles` plus test scores —
 * deliberately not the full DB row, so the engine's signature documents
 * exactly which fields it reads and stays testable without a database.
 */
export type MatchUserProfile = Pick<
  Database["public"]["Tables"]["user_profiles"]["Row"],
  | "current_education_level"
  | "current_gpa"
  | "current_gpa_scale"
  | "budget_min"
  | "budget_max"
  | "budget_currency"
  | "budget_mode"
  | "living_cost_mode"
  | "preferred_degree_level"
  | "preferred_country_codes"
  | "preferred_cities"
  | "preferred_field_of_study_ids"
  | "preferred_language_codes"
  | "location_preference_type"
  | "preferred_ownership_type"
  | "preferred_study_format"
  | "support_preference"
  | "english_level"
  | "math_background"
  | "has_graduated"
  | "career_priorities"
  | "lifestyle_preferences"
  | "wants_dormitory"
  | "wants_scholarship"
  | "wants_work_during_study"
  | "wants_stay_after_graduation"
  | "open_to_additional_exams"
> & {
  testScores: Pick<
    Database["public"]["Tables"]["user_test_scores"]["Row"],
    "test_type" | "qualification_id" | "score" | "cefr_equivalent"
  >[];
  /** Per-subject NMT results (Czech national exam) — checked against NMT test requirements. */
  nmtScores: Pick<
    Database["public"]["Tables"]["user_nmt_scores"]["Row"],
    "subject_code" | "score" | "max_score"
  >[];
  /** Certificates/qualifications the user holds (A-levels, IB, SAT, ...). */
  qualifications: Pick<
    Database["public"]["Tables"]["user_qualifications"]["Row"],
    "qualification_id" | "year"
  >[];
};

export type { ProgrammeWithDetails };

export const MATCH_DIMENSION_KEYS = [
  "academic",
  "admission",
  "budget",
  "language",
  "location",
  "career",
  "format",
  "lifestyle",
  "support",
] as const;

export type MatchDimensionKey = (typeof MATCH_DIMENSION_KEYS)[number];

export const MATCH_DIMENSION_LABELS: Record<MatchDimensionKey, string> = {
  academic: "Academic Fit",
  admission: "Admission Fit",
  budget: "Budget Fit",
  language: "Language Fit",
  location: "Location Fit",
  career: "Career Fit",
  format: "Study Format Fit",
  lifestyle: "Lifestyle Fit",
  support: "International Support Fit",
};

export interface MatchDimensionResult {
  key: MatchDimensionKey;
  label: string;
  /** 0–100, or null when there isn't enough data to score this dimension. */
  score: number | null;
  /** False when score is null — excluded from the overall average. */
  applicable: boolean;
  /** Positive signals, in the product spec's "why it matches you" style. Render via next-intl — see `MatchMessage`. */
  reasons: MatchMessage[];
  /** Things the student should double-check, never silently dropped. Render via next-intl — see `MatchMessage`. */
  concerns: MatchMessage[];
}

/** Per-dimension weights for the weighted Match Score (spec §26). Missing keys default to 1 (equal weight). */
export type MatchWeights = Partial<Record<MatchDimensionKey, number>>;

/** Overall confidence in the score based on how much data was available (spec §30). */
export type MatchConfidence = "low" | "medium" | "high";

/** Hard-requirement check result: PASS, FAIL, or UNKNOWN (spec §28–§29). */
export type HardRequirementStatus = "pass" | "fail" | "unknown";

export interface HardRequirementCheck {
  /** Machine-readable type — rendered via `Matching` message namespace keys. */
  type: "degree_level" | "field_of_study" | "math_background" | "language_proficiency";
  status: HardRequirementStatus;
  /** Human-readable detail (translated elsewhere), empty when status is `pass`. */
  message: string;
}

export interface MatchResult {
  /** Weighted average of applicable dimensions' scores, 0–100. Null only if no dimension was applicable. */
  overallScore: number | null;
  overallLabel: MatchLabel | null;
  dimensions: MatchDimensionResult[];
  /** All dimensions' reasons, flattened and de-duplicated, in dimension order. */
  reasons: MatchMessage[];
  /** All dimensions' concerns, flattened and de-duplicated, in dimension order. */
  concerns: MatchMessage[];
  /** Hard requirements that gate this programme (spec §28). Failing one must not produce an artificially high score. */
  hardRequirements: HardRequirementCheck[];
  /** Data confidence for this score (spec §30). */
  confidence: MatchConfidence;
}

export type MatchLabel =
  | "Excellent Fit"
  | "Strong Fit"
  | "Good Fit"
  | "Potential Fit"
  | "Weak Fit";

/**
 * Score → label thresholds (§33). Centralized here (not inlined in the
 * engine) so the UI can render the same bands consistently, e.g. for a
 * legend. These are configurable labels — adjust thresholds here to change
 * them product-wide without touching any UI component.
 *
 *   90–100: Excellent Fit
 *   80–89:  Strong Fit
 *   70–79:  Good Fit
 *   60–69:  Potential Fit
 *   Below 60: Weak Fit
 */
export const MATCH_LABEL_THRESHOLDS: { min: number; label: MatchLabel; description: string }[] = [
  { min: 90, label: "Excellent Fit", description: "Outstanding match across most dimensions" },
  { min: 80, label: "Strong Fit", description: "Very good alignment with your preferences" },
  { min: 70, label: "Good Fit", description: "Solid match worth considering" },
  { min: 60, label: "Potential Fit", description: "Meets some criteria — review details" },
  { min: 0, label: "Weak Fit", description: "Limited alignment — check for gaps" },
];

export function labelForScore(score: number): MatchLabel {
  const band = MATCH_LABEL_THRESHOLDS.find((b) => score >= b.min);
  // MATCH_LABEL_THRESHOLDS always has a `min: 0` band, so this is unreachable.
  return band?.label ?? "Weak Fit";
}