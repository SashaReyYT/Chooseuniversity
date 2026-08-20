"use server";

import { getLocale } from "next-intl/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  ComparisonLimitError,
  ComparisonService,
} from "@/lib/services/comparison.service";
import { redirect } from "@/i18n/navigation";

/**
 * Adds a programme picked from the /compare page's picker (the "add a
 * second/third university" flow after landing here from a programme
 * card). Redirects back to /compare; on hitting the 3-programme cap
 * redirects with a notice instead of failing silently.
 */
export async function addComparisonProgrammeAction(
  formData: FormData,
): Promise<void> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const programmeId = String(formData.get("programmeId") ?? "");
  if (!programmeId) return;

  const defaultComparisonName = String(
    formData.get("defaultComparisonName") ?? "Comparison",
  );
  const locale = await getLocale();

  const comparisonService = new ComparisonService(supabase);
  const comparison = await comparisonService.getOrCreateDefaultComparison(
    user.id,
    defaultComparisonName,
  );

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