"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { FavouritesService } from "@/lib/services/favourites.service";

/**
 * Toggles a programme's saved status for the current user. Used from a
 * plain `<form action={toggleSaveAction}>` — Next.js automatically
 * refreshes the invoking page's Server Components after a form action
 * completes (as long as it doesn't redirect), so the "Saved" state on
 * /saved updates without any client-side state management here.
 */
export async function toggleSaveAction(formData: FormData): Promise<void> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const programmeId = String(formData.get("programmeId") ?? "");
  if (!programmeId) return;

  const isSaved = formData.get("isSaved") === "true";
  const favourites = new FavouritesService(supabase);

  if (isSaved) {
    await favourites.unsave(user.id, programmeId);
  } else {
    await favourites.save(user.id, programmeId);
  }
}
