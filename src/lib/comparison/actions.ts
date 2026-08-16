"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ComparisonService } from "@/lib/services/comparison.service";

/**
 * Toggles a programme's membership in the current user's (single,
 * implicit — see `ComparisonService.getOrCreateDefaultComparison`)
 * comparison set. Same shape as `src/lib/favourites/actions.ts`'s
 * `toggleSaveAction`: a plain `<form action={...}>` target, no
 * comparison id required from the caller.
 *
 * Revalidates broadly (`"/", "layout"`) rather than a specific path list
 * — this action is called from the catalog grid, match cards, and the
 * compare page itself, and every locale variant of each, so an exact
 * path list would need constant upkeep for little benefit at this app's
 * size.
 */
export async function toggleComparisonAction(formData: FormData): Promise<void> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const programmeId = String(formData.get("programmeId") ?? "");
  if (!programmeId) return;

  const inComparison = formData.get("inComparison") === "true";
  const service = new ComparisonService(supabase);
  const comparison = await service.getOrCreateDefaultComparison(user.id);

  if (inComparison) {
    await service.removeProgramme(comparison.id, programmeId);
  } else {
    await service.addProgramme(comparison.id, programmeId);
  }

  revalidatePath("/", "layout");
}
