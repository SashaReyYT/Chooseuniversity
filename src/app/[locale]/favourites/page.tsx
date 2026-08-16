import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { FavouritesService } from "@/lib/services/favourites.service";
import { ComparisonService } from "@/lib/services/comparison.service";
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

  const [saved, comparisons] = await Promise.all([
    new FavouritesService(supabase).listSavedProgrammesForUser(user.id),
    new ComparisonService(supabase).listForUser(user.id),
  ]);
  const comparisonIds = new Set((comparisons[0]?.programmes ?? []).map((p) => p.id));

  // Match scores are computed lazily per saved programme rather than
  // carried on the row — see the equivalent comment in the pre-i18n
  // favourites page this replaces (`src/app/favourites/page.tsx`), same
  // reasoning applies: the schema doesn't persist scores, so a shortlist
  // always reflects the user's current profile.
  const matchingService = new MatchingService(supabase);
  const withMatches = await Promise.all(
    saved.map(async (s) => ({
      programme: s.programme,
      matchScore:
        (await matchingService.getMatchForProgramme(user.id, s.programme.id))?.match
          .overallScore ?? null,
    })),
  );

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
          {withMatches.map(({ programme, matchScore }) => (
            <ProgrammeCard
              key={programme.id}
              programme={programme}
              isSaved
              inComparison={comparisonIds.has(programme.id)}
              matchScore={matchScore}
              labels={{
                save: t("save"),
                unsave: t("unsave"),
                compareAdd: t("compareAdd"),
                compareRemove: t("compareRemove"),
                viewDetails: t("viewDetails"),
              }}
            />
          ))}
        </div>
      )}
    </main>
  );
}
