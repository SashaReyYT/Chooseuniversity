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
import { ProgrammesRepository } from "@/lib/repositories/programmes.repository";
import { ReferenceDataRepository } from "@/lib/repositories/reference-data.repository";
import { ProgrammeCard } from "@/components/programme-card";

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
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect({ href: "/", locale });
    return;
  }

  const profileData = await new ProfileService(supabase).getFullProfileForUser(user.id);

  const favouritesService = new FavouritesService(supabase);
  const comparisonService = new ComparisonService(supabase);

  // Build match user profile for Best For labels
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

  // Server-side search/filter from query params (§35, §36)
  const searchQuery = sp?.q ?? "";
  const fieldOfStudyFilter = sp?.fieldOfStudy ?? "";
  const degreeFilter = sp?.degree ?? "";
  const languageFilter = sp?.language ?? "";
  const sortBy = (sp?.sort as "best_match" | "lowest_tuition" | "highest_match" | "lowest_cost") ?? "best_match";

  const [entries, saved, comparisons] = await Promise.all([
    profileData?.profile
      ? new MatchingService(supabase)
          .listMatchesForUser(user.id, {
            query: searchQuery || undefined,
            fieldOfStudyId: fieldOfStudyFilter || undefined,
            degreeLevel: degreeFilter || undefined,
            languageCode: languageFilter || undefined,
            sortBy,
          })
          .then((ranked) => ranked.map((r) => ({ programme: r.programme, match: r.match })))
      : new ProgrammesRepository(supabase)
          .search({
            query: searchQuery || undefined,
            fieldOfStudyId: fieldOfStudyFilter || undefined,
            degreeLevel: degreeFilter || undefined,
            languageCode: languageFilter || undefined,
            sortBy,
          })
          .then((programmes) => programmes.map((programme) => ({ programme, match: null }))),
    favouritesService.listSavedProgrammesForUser(user.id),
    comparisonService.listForUser(user.id),
  ]);

  const savedProgrammeIds = new Set(saved.map((s) => s.programme.id));
  const comparedProgrammeIds = new Set(
    comparisons[0]?.programmes.map((p) => p.id) ?? [],
  );
  const defaultComparisonName = t("heading");

  // Get filter options
  const referenceDataRepo = new ReferenceDataRepository(supabase);
  const [fieldsOfStudy, languages] = await Promise.all([
    referenceDataRepo.listFieldsOfStudy(),
    referenceDataRepo.listLanguages(),
  ]);

  // For search form action — uses GET to preserve query params (locale-aware)

  return (
    <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-16 space-y-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-primary">
            {t("heading")}
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            {profileData?.profile ? t("description") : t("descriptionNoProfile")}
          </p>
        </div>
        <Link
          href="/profile"
          className="font-label-caps text-label-caps text-primary border border-primary rounded-full px-6 py-3 hover:bg-surface-container transition-all whitespace-nowrap"
        >
          {profileData?.profile ? t("editProfile") : t("buildProfile")}
        </Link>
      </div>

      {/* Search and filters (§35, §36) */}
      <form
        method="GET"
        action={`/${locale}/discover`}
        className="flex flex-col md:flex-row gap-3 items-end"
      >
        <div className="flex-1 min-w-0">
          <label htmlFor="search-q" className="sr-only">{t("searchLabel")}</label>
          <input
            id="search-q"
            name="q"
            type="search"
            defaultValue={searchQuery}
            placeholder={t("searchPlaceholder")}
            className="w-full font-body-md text-body-md bg-surface-container-lowest border border-outline-variant rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="flex gap-3 flex-wrap">
          <select
            name="fieldOfStudy"
            defaultValue={fieldOfStudyFilter}
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
            className="font-body-sm text-body-sm bg-surface-container-lowest border border-outline-variant rounded-lg px-4 py-3"
          >
            <option value="">{t("allLanguages")}</option>
            {languages.map((language) => (
              <option key={language.code} value={language.code}>{language.name}</option>
            ))}
          </select>
          <select
            name="sort"
            defaultValue={sortBy}
            className="font-body-sm text-body-sm bg-surface-container-lowest border border-outline-variant rounded-lg px-4 py-3"
          >
            <option value="best_match">{t("sortBestMatch")}</option>
            <option value="lowest_tuition">{t("sortLowestTuition")}</option>
            <option value="lowest_cost">{t("sortLowestCost")}</option>
          </select>
          <button
            type="submit"
            className="font-label-caps text-label-caps text-on-primary bg-primary rounded-full px-6 py-3 hover:bg-primary/90 transition-all active:scale-95"
          >
            {t("searchButton")}
          </button>
        </div>
      </form>

      {entries.length === 0 ? (
        <p className="font-body-md text-body-md text-on-surface-variant">
          {t("empty")}
        </p>
      ) : (
        <>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            {t("resultCount", { count: entries.length })}
          </p>
          <div className="space-y-6">
            {entries.map(({ programme, match }) => (
              <ProgrammeCard
                key={programme.id}
                programme={programme}
                match={match}
                profile={matchProfile}
                isSaved={savedProgrammeIds.has(programme.id)}
                isInComparison={comparedProgrammeIds.has(programme.id)}
                t={t}
                defaultComparisonName={defaultComparisonName}
              />
            ))}
          </div>
        </>
      )}
    </main>
  );
}
