import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { CatalogService } from "@/lib/services/catalog.service";
import { FavouritesService } from "@/lib/services/favourites.service";
import { ComparisonService } from "@/lib/services/comparison.service";
import { ProgrammeCard } from "@/components/programme-card";
import { formSelectClassName, formLabelClassName } from "@/components/form-styles";

/**
 * Browses the full catalog with the same field/country/budgetMax GET
 * filters the homepage's Quick Match form already submits to (see
 * `[locale]/page.tsx`) — a plain GET form needs no client JS, and
 * filtering happens in-memory since `CatalogService.listProgrammes` is
 * deliberately unfiltered (see its doc comment).
 */
export default async function CatalogPage({
  params,
  searchParams,
}: PageProps<"/[locale]/catalog">) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  const sp = await searchParams;
  const fieldFilter = typeof sp.field === "string" && sp.field ? sp.field : null;
  const countryFilter = typeof sp.country === "string" && sp.country ? sp.country : null;
  const budgetMaxFilter =
    typeof sp.budgetMax === "string" && sp.budgetMax ? Number(sp.budgetMax) : null;

  const t = await getTranslations("Catalog");
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const catalogService = new CatalogService(supabase);
  const [allProgrammes, countries, fieldsOfStudy] = await Promise.all([
    catalogService.listProgrammes(),
    catalogService.listCountries(),
    catalogService.listFieldsOfStudy(),
  ]);

  const programmes = allProgrammes.filter((programme) => {
    if (fieldFilter && programme.field_of_study.id !== fieldFilter) return false;
    if (countryFilter && programme.university.country.code !== countryFilter) return false;
    if (budgetMaxFilter && programme.tuition_fee_amount > budgetMaxFilter) return false;
    return true;
  });

  // Saved/compared state is only meaningful for a real user session, but
  // per `src/proxy.ts` every visitor has one (anonymous or not) — `user`
  // being null here is the rare edge case, not the common signed-out
  // case, so this guard is defensive rather than a "please sign in" path.
  let savedIds = new Set<string>();
  let comparisonIds = new Set<string>();
  if (user) {
    const [saved, comparisons] = await Promise.all([
      new FavouritesService(supabase).listSavedProgrammesForUser(user.id),
      new ComparisonService(supabase).listForUser(user.id),
    ]);
    savedIds = new Set(saved.map((s) => s.programme.id));
    comparisonIds = new Set((comparisons[0]?.programmes ?? []).map((p) => p.id));
  }

  return (
    <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-16 space-y-8">
      <div className="space-y-1">
        <h1 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-primary">
          {t("heading")}
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          {t("description")}
        </p>
      </div>

      <form action="/catalog" className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
        <div className="space-y-1">
          <label htmlFor="field" className={formLabelClassName}>
            {t("filterFieldLabel")}
          </label>
          <select
            id="field"
            name="field"
            defaultValue={fieldFilter ?? ""}
            className={formSelectClassName}
          >
            <option value="">{t("filterAnyOption")}</option>
            {fieldsOfStudy.map((field) => (
              <option key={field.id} value={field.id}>
                {field.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label htmlFor="country" className={formLabelClassName}>
            {t("filterCountryLabel")}
          </label>
          <select
            id="country"
            name="country"
            defaultValue={countryFilter ?? ""}
            className={formSelectClassName}
          >
            <option value="">{t("filterAnyOption")}</option>
            {countries.map((country) => (
              <option key={country.code} value={country.code}>
                {country.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label htmlFor="budgetMax" className={formLabelClassName}>
            {t("filterBudgetLabel")}
          </label>
          <select
            id="budgetMax"
            name="budgetMax"
            defaultValue={budgetMaxFilter != null ? String(budgetMaxFilter) : ""}
            className={formSelectClassName}
          >
            <option value="">{t("filterAnyOption")}</option>
            <option value="5000">{t("filterBudgetUnder5k")}</option>
            <option value="10000">{t("filterBudgetUnder10k")}</option>
            <option value="15000">{t("filterBudgetUnder15k")}</option>
          </select>
        </div>

        <button
          type="submit"
          className="font-label-caps text-label-caps bg-primary text-on-primary px-6 py-3 rounded-full hover:bg-on-primary-fixed-variant transition-all active:scale-95"
        >
          {t("filterSubmit")}
        </button>
      </form>

      <p className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wide">
        {t("resultsCount", { count: programmes.length })}
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {programmes.map((programme) => (
          <ProgrammeCard
            key={programme.id}
            programme={programme}
            isSaved={savedIds.has(programme.id)}
            inComparison={comparisonIds.has(programme.id)}
            labels={{
              save: t("save"),
              unsave: t("unsave"),
              compareAdd: t("compareAdd"),
              compareRemove: t("compareRemove"),
              viewDetails: t("viewDetails"),
            }}
          />
        ))}
      </div>
    </main>
  );
}
