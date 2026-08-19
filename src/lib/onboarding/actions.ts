"use server";

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ProfileService } from "@/lib/services/profile.service";
import type { OnboardingActionState } from "@/lib/onboarding/types";
import type {
  DegreeLevel,
  EducationLevel,
  LocationPreferenceType,
} from "@/types/database";

const DEGREE_LEVELS: DegreeLevel[] = ["foundation", "bachelor", "master", "phd"];
const EDUCATION_LEVELS: EducationLevel[] = ["high_school", "bachelor", "master"];
const LOCATION_PREFERENCES: LocationPreferenceType[] = [
  "specific_city",
  "any_city",
  "capital_or_large_city",
  "medium_city",
  "small_city",
  "student_city",
  "flexible",
];
const OWNERSHIP_PREFERENCES = ["public", "private", "no_preference"] as const;
const SUPPORT_PREFERENCES = ["wants_support", "no_preference"] as const;

function parseOptionalNumber(
  formData: FormData,
  key: string,
): number | null | typeof Number.NaN {
  const raw = formData.get(key);
  if (raw == null || String(raw).trim() === "") return null;
  const num = Number(raw);
  return Number.isFinite(num) ? num : Number.NaN;
}

function parseDegreeLevel(value: FormDataEntryValue | null): DegreeLevel | null {
  return DEGREE_LEVELS.includes(value as DegreeLevel)
    ? (value as DegreeLevel)
    : null;
}

function parseEducationLevel(
  value: FormDataEntryValue | null,
): EducationLevel | null {
  return EDUCATION_LEVELS.includes(value as EducationLevel)
    ? (value as EducationLevel)
    : null;
}

function parseCities(value: FormDataEntryValue | null): string[] {
  if (typeof value !== "string" || value.trim() === "") return [];
  return value
    .split(",")
    .map((city) => city.trim())
    .filter(Boolean);
}

function parseLocationPreference(
  value: FormDataEntryValue | null,
): LocationPreferenceType | null {
  return LOCATION_PREFERENCES.includes(value as LocationPreferenceType)
    ? (value as LocationPreferenceType)
    : null;
}

function parseOwnershipPreference(
  value: FormDataEntryValue | null,
): (typeof OWNERSHIP_PREFERENCES)[number] | null {
  return OWNERSHIP_PREFERENCES.includes(value as (typeof OWNERSHIP_PREFERENCES)[number])
    ? (value as (typeof OWNERSHIP_PREFERENCES)[number])
    : null;
}

function parseSupportPreference(
  value: FormDataEntryValue | null,
): (typeof SUPPORT_PREFERENCES)[number] | null {
  return SUPPORT_PREFERENCES.includes(value as (typeof SUPPORT_PREFERENCES)[number])
    ? (value as (typeof SUPPORT_PREFERENCES)[number])
    : null;
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

  const currentGpa = parseOptionalNumber(formData, "current_gpa");
  const currentGpaScale = parseOptionalNumber(formData, "current_gpa_scale");
  const budgetMin = parseOptionalNumber(formData, "budget_min");
  const budgetMax = parseOptionalNumber(formData, "budget_max");

  if (
    Number.isNaN(currentGpa) ||
    Number.isNaN(currentGpaScale) ||
    Number.isNaN(budgetMin) ||
    Number.isNaN(budgetMax)
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

  const profileService = new ProfileService(supabase);

  try {
    await profileService.upsert(user.id, {
      full_name: String(formData.get("full_name") ?? "").trim() || null,
      nationality_country_code:
        String(formData.get("nationality_country_code") ?? "") || null,
      current_education_level: parseEducationLevel(
        formData.get("current_education_level"),
      ),
      current_gpa: currentGpa,
      current_gpa_scale: currentGpaScale,
      budget_min: budgetMin,
      budget_max: budgetMax,
      budget_currency: budgetCurrency || null,
      preferred_degree_level: parseDegreeLevel(
        formData.get("preferred_degree_level"),
      ),
      preferred_country_codes: formData.getAll("preferred_country_codes").map(String),
      preferred_cities: parseCities(formData.get("preferred_cities")),
      preferred_field_of_study_ids: formData
        .getAll("preferred_field_of_study_ids")
        .map(String),
      preferred_language_codes: formData
        .getAll("preferred_language_codes")
        .map(String),
      location_preference_type: parseLocationPreference(
        formData.get("location_preference_type"),
      ),
      preferred_ownership_type: parseOwnershipPreference(
        formData.get("preferred_ownership_type"),
      ),
      support_preference: parseSupportPreference(
        formData.get("support_preference"),
      ),
    });
  } catch (error) {
    console.error("Failed to save profile:", error);
    return { error: "Something went wrong saving your profile. Please try again." };
  }

  redirect(`/${locale}/discover`);
}
