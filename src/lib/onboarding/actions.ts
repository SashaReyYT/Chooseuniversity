"use server";

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ProfileService } from "@/lib/services/profile.service";
import type { OnboardingActionState } from "@/lib/onboarding/types";
import {
  CEFR_LEVELS,
  EDUCATION_STAGES,
  LANG_PROFICIENCY_PREFIX,
  NMT_BRANCHES,
  NMT_SCORE_PREFIX,
  START_YEAR_CHOICES,
  STRENGTH_LEVELS,
  SUBJECT_STRENGTH_PREFIX,
  isExamStage,
  listField,
  mapEnglishLevel,
  mapMathStrength,
  optionalText,
  parseBudgetMode,
  parseEnum,
} from "@/lib/onboarding/profile-mapping";
import { LIFESTYLE_OPTIONS } from "@/components/onboarding-form";
import type {
  EducationLevel,
  EducationStage,
  DegreeLevel,
  LocationPreferenceType,
} from "@/types/database";

/**
 * Which national exam question (onboarding Q8) applies to a resident of
 * a given country. Only Ukraine is wired up today — everyone else skips
 * Q8 entirely (see the matching UI-side map in `onboarding-form.tsx`) —
 * extend both maps together when adding a country's exam.
 */
const RESIDENCE_EXAM_MAP: Record<string, "nmt"> = { UA: "nmt" };

/**
 * Q3 (education stage) also decides `current_education_level`,
 * `has_graduated`, and `preferred_degree_level` — asked as a single
 * question rather than three, per the migration's design (see
 * `supabase/migrations/0018_questionnaire_redesign_sql`).
 * "college" is treated as still-pre-bachelor's, since in the
 * Ukrainian/CIS system a "коледж" doesn't reliably imply a completed
 * higher-education degree.
 */
function deriveFromEducationStage(stage: EducationStage | null): {
  currentEducationLevel: EducationLevel | null;
  hasGraduated: boolean | null;
  preferredDegreeLevel: DegreeLevel | null;
} {
  switch (stage) {
    case "grade_9":
    case "grade_10":
    case "grade_11":
      return { currentEducationLevel: "high_school", hasGraduated: false, preferredDegreeLevel: "bachelor" };
    case "finished_school":
      return { currentEducationLevel: "high_school", hasGraduated: true, preferredDegreeLevel: "bachelor" };
    case "college":
      return { currentEducationLevel: "high_school", hasGraduated: false, preferredDegreeLevel: "bachelor" };
    default:
      return { currentEducationLevel: null, hasGraduated: null, preferredDegreeLevel: null };
  }
}

function deriveStartYear(choice: (typeof START_YEAR_CHOICES)[number] | null): number | null {
  // "later" and "not_sure" both mean "no specific year" — start_year is a
  // nullable integer column with nowhere honest to store the distinction,
  // so both become null. The remaining choices are calendar years.
  if (choice === "later" || choice === "not_sure") return null;
  return choice ? Number(choice) : null;
}

export async function submitOnboardingAction(
  locale: string,
  _prevState: OnboardingActionState,
  formData: FormData,
): Promise<OnboardingActionState> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Shouldn't happen — src/proxy.ts establishes an anonymous session for
    // every visitor — but fail loudly rather than silently no-op if it
    // somehow does.
    return { error: "No active session. Please reload the page and try again." };
  }

  const residenceCountryCode = optionalText(formData, "residence_country_code");
  const educationStage = parseEnum(formData.get("education_stage"), EDUCATION_STAGES);
  const { currentEducationLevel, hasGraduated, preferredDegreeLevel } =
    deriveFromEducationStage(educationStage);

  const startYearChoice = parseEnum(formData.get("start_year_choice"), START_YEAR_CHOICES);
  const startYear = deriveStartYear(startYearChoice);

  // Q5 — field of study: one specific programme (primary), which also
  // counts as the only preferred field in onboarding (the full profile
  // form still supports a multi-select of additional fields).
  const primaryFieldId = optionalText(formData, "primary_field_of_study_id");
  const preferredFieldIds = new Set(
    formData.getAll("preferred_field_of_study_ids").map(String),
  );
  if (primaryFieldId) preferredFieldIds.add(primaryFieldId);

  const preferredCountryCodes = listField(formData, "preferred_country_codes");
  const preferredLanguageCodes = listField(formData, "preferred_language_codes");

  // Q10 — budget tiers (no exact amounts in onboarding; the profile form
  // still offers them).
  const budgetMode = parseBudgetMode(formData.get("budget_mode")) ?? "unknown";
  const livingCostMode = parseBudgetMode(formData.get("living_cost_mode")) ?? "unknown";

  // Q11 — extra requirements, all multi-select checkboxes. "nothing"
  // ("Don't care") wins over everything else and clears the profile's
  // requirement fields.
  const nothingSelected = formData.get("nothing") != null;
  const wantsScholarship = !nothingSelected && formData.get("wants_scholarship") != null;
  const wantsDormitory = !nothingSelected && formData.get("wants_dormitory") != null;
  const wantsWorkDuringStudy = !nothingSelected && formData.get("wants_work_during_study") != null;
  const wantsStayAfterGraduation = !nothingSelected && formData.get("wants_stay_after_graduation") != null;
  const noExtraExams = !nothingSelected && formData.get("no_extra_exams") != null;
  const bigCity = !nothingSelected && formData.get("big_city") != null;
  const smallCity = !nothingSelected && formData.get("small_city") != null;

  const openToAdditionalExams = nothingSelected
    ? null
    : noExtraExams
      ? false
      : null;
  const locationPreferenceType: LocationPreferenceType | null = nothingSelected
    ? null
    : bigCity
      ? "capital_or_large_city"
      : smallCity
        ? "small_city"
        : null;

  // Q7 — per-language proficiency, one row per selected language (CEFR levels).
  const languageProficiency = preferredLanguageCodes
    .map((code) => {
      const level = parseEnum(
        formData.get(`${LANG_PROFICIENCY_PREFIX}${code}`),
        CEFR_LEVELS,
      );
      return level
        ? { languageCode: code, level }
        : null;
    })
    .filter(
      (entry): entry is { languageCode: string; level: (typeof CEFR_LEVELS)[number] } =>
        entry != null,
    );
  // English proficiency is what the matching engine's Language scorer and
  // the CEFR hard requirement read off the profile.
  const englishLevel = mapEnglishLevel(
    languageProficiency.find((entry) => entry.languageCode === "en")?.level ?? null,
  );

  // Q8 — national exam. Only meaningful when the residence country maps
  // to a known exam and the user has finished school (grades 9–11 never
  // see this step — subject strengths take its place); the wizard doesn't
  // even render the step otherwise, but re-derive the gate server-side
  // rather than trusting the client.
  const examType = residenceCountryCode ? RESIDENCE_EXAM_MAP[residenceCountryCode] : undefined;
  const examStepVisible = examType === "nmt" && isExamStage(educationStage);
  const nmtBranch = parseEnum(formData.get("nmt_branch"), NMT_BRANCHES);
  const nmtIsExpected = nmtBranch === "planning";

  // Collect any NMT scores actually filled in (branch selection alone
  // doesn't guarantee it). Q9 (subject strengths) then falls back in for
  // anyone who ends up with zero scores here, exactly mirroring the
  // client-side visibility rule.
  const nmtScores: { subjectCode: string; score: number; isExpected: boolean }[] = [];
  if (examStepVisible) {
    for (const [key, value] of formData.entries()) {
      if (!key.startsWith(NMT_SCORE_PREFIX)) continue;
      const raw = String(value).trim();
      if (raw === "") continue;
      const score = Number(raw);
      if (!Number.isFinite(score)) continue;
      nmtScores.push({
        subjectCode: key.slice(NMT_SCORE_PREFIX.length),
        score,
        isExpected: nmtIsExpected,
      });
    }
  }
  const nmtScoreEntered = nmtScores.length > 0;

  // Q9 — subject strengths, collected whenever no NMT score was entered
  // above (school students, residents of non-mapped countries, or the
  // user declined/hasn't got a score yet).
  const subjectStrengths: {
    subjectCode: string;
    level: (typeof STRENGTH_LEVELS)[number];
  }[] = [];
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith(SUBJECT_STRENGTH_PREFIX)) continue;
    const level = parseEnum(value, STRENGTH_LEVELS);
    if (!level) continue;
    subjectStrengths.push({ subjectCode: key.slice(SUBJECT_STRENGTH_PREFIX.length), level });
  }
  // Math strength is what the engine's Academic scorer and the math hard
  // requirement read off the profile.
  const mathStrength =
    subjectStrengths.find((entry) => entry.subjectCode === "mathematics")?.level ?? null;

  const profileService = new ProfileService(supabase);

  try {
    const lifestylePreferences = LIFESTYLE_OPTIONS.map((opt) => opt.value)
      .filter((val) => formData.get(val) != null);

    await profileService.upsert(user.id, {
      full_name: String(formData.get("full_name") ?? "").trim() || null,
      residence_country_code: residenceCountryCode,
      residence_city: optionalText(formData, "residence_city"),
      preferred_country_codes: preferredCountryCodes,
      education_stage: educationStage,
      current_education_level: currentEducationLevel,
      has_graduated: hasGraduated,
      preferred_degree_level: preferredDegreeLevel,
      start_year: startYear,
      primary_field_of_study_id: primaryFieldId,
      preferred_field_of_study_ids: Array.from(preferredFieldIds),
      preferred_language_codes: preferredLanguageCodes,
      national_exam_type: examType ?? null,
      budget_mode: budgetMode,
      living_cost_mode: livingCostMode,
      wants_scholarship: wantsScholarship,
      wants_dormitory: wantsDormitory,
      wants_work_during_study: wantsWorkDuringStudy,
      wants_stay_after_graduation: wantsStayAfterGraduation,
      open_to_additional_exams: openToAdditionalExams,
      location_preference_type: locationPreferenceType,
      math_background: mapMathStrength(mathStrength),
      english_level: englishLevel,
      lifestyle_preferences: lifestylePreferences,
    });

    // Q7 — per-language proficiency.
    await profileService.replaceLanguageProficiency(user.id, languageProficiency);

    // Q8 — NMT subject scores (already collected above, used to gate Q9).
    await profileService.replaceNmtScores(user.id, nmtScores);

    // Q9 — subject strengths, cleared when exam scores took their place.
    await profileService.replaceSubjectStrengths(user.id, nmtScoreEntered ? [] : subjectStrengths);
  } catch (error) {
    console.error("Failed to save profile:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return { error: `Failed to save profile: ${message}` };
  }

  redirect(`/${locale}/results`);
}