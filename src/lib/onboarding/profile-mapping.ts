import type { BudgetMode, DegreeLevel, EducationLevel } from "@/types/database";

export const EDUCATION_STAGES = [
  "grade_9",
  "grade_10",
  "grade_11",
  "finished_school",
  "college",
  "other",
] as const;

export const BUDGET_MODES = ["low", "medium", "high", "unknown"] as const;

export const START_YEARS = ["2026", "2027", "2028"] as const;

export const PROFICIENCY_LEVELS = ["good", "average", "poor", "not_sure"] as const;

export const STRENGTH_LEVELS = ["good", "average", "poor"] as const;

export const NATIONAL_EXAM_TYPES = [
  "nmt",
  "matura",
  "abitur",
  "national_certificate",
  "other",
] as const;

/** Core NMT subjects (Q8) — matches the `nmt_subjects` seed codes. */
export const NMT_SUBJECTS = [
  "ukrainian_language",
  "mathematics",
  "ukrainian_history",
  "english",
] as const;

/** Core subject-strength list (Q9). */
export const SUBJECT_CODES = [
  "math",
  "physics",
  "chemistry",
  "biology",
  "computer_science",
  "languages",
] as const;

export const NMT_SUBJECT_PREFIX = "nmt_";
export const LANG_PROFICIENCY_PREFIX = "lang_";
export const SUBJECT_STRENGTH_PREFIX = "subject_";

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
    case "college":
      return {
        currentEducationLevel: "high_school",
        hasGraduated: true,
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

/** Subject strength (Q9) → the engine's `math_background` value. */
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

/** Per-language proficiency (Q7) → the engine's CEFR `english_level`. */
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

/** The exam step (Q8) is only shown to graduates (finished_school/college). */
export function isGraduateStage(stage: string | null): boolean {
  return stage === "finished_school" || stage === "college";
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