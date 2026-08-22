import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "@/components/language-switcher";
import { AppNav } from "@/components/app-nav";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ProfileService } from "@/lib/services/profile.service";
import { MatchingService, type RankedMatch } from "@/lib/services/matching.service";
import { ReferenceDataRepository } from "@/lib/repositories/reference-data.repository";
import { renderMatchMessage } from "@/components/match-display";
import { AuthNav } from "@/components/auth-nav";

/**
 * Landing page (spec §9 visual reference: `unifind_premium_landing_page_updated`).
 * Every user-facing string comes from `messages/{locale}.json`.
 *
 * The hero and "top match" cards below are real data, not the mockup's
 * fixed "Charles University, 94% Match" example: for a visitor with a
 * completed profile it's their actual best match (same `MatchingService`
 * the /discover page uses); for everyone else it's an honest "no score
 * yet" state rather than an invented percentage. The mockup's hero photo
 * has a real schema field (`universities.cover_image_url`) but no seeded
 * university has one set yet, so the card uses that image when present
 * and degrades to a navy gradient — matching the design system's
 * `primary` tone — when it isn't, rather than fabricating a stock photo.
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
  const tNav = await getTranslations("Nav");
  const tDiscover = await getTranslations("Discover");

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // src/proxy.ts establishes an anonymous session for every visitor, so
  // `user` should always be present here — but the landing page has to
  // render even if session establishment failed, so this degrades to the
  // no-profile state rather than throwing.
  const profile = user
    ? await new ProfileService(supabase).getForUser(user.id)
    : null;

  let topMatch: RankedMatch | null = null;
  if (user && profile) {
    const ranked = await new MatchingService(supabase).listMatchesForUser(user.id);
    topMatch = ranked[0] ?? null;
  }

  const tMatching = topMatch ? await getTranslations("Matching") : null;

  return (
    <div className="pb-16 md:pb-0">
      <AppNav />
      <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop pt-8 pb-16 space-y-section-gap overflow-hidden">
        <header className="flex items-center justify-between gap-4">
          <span className="font-headline-sm text-headline-sm font-bold text-primary tracking-tight">
            {tNav("brand")}
          </span>
          <div className="flex items-center gap-3">
            <AuthNav />
            <LanguageSwitcher />
          </div>
        </header>

        <section className="relative space-y-6 flex flex-col items-center text-center">
          <div className="space-y-4 max-w-2xl mx-auto z-10">
            <h1 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-primary">
              {t("heading")}
            </h1>
            <p className="font-body-md text-body-md md:font-body-lg md:text-body-lg text-on-surface-variant max-w-xl mx-auto px-4">
              {t("description")}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto px-4 z-10 mt-2">
            <Link
              href="/onboarding"
              className="bg-primary text-on-primary font-label-caps text-label-caps px-8 py-4 rounded-full hover:bg-on-primary-fixed-variant transition-all active:scale-95 shadow-md text-center"
            >
              {t("ctaPrimary")}
            </Link>
            <Link
              href="/discover"
              className="bg-transparent text-primary font-label-caps text-label-caps px-8 py-4 rounded-full border border-primary hover:bg-surface-container transition-all active:scale-95 text-center"
            >
              {t("ctaSecondary")}
            </Link>
          </div>

          {topMatch && tMatching ? (
            <FeaturedMatch
              rankedMatch={topMatch}
              t={t}
              tDiscover={tDiscover}
              tMatching={tMatching}
            />
          ) : (
            <div className="w-full max-w-md mx-auto mt-12 relative rounded-xl overflow-hidden ambient-shadow border border-outline-variant/40 bg-surface-container-lowest p-6">
              <p className="font-label-caps text-label-caps text-on-surface-variant mb-2">
                {t("matchScoreLabel")}
              </p>
              <p className="font-body-sm text-body-sm text-on-surface-variant italic">
                {profile ? t("featuredNoMatches") : t("featuredNoProfile")}
              </p>
            </div>
          )}
        </section>

        <HowItWorks t={t} />
      </main>
    </div>
  );
}

/**
 * Real "top match" hero card. Uses `university.cover_image_url` when a
 * university has one set (schema supports it, no seed data does yet —
 * see the file-level comment) and falls back to a `primary`-tinted
 * gradient otherwise, so the badge/gradient-scrim/headline treatment
 * from the mockup still reads correctly either way.
 */
async function FeaturedMatch({
  rankedMatch,
  t,
  tDiscover,
  tMatching,
}: {
  rankedMatch: RankedMatch;
  t: Awaited<ReturnType<typeof getTranslations<"HomePage">>>;
  tDiscover: Awaited<ReturnType<typeof getTranslations<"Discover">>>;
  tMatching: Awaited<ReturnType<typeof getTranslations>>;
}) {
  const { programme, match } = rankedMatch;
  const [topReason] = match.reasons;
  const coverImageUrl = programme.university.cover_image_url;

  return (
    <Link
      href={`/programmes/${programme.id}`}
      className="w-full max-w-md mx-auto mt-12 relative h-64 md:h-80 rounded-xl overflow-hidden shadow-lg border border-outline-variant/30 group block text-left"
    >
      {coverImageUrl ? (
        <div
          className="absolute inset-0 bg-cover bg-center w-full h-full transition-transform duration-700 group-hover:scale-105"
          style={{ backgroundImage: `url('${coverImageUrl}')` }}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-primary-container to-primary" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/30 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          {match.overallScore != null ? (
            <span className="bg-tertiary-fixed text-on-tertiary-fixed font-label-caps text-label-caps px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
              <span className="material-symbols-outlined text-[14px]" aria-hidden="true">
                stars
              </span>
              {t("matchScoreLabel")}: {match.overallScore}%
            </span>
          ) : (
            <span className="bg-surface-container-lowest/20 backdrop-blur-md text-white font-label-caps text-label-caps px-3 py-1 rounded-full border border-white/20">
              {tDiscover("noScoreHint")}
            </span>
          )}
          <span className="bg-surface-container-lowest/20 backdrop-blur-md text-white font-label-caps text-label-caps px-3 py-1 rounded-full border border-white/20">
            {programme.university.city}
          </span>
        </div>
        <h3 className="font-headline-sm text-headline-sm text-white">
          {programme.university.name}
        </h3>
        <p className="font-body-sm text-body-sm text-white/80 line-clamp-1">
          {programme.name}
        </p>
        {topReason && (
          <p className="font-body-sm text-body-sm text-white/90 flex items-center gap-1 mt-1">
            <span aria-hidden="true">✓</span> {renderMatchMessage(topReason, tMatching)}
          </p>
        )}
      </div>
    </Link>
  );
}

/** "How it Works" 3-step section (spec §9 visual reference). */
function HowItWorks({
  t,
}: {
  t: Awaited<ReturnType<typeof getTranslations<"HomePage">>>;
}) {
  const steps = [
    { icon: "person_edit", labelKey: "step1Label", titleKey: "step1Title", descKey: "step1Description" },
    { icon: "manage_search", labelKey: "step2Label", titleKey: "step2Title", descKey: "step2Description" },
    { icon: "flight_takeoff", labelKey: "step3Label", titleKey: "step3Title", descKey: "step3Description" },
  ] as const;

  return (
    <section className="max-w-4xl mx-auto space-y-10 py-8">
      <h2 className="font-headline-md text-headline-md text-primary text-center">
        {t("howItWorksHeading")}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
        <div
          className="hidden md:block absolute top-1/2 left-[16%] right-[16%] h-[2px] bg-outline-variant/30 -z-10 -translate-y-[40px]"
          aria-hidden="true"
        />
        {steps.map((step) => (
          <div key={step.labelKey} className="flex flex-col items-center text-center space-y-4 group">
            <div className="w-16 h-16 rounded-full bg-surface-container-lowest border border-outline-variant/30 ambient-shadow flex items-center justify-center text-primary group-hover:-translate-y-1 transition-transform relative z-10">
              <span
                className="material-symbols-outlined text-2xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
                aria-hidden="true"
              >
                {step.icon}
              </span>
            </div>
            <div className="space-y-2 max-w-[240px]">
              <h4 className="font-label-caps text-label-caps text-primary">{t(step.labelKey)}</h4>
              <h3 className="font-body-lg text-body-lg font-semibold text-primary">
                {t(step.titleKey)}
              </h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                {t(step.descKey)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
