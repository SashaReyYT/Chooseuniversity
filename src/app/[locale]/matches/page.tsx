import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ProfileService } from "@/lib/services/profile.service";
import { MatchingService } from "@/lib/services/matching.service";
import { FavouritesService } from "@/lib/services/favourites.service";
import { MatchCard } from "./match-card";

export default async function MatchesPage({
  params,
}: PageProps<"/[locale]/matches">) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  const t = await getTranslations("Matches");
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Shouldn't happen — src/proxy.ts establishes an anonymous session for
  // every visitor — but this page needs `auth.uid()` to mean anything, so
  // treat "no session" the same as "no profile yet".
  const profile = user
    ? await new ProfileService(supabase).getForUser(user.id)
    : null;

  if (!user || !profile) {
    return (
      <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-16 space-y-4">
        <p className="font-body-md text-body-md text-on-surface-variant">
          {t("noProfile")}
        </p>
        <Link
          href="/onboarding"
          className="inline-block font-label-caps text-label-caps text-primary underline"
        >
          {t("noProfileCta")}
        </Link>
      </main>
    );
  }

  const matchingService = new MatchingService(supabase);
  const favouritesService = new FavouritesService(supabase);

  const [ranked, saved] = await Promise.all([
    matchingService.listMatchesForUser(user.id),
    favouritesService.listSavedProgrammesForUser(user.id),
  ]);
  const savedProgrammeIds = new Set(saved.map((s) => s.programme.id));

  return (
    <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-16 space-y-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-primary">
            {t("heading")}
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            {t("description")}
          </p>
        </div>
        <Link
          href="/onboarding"
          className="font-label-caps text-label-caps text-primary border border-primary rounded-full px-6 py-3 hover:bg-surface-container transition-all whitespace-nowrap"
        >
          {t("editProfile")}
        </Link>
      </div>

      {ranked.length === 0 ? (
        <p className="font-body-md text-body-md text-on-surface-variant">
          {t("empty")}
        </p>
      ) : (
        <div className="space-y-6">
          {ranked.map(({ programme, match }) => (
            <MatchCard
              key={programme.id}
              programme={programme}
              match={match}
              isSaved={savedProgrammeIds.has(programme.id)}
              t={t}
            />
          ))}
        </div>
      )}
    </main>
  );
}
