"use client";

import { useActionState } from "react";
import { saveOnboardingProfile, type ProfileFormState } from "@/lib/actions/profile.actions";

type Option = { value: string; label: string };

const initialState: ProfileFormState = { error: null };

const fieldClass =
  "w-full rounded-md border border-outline-variant bg-surface-container-lowest px-4 py-3 font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary";
const labelClass =
  "font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wide";

export function OnboardingForm({
  countries,
  languages,
  fieldsOfStudy,
  defaults,
}: {
  countries: Option[];
  languages: Option[];
  fieldsOfStudy: Option[];
  defaults?: {
    full_name?: string | null;
    nationality_country_code?: string | null;
    current_education_level?: string | null;
    current_gpa?: number | null;
    current_gpa_scale?: number | null;
    budget_min?: number | null;
    budget_max?: number | null;
    budget_currency?: string | null;
    preferred_degree_level?: string | null;
    preferred_country_codes?: string[];
    preferred_cities?: string[];
    preferred_field_of_study_ids?: string[];
    preferred_language_codes?: string[];
  };
}) {
  const [state, formAction, isPending] = useActionState(saveOnboardingProfile, initialState);

  return (
    <form action={formAction} className="space-y-10 max-w-2xl">
      <section className="space-y-4">
        <h2 className="font-headline-sm text-headline-sm text-primary">
          About you
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="full_name" className={labelClass}>Full name</label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              defaultValue={defaults?.full_name ?? ""}
              className={fieldClass}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="nationality_country_code" className={labelClass}>Nationality</label>
            <select
              id="nationality_country_code"
              name="nationality_country_code"
              defaultValue={defaults?.nationality_country_code ?? ""}
              className={fieldClass}
            >
              <option value="">Select a country</option>
              {countries.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-headline-sm text-headline-sm text-primary">
          Academic background
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="current_education_level" className={labelClass}>Current level</label>
            <select
              id="current_education_level"
              name="current_education_level"
              defaultValue={defaults?.current_education_level ?? ""}
              className={fieldClass}
            >
              <option value="">Select</option>
              <option value="high_school">High school</option>
              <option value="bachelor">Bachelor&rsquo;s</option>
              <option value="master">Master&rsquo;s</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="current_gpa" className={labelClass}>Current GPA</label>
            <input
              id="current_gpa"
              name="current_gpa"
              type="number"
              step="0.01"
              min="0"
              defaultValue={defaults?.current_gpa ?? ""}
              className={fieldClass}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="current_gpa_scale" className={labelClass}>GPA scale (e.g. 4.0)</label>
            <input
              id="current_gpa_scale"
              name="current_gpa_scale"
              type="number"
              step="0.01"
              min="0"
              defaultValue={defaults?.current_gpa_scale ?? ""}
              className={fieldClass}
            />
          </div>
        </div>
        <div className="space-y-1.5 max-w-xs">
          <label htmlFor="ielts_score" className={labelClass}>IELTS score (if you have one)</label>
          <input
            id="ielts_score"
            name="ielts_score"
            type="number"
            step="0.5"
            min="0"
            max="9"
            className={fieldClass}
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-headline-sm text-headline-sm text-primary">
          Budget
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="budget_min" className={labelClass}>Min per year</label>
            <input
              id="budget_min"
              name="budget_min"
              type="number"
              min="0"
              defaultValue={defaults?.budget_min ?? ""}
              className={fieldClass}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="budget_max" className={labelClass}>Max per year</label>
            <input
              id="budget_max"
              name="budget_max"
              type="number"
              min="0"
              defaultValue={defaults?.budget_max ?? ""}
              className={fieldClass}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="budget_currency" className={labelClass}>Currency (e.g. EUR)</label>
            <input
              id="budget_currency"
              name="budget_currency"
              type="text"
              maxLength={3}
              defaultValue={defaults?.budget_currency ?? ""}
              className={`${fieldClass} uppercase`}
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-headline-sm text-headline-sm text-primary">
          What you&rsquo;re looking for
        </h2>
        <div className="space-y-1.5 max-w-xs">
          <label htmlFor="preferred_degree_level" className={labelClass}>Degree level</label>
          <select
            id="preferred_degree_level"
            name="preferred_degree_level"
            defaultValue={defaults?.preferred_degree_level ?? ""}
            className={fieldClass}
          >
            <option value="">Select</option>
            <option value="foundation">Foundation</option>
            <option value="bachelor">Bachelor&rsquo;s</option>
            <option value="master">Master&rsquo;s</option>
            <option value="phd">PhD</option>
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="preferred_country_codes" className={labelClass}>
              Countries (hold Ctrl/Cmd to select several)
            </label>
            <select
              id="preferred_country_codes"
              name="preferred_country_codes"
              multiple
              size={6}
              defaultValue={defaults?.preferred_country_codes ?? []}
              className={fieldClass}
            >
              {countries.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="preferred_language_codes" className={labelClass}>
              Languages of instruction
            </label>
            <select
              id="preferred_language_codes"
              name="preferred_language_codes"
              multiple
              size={6}
              defaultValue={defaults?.preferred_language_codes ?? []}
              className={fieldClass}
            >
              {languages.map((l) => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="preferred_field_of_study_ids" className={labelClass}>
            Fields of study
          </label>
          <select
            id="preferred_field_of_study_ids"
            name="preferred_field_of_study_ids"
            multiple
            size={8}
            defaultValue={defaults?.preferred_field_of_study_ids ?? []}
            className={fieldClass}
          >
            {fieldsOfStudy.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="preferred_cities" className={labelClass}>
            Cities (comma-separated, optional)
          </label>
          <input
            id="preferred_cities"
            name="preferred_cities"
            type="text"
            placeholder="Prague, Amsterdam"
            defaultValue={defaults?.preferred_cities?.join(", ") ?? ""}
            className={fieldClass}
          />
        </div>
      </section>

      {state.error && (
        <p className="font-body-sm text-body-sm text-error">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="bg-primary text-on-primary font-label-caps text-label-caps px-8 py-4 rounded-full hover:bg-on-primary-fixed-variant transition-all active:scale-95 shadow-md disabled:opacity-60"
      >
        {isPending ? "Saving…" : "Save and see my matches"}
      </button>
    </form>
  );
}
