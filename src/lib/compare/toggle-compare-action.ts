"use server";

import { getLocale } from "next-intl/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  ComparisonLimitError,
  ComparisonService,
} from "@/lib/services/comparison.service";
import { redirect } from "@/i18n/navigation";
import { requireRealUser } from "@/lib/auth/session";

/**
 * Toggles a programme's presence in the current user's comparison set.
 * V1 has exactly one implicit comparison per user (see
 * `ComparisonService.getOrCreateDefaultComparison`) — no UI here for
 * naming or managing multiple comparisons.
 *
 * Adding a programme sends the user straight to /compare (the compare
 * tab), where they pick the second/third university to compare against —
 * see the picker on the compare page. Removing stays put.
 *
 * Enforces the spec's 3-programme comparison limit (§38): adding a 4th
 * programme redirects back to /compare with a notice instead of silently
 * dropping the request.
 */
export async function toggleCompareAction(formData: FormData): Promise<void> {
  "use server";
  const user = await requireRealUser("/compare");

  const supabase = await createServerSupabaseClient();
  const locale = await getLocale();

  const programmeId = String(formData.get("programmeId") ?? "");
  if (!programmeId) return;

  const isInComparison = formData.get("isInComparison") === "true";
  const defaultComparisonName = String(
    formData.get("defaultComparisonName") ?? "Comparison",
  );

  const comparisonService = new ComparisonService(supabase);
  const comparison = await comparisonService.getOrCreateDefaultComparison(
    user.id,
    defaultComparisonName,
  );

  if (isInComparison) {
    await comparisonService.removeProgramme(comparison.id, programmeId);
    return;
  }

  try {
    await comparisonService.addProgrammeWithinLimit(
      comparison.id,
      programmeId,
    );
  } catch (error) {
    if (error instanceof ComparisonLimitError) {
      redirect({
        href: { pathname: "/compare", query: { notice: "compare-limit" } },
        locale,
      });
      return;
    }
    throw error;
  }

  redirect({ href: "/compare", locale });
}