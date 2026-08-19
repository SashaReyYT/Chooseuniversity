import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Link, redirect } from "@/i18n/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ProfileService } from "@/lib/services/profile.service";
import { MatchingService } from "@/lib/services/matching.service";
import { FavouritesService } from "@/lib/services/favourites.service";
import { ComparisonService } from "@/lib/services/comparison.service";
import { ProgrammeCard } from "@/components/programme-card";
import type { MatchResult } from "@/lib/matching/engine";

export default async function SavedPage({
  params,
}: PageProps<"/[locale]/saved">) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  const t = await getTranslations("Saved");
  const tDiscover = await getTranslations("Discover");
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Shouldn't happen — src/proxy.ts establishes an anonymous session for
    // every visitor — but if it somehow does (session establishment
    // failed, cookies blocked), send the visitor home rather than a bare
    // 404, which would misleadingly imply the page itself doesn't exist.
    //
    // The extra `return` below is deliberate, not dead code: next-intl's
    // `redirect` is typed to return `never`, but its signature is complex
    // enough (generic/conditional on path params) that TypeScript's
    // control-flow narrowing doesn't reliably pick that up — without this
    // `return`, TS still treats `user` as possibly null afterwards even
    // though this branch always exits at runtime.
    redirect({ href: "/", locale });
    return;
  }

  const favouritesService = new FavouritesService(supabase);
  const comparisonService = new ComparisonService(supabase);
  const profileData = await new ProfileService(supabase).getFullProfileForUser(user.id);

  const [saved, comparisons, matchesById] = await Promise.all([
    favouritesService.listSavedProgrammesForUser(user.id),
    comparisonService.listForUser(user.id),
    // Only compute matches when a profile exists — matching against no
    // profile data is meaningless, and ProgrammeCard already renders
    // gracefully with `match: null` (see its "no score" hint).
    profileData?.profile
      ? new MatchingService(supabase)
          .listMatchesForUser(user.id)
          .then((ranked) => new Map(ranked.map((r) => [r.programme.id, r.match])))
      : Promise.resolve(new Map<string, MatchResult>()),
  ]);

  const comparedProgrammeIds = new Set(
    comparisons[0]?.programmes.map((p) => p.id) ?? [],
  );
  const defaultComparisonName = tDiscover("heading");

  // Build match profile for Best For labels
  const matchProfile = profileData?.profile
    ? {
        current_education_level: profileData.profile.current_education_level,
        current_gpa: profileData.profile.current_gpa,
        current_gpa_scale: profileData.profile.current_gpa_scale,
        budget_min: profileData.profile.budget_min,
        budget_max: profileData.profile.budget_max,
        budget_currency: profileData.profile.budget_currency,
        budget_mode: profileData.profile.budget_mode,
        preferred_degree_level: profileData.profile.preferred_degree_level,
        preferred_country_codes: profileData.profile.preferred_country_codes,
        preferred_cities: profileData.profile.preferred_cities,
        preferred_field_of_study_ids: profileData.profile.preferred_field_of_study_ids,
        preferred_language_codes: profileData.profile.preferred_language_codes,
        location_preference_type: profileData.profile.location_preference_type,
        preferred_ownership_type: profileData.profile.preferred_ownership_type,
        support_preference: profileData.profile.support_preference,
        english_level: profileData.profile.english_level,
        math_background: profileData.profile.math_background,
        testScores: profileData.testScores.map((s) => ({
          test_type: s.test_type,
          qualification_id: s.qualification_id,
          score: s.score,
          cefr_equivalent: s.cefr_equivalent,
        })),
        nmtScores: profileData.nmtScores.map((s) => ({
          subject_code: s.subject_code,
          score: s.score,
          max_score: s.max_score,
        })),
        qualifications: profileData.qualifications.map((q) => ({
          qualification_id: q.qualification_id,
          year: q.year,
        })),
      }
    : null;

  // Group by match level (§37)
  const excellentMatches = saved.filter(({ programme }) => {
    const m = matchesById.get(programme.id);
    return m?.overallLabel === "Excellent Fit";
  });
  const strongMatches = saved.filter(({ programme }) => {
    const m = matchesById.get(programme.id);
    return m?.overallLabel === "Strong Fit";
  });
  const otherSaved = saved.filter(({ programme }) => {
    const m = matchesById.get(programme.id);
    return !m || (m.overallLabel !== "Excellent Fit" && m.overallLabel !== "Strong Fit");
  });

  const renderProgrammeCard = (savedItem: { programme: import("@/lib/repositories/programmes.repository").ProgrammeWithDetails }) => (
    <ProgrammeCard
      key={savedItem.programme.id}
      programme={savedItem.programme}
      match={matchesById.get(savedItem.programme.id) ?? null}
      profile={matchProfile}
      isSaved
      isInComparison={comparedProgrammeIds.has(savedItem.programme.id)}
      t={tDiscover}
      defaultComparisonName={defaultComparisonName}
    />
  );

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

      {saved.length === 0 ? (
        <div className="space-y-4">
          <p className="font-body-md text-body-md text-on-surface-variant">
            {t("empty")}
          </p>
          <Link
            href="/discover"
            className="inline-block font-label-caps text-label-caps text-primary underline"
          >
            {t("browseCta")}
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            {t("count", { count: saved.length })}
          </p>

          {excellentMatches.length > 0 && (
            <section className="space-y-4">
              <h2 className="font-headline-sm text-headline-sm text-primary">
                {t("groupExcellent")}
              </h2>
              <div className="space-y-6">
                {excellentMatches.map(renderProgrammeCard)}
              </div>
            </section>
          )}

          {strongMatches.length > 0 && (
            <section className="space-y-4">
              <h2 className="font-headline-sm text-headline-sm text-primary">
                {t("groupStrong")}
              </h2>
              <div className="space-y-6">
                {strongMatches.map(renderProgrammeCard)}
              </div>
            </section>
          )}

          {otherSaved.length > 0 && (
            <section className="space-y-4">
              <h2 className="font-headline-sm text-headline-sm text-primary">
                {t("groupOther")}
              </h2>
              <div className="space-y-6">
                {otherSaved.map(renderProgrammeCard)}
              </div>
            </section>
          )}
        </div>
      )}
    </main>
  );
}
