import { hasLocale } from "next-intl";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { CatalogService } from "@/lib/services/catalog.service";
import { formSelectClassName } from "@/components/form-styles";

/**
 * Real landing screen, rebuilt to match the
 * `unifind_premium_landing_page_updated` Stitch mockup: hero + two CTAs,
 * an illustrative "top match" preview card, a real Quick Match mini-form
 * (plain GET form -- no client JS needed -- that hands off to /catalog's
 * own filters), and the three-step "How it works" explainer.
 */
export default async function Home({
  params,
}: PageProps<"/[locale]">) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const t = await getTranslations("HomePage");
  const supabase = await createServerSupabaseClient();
  const catalog = new CatalogService(supabase);
  const [countries, fieldsOfStudy, programmeCount] = await Promise.all([
    catalog.listCountries(),
    catalog.listFieldsOfStudy(),
    catalog.listProgrammes().then((p) => p.length),
  ]);

  return (
    <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-10 md:py-16 space-y-16">
      <section className="space-y-5 max-w-2xl">
        <h1 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-primary text-center md:text-left">
          {t("heading")}
        </h1>
        <p className="font-body-md text-body-md md:font-body-lg md:text-body-lg text-on-surface-variant max-w-xl text-center md:text-left mx-auto md:mx-0">
          {t("description")}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link
            href="/onboarding"
            className="font-label-caps text-label-caps text-center bg-primary text-on-primary px-8 py-4 rounded-full hover:bg-on-primary-fixed-variant transition-all active:scale-95 shadow-md"
          >
            {t("ctaPrimary")}
          </Link>
          <Link
            href="/catalog"
            className="font-label-caps text-label-caps text-center border border-outline-variant px-8 py-4 rounded-full hover:bg-surface-container transition-all active:scale-95"
          >
            {t("ctaSecondary")}
          </Link>
        </div>
      </section>

      {/* Illustrative top-match preview -- no real photo asset ships with
          this repo, so a gradient panel stands in for the mockup's
          Charles University photo while keeping the same badge/score
          layout. */}
      <section className="relative rounded-xl overflow-hidden ambient-shadow h-56 md:h-72 bg-gradient-to-br from-primary via-primary-container to-on-primary-fixed-variant">
        <div className="absolute top-4 left-4 flex items-center gap-2">
          <span className="font-label-caps text-label-caps bg-tertiary-fixed text-on-tertiary-fixed px-3 py-1.5 rounded-full">
            {t("matchScoreLabel")} · 94%
          </span>
        </div>
        <div className="absolute bottom-0 inset-x-0 p-5 md:p-6 bg-gradient-to-t from-black/70 to-transparent">
          <p className="font-headline-sm text-headline-sm text-white">
            Charles University
          </p>
          <p className="font-body-sm text-body-sm text-white/80">
            Computer Science &amp; Information Technology
          </p>
        </div>
      </section>

      <section className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-6 md:p-8 ambient-shadow space-y-6 max-w-2xl mx-auto">
        <h2 className="font-headline-sm text-headline-sm text-primary text-center">
          {t("quickMatchHeading")}
        </h2>

        <form action="/catalog" className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="field" className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wide">
              {t("quickMatchFieldLabel")}
            </label>
            <select id="field" name="field" defaultValue="" className={formSelectClassName}>
              <option value="">{t("quickMatchAnyOption")}</option>
              {fieldsOfStudy.map((field) => (
                <option key={field.id} value={field.id}>
                  {field.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label htmlFor="country" className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wide">
              {t("quickMatchCountryLabel")}
            </label>
            <select id="country" name="country" defaultValue="" className={formSelectClassName}>
              <option value="">{t("quickMatchAnyOption")}</option>
              {countries.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label htmlFor="budgetMax" className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wide">
              {t("quickMatchBudgetLabel")}
            </label>
            <select id="budgetMax" name="budgetMax" defaultValue="" className={formSelectClassName}>
              <option value="">{t("quickMatchAnyOption")}</option>
              <option value="5000">{t("quickMatchBudgetUnder5k")}</option>
              <option value="10000">{t("quickMatchBudgetUnder10k")}</option>
              <option value="15000">{t("quickMatchBudgetUnder15k")}</option>
            </select>
          </div>

          <div className="flex items-center justify-between gap-4 pt-2">
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              {t.rich("quickMatchCount", {
                count: programmeCount,
                strong: (chunks) => (
                  <span className="font-headline-sm text-headline-sm text-primary">
                    {chunks}
                  </span>
                ),
              })}
            </p>
            <button
              type="submit"
              aria-label={t("quickMatchSubmit")}
              className="shrink-0 w-11 h-11 rounded-full bg-primary text-on-primary flex items-center justify-center hover:bg-on-primary-fixed-variant transition-all active:scale-95"
            >
              <span className="material-symbols-outlined" aria-hidden="true">
                arrow_forward
              </span>
            </button>
          </div>
        </form>
      </section>

      <section className="space-y-10">
        <h2 className="font-headline-md text-headline-md text-primary text-center">
          {t("howItWorksHeading")}
        </h2>

        <ol className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {(
            [
              ["edit_note", "howItWorksStep1Title", "howItWorksStep1Description"],
              ["manage_search", "howItWorksStep2Title", "howItWorksStep2Description"],
              ["flight_takeoff", "howItWorksStep3Title", "howItWorksStep3Description"],
            ] as const
          ).map(([icon, titleKey, descriptionKey], index) => (
            <li key={titleKey} className="flex flex-col items-center text-center gap-3">
              <span className="w-14 h-14 rounded-full bg-surface-container-lowest border border-outline-variant/40 ambient-shadow flex items-center justify-center">
                <span className="material-symbols-outlined text-primary" aria-hidden="true">
                  {icon}
                </span>
              </span>
              <p className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wide">
                {t("howItWorksStepLabel", { number: index + 1 })}
              </p>
              <p className="font-headline-sm text-headline-sm text-primary">
                {t(titleKey)}
              </p>
              <p className="font-body-sm text-body-sm text-on-surface-variant max-w-xs">
                {t(descriptionKey)}
              </p>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
