import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { FavouritesService } from "@/lib/services/favourites.service";
import { MatchingService } from "@/lib/services/matching.service";
import { ComparisonService } from "@/lib/services/comparison.service";
import { MatchCard } from "@/components/match-card";

export default async function FavouritesPage() {
  const user = await requireUser();
  const supabase = await createServerSupabaseClient();

  const [saved, activeComparison] = await Promise.all([
    new FavouritesService(supabase).listForUser(user.id),
    new ComparisonService(supabase).getActiveForUser(user.id),
  ]);

  const comparisonIds = new Set((activeComparison?.programmes ?? []).map((p) => p.id));

  // Match scores are computed lazily per saved programme rather than
  // carried on the row (the schema deliberately doesn't persist scores —
  // see supabase/README.md — so a shortlist always reflects the user's
  // current profile, not a stale snapshot from when they saved it).
  const matchingService = new MatchingService(supabase);
  const withMatches = await Promise.all(
    saved.map(async (s) => ({
      programme: s.programme,
      match: (await matchingService.getMatchForProgramme(user.id, s.programme.id))?.match ?? null,
    })),
  );

  return (
    <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-16 space-y-8">
      <div className="space-y-2">
        <h1 className="font-headline-md text-headline-md text-primary">
          Your shortlist
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          {saved.length} saved programme{saved.length === 1 ? "" : "s"}.
        </p>
      </div>

      {withMatches.length === 0 ? (
        <p className="font-body-md text-body-md text-on-surface-variant">
          Nothing saved yet.{" "}
          <Link href="/dashboard" className="text-primary hover:underline">
            Browse your matches
          </Link>{" "}
          to start a shortlist.
        </p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {withMatches.map(({ programme, match }) => (
            <MatchCard
              key={programme.id}
              programme={programme}
              match={match}
              saved
              inComparison={comparisonIds.has(programme.id)}
            />
          ))}
        </div>
      )}
    </main>
  );
}
