import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { FavouritesService } from "@/lib/services/favourites.service";
import { ComparisonService } from "@/lib/services/comparison.service";
import { ProfileService } from "@/lib/services/profile.service";
import { MatchingService } from "@/lib/services/matching.service";
import { ProgrammeCard } from "@/components/programme-card";

export default async function FavouritesPage({
  params,
}: PageProps<"/[locale]/favourites">) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  const t = await getTranslations("Favourites");
  const tDiscover = await getTranslations("Discover");
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-16 space-y-4">
        <p className="font-body-md text-body-md text-on-surface-variant">
          {t("empty")}
        </p>
      </main>
    );
  }

  const [saved, comparisons, profileData] = await Promise.all([
    new FavouritesService(supabase).listSavedProgrammesForUser(user.id),
    new ComparisonService(supabase).listForUser(user.id),
    new ProfileService(supabase).getFullProfileForUser(user.id),
  ]);
  const comparisonIds = new Set((comparisons[0]?.programmes ?? []).map((p) => p.id));

  // Match scores are computed lazily per saved programme rather than
  // carried on the row — the schema doesn't persist scores, so a shortlist
  // always reflects the user's current profile.
  const matchingService = new MatchingService(supabase);
  const withMatches = await Promise.all(
    saved.map(async (s) => ({
      programme: s.programme,
      match:
        (await matchingService.getMatchForProgramme(user.id, s.programme.id))?.match ??
        null,
    })),
  );

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

  const defaultComparisonName = t("heading");

  return (
    <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-16 space-y-8">
      <div className="space-y-1">
        <h1 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-primary">
          {t("heading")}
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          {t("description", { count: saved.length })}
        </p>
      </div>

      {withMatches.length === 0 ? (
        <p className="font-body-md text-body-md text-on-surface-variant">
          {t("empty")}{" "}
          <Link href="/catalog" className="text-primary hover:underline">
            {t("emptyCta")}
          </Link>
        </p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {withMatches.map(({ programme, match }) => (
            <ProgrammeCard
              key={programme.id}
              programme={programme}
              match={match}
              profile={matchProfile}
              isSaved
              isInComparison={comparisonIds.has(programme.id)}
              t={tDiscover}
              defaultComparisonName={defaultComparisonName}
            />
          ))}
        </div>
      )}
    </main>
  );
}