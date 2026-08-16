"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";
import { FavouritesService } from "@/lib/services/favourites.service";

export async function toggleFavourite(
  programmeId: string,
): Promise<{ saved: boolean; error?: string }> {
  // Deliberately `getCurrentUser` (returns null), not `requireUser`
  // (redirects): `redirect()` throws a Next.js-internal signal that must
  // propagate to the framework, not get swallowed by this action's
  // try/catch below. This action is only ever called from behind a
  // protected route, so a null user here means the session expired
  // mid-visit — surface it as a normal error, not a redirect.
  try {
    const user = await getCurrentUser();
    if (!user) return { saved: false, error: "Sign in to save programmes." };

    const supabase = await createServerSupabaseClient();
    const favourites = new FavouritesService(supabase);
    const currentlySaved = await favourites.isSaved(user.id, programmeId);

    if (currentlySaved) {
      await favourites.unsave(user.id, programmeId);
    } else {
      await favourites.save(user.id, programmeId);
    }

    // Revalidate every screen a save toggle could be visible on, rather
    // than threading the calling page's path through — this action is
    // called from several places (dashboard, programme detail, favourites
    // list) and staleness is worse than an extra cache miss.
    revalidatePath("/dashboard");
    revalidatePath("/favourites");
    revalidatePath(`/programmes/${programmeId}`);

    return { saved: !currentlySaved };
  } catch (error) {
    return { saved: false, error: error instanceof Error ? error.message : "Something went wrong." };
  }
}
