import type { BudgetMode, DegreeLevel, EducationLevel } from "@/types/database";

/**
 * Education stages (onboarding Q3). Values must match the
 * `education_stage` enum in the database — `finished_school`, not
 * `graduated`.
 */
export const EDUCATION_STAGES = [
  "grade_9",
  "grade_10",
  "grade_11",
  "finished_school",
  "college",
  "other",
] as const;

/** budget_mode / living_cost_mode tiers offered by the onboarding (Q10). */
export const BUDGET_MODES = ["low", "medium", "high", "unknown"] as const;

export const START_YEAR_CHOICES = ["2026", "2027", "2028", "later", "not_sure"] as const;

/**
 * Per-language self-rated proficiency (Q7). Values must match the
 * `user_language_proficiency.level` check constraint in the database —
 * `average`, not `medium`.
 */
export const PROFICIENCY_LEVELS = ["good", "average", "poor", "not_sure"] as const;

/**
 * Subject-strength self-rating (Q9). Values must match the
 * `user_subject_strengths.level` check constraint in the database —
 * `poor`, not `weak`.
 */
export const STRENGTH_LEVELS = ["good", "average", "poor"] as const;

/** Which branch of the national-exam question (Q8) the user picked. */
export const NMT_BRANCHES = [
  "yes",
  "planning",
  "no",
  "other",
  "grade11_taking",
  "grade11_skip",
] as const;

export const LANG_PROFICIENCY_PREFIX = "language_level__";
export const NMT_SCORE_PREFIX = "nmt_score_";
export const SUBJECT_STRENGTH_PREFIX = "subject_strength_";

/**
 * Stage → the legacy matching fields. The engine's Academic/Admission
 * scorers read `current_education_level` / `has_graduated` /
 * `preferred_degree_level`; the new granular stage answer is mapped onto
 * them here so no engine change is needed.
 */
export function mapStage(stage: string | null): {
  currentEducationLevel: EducationLevel | null;
  hasGraduated: boolean | null;
  preferredDegreeLevel: DegreeLevel | null;
} {
  switch (stage) {
    case "grade_9":
    case "grade_10":
    case "grade_11":
      return {
        currentEducationLevel: "high_school",
        hasGraduated: false,
        preferredDegreeLevel: "bachelor",
      };
    case "finished_school":
      return {
        currentEducationLevel: "high_school",
        hasGraduated: true,
        preferredDegreeLevel: "bachelor",
      };
    case "college":
      // In college / at university right now — still pre-bachelor's, so
      // not graduated from the current education level (mirrors
      // `submitOnboardingAction`).
      return {
        currentEducationLevel: "high_school",
        hasGraduated: false,
        preferredDegreeLevel: "bachelor",
      };
    default:
      return {
        currentEducationLevel: null,
        hasGraduated: null,
        preferredDegreeLevel: null,
      };
  }
}

/** Subject strength (Q9, the "mathematics" subject) → `math_background`. */
export function mapMathStrength(level: string | null) {
  switch (level) {
    case "good":
      return "excellent" as const;
    case "average":
      return "average" as const;
    case "poor":
      return "weak" as const;
    default:
      return null;
  }
}

/** Per-language proficiency (Q7, English) → the engine's CEFR `english_level`. */
export function mapEnglishLevel(level: string | null) {
  switch (level) {
    case "good":
      return "b2" as const;
    case "average":
      return "b1" as const;
    case "poor":
      return "a2" as const;
    case "not_sure":
      return "not_sure" as const;
    default:
      return null;
  }
}

/** The exam step (Q8) only applies once the user is past grade 10. */
export function isExamStage(stage: string | null): boolean {
  return (
    stage !== null &&
    stage !== "" &&
    stage !== "grade_9" &&
    stage !== "grade_10"
  );
}

export function optionalText(
  formData: FormData,
  key: string,
): string | null {
  const value = String(formData.get(key) ?? "").trim();
  return value.length > 0 ? value : null;
}

export function listField(formData: FormData, key: string): string[] {
  return formData
    .getAll(key)
    .map((v) => String(v).trim())
    .filter(Boolean);
}

export function optionalNumber(
  formData: FormData,
  key: string,
): number | null {
  const raw = String(formData.get(key) ?? "").trim();
  if (raw === "") return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

export function parseEnum<T extends string>(
  value: FormDataEntryValue | null,
  allowed: readonly T[],
): T | null {
  return allowed.includes(value as T) ? (value as T) : null;
}

/** budget_mode / living_cost_mode are the same "low|medium|high|unknown" enum. */
export function parseBudgetMode(value: FormDataEntryValue | null): BudgetMode | null {
  return parseEnum(value, BUDGET_MODES);
}