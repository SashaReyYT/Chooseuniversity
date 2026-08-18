"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  ComparisonLimitError,
  ComparisonService,
} from "@/lib/services/comparison.service";
import { redirect } from "@/i18n/navigation";

/**
 * Toggles a programme's presence in the current user's comparison set.
 * V1 has exactly one implicit comparison per user (see
 * `ComparisonService.getOrCreateDefaultComparison`) — no UI here for
 * naming or managing multiple comparisons.
 *
 * Enforces the spec's 3-programme comparison limit (§38): adding a 4th
 * programme redirects back to /compare with a notice instead of silently
 * dropping the request.
 *
 * Used from a plain `<form action={toggleCompareAction}>`; Next.js
 * automatically refreshes the invoking page's Server Components after a
 * form action completes (as long as it doesn't redirect), so pages
 * showing "in compare" state update without client-side state here.
 */
export async function toggleCompareAction(formData: FormData): Promise<void> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const programmeId = String(formData.get("programmeId") ?? "");
  if (!programmeId) return;

  const isInComparison = formData.get("isInComparison") === "true";
  const defaultComparisonName = String(
    formData.get("defaultComparisonName") ?? "Comparison",
  );
  const locale = String(formData.get("locale") ?? "");

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
        locale: locale as "en" | "uk",
      });
      return;
    }
    throw error;
  }
}
