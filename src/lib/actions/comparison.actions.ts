"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";
import { ComparisonService } from "@/lib/services/comparison.service";

/**
 * Was out of sync with `ComparisonService`'s real API (no
 * `ComparisonLimitError` export, `addProgramme` takes a comparison id
 * not a user id) — broke the whole build, not just this route, since
 * Next.js compiles every file under `src/app` regardless of whether the
 * route is reachable. Fixed to match the service as it exists today; see
 * `src/lib/comparison/actions.ts` for the equivalent used by the
 * `[locale]` tree's pages.
 */
export interface ComparisonActionResult {
  ok: boolean;
  error?: string;
  itemCount?: number;
}

export async function addToComparison(programmeId: string): Promise<ComparisonActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sign in to compare programmes." };

  const supabase = await createServerSupabaseClient();
  try {
    const service = new ComparisonService(supabase);
    const comparison = await service.getOrCreateDefaultComparison(
      user.id,
      "My comparison",
    );
    await service.addProgramme(comparison.id, programmeId);
    revalidatePath("/dashboard");
    revalidatePath("/compare");
    revalidatePath(`/programmes/${programmeId}`);
    return { ok: true, itemCount: comparison.programmes.length + 1 };
  } catch {
    return { ok: false, error: "Something went wrong." };
  }
}

export async function removeFromComparison(
  comparisonId: string,
  programmeId: string,
): Promise<ComparisonActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sign in to compare programmes." };

  const supabase = await createServerSupabaseClient();
  const service = new ComparisonService(supabase);
  await service.removeProgramme(comparisonId, programmeId);

  revalidatePath("/dashboard");
  revalidatePath("/compare");
  revalidatePath(`/programmes/${programmeId}`);

  return { ok: true };
}
