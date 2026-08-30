"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { FavouritesService } from "@/lib/services/favourites.service";
import { requireRealUser } from "@/lib/auth/session";

/**
 * Toggles a programme's saved status for the current user. Used from a
 * plain `<form action={toggleSaveAction}>`. `revalidatePath("/", "layout")`
 * refreshes every Server Component after the write, so the button flips to
 * "Saved" immediately on the same page (results, discover, programme,
 * saved) without a manual reload.
 */
export async function toggleSaveAction(formData: FormData): Promise<void> {
  "use server";
  const user = await requireRealUser("/saved");

  const supabase = await createServerSupabaseClient();
  const programmeId = String(formData.get("programmeId") ?? "");
  if (!programmeId) return;

  const isSaved = formData.get("isSaved") === "true";
  const favourites = new FavouritesService(supabase);

  if (isSaved) {
    await favourites.unsave(user.id, programmeId);
  } else {
    await favourites.save(user.id, programmeId);
  }

  // Targeted revalidation — layout-wide would invalidate every ISR page
  // (including all university profiles) for a single bookmark toggle.
  revalidatePath("/saved");
  revalidatePath("/discover");
  revalidatePath("/results");
}