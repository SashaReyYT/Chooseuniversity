"use server";

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ProfileService } from "@/lib/services/profile.service";
import type { OnboardingActionState } from "@/lib/onboarding/types";
import {
  EDUCATION_STAGES,
  LANG_PROFICIENCY_PREFIX,
  NATIONAL_EXAM_TYPES,
  NMT_SUBJECTS,
  NMT_SUBJECT_PREFIX,
  PROFICIENCY_LEVELS,
  START_YEARS,
  STRENGTH_LEVELS,
  SUBJECT_CODES,
  SUBJECT_STRENGTH_PREFIX,
  isGraduateStage,
  listField,
  mapEnglishLevel,
  mapMathStrength,
  mapStage,
  optionalNumber,
  optionalText,
  parseBudgetMode,
  parseEnum,
} from "@/lib/onboarding/profile-mapping";

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
    // Shouldn't happen — `src/proxy.ts` establishes an anonymous session for
    // every visitor — but fail loudly rather than silently no-op if it
    // somehow does.
    return { error: "No active session. Please reload the page and try again." };
  }

  const residenceCountryCode = optionalText(formData, "residence_country_code");
  const residenceCity = optionalText(formData, "residence_city");
  const educationStage = parseEnum(formData.get("education_stage"), EDUCATION_STAGES);
  const stageMapping = mapStage(educationStage);

  const startYearRaw = parseEnum(formData.get("start_year"), START_YEARS);
  const startYear = startYearRaw ? Number(startYearRaw) : null;

  const budgetMode = parseBudgetMode(formData.get("budget_mode"));
  const livingCostMode = parseBudgetMode(formData.get("living_cost_mode"));

  const preferredCountries = listField(formData, "preferred_country_codes");
  const preferredFields = listField(formData, "preferred_field_of_study_ids");
  // The first selected field is the primary one (the UI marks it).
  const primaryField = preferredFields[0] ?? null;
  const preferredLanguages = listField(formData, "preferred_language_codes");

  // Q7 — one proficiency per chosen language: `lang_<code>`.
  const languageProficiency = preferredLanguages.flatMap((code) => {
    const level = parseEnum(
      formData.get(`${LANG_PROFICIENCY_PREFIX}${code}`),
      PROFICIENCY_LEVELS,
    );
    return level != null
      ? [{ languageCode: code, level }]
      : [];
  });

  // Q9 — per-subject strength: `subject_<code>`.
  const subjectStrengths = SUBJECT_CODES.flatMap((code) => {
    const level = parseEnum(
      formData.get(`${SUBJECT_STRENGTH_PREFIX}${code}`),
      STRENGTH_LEVELS,
    );
    return level != null ? [{ subjectCode: code, level }] : [];
  });

  const mathStrength =
    subjectStrengths.find((s) => s.subjectCode === "math")?.level ?? null;
  const englishProficiency =
    languageProficiency.find((l) => l.languageCode === "en")?.level ?? null;

  // Q8 — national exams. Only asked for graduates (finished_school/college);
  // in-school stages (grade_9..grade_11) answer subject strengths instead.
  const showExamStep = isGraduateStage(educationStage);

  const nationalExamType = showExamStep
    ? parseEnum(formData.get("national_exam_type"), NATIONAL_EXAM_TYPES)
    : null;

  const nmtTaken = showExamStep
    ? formData.get("nmt_taken") === "taken"
    : null;

  // NMT subject scores: `nmt_<subject_code>` (0–200). For "not yet taken"
  // answers these are expected results (honestly flagged as such).
  const nmtScores = showExamStep
    ? NMT_SUBJECTS.flatMap((subjectCode) => {
        const score = optionalNumber(
          formData,
          `${NMT_SUBJECT_PREFIX}${subjectCode}`,
        );
        return score != null
          ? [{ subjectCode, score, scoreIsExpected: !nmtTaken }]
          : [];
      })
    : [];

  // Non-NMT national exams (Matura, Abitur, ...) → a single overall result
  // stored as a test score the Admission Fit scorer can compare against
  // programme requirements.
  const nationalExamScore = showExamStep
    ? optionalNumber(formData, "national_exam_score")
    : null;

  // Q11 — additional requirements.
  const requirements = listField(formData, "requirements");
  const wantsScholarship = requirements.includes("scholarship");
  const wantsDormitory = requirements.includes("dormitory");
  const wantsWorkDuringStudy = requirements.includes("work");
  const wantsStayAfterGraduation = requirements.includes("stay");
  const openToAdditionalExams = !requirements.includes("no_extra_exams");

  const profileService = new ProfileService(supabase);

  try {
    await profileService.upsert(user.id, {
      full_name: null,
      residence_country_code: residenceCountryCode,
      residence_city: residenceCity,
      education_stage: educationStage,
      current_education_level: stageMapping.currentEducationLevel,
      has_graduated: stageMapping.hasGraduated,
      preferred_degree_level: stageMapping.preferredDegreeLevel,
      start_year: startYear,
      preferred_country_codes: preferredCountries,
      preferred_field_of_study_ids: preferredFields,
      primary_field_of_study_id: primaryField,
      preferred_language_codes: preferredLanguages,
      budget_mode: budgetMode ?? "unknown",
      budget_currency: "EUR",
      living_cost_mode: livingCostMode ?? "unknown",
      national_exam_type: nationalExamType,
      wants_scholarship: wantsScholarship,
      wants_dormitory: wantsDormitory,
      wants_work_during_study: wantsWorkDuringStudy,
      wants_stay_after_graduation: wantsStayAfterGraduation,
      open_to_additional_exams: openToAdditionalExams,
      math_background: mapMathStrength(mathStrength),
      english_level: mapEnglishLevel(englishProficiency),
    });

    await profileService.replaceLanguageProficiency(user.id, languageProficiency);
    await profileService.replaceSubjectStrengths(user.id, subjectStrengths);
    await profileService.replaceNmtScores(user.id, nmtScores);

    if (showExamStep && nationalExamType && nationalExamType !== "nmt") {
      await profileService.setEnglishTestScore(
        user.id,
        nationalExamScore != null
          ? {
              qualificationId: null,
              testType: nationalExamType,
              score: nationalExamScore,
              scoreDisplay: String(nationalExamScore),
            }
          : null,
        null,
      );
    } else {
      await profileService.setEnglishTestScore(user.id, null, null);
    }
  } catch (error) {
    console.error("Failed to save onboarding profile:", error);
    return { error: "Something went wrong saving your profile. Please try again." };
  }

  redirect(`/${locale}/discover`);
}