"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { submitOnboardingAction } from "@/lib/onboarding/actions";
import { initialOnboardingActionState } from "@/lib/onboarding/types";
import type { Database } from "@/types/database";
import {
  formInputClassName,
  formLabelClassName,
  formPrimaryButtonClassName,
  formSelectClassName,
} from "@/components/form-styles";
import { ToggleCardGroup } from "@/components/toggle-card-group";

type CountryRow = Database["public"]["Tables"]["countries"]["Row"];
type LanguageRow = Database["public"]["Tables"]["languages"]["Row"];
type FieldOfStudyRow = Database["public"]["Tables"]["fields_of_study"]["Row"];
type UserProfileRow = Database["public"]["Tables"]["user_profiles"]["Row"];

interface OnboardingFormProps {
  locale: string;
  countries: CountryRow[];
  languages: LanguageRow[];
  fieldsOfStudy: FieldOfStudyRow[];
  existingProfile: UserProfileRow | null;
}

const STEP_COUNT = 8;

/**
 * Multi-step wizard matching the `unifind_personalized_matching_test`
 * mockup ("STEP 3 OF 8" for the country picker) instead of the earlier
 * single long form. Every field from the original single-page form is
 * still here, still posted by the same `submitOnboardingAction` server
 * action with the same `name`s — every step's fieldset stays mounted in
 * the DOM the whole time (just visually hidden via `hidden` when it
 * isn't the active step), so FormData collects every field's value
 * regardless of which step last touched it, exactly as the native
 * multi-select version did.
 */
export function OnboardingForm({
  locale,
  countries,
  languages,
  fieldsOfStudy,
  existingProfile,
}: OnboardingFormProps) {
  const t = useTranslations("Onboarding");
  const action = submitOnboardingAction.bind(null, locale);
  const [state, formAction, pending] = useActionState(
    action,
    initialOnboardingActionState,
  );
  const [step, setStep] = useState(1);

  const countryOptions = countries.map((c) => ({
    value: c.code,
    label: c.name,
    caption: c.code,
  }));
  const languageOptions = languages.map((l) => ({ value: l.code, label: l.name }));
  const fieldOptions = fieldsOfStudy.map((f) => ({ value: f.id, label: f.name }));

  const stepTitleKeys = [
    "step1Title",
    "step2Title",
    "step3Title",
    "step4Title",
    "step5Title",
    "step6Title",
    "step7Title",
    "step8Title",
  ] as const;
  const stepSubtitleKeys = [
    "step1Subtitle",
    "step2Subtitle",
    "step3Subtitle",
    "step4Subtitle",
    "step5Subtitle",
    "step6Subtitle",
    "step7Subtitle",
    "step8Subtitle",
  ] as const;

  function goNext() {
    setStep((current) => Math.min(STEP_COUNT, current + 1));
  }
  function goBack() {
    setStep((current) => Math.max(1, current - 1));
  }

  return (
    <form action={formAction} className="max-w-2xl mx-auto space-y-8">
      {/* Progress header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={goBack}
              aria-label={t("back")}
              className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-surface-container transition-colors"
            >
              <span className="material-symbols-outlined" aria-hidden="true">
                arrow_back
              </span>
            </button>
          ) : (
            <span className="w-9 h-9" />
          )}
          <p className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wide">
            {t("stepIndicator", { step, total: STEP_COUNT })}
          </p>
          <span className="w-9 h-9" />
        </div>
        <div className="h-1.5 rounded-full bg-surface-container-high overflow-hidden">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${(step / STEP_COUNT) * 100}%` }}
          />
        </div>
      </div>

      <div className="space-y-2">
        <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-primary">
          {t(stepTitleKeys[step - 1])}
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          {t(stepSubtitleKeys[step - 1])}
        </p>
      </div>

      {/* Step 1 — name */}
      <div className={step === 1 ? "space-y-1" : "hidden"}>
        <label htmlFor="full_name" className={formLabelClassName}>
          {t("nameLabel")}
        </label>
        <input
          id="full_name"
          name="full_name"
          type="text"
          defaultValue={existingProfile?.full_name ?? ""}
          className={formInputClassName}
        />
      </div>

      {/* Step 2 — fields of study */}
      <div className={step === 2 ? "" : "hidden"}>
        <ToggleCardGroup
          name="preferred_field_of_study_ids"
          options={fieldOptions}
          defaultValues={existingProfile?.preferred_field_of_study_ids ?? []}
        />
      </div>

      {/* Step 3 — countries */}
      <div className={step === 3 ? "" : "hidden"}>
        <ToggleCardGroup
          name="preferred_country_codes"
          options={countryOptions}
          defaultValues={existingProfile?.preferred_country_codes ?? []}
        />
      </div>

      {/* Step 4 — cities */}
      <div className={step === 4 ? "space-y-1" : "hidden"}>
        <label htmlFor="preferred_cities" className={formLabelClassName}>
          {t("citiesLabel")}
        </label>
        <input
          id="preferred_cities"
          name="preferred_cities"
          type="text"
          placeholder={t("citiesPlaceholder")}
          defaultValue={existingProfile?.preferred_cities?.join(", ") ?? ""}
          className={formInputClassName}
        />
      </div>

      {/* Step 5 — languages */}
      <div className={step === 5 ? "" : "hidden"}>
        <ToggleCardGroup
          name="preferred_language_codes"
          options={languageOptions}
          defaultValues={existingProfile?.preferred_language_codes ?? []}
        />
      </div>

      {/* Step 6 — nationality */}
      <div className={step === 6 ? "space-y-1" : "hidden"}>
        <label htmlFor="nationality_country_code" className={formLabelClassName}>
          {t("nationalityLabel")}
        </label>
        <select
          id="nationality_country_code"
          name="nationality_country_code"
          defaultValue={existingProfile?.nationality_country_code ?? ""}
          className={formSelectClassName}
        >
          <option value="">{t("selectPlaceholder")}</option>
          {countries.map((country) => (
            <option key={country.code} value={country.code}>
              {country.name}
            </option>
          ))}
        </select>
      </div>

      {/* Step 7 — academic background */}
      <div className={step === 7 ? "space-y-4" : "hidden"}>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label htmlFor="current_gpa" className={formLabelClassName}>
              {t("gpaLabel")}
            </label>
            <input
              id="current_gpa"
              name="current_gpa"
              type="number"
              step="0.01"
              min="0"
              defaultValue={existingProfile?.current_gpa ?? ""}
              className={formInputClassName}
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="current_gpa_scale" className={formLabelClassName}>
              {t("gpaScaleLabel")}
            </label>
            <input
              id="current_gpa_scale"
              name="current_gpa_scale"
              type="number"
              step="0.01"
              min="0"
              placeholder="4.0"
              defaultValue={existingProfile?.current_gpa_scale ?? ""}
              className={formInputClassName}
            />
          </div>
        </div>

        <div className="space-y-1">
          <label htmlFor="current_education_level" className={formLabelClassName}>
            {t("educationLevelLabel")}
          </label>
          <select
            id="current_education_level"
            name="current_education_level"
            defaultValue={existingProfile?.current_education_level ?? ""}
            className={formSelectClassName}
          >
            <option value="">{t("selectPlaceholder")}</option>
            <option value="high_school">{t("educationLevelHighSchool")}</option>
            <option value="bachelor">{t("educationLevelBachelor")}</option>
            <option value="master">{t("educationLevelMaster")}</option>
          </select>
        </div>

        <div className="space-y-1">
          <label htmlFor="preferred_degree_level" className={formLabelClassName}>
            {t("preferredDegreeLevelLabel")}
          </label>
          <select
            id="preferred_degree_level"
            name="preferred_degree_level"
            defaultValue={existingProfile?.preferred_degree_level ?? ""}
            className={formSelectClassName}
          >
            <option value="">{t("selectPlaceholder")}</option>
            <option value="foundation">{t("degreeLevelFoundation")}</option>
            <option value="bachelor">{t("degreeLevelBachelor")}</option>
            <option value="master">{t("degreeLevelMaster")}</option>
            <option value="phd">{t("degreeLevelPhd")}</option>
          </select>
        </div>
      </div>

      {/* Step 8 — budget */}
      <div className={step === 8 ? "grid grid-cols-3 gap-4" : "hidden"}>
        <div className="space-y-1">
          <label htmlFor="budget_min" className={formLabelClassName}>
            {t("budgetMinLabel")}
          </label>
          <input
            id="budget_min"
            name="budget_min"
            type="number"
            min="0"
            defaultValue={existingProfile?.budget_min ?? ""}
            className={formInputClassName}
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="budget_max" className={formLabelClassName}>
            {t("budgetMaxLabel")}
          </label>
          <input
            id="budget_max"
            name="budget_max"
            type="number"
            min="0"
            defaultValue={existingProfile?.budget_max ?? ""}
            className={formInputClassName}
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="budget_currency" className={formLabelClassName}>
            {t("budgetCurrencyLabel")}
          </label>
          <input
            id="budget_currency"
            name="budget_currency"
            type="text"
            maxLength={3}
            placeholder="EUR"
            defaultValue={existingProfile?.budget_currency ?? ""}
            className={`${formInputClassName} uppercase`}
          />
        </div>
      </div>

      {state.error && (
        <p role="alert" className="font-body-sm text-body-sm text-error">
          {state.error}
        </p>
      )}

      <div className="pt-2">
        {step < STEP_COUNT ? (
          <button
            type="button"
            onClick={goNext}
            className={`${formPrimaryButtonClassName} w-full flex items-center justify-center gap-2`}
          >
            {t("continue")}
            <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 18 }}>
              arrow_forward
            </span>
          </button>
        ) : (
          <button
            type="submit"
            disabled={pending}
            className={`${formPrimaryButtonClassName} w-full`}
          >
            {pending ? t("submitPending") : t("submit")}
          </button>
        )}
      </div>
    </form>
  );
}
