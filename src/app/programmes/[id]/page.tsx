import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { CatalogService } from "@/lib/services/catalog.service";
import { MatchingService } from "@/lib/services/matching.service";
import { FavouritesService } from "@/lib/services/favourites.service";
import { ComparisonService } from "@/lib/services/comparison.service";
import { SaveButton } from "@/components/save-button";
import { CompareButton } from "@/components/compare-button";
import { DocumentChecklist } from "@/components/document-checklist";
import { UniversityResources } from "@/components/university-resources";
import type { MatchDimensionResult } from "@/lib/matching/types";

function formatMoney(amount: number, currency: string) {
  return `${Math.round(amount).toLocaleString()} ${currency}`;
}

function DimensionRow({ dimension }: { dimension: MatchDimensionResult }) {
  return (
    <div className="border-b border-outline-variant/30 py-4 last:border-0">
      <div className="flex items-center justify-between">
        <p className="font-body-md text-body-md text-on-surface">{dimension.label}</p>
        <p className="font-data-lg text-data-lg text-primary">
          {dimension.applicable && dimension.score != null ? `${dimension.score}%` : "N/A"}
        </p>
      </div>
      <div className="mt-2 space-y-1">
        {dimension.reasons.map((r) => (
          <p key={r} className="font-body-sm text-body-sm text-on-surface flex items-start gap-2">
            <span className="text-success">✓</span> {r}
          </p>
        ))}
        {dimension.concerns.map((c) => (
          <p key={c} className="font-body-sm text-body-sm text-on-surface flex items-start gap-2">
            <span className="text-warning">⚠</span> {c}
          </p>
        ))}
      </div>
    </div>
  );
}

export default async function ProgrammeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  const supabase = await createServerSupabaseClient();

  const catalogService = new CatalogService(supabase);
  const programme = await catalogService.getProgramme(id);
  if (!programme) notFound();

  const universityResources = await catalogService.listUniversityResources(
    programme.university.id,
  );

  const [rankedMatch, saved, activeComparison] = user
    ? await Promise.all([
        new MatchingService(supabase).getMatchForProgramme(user.id, id),
        new FavouritesService(supabase).listSavedProgrammeIds(user.id).then((s) => s.has(id)),
        new ComparisonService(supabase).getActiveForUser(user.id),
      ])
    : [null, false, null];

  const inComparison = (activeComparison?.programmes ?? []).some((p) => p.id === id);

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
          {programme.degree_level} · {programme.language.name}-taught ·{" "}
          {programme.duration_months} months
        </p>
      </div>

      {programme.description && (
        <p className="font-body-md text-body-md text-on-surface max-w-2xl">
          {programme.description}
        </p>
      )}

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl">
        <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-lg p-6 ambient-shadow">
          <p className="font-label-caps text-label-caps text-on-surface-variant mb-1">Tuition</p>
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
              Est. living cost
            </p>
            <p className="font-data-lg text-data-lg text-on-surface">
              {formatMoney(
                programme.estimated_living_cost_monthly,
                programme.living_cost_currency ?? programme.tuition_fee_currency,
              )}
            </p>
            <p className="font-body-sm text-body-sm text-on-surface-variant">per month</p>
          </div>
        )}
        {programme.application_deadline && (
          <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-lg p-6 ambient-shadow">
            <p className="font-label-caps text-label-caps text-on-surface-variant mb-1">
              Application deadline
            </p>
            <p className="font-data-lg text-data-lg text-on-surface">
              {new Date(programme.application_deadline).toLocaleDateString()}
            </p>
          </div>
        )}
      </section>

      {user ? (
        <div className="flex gap-3">
          <SaveButton programmeId={programme.id} initiallySaved={saved} />
          <CompareButton programmeId={programme.id} initiallyInComparison={inComparison} />
        </div>
      ) : (
        <p className="font-body-md text-body-md text-on-surface-variant">
          <a href="/sign-in" className="text-primary hover:underline">Sign in</a> to see your
          personalized Match Score, and to save or compare this programme.
        </p>
      )}

      {rankedMatch && (
        <section className="max-w-2xl space-y-4">
          <div className="flex items-baseline justify-between">
            <h2 className="font-headline-sm text-headline-sm text-primary">
              Your Match Score
            </h2>
            {rankedMatch.match.overallScore != null && (
              <p className="font-headline-md text-headline-md text-primary">
                {rankedMatch.match.overallScore}%
              </p>
            )}
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Match Score reflects fit with your profile, not your chance of
            admission.
          </p>
          <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-lg p-6 ambient-shadow">
            {rankedMatch.match.dimensions.map((d) => (
              <DimensionRow key={d.key} dimension={d} />
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
