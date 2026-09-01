import { hasLocale } from "next-intl";
import type { Metadata } from "next";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Link, redirect } from "@/i18n/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ProfileService } from "@/lib/services/profile.service";
import { MatchingService } from "@/lib/services/matching.service";
import { FavouritesService } from "@/lib/services/favourites.service";
import { ComparisonService } from "@/lib/services/comparison.service";
import { ProgrammesRepository, type ProgrammeWithDetails } from "@/lib/repositories/programmes.repository";
import { ReferenceDataRepository } from "@/lib/repositories/reference-data.repository";
import { UserMatchWeightsRepository } from "@/lib/repositories/user-match-weights.repository";
import type { MatchResult } from "@/lib/matching/engine";
import { ProgrammeCard } from "@/components/programme-card";
import { AppShell } from "@/components/app-shell";
import { MatchChangesWrapper } from "@/components/match-changes-wrapper";
import { Suspense } from "react";
import { DiscoverSkeleton } from "@/components/skeleton-wrappers";
import { TopMatchesClient } from "@/components/top-matches-client";
import { DebouncedSearch } from "@/components/debounced-search";

import { toMatchProfile } from "@/lib/matching/profile-mapper";
import { updatePriorityAction } from "@/lib/matching/actions";

export async function generateMetadata({
  params: _params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  // Filtered views duplicate content — canonical points at the clean URL
  // so crawlers consolidate ranking signals.
  return {
    alternates: { canonical: "/discover" },
    title: "Discover",
  };
}

export default async function DiscoverPage({
  params,
  searchParams,
}: PageProps<"/[locale]/discover"> & { searchParams?: Promise<Record<string, string | undefined>> }) {
  const { locale } = await params;
  const sp = await searchParams;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  const t = await getTranslations("Discover");
  const uiLocale = await getLocale();
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Auth-first: trying to find a university without an account sends the
  // visitor to sign-up first, and only afterwards into the questionnaire
  // (`next=/onboarding`) — matches are an account feature.
  if (!user || user.is_anonymous === true) {
    redirect({
      href: `/sign-up?next=${encodeURIComponent("/onboarding")}`,
      locale,
    });
    return;
  }

  const profileData = await new ProfileService(supabase).getFullProfileForUser(user.id);

  const favouritesService = new FavouritesService(supabase);
  const comparisonService = new ComparisonService(supabase);

  // Build match user profile for Best For labels
  const matchProfile = profileData ? toMatchProfile(profileData) : null;

  // Server-side search/filter from query params (§35, §36)
  const searchQuery = sp?.q ?? "";
  const fieldOfStudyFilter = sp?.fieldOfStudy ?? "";
  const degreeFilter = sp?.degree ?? "";
  const languageFilter = sp?.language ?? "";
  const countryFilter = sp?.country ?? "";
  const sortBy = (sp?.sort as "best_match" | "lowest_tuition" | "highest_match" | "lowest_cost") ?? "best_match";

  let entries: { programme: ProgrammeWithDetails; match: MatchResult | null }[] = [];
  let saved: Awaited<ReturnType<FavouritesService["listSavedProgrammesForUser"]>> = [];
  let comparisons: Awaited<ReturnType<ComparisonService["listForUser"]>> = [];

  try {
    [entries, saved, comparisons] = await Promise.all([
      profileData?.profile
        ? new MatchingService(supabase)
            .listMatchesForUser(user.id, {
              query: searchQuery || undefined,
              fieldOfStudyId: fieldOfStudyFilter || undefined,
              degreeLevel: degreeFilter || undefined,
              languageCode: languageFilter || undefined,
              countryCode: countryFilter || undefined,
              sortBy,
            })
            .then((ranked) => ranked.map((r) => ({ programme: r.programme, match: r.match })))
        : new ProgrammesRepository(supabase)
            .search({
              query: searchQuery || undefined,
              fieldOfStudyId: fieldOfStudyFilter || undefined,
              degreeLevel: degreeFilter || undefined,
              languageCode: languageFilter || undefined,
              countryCode: countryFilter || undefined,
              sortBy,
            })
            .then((programmes) => programmes.map((programme) => ({ programme, match: null }))),
      favouritesService.listSavedProgrammesForUser(user.id),
      comparisonService.listForUser(user.id),
    ]);
  } catch (err) {
    console.error("Discover page data fetch failed:", err);
    // Continue with empty results — page still renders
  }

  const savedProgrammeIds = new Set(saved.map((s) => s.programme.id));
  const comparedProgrammeIds = new Set(
    comparisons[0]?.programmes.map((p) => p.id) ?? [],
  );
  const defaultComparisonName = t("heading");

  // Load user's custom match weights (priority preferences)
  const weightsRepo = new UserMatchWeightsRepository(supabase);
  const weights = (profileData?.profile
    ? await weightsRepo.findByUserId(user.id)
    : null) ?? {};

  // Get filter options
  const referenceDataRepo = new ReferenceDataRepository(supabase);
  let fieldsOfStudy: Awaited<ReturnType<ReferenceDataRepository["listFieldsOfStudy"]>> = [];
  let languages: Awaited<ReturnType<ReferenceDataRepository["listLanguages"]>> = [];
  let countries: Awaited<ReturnType<ReferenceDataRepository["listCountries"]>> = [];

  try {
    [fieldsOfStudy, languages, countries] = await Promise.all([
      referenceDataRepo.listFieldsOfStudy(),
      referenceDataRepo.listLanguages(),
      referenceDataRepo.listCountries(),
    ]);
  } catch (err) {
    console.error("Discover page reference data fetch failed:", err);
  }

  // Profile summary chips (mockup "27 programmes" header): derived from
  // the stored profile, shown only when one exists.
  const profile = profileData?.profile ?? null;
  const summaryChips = profile
    ? [
        profile.preferred_field_of_study_ids?.[0]
          ? fieldsOfStudy.find((f) => f.id === profile.preferred_field_of_study_ids[0])?.name
          : null,
        profile.preferred_degree_level
          ? {
              foundation: t("degreeFoundation"),
              bachelor: t("degreeBachelor"),
              master: t("degreeMaster"),
              phd: t("degreePhd"),
            }[profile.preferred_degree_level] ?? profile.preferred_degree_level
          : null,
        profile.preferred_country_codes?.length
          ? profile.preferred_country_codes
              .map((code) => countries.find((c) => c.code === code)?.name)
              .filter(Boolean)
              .join(" + ")
          : null,
        profile.preferred_language_codes?.length
          ? profile.preferred_language_codes
              .map((code) => languages.find((l) => l.code === code)?.name)
              .filter(Boolean)
              .join(" + ")
          : null,
        profile.budget_max != null && profile.budget_currency
          ? `${new Intl.NumberFormat(uiLocale, {
              style: "currency",
              currency: profile.budget_currency,
              maximumFractionDigits: 0,
            }).format(profile.budget_max)}/${t("perYear")}`
          : null,
      ].filter((chip): chip is string => Boolean(chip))
    : [];

  // Sort chips (mockup: Best Match / Lowest Cost / Top Academic /
  // Filters) — plain links preserving the active search & filters.
  const sortChips: { value: string; label: string }[] = [
    { value: "best_match", label: t("sortBestMatch") },
    { value: "lowest_cost", label: t("sortLowestCost") },
    { value: "highest_match", label: t("sortTopAcademic") },
  ];
  // ---- Pagination + intake filter + dedup top matches ------------------
  const PAGE_SIZE = 24;
  const intakeFilter = sp?.intake ?? "";

  // Top-match programme IDs — excluded from the list below so the same
  // university doesn't appear twice on one page.
  const topMatchIds = new Set(
    profileData?.profile
      ? entries
          .filter((e) => e.match?.overallScore != null)
          .slice(0, 3)
          .map((e) => e.programme.id)
      : [],
  );

  const intakeFiltered = (intakeFilter === ""
    ? entries
    : entries.filter(({ programme }) => {
        if (!programme.intake_start) return true;
        const m = new Date(programme.intake_start).getUTCMonth() + 1;
        return intakeFilter === "fall" ? m >= 7 : m < 7;
      })
  ).filter(({ programme }) => !topMatchIds.has(programme.id));

  const shownCount = Math.min(
    Math.max(1, Number(sp?.n ?? PAGE_SIZE) || PAGE_SIZE),
    intakeFiltered.length,
  );
  const visibleEntries = intakeFiltered.slice(0, shownCount);

  // Current filter state as a query object — reused by sort chips and the
  // load-more link. Deliberately excludes `n` so new filters reset paging.
  const activeQuery: Record<string, string> = {};
  if (searchQuery) activeQuery.q = searchQuery;
  if (fieldOfStudyFilter) activeQuery.fieldOfStudy = fieldOfStudyFilter;
  if (degreeFilter) activeQuery.degree = degreeFilter;
  if (languageFilter) activeQuery.language = languageFilter;
  if (countryFilter) activeQuery.country = countryFilter;
  if (intakeFilter) activeQuery.intake = intakeFilter;

  const sortHref = (value: string) => ({
    // next-intl Link is locale-aware — pass the pathname WITHOUT the
    // /en|uk prefix, otherwise it double-prefixes and 404s.
    pathname: "/discover",
    query: { ...activeQuery, sort: value },
  });

  // For search form action — uses GET to preserve query params (locale-aware)

  // Top matches for recommendations section — categorised as Best Fit / Safe Choice / Ambitious
  // Prioritise by preferred country → preferred field (same logic as results page)
  // so the top-3 always reflect the user's stated preferences.
  const topMatches = (() => {
    const withScore = entries.filter((e) => e.match?.overallScore != null);

    const preferredCountries: string[] = profile?.preferred_country_codes ?? [];
    const preferredFieldIds: string[] = profile?.preferred_field_of_study_ids ?? [];

    const inCountry = withScore.filter(
      (e) =>
        preferredCountries.length === 0 ||
        preferredCountries.includes(e.programme.university.country.code),
    );
    const outOfCountry = withScore.filter(
      (e) =>
        preferredCountries.length > 0 &&
        !preferredCountries.includes(e.programme.university.country.code),
    );

    const inCountryAndField = inCountry.filter(
      (e) =>
        preferredFieldIds.length === 0 ||
        preferredFieldIds.includes(e.programme.field_of_study_id),
    );
    const inCountryOtherField = inCountry.filter(
      (e) =>
        preferredFieldIds.length > 0 &&
        !preferredFieldIds.includes(e.programme.field_of_study_id),
    );

    const top3 = [...inCountryAndField, ...inCountryOtherField, ...outOfCountry].slice(0, 3);

    return top3.map((entry, idx) => {
      const score = entry.match!.overallScore!;
      let category: "best" | "safe" | "ambitious";
      let categoryKey: string;
      let categoryDescKey: string;

      if (idx === 0 && score >= 90) {
        category = "best";
        categoryKey = "categoryBestFit";
        categoryDescKey = "categoryBestFitDesc";
      } else if (score >= 80) {
        category = "safe";
        categoryKey = "categorySafeChoice";
        categoryDescKey = "categorySafeChoiceDesc";
      } else {
        category = "ambitious";
        categoryKey = "categoryAmbitious";
        categoryDescKey = "categoryAmbitiousDesc";
      }

      return {
        entry,
        category,
        categoryKey,
        categoryDescKey,
        idx,
      };
    });
  })();

  return (
    <AppShell>
      <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-16 space-y-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-primary">
            {t("heading")}
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            {profile ? t("description") : t("descriptionNoProfile")}
          </p>
        </div>
        <Link
          href="/onboarding"
          className="font-label-caps text-label-caps text-primary border border-primary rounded-full px-6 py-3 hover:bg-surface-container transition-all whitespace-nowrap"
        >
          {profile ? t("editProfile") : t("buildProfile")}
        </Link>
      </div>

      {profile && (
        <section className="space-y-3" aria-label={t("profileSummaryLabel")}>
          <p className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-primary">
            {t("resultCount", { count: entries.length })}
          </p>
          {summaryChips.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {summaryChips.map((chip) => (
                <span
                  key={chip}
                  className="font-label-caps text-label-caps text-on-surface-variant border border-outline-variant rounded-full px-4 py-2"
                >
                  {chip}
                </span>
              ))}
            </div>
)}
    </section>
  )}

      {/* Your top matches — human-readable recommendations with Safe/Best/Ambitious categorisation */}
      {topMatches.length > 0 && (
        <TopMatchesClient
          topMatches={topMatches}
          uiLocale={uiLocale}
          savedIds={savedProgrammeIds}
        />
      )}

      {/* Match score changes after profile update */}
      <MatchChangesWrapper />

      {/* Search and filters (§35, §36) */}
      <form
        method="GET"
        action={`/${locale}/discover`}
        id="filters"
        className="flex flex-col md:flex-row gap-3 items-end"
      >
        <div className="flex-1 min-w-0">
          <label htmlFor="search-q" className="sr-only">{t("searchLabel")}</label>
          <DebouncedSearch
            defaultValue={searchQuery}
            placeholder={t("searchPlaceholder")}
            debounceMs={300}
          />
        </div>
        <div className="flex gap-3 flex-wrap">
          <select
            name="fieldOfStudy"
            defaultValue={fieldOfStudyFilter}
            onChange={(e) => e.target.form?.requestSubmit()}
            aria-label={t("searchLabel")}
            className="font-body-sm text-body-sm bg-surface-container-lowest border border-outline-variant rounded-lg px-4 py-3"
          >
            <option value="">{t("allFields")}</option>
            {fieldsOfStudy.map((fos) => (
              <option key={fos.id} value={fos.id}>{fos.name}</option>
            ))}
          </select>
          <select
            name="degree"
            defaultValue={degreeFilter}
            onChange={(e) => e.target.form?.requestSubmit()}
            aria-label={t("allDegrees")}
            className="font-body-sm text-body-sm bg-surface-container-lowest border border-outline-variant rounded-lg px-4 py-3"
          >
            <option value="">{t("allDegrees")}</option>
            <option value="bachelor">{t("degreeBachelor")}</option>
            <option value="master">{t("degreeMaster")}</option>
            <option value="phd">{t("degreePhd")}</option>
          </select>
          <select
            name="language"
            defaultValue={languageFilter}
            onChange={(e) => e.target.form?.requestSubmit()}
            aria-label={t("allLanguages")}
            className="font-body-sm text-body-sm bg-surface-container-lowest border border-outline-variant rounded-lg px-4 py-3"
          >
            <option value="">{t("allLanguages")}</option>
            {languages.map((language) => (
              <option key={language.code} value={language.code}>{language.name}</option>
            ))}
          </select>
          <select
            name="country"
            defaultValue={countryFilter}
            onChange={(e) => e.target.form?.requestSubmit()}
            aria-label={t("allCountries")}
            className="font-body-sm text-body-sm bg-surface-container-lowest border border-outline-variant rounded-lg px-4 py-3"
          >
            <option value="">{t("allCountries")}</option>
            {countries.map((country) => (
              <option key={country.code} value={country.code}>{country.name}</option>
            ))}
          </select>
          <select
            name="intake"
            defaultValue={intakeFilter}
            onChange={(e) => e.target.form?.requestSubmit()}
            aria-label={t("intakeLabel")}
            className="font-body-sm text-body-sm bg-surface-container-lowest border border-outline-variant rounded-lg px-4 py-3"
          >
            <option value="">{t("intakeAny")}</option>
            <option value="fall">{t("intakeFall")}</option>
            <option value="spring">{t("intakeSpring")}</option>
          </select>
          <button
            type="submit"
            className="font-label-caps text-label-caps text-on-primary bg-primary rounded-full px-6 py-3 hover:bg-primary/90 transition-all active:scale-95"
          >
            {t("searchButton")}
          </button>
        </div>
      </form>

      {/* Sort chips (mockup: Best Match / Lowest Cost / Top Academic / Filters) */}
      <div className="flex flex-wrap gap-2" role="group" aria-label={t("searchLabel")}>
        {sortChips.map((chip) => {
          const active = sortBy === chip.value;
          return (
            <Link
              key={chip.value}
              href={sortHref(chip.value)}
              aria-current={active ? "true" : undefined}
              className={`font-label-caps text-label-caps rounded-full px-4 py-2 border transition-colors ${
                active
                  ? "bg-primary text-on-primary border-primary"
                  : "border-outline-variant text-on-surface hover:border-primary"
              }`}
            >
              {chip.label}
            </Link>
          );
        })}
        <Link
          href="#filters"
          className="font-label-caps text-label-caps rounded-full px-4 py-2 border border-outline-variant text-on-surface hover:border-primary transition-colors"
        >
          {t("filtersChip")}
        </Link>
      </div>

      {/* What matters most — priority weighting (collapsible) */}
      {profileData?.profile && (
        <section className="space-y-4" aria-labelledby="priorities-heading">
          <details className="group">
            <summary className="flex items-center justify-between cursor-pointer font-headline-sm text-headline-sm text-primary list-none">
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary" aria-hidden="true">tune</span>
                {t("whatMattersMost")}
              </span>
              <span className="material-symbols-outlined text-on-surface-variant transition-transform group-open:rotate-180" aria-hidden="true">expand_more</span>
            </summary>
            <div className="mt-4 animate-in fade-in-20">
              <form action={updatePriorityAction} className="space-y-4">
                <input type="hidden" name="locale" value={locale} />
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {[
                    { key: "budget", label: t("priorityBudget"), icon: "attach_money", color: "text-green-600" },
                    { key: "admission", label: t("priorityAdmission"), icon: "how_to_reg", color: "text-blue-600" },
                    { key: "academic", label: t("priorityAcademic"), icon: "school", color: "text-purple-600" },
                    { key: "location", label: t("priorityLocation"), icon: "location_on", color: "text-orange-600" },
                    { key: "career", label: t("priorityCareer"), icon: "work", color: "text-indigo-600" },
                  ].map(({ key, label, icon, color }) => {
                    const dimensionKey = key as keyof typeof weights;
                    const currentWeight = weights[dimensionKey] ?? 1;
                    return (
                      <button
                        key={key}
                        type="submit"
                        name="priority"
                        value={key}
                        className={`relative rounded-xl border-2 p-4 text-left transition-all ${
                          currentWeight > 1
                            ? "border-primary bg-primary-fixed/10"
                            : "border-outline-variant/40 hover:border-primary/50"
                        }`}
                      >
                        <input type="hidden" name={`weight_${key}`} value={currentWeight > 1 ? "1" : "2"} />
                        <div className="flex items-center gap-3">
                          <span className={`material-symbols-outlined ${color}`} aria-hidden="true">
                            {icon}
                          </span>
                          <span className="font-label-caps text-label-caps text-primary">{label}</span>
                        </div>
                        {currentWeight > 1 && (
                          <span className="absolute top-2 right-2 material-symbols-outlined text-primary" aria-hidden="true">
                            check_circle
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  {t("priorityHint")}
                </p>
              </form>
            </div>
          </details>
        </section>
      )}

      {entries.length === 0 ? (
        <p className="font-body-md text-body-md text-on-surface-variant">
          {t("empty")}
        </p>
      ) : (
        <>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            {t("resultCount", { count: intakeFiltered.length })}
          </p>
          <div className="space-y-6">
            <Suspense fallback={<DiscoverSkeleton />}>
              {visibleEntries.map(({ programme, match }) => (
                <div key={programme.id} className="relative">
                  <ProgrammeCard
                    programme={programme}
                    match={match}
                    profile={matchProfile}
                    isSaved={savedProgrammeIds.has(programme.id)}
                    isInComparison={comparedProgrammeIds.has(programme.id)}
                    t={t}
                    defaultComparisonName={defaultComparisonName}
                  />
                </div>
              ))}
            </Suspense>
          </div>

          {/* Load-more pagination — `n` accumulates so each click extends
              the rendered list without duplicating DOM. New searches/filters
              omit `n`, resetting to the first page. */}
          {entries.length > shownCount && (
            <Link
              href={{ pathname: "/discover", query: { ...activeQuery, n: String(shownCount + PAGE_SIZE) } }}
              className="block w-full rounded-full border border-primary py-4 text-center font-label-caps text-label-caps text-primary transition-all hover:bg-surface-container active:scale-[0.99]"
              role="button"
            >
              {t("loadMore", { count: Math.min(PAGE_SIZE, entries.length - shownCount) })}
            </Link>
          )}
        </>
      )}
      </main>
    </AppShell>
  );
}
