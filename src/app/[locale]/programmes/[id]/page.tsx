import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { CatalogService } from "@/lib/services/catalog.service";
import { MatchingService } from "@/lib/services/matching.service";
import { FavouritesService } from "@/lib/services/favourites.service";
import { ComparisonService } from "@/lib/services/comparison.service";
import { SaveToggleForm } from "@/components/save-toggle-form";
import { CompareToggleForm } from "@/components/compare-toggle-form";
import { DocumentChecklist } from "@/components/document-checklist";
import { UniversityResources } from "@/components/university-resources";
import type { MatchDimensionResult } from "@/lib/matching/types";

function formatMoney(amount: number, currency: string) {
  return `${Math.round(amount).toLocaleString()} ${currency}`;
}

// Same key mapping `matches/match-card.tsx` uses for the `Matches`
// namespace — duplicated locally rather than imported, since that
// module's maps aren't exported and this page's dimension list is
// simpler (no reasons/concerns rendering via `Matching` messages).
const DIMENSION_KEYS: Record<MatchDimensionResult["key"], string> = {
  academic: "dimensionAcademic",
  budget: "dimensionBudget",
  language: "dimensionLanguage",
  location: "dimensionLocation",
  admission: "dimensionAdmission",
};

export default async function ProgrammeDetailPage({
  params,
}: PageProps<"/[locale]/programmes/[id]">) {
  const { locale, id } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  const t = await getTranslations("ProgrammeDetail");
  const tMatches = await getTranslations("Matches");
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const catalogService = new CatalogService(supabase);
  const programme = await catalogService.getProgramme(id);
  if (!programme) notFound();

  const universityResources = await catalogService.listUniversityResources(
    programme.university.id,
  );

  let rankedMatch = null;
  let saved = false;
  let inComparison = false;
  if (user) {
    const [rm, isSaved, comparisons] = await Promise.all([
      new MatchingService(supabase).getMatchForProgramme(user.id, id),
      new FavouritesService(supabase).isSaved(user.id, id),
      new ComparisonService(supabase).listForUser(user.id),
    ]);
    rankedMatch = rm;
    saved = isSaved;
    inComparison = (comparisons[0]?.programmes ?? []).some((p) => p.id === id);
  }

  return (
    <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-16 space-y-10">
      <div className="space-y-2">
        <p className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wide">
          {programme.university.name} · {programme.university.city},{" "}
          {programme.university.country.name}
        </p>
        <h1 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-primary">
          {programme.name}
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          {programme.degree_level} · {programme.language.name} ·{" "}
          {programme.duration_months} mo
        </p>
      </div>

      {programme.description && (
        <p className="font-body-md text-body-md text-on-surface max-w-2xl">
          {programme.description}
        </p>
      )}

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl">
        <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-lg p-6 ambient-shadow">
          <p className="font-label-caps text-label-caps text-on-surface-variant mb-1">
            {t("tuitionLabel")}
          </p>
          <p className="font-data-lg text-data-lg text-on-surface">
            {formatMoney(programme.tuition_fee_amount, programme.tuition_fee_currency)}
          </p>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            {programme.tuition_fee_period.replace("_", " ")}
          </p>
        </div>
        {programme.estimated_living_cost_monthly != null && (
          <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-lg p-6 ambient-shadow">
            <p className="font-label-caps text-label-caps text-on-surface-variant mb-1">
              {t("livingCostLabel")}
            </p>
            <p className="font-data-lg text-data-lg text-on-surface">
              {formatMoney(
                programme.estimated_living_cost_monthly,
                programme.living_cost_currency ?? programme.tuition_fee_currency,
              )}
            </p>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              {t("perMonth")}
            </p>
          </div>
        )}
        {programme.application_deadline && (
          <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-lg p-6 ambient-shadow">
            <p className="font-label-caps text-label-caps text-on-surface-variant mb-1">
              {t("deadlineLabel")}
            </p>
            <p className="font-data-lg text-data-lg text-on-surface">
              {new Date(programme.application_deadline).toLocaleDateString(locale)}
            </p>
          </div>
        )}
      </section>

      <div className="flex gap-3">
        <SaveToggleForm
          programmeId={programme.id}
          isSaved={saved}
          saveLabel={t("save")}
          unsaveLabel={t("unsave")}
        />
        <CompareToggleForm
          programmeId={programme.id}
          inComparison={inComparison}
          addLabel={t("compareAdd")}
          removeLabel={t("compareRemove")}
        />
      </div>

      {rankedMatch && (
        <section className="max-w-2xl space-y-4">
          <div className="flex items-baseline justify-between">
            <h2 className="font-headline-sm text-headline-sm text-primary">
              {t("yourMatchScore")}
            </h2>
            {rankedMatch.match.overallScore != null && (
              <p className="font-headline-md text-headline-md text-primary">
                {rankedMatch.match.overallScore}%
              </p>
            )}
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            {t("matchScoreDisclaimer")}
          </p>
          <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-lg p-6 ambient-shadow">
            {rankedMatch.match.dimensions.map((dimension) => (
              <div
                key={dimension.key}
                className="border-b border-outline-variant/30 py-4 last:border-0"
              >
                <div className="flex items-center justify-between">
                  <p className="font-body-md text-body-md text-on-surface">
                    {tMatches(DIMENSION_KEYS[dimension.key] as Parameters<typeof tMatches>[0])}
                  </p>
                  <p
                    className={`font-data-lg text-data-lg ${
                      dimension.applicable ? "text-primary" : "text-on-surface-variant"
                    }`}
                  >
                    {dimension.applicable && dimension.score != null
                      ? `${dimension.score}%`
                      : tMatches("notApplicable")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <DocumentChecklist />

      <UniversityResources
        universityName={programme.university.name}
        resources={universityResources}
      />
    </main>
  );
}
