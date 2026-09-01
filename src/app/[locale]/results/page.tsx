import { hasLocale } from "next-intl";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ProfileService } from "@/lib/services/profile.service";
import { MatchingService } from "@/lib/services/matching.service";
import { FavouritesService } from "@/lib/services/favourites.service";
import { toggleSaveAction } from "@/lib/favourites/toggle-save-action";
import { SaveButton } from "@/components/save-button";
import { TopMatchCard } from "@/components/top-match-card";
import { AppShell } from "@/components/app-shell";
import { Suspense } from "react";
import { ResultsSkeleton } from "@/components/skeleton-wrappers";
import { ReferenceDataRepository } from "@/lib/repositories/reference-data.repository";
import { formatTuition } from "@/components/match-display";

type ResultsPageProps = PageProps<"/[locale]/results">;

export default async function ResultsPage({ params }: ResultsPageProps) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  const t = await getTranslations("Results");
  const tDiscover = await getTranslations("Discover");
  const uiLocale = await getLocale();
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/sign-up?next=/results`);
    return;
  }

  const profileData = await new ProfileService(supabase).getFullProfileForUser(user.id);

  if (!profileData?.profile) {
    redirect(`/${locale}/onboarding`);
    return;
  }

  const matches = await new MatchingService(supabase).listMatchesForUser(user.id);

  const saved = await new FavouritesService(supabase).listSavedProgrammesForUser(user.id);
  const savedProgrammeIds = new Set(saved.map((s) => s.programme.id));

  const referenceData = new ReferenceDataRepository(supabase);
  const [fieldsOfStudy, languages, countries] = await Promise.all([
    referenceData.listFieldsOfStudy(),
    referenceData.listLanguages(),
    referenceData.listCountries(),
  ]);

  const profile = profileData.profile;
  const withScore = matches.filter((m) => m.match?.overallScore != null);

  // Only show programmes that match the user's preferred country AND field.
  const preferredCountries: string[] = profile.preferred_country_codes ?? [];
  const preferredFieldIds: string[] = profile.preferred_field_of_study_ids ?? [];

  const top3 = withScore
    .filter(
      (m) =>
        (preferredCountries.length === 0 ||
          preferredCountries.includes(m.programme.university.country.code)) &&
        (preferredFieldIds.length === 0 ||
          preferredFieldIds.includes(m.programme.field_of_study_id)),
    )
    .slice(0, 3);

  const profileChips = [
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
        }).format(profile.budget_max)}/${tDiscover("perYear")}`
      : null,
  ].filter((chip): chip is string => Boolean(chip));

  const categorisedTop = top3.map((entry, index) => {
    const score = entry.match!.overallScore!;
    let category: "best" | "ambitious" | "safe";
    let categoryLabel: string;
    let categoryDesc: string;

    if (index === 0 && score >= 90) {
      category = "best";
      categoryLabel = t("categoryBestFit");
      categoryDesc = t("categoryBestFitDesc");
    } else if (score >= 80) {
      category = "safe";
      categoryLabel = t("categorySafeChoice");
      categoryDesc = t("categorySafeChoiceDesc");
    } else {
      category = "ambitious";
      categoryLabel = t("categoryAmbitious");
      categoryDesc = t("categoryAmbitiousDesc");
    }

    return {
      entry,
      category,
      categoryLabel,
      categoryDesc,
    };
  });

  return (
    <AppShell>
      <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-16 space-y-10">
        <header className="space-y-4">
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-primary">
            {t("heading")}
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
            {t("subtitle")}
          </p>

          {profileChips.length > 0 && (
            <div className="flex flex-wrap gap-2" aria-label={t("yourProfileLabel")}>
              {profileChips.map((chip) => (
                <span
                  key={chip}
                  className="font-label-caps text-label-caps text-on-surface-variant border border-outline-variant rounded-full px-4 py-2"
                >
                  {chip}
                </span>
              ))}
            </div>
          )}

          <p className="font-body-md text-body-md text-on-surface-variant">
            {t("foundCount", { count: matches.length })}
          </p>
        </header>

        {top3.length > 0 && (
          <section className="space-y-6" aria-labelledby="top-matches-heading">
            <header>
              <h2 id="top-matches-heading" className="font-headline-md text-headline-md text-primary">
                {t("topMatchesHeading")}
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant">
                {t("topMatchesSubtitle")}
              </p>
            </header>

            <div className="space-y-4">
              <Suspense fallback={<ResultsSkeleton />}>
                {categorisedTop.map(({ entry, category, categoryLabel, categoryDesc }) => (
                  <TopMatchCard
                    key={entry.programme.id}
                    data={{
                      programmeId: entry.programme.id,
                      programmeName: entry.programme.name,
                      universityName: entry.programme.university.name,
                      city: entry.programme.university.city,
                      score: entry.match?.overallScore ?? null,
                      label:
                        entry.match?.overallLabel != null
                          ? tDiscover(`label${entry.match.overallLabel.replace(/\s+/g, "")}` as Parameters<typeof tDiscover>[0])
                          : null,
                      tuition: formatTuition(entry.programme, uiLocale, tDiscover),
                    }}
                    category={category}
                    categoryLabel={categoryLabel}
                    categoryDesc={categoryDesc}
                    viewDetailsLabel={t("viewDetails")}
                    localePrefix=""
                    actions={
                      <SaveButton
                        action={toggleSaveAction}
                        programmeId={entry.programme.id}
                        isSaved={savedProgrammeIds.has(entry.programme.id)}
                        labelSave={tDiscover("save")}
                        labelSaved={tDiscover("unsave")}
                        toastSaved={tDiscover("toastSaved")}
                        toastUnsaved={tDiscover("toastUnsaved")}
                      />
                    }
                  />
                ))}
              </Suspense>
            </div>
          </section>
        )}

        <div className="pt-4 border-t border-outline-variant/40">
          <Link
            href="/discover"
            className="inline-flex items-center gap-2 font-label-caps text-label-caps text-on-primary bg-primary rounded-full px-8 py-4 hover:bg-primary/90 transition-all active:scale-95 shadow-md"
          >
            {t("seeAllMatches")}
            <span className="material-symbols-outlined" aria-hidden="true">
              arrow_forward
            </span>
          </Link>
          <p className="mt-3 font-body-sm text-body-sm text-on-surface-variant">
            {t("seeAllMatchesNote")}
          </p>
        </div>

        <section className="space-y-3" aria-labelledby="whatNextHeading">
          <h2 id="whatNextHeading" className="font-headline-sm text-headline-sm text-primary">
            {t("whatNextHeading")}
          </h2>
          <ul className="space-y-2">
            <li className="font-body-md text-body-md text-on-surface flex items-start gap-3">
              <span className="shrink-0 w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center font-label-caps text-label-caps text-xs">1</span>
              <span>{t("nextStepExplore")}</span>
            </li>
            <li className="font-body-md text-body-md text-on-surface flex items-start gap-3">
              <span className="shrink-0 w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center font-label-caps text-label-caps text-xs">2</span>
              <span>{t("nextStepCompare")}</span>
            </li>
            <li className="font-body-md text-body-md text-on-surface flex items-start gap-3">
              <span className="shrink-0 w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center font-label-caps text-label-caps text-xs">3</span>
              <span>{t("nextStepApply")}</span>
            </li>
          </ul>
        </section>
      </main>
    </AppShell>
  );
}