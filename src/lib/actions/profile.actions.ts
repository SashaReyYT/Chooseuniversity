"use server";

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/session";
import { ProfileService } from "@/lib/services/profile.service";
import type { Database } from "@/types/database";

export interface ProfileFormState {
  error: string | null;
}

type DegreeLevel = Database["public"]["Enums"]["degree_level"];
type EducationLevel = Database["public"]["Enums"]["education_level"];

function optionalNumber(formData: FormData, key: string): number | null {
  const raw = formData.get(key);
  if (raw == null || raw === "") return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function optionalText(formData: FormData, key: string): string | null {
  const raw = formData.get(key);
  const value = String(raw ?? "").trim();
  return value.length > 0 ? value : null;
}

function listField(formData: FormData, key: string): string[] {
  return formData
    .getAll(key)
    .map((v) => String(v).trim())
    .filter(Boolean);
}

/** For free-text "type your own list" inputs (e.g. cities) rather than a fixed multi-select. */
function commaListField(formData: FormData, key: string): string[] {
  return String(formData.get(key) ?? "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

/**
 * Saves the onboarding questionnaire in one submit — the product spec's
 * multi-step Stitch questionnaire mockup isn't rendered here yet (no
 * mockup file available to build against), so this is a single form
 * covering the same fields `MatchUserProfile` reads, split visually into
 * sections. See the "screens" note in the chat response.
 */
export async function saveOnboardingProfile(
  _prevState: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const user = await requireUser();
  const supabase = await createServerSupabaseClient();

  const gpa = optionalNumber(formData, "current_gpa");
  const gpaScale = optionalNumber(formData, "current_gpa_scale");
  if ((gpa == null) !== (gpaScale == null)) {
    return { error: "Enter both your GPA and its scale, or leave both blank." };
  }
  if (gpa != null && gpaScale != null && gpa > gpaScale) {
    return { error: "GPA can't be higher than the scale it's out of." };
  }

  const budgetMin = optionalNumber(formData, "budget_min");
  const budgetMax = optionalNumber(formData, "budget_max");
  if (budgetMin != null && budgetMax != null && budgetMin > budgetMax) {
    return { error: "Minimum budget can't be higher than maximum budget." };
  }

  const ieltsScore = optionalNumber(formData, "ielts_score");

  try {
    await new ProfileService(supabase).upsert(user.id, {
      full_name: optionalText(formData, "full_name"),
      nationality_country_code: optionalText(formData, "nationality_country_code"),
      current_education_level: optionalText(formData, "current_education_level") as EducationLevel | null,
      current_gpa: gpa,
      current_gpa_scale: gpaScale,
      budget_min: budgetMin,
      budget_max: budgetMax,
      budget_currency: optionalText(formData, "budget_currency"),
      preferred_degree_level: optionalText(formData, "preferred_degree_level") as DegreeLevel | null,
      preferred_country_codes: listField(formData, "preferred_country_codes"),
      preferred_cities: commaListField(formData, "preferred_cities"),
      preferred_field_of_study_ids: listField(formData, "preferred_field_of_study_ids"),
      preferred_language_codes: listField(formData, "preferred_language_codes"),
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Couldn't save your profile." };
  }

  redirect("/dashboard");
}
