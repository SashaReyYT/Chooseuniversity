"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { quickMatchAction } from "@/lib/quick-match/quick-match-action";
import { initialQuickMatchActionState } from "@/lib/quick-match/quick-match-action";
import type { Database } from "@/types/database";
import {
  formInputClassName,
  formPrimaryButtonClassName,
  formSelectClassName,
} from "@/components/form-styles";

type CountryRow = Database["public"]["Tables"]["countries"]["Row"];
type FieldOfStudyRow = Database["public"]["Tables"]["fields_of_study"]["Row"];

interface QuickMatchFormProps {
  supportedCountries: CountryRow[];
  fieldsOfStudy: FieldOfStudyRow[];
}

/**
 * Landing page "Quick Match Profile" (spec §9, visual reference:
 * `unifind_premium_landing_page_updated`): three coarse questions
 * (field of study, destination country, rough annual budget) that return
 * a simple "X programmes may fit you" teaser count before the user
 * commits to the full questionnaire. Deliberately not the real matching
 * engine — no score, no reasons/concerns, no explainability requirement.
 *
 * Styled to overlap the hero section above it (negative top margin +
 * higher z-index + larger rounded-xl radius), matching the mockup's
 * "Interactive Teaser" card treatment.
 */
export function QuickMatchForm({
  supportedCountries,
  fieldsOfStudy,
}: QuickMatchFormProps) {
  const t = useTranslations("QuickMatch");
  const [state, formAction, pending] = useActionState(
    quickMatchAction,
    initialQuickMatchActionState,
  );

  const hasResult = state.submitted && state.count != null;
  const resultCount = hasResult ? state.count : null;

  return (
    <section className="bg-surface-container-lowest rounded-xl ambient-shadow p-6 md:p-8 max-w-2xl mx-auto border border-outline-variant/40 relative z-20 -mt-16 md:-mt-20 space-y-5">
      <h2 className="font-headline-sm text-headline-sm text-primary text-center pb-2">
        {t("heading")}
      </h2>

      <form action={formAction} className="space-y-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="quick-field-of-study" className="font-body-sm text-body-sm font-semibold text-primary pl-1">
            {t("fieldOfStudyLabel")}
          </label>
          <select
            id="quick-field-of-study"
            name="field_of_study_id"
            className={formSelectClassName}
          >
            <option value="">{t("anyOption")}</option>
            {fieldsOfStudy.map((field) => (
              <option key={field.id} value={field.id}>
                {field.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="quick-country" className="font-body-sm text-body-sm font-semibold text-primary pl-1">
            {t("countryLabel")}
          </label>
          <select
            id="quick-country"
            name="country_code"
            className={formSelectClassName}
          >
            <option value="">{t("anyOption")}</option>
            {supportedCountries.map((country) => (
              <option key={country.code} value={country.code}>
                {country.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="quick-budget" className="font-body-sm text-body-sm font-semibold text-primary pl-1">
            {t("budgetLabel")}
          </label>
          <input
            id="quick-budget"
            name="budget_max_yearly"
            type="number"
            min="0"
            placeholder={t("budgetPlaceholder")}
            className={formInputClassName}
          />
        </div>

        <button
          type="submit"
          disabled={pending}
          className={formPrimaryButtonClassName}
        >
          {pending ? t("submitPending") : t("submit")}
        </button>
      </form>

      {hasResult && (
        <div className="pt-4 border-t border-outline-variant/30 flex items-center justify-between gap-4">
          <p className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-2">
            <span className="material-symbols-outlined text-tertiary-container text-[18px]" aria-hidden="true">
              auto_awesome
            </span>
            {resultCount != null && resultCount > 0 ? (
              <span>
                <span className="text-primary font-semibold font-body-md">
                  {t("resultsHint", { count: resultCount })}
                </span>
              </span>
            ) : (
              <span>{t("resultsHintZero")}</span>
            )}
          </p>
          <Link
            href="/profile"
            aria-label={t("continueLink")}
            className="bg-primary/5 text-primary hover:bg-primary/10 p-2 rounded-full transition-colors flex items-center justify-center h-10 w-10 shrink-0"
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
              arrow_forward
            </span>
          </Link>
        </div>
      )}
    </section>
  );
}