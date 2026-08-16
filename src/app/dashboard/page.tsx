import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { MatchingService } from "@/lib/services/matching.service";
import { FavouritesService } from "@/lib/services/favourites.service";
import { ComparisonService } from "@/lib/services/comparison.service";
import { ProfileService } from "@/lib/services/profile.service";
import { MatchCard } from "@/components/match-card";

export default async function DashboardPage() {
  const user = await requireUser();
  const supabase = await createServerSupabaseClient();

  const profile = await new ProfileService(supabase).getProfile(user.id);
  if (!profile) redirect("/onboarding");

  const [ranked, savedIds, activeComparison] = await Promise.all([
    new MatchingService(supabase).listMatchesForUser(user.id),
    new FavouritesService(supabase).listSavedProgrammeIds(user.id),
    new ComparisonService(supabase).getActiveForUser(user.id),
  ]);

  const comparisonIds = new Set(
    (activeComparison?.programmes ?? []).map((p) => p.id),
  );

  return (
    <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-16 space-y-8">
      <div className="space-y-2">
        <h1 className="font-headline-md text-headline-md text-primary">
          Your matches
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          {ranked.length} programme{ranked.length === 1 ? "" : "s"}, ranked
          by fit — not by prestige. Match Score reflects how well a
          programme fits your profile, not your admission chances.
        </p>
      </div>

      {ranked.length === 0 ? (
        <p className="font-body-md text-body-md text-on-surface-variant">
          No programmes in the catalog yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {ranked.map(({ programme, match }) => (
            <MatchCard
              key={programme.id}
              programme={programme}
              match={match}
              saved={savedIds.has(programme.id)}
              inComparison={comparisonIds.has(programme.id)}
            />
          ))}
        </div>
      )}
    </main>
  );
}
