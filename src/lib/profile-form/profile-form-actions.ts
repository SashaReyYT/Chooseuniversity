"use server";

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ProfileService } from "@/lib/services/profile.service";
import { ReferenceDataRepository } from "@/lib/repositories/reference-data.repository";
import type { ProfileFormActionState } from "@/lib/profile-form/profile-form-action-state";
import type {
  AdmissionPreference,
  BudgetMode,
  CefrLevel,
  DegreeLevel,
  EducationLevel,
  LocationPreferenceType,
  MathBackground,
  StudyFormat,
} from "@/types/database";

// spec §20 — conditional on whether the user has taken the NMT at all
// before asking which subjects/scores.
const NMT_TAKEN_OPTIONS = ["yes", "no", "planning", "other"] as const;

// V1 "study level" (spec §10) is deliberately Bachelor's/Master's only —
// the enum already supports foundation/phd for later, this is just what
// the questionnaire currently offers.
const STUDY_LEVELS: DegreeLevel[] = ["bachelor", "master"];
const EDUCATION_LEVELS: EducationLevel[] = ["high_school", "bachelor", "master"];
const STUDY_FORMATS: StudyFormat[] = ["full_time", "part_time", "either"];
const BUDGET_MODES: BudgetMode[] = ["exact", "low", "medium", "high", "unknown"];
const LOCATION_PREFERENCE_TYPES: LocationPreferenceType[] = [
  "specific_city",
  "any_city",
  "capital_or_large_city",
  "medium_city",
  "small_city",
  "student_city",
  "flexible",
];
const CEFR_LEVELS: CefrLevel[] = [
  "a1", "a2", "b1", "b2", "c1", "c2", "native", "not_sure",
];
const MATH_BACKGROUNDS: MathBackground[] = [
  "excellent", "good", "average", "weak", "not_sure",
];
const ADMISSION_PREFERENCES: AdmissionPreference[] = [
  "safest", "balanced", "competitive", "no_preference",
];
const CAREER_PRIORITY_CODES = [
  "career_opportunities",
  "academic_reputation",
  "research",
  "internships",
  "employment_after_graduation",
  "international_environment",
  "affordable_education",
  "affordable_living",
  "big_city",
  "student_life",
  "small_class_sizes",
  "practical_education",
  "tech_ecosystem",
  "stay_after_graduation",
];

function parseOptionalNumber(
  formData: FormData,
  key: string,
): number | null | typeof Number.NaN {
  const raw = formData.get(key);
  if (raw == null || String(raw).trim() === "") return null;
  const num = Number(raw);
  return Number.isFinite(num) ? num : Number.NaN;
}

function parseEnum<T extends string>(
  value: FormDataEntryValue | null,
  allowed: T[],
): T | null {
  return allowed.includes(value as T) ? (value as T) : null;
}

function parseCities(value: FormDataEntryValue | null): string[] {
  if (typeof value !== "string" || value.trim() === "") return [];
  return value
    .split(",")
    .map((city) => city.trim())
    .filter(Boolean);
}

export async function submitProfileFormAction(
  locale: string,
  _prevState: ProfileFormActionState,
  formData: FormData,
): Promise<ProfileFormActionState> {
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

  const currentGpa = parseOptionalNumber(formData, "current_gpa");
  const currentGpaScale = parseOptionalNumber(formData, "current_gpa_scale");
  const budgetMin = parseOptionalNumber(formData, "budget_min");
  const budgetMax = parseOptionalNumber(formData, "budget_max");
  const graduationYear = parseOptionalNumber(formData, "graduation_year");

  if (
    Number.isNaN(currentGpa) ||
    Number.isNaN(currentGpaScale) ||
    Number.isNaN(budgetMin) ||
    Number.isNaN(budgetMax) ||
    Number.isNaN(graduationYear)
  ) {
    return { error: "Please enter valid numbers." };
  }
  if (currentGpa != null && currentGpaScale != null && currentGpa > currentGpaScale) {
    return { error: "Your GPA can't be higher than the scale it's out of." };
  }
  if (budgetMin != null && budgetMax != null && budgetMin > budgetMax) {
    return { error: "Minimum budget can't be higher than maximum budget." };
  }

  const budgetCurrency = String(formData.get("budget_currency") ?? "").trim().toUpperCase();
  if (budgetCurrency && !/^[A-Z]{3}$/.test(budgetCurrency)) {
    return { error: "Currency should be a 3-letter code, e.g. EUR." };
  }

  const budgetModeRaw = parseEnum(formData.get("budget_mode"), BUDGET_MODES) ?? "unknown";
  // A number the user actually typed always means "exact", regardless of
  // which mode option was selected — the spec's rule is "don't force a
  // fake precise number", not "don't accept a real one".
  const budgetMode: BudgetMode = budgetMax != null ? "exact" : budgetModeRaw;

  const primaryFieldOfStudyId =
    String(formData.get("primary_field_of_study_id") ?? "") || null;
  const additionalFieldIds = formData
    .getAll("additional_field_of_study_ids")
    .map(String)
    .filter(Boolean);
  // The array historically read by the matching engine always holds the
  // primary field plus any additional interests — see the migration
  // comment on `primary_field_of_study_id` for why this is additive, not
  // a replacement.
  const preferredFieldOfStudyIds = Array.from(
    new Set([...(primaryFieldOfStudyId ? [primaryFieldOfStudyId] : []), ...additionalFieldIds]),
  );

  const locationPreferenceType = parseEnum(
    formData.get("location_preference_type"),
    LOCATION_PREFERENCE_TYPES,
  );
  const openToOtherCitiesRaw = formData.get("open_to_other_cities");
  const openToOtherCities =
    openToOtherCitiesRaw === "yes" ? true : openToOtherCitiesRaw === "no" ? false : null;

  // §20–§21 — validate submitted NMT subjects / qualifications against
  // what's actually configured in the database, rather than trusting
  // arbitrary form values.
  const referenceData = new ReferenceDataRepository(supabase);
  const [nmtSubjects, qualifications] = await Promise.all([
    referenceData.listNmtSubjects(),
    referenceData.listQualifications(),
  ]);
  const validNmtSubjectCodes = new Set(nmtSubjects.map((subject) => subject.code));
  const qualificationById = new Map(qualifications.map((q) => [q.id, q]));

  const nmtTaken = parseEnum(formData.get("nmt_taken"), [...NMT_TAKEN_OPTIONS]);
  const nmtScores =
    nmtTaken === "yes"
      ? formData
          .getAll("nmt_subject_codes")
          .map(String)
          .filter((code) => validNmtSubjectCodes.has(code))
          .map((code) => {
            const rawScore = formData.get(`nmt_score__${code}`);
            const score = rawScore != null ? Number(rawScore) : Number.NaN;
            return Number.isFinite(score) ? { subjectCode: code, score } : null;
          })
          .filter((entry): entry is { subjectCode: string; score: number } => entry != null)
      : [];

  // §21 — "other qualifications" (SAT/ACT/IB/etc), excluding NMT and CEFR
  // which are handled by their own dedicated questions.
  const qualificationEntries = formData
    .getAll("qualification_ids")
    .map(String)
    .filter((id) => {
      const qualification = qualificationById.get(id);
      return qualification && qualification.code !== "nmt" && qualification.code !== "cefr";
    })
    .map((id) => {
      const rawScore = formData.get(`qualification_score__${id}`);
      const rawYear = formData.get(`qualification_year__${id}`);
      const score = rawScore != null && String(rawScore).trim() !== "" ? Number(rawScore) : null;
      const year = rawYear != null && String(rawYear).trim() !== "" ? Number(rawYear) : null;
      return {
        qualificationId: id,
        score: score != null && Number.isFinite(score) ? score : null,
        year: year != null && Number.isFinite(year) ? year : null,
      };
    });

  // §22 — English proficiency test (separate from the CEFR self-estimate
  // above, which stays on the profile itself).
  const englishTestQualificationId =
    String(formData.get("english_test_qualification_id") ?? "") || null;
  const englishTestQualification = englishTestQualificationId
    ? qualificationById.get(englishTestQualificationId)
    : null;
  const englishTestScoreRaw = formData.get("english_test_score");
  const englishTestScore =
    englishTestScoreRaw != null && String(englishTestScoreRaw).trim() !== ""
      ? Number(englishTestScoreRaw)
      : null;
  const englishTestEntry =
    englishTestQualification && englishTestScore != null && Number.isFinite(englishTestScore)
      ? {
          qualificationId: englishTestQualification.id,
          testType: englishTestQualification.code,
          score: englishTestScore,
          scoreDisplay: String(englishTestScoreRaw),
        }
      : null;

  const profileService = new ProfileService(supabase);

  try {
    await profileService.upsert(user.id, {
      full_name: String(formData.get("full_name") ?? "").trim() || null,
      nationality_country_code:
        String(formData.get("nationality_country_code") ?? "") || null,
      current_education_level: parseEnum(
        formData.get("current_education_level"),
        EDUCATION_LEVELS,
      ),
      graduation_year: graduationYear,
      has_graduated:
        formData.get("has_graduated") === "yes"
          ? true
          : formData.get("has_graduated") === "no"
            ? false
            : null,
      english_level: parseEnum(formData.get("english_level"), CEFR_LEVELS),
      math_background: parseEnum(formData.get("math_background"), MATH_BACKGROUNDS),
      admission_preference: parseEnum(
        formData.get("admission_preference"),
        ADMISSION_PREFERENCES,
      ),
      career_priorities: formData
        .getAll("career_priorities")
        .map(String)
        .filter((code) => CAREER_PRIORITY_CODES.includes(code)),
      current_gpa: currentGpa,
      current_gpa_scale: currentGpaScale,
      budget_min: budgetMin,
      budget_max: budgetMax,
      budget_currency: budgetCurrency || null,
      budget_mode: budgetMode,
      preferred_degree_level: parseEnum(
        formData.get("preferred_degree_level"),
        STUDY_LEVELS,
      ),
      preferred_study_format: parseEnum(
        formData.get("preferred_study_format"),
        STUDY_FORMATS,
      ),
      primary_field_of_study_id: primaryFieldOfStudyId,
      preferred_country_codes: formData.getAll("preferred_country_codes").map(String),
      preferred_cities: parseCities(formData.get("preferred_cities")),
      location_preference_type: locationPreferenceType,
      open_to_other_cities: openToOtherCities,
      preferred_field_of_study_ids: preferredFieldOfStudyIds,
      preferred_language_codes: formData
        .getAll("preferred_language_codes")
        .map(String),
    });

    await Promise.all([
      profileService.replaceNmtScores(user.id, nmtScores),
      profileService.replaceQualifications(user.id, qualificationEntries),
      profileService.setEnglishTestScore(
        user.id,
        englishTestEntry,
        parseEnum(formData.get("english_level"), CEFR_LEVELS),
      ),
    ]);
  } catch (error) {
    console.error("Failed to save profile:", error);
    return { error: "Something went wrong saving your profile. Please try again." };
  }

  redirect(`/${locale}/discover`);
}