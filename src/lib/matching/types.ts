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
  | "current_gpa"
  | "current_gpa_scale"
  | "budget_min"
  | "budget_max"
  | "budget_currency"
  | "preferred_degree_level"
  | "preferred_country_codes"
  | "preferred_cities"
  | "preferred_field_of_study_ids"
  | "preferred_language_codes"
> & {
  testScores: Pick<
    Database["public"]["Tables"]["user_test_scores"]["Row"],
    "test_type" | "score"
  >[];
};

export type { ProgrammeWithDetails };

export const MATCH_DIMENSION_KEYS = [
  "academic",
  "budget",
  "language",
  "location",
  "admission",
] as const;

export type MatchDimensionKey = (typeof MATCH_DIMENSION_KEYS)[number];

export const MATCH_DIMENSION_LABELS: Record<MatchDimensionKey, string> = {
  academic: "Academic Fit",
  budget: "Budget Fit",
  language: "Language Fit",
  location: "Location Fit",
  admission: "Admission Fit",
};

export interface MatchDimensionResult {
  key: MatchDimensionKey;
  label: string;
  /** 0–100, or null when there isn't enough data to score this dimension. */
  score: number | null;
  /** False when `score` is null — excluded from the overall average. */
  applicable: boolean;
  /** Positive signals, in the product spec's "why it matches you" style. Render via next-intl — see `MatchMessage`. */
  reasons: MatchMessage[];
  /** Things the student should double-check, never silently dropped. Render via next-intl — see `MatchMessage`. */
  concerns: MatchMessage[];
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
}

export type MatchLabel =
  | "Excellent Fit"
  | "Great Fit"
  | "Good Fit"
  | "Fair Fit"
  | "Limited Fit";

/**
 * Score → label thresholds. Centralized here (not inlined in the engine)
 * so the UI can render the same bands consistently, e.g. for a legend.
 */
export const MATCH_LABEL_THRESHOLDS: { min: number; label: MatchLabel }[] = [
  { min: 90, label: "Excellent Fit" },
  { min: 75, label: "Great Fit" },
  { min: 60, label: "Good Fit" },
  { min: 40, label: "Fair Fit" },
  { min: 0, label: "Limited Fit" },
];

export function labelForScore(score: number): MatchLabel {
  const band = MATCH_LABEL_THRESHOLDS.find((b) => score >= b.min);
  // MATCH_LABEL_THRESHOLDS always has a `min: 0` band, so this is unreachable.
  return band?.label ?? "Limited Fit";
}
