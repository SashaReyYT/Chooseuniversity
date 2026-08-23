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
    redirect(`/${locale}`);
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
  const top3 = withScore.slice(0, 3);

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
                  <article
                    key={entry.programme.id}
                    className={`relative rounded-xl border border-outline-variant/40 bg-surface-container-low p-6 space-y-4 ${
                      category === "best" ? "border-primary/50 shadow-lg" : ""
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <span
                        className={`shrink-0 font-label-caps text-label-caps rounded-full px-3 py-1 ${
                          category === "best"
                            ? "bg-primary text-on-primary"
                            : category === "safe"
                            ? "bg-success text-on-success"
                            : "bg-warning text-on-warning"
                        }`}
                      >
                        {categoryLabel}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="font-headline-sm text-headline-sm text-primary line-clamp-1">
                            {entry.programme.name}
                          </h3>
                          <form action={toggleSaveAction} className="shrink-0">
                            <input type="hidden" name="programmeId" value={entry.programme.id} />
                            <input type="hidden" name="isSaved" value={String(savedProgrammeIds.has(entry.programme.id))} />
                            <button
                              type="submit"
                              aria-label={savedProgrammeIds.has(entry.programme.id) ? tDiscover("unsave") : tDiscover("save")}
                              className={`flex items-center gap-2 font-label-caps text-label-caps px-4 py-2 rounded-full border transition-all active:scale-95 ${
                                savedProgrammeIds.has(entry.programme.id)
                                  ? "bg-primary text-on-primary border-primary"
                                  : "bg-transparent text-primary border-primary hover:bg-surface-container"
                              }`}
                            >
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill={savedProgrammeIds.has(entry.programme.id) ? "currentColor" : "none"}
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                              >
                                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                              </svg>
                              {savedProgrammeIds.has(entry.programme.id) ? tDiscover("unsave") : tDiscover("save")}
                            </button>
                          </form>
                        </div>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">
                          {entry.programme.university.name} · {entry.programme.university.city}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <p className="font-display-lg text-display-lg text-primary leading-none">
                          {entry.match?.overallScore}%
                        </p>
                        {entry.match?.overallLabel && (
                          <p className="font-headline-sm text-headline-sm text-on-surface-variant">
                            {tDiscover(`label${entry.match.overallLabel.replace(/\s+/g, "")}` as Parameters<typeof tDiscover>[0])}
                          </p>
                        )}
                      </div>
                    </div>

                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      {categoryDesc}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      <span className="font-body-sm text-body-sm text-on-surface-variant">
                        {formatTuition(entry.programme, uiLocale, tDiscover)}
                      </span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">
                        {entry.programme.duration_months} {tDiscover("months")}
                      </span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">
                        {entry.programme.language.name}
                      </span>
                    </div>

                    <Link
                      href={`/programmes/${entry.programme.id}`}
                      className="inline-block font-label-caps text-label-caps text-primary underline hover:text-primary/80"
                    >
                      {t("viewDetails")}
                    </Link>
                  </article>
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