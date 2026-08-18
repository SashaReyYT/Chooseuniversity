"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { QuickMatchService } from "@/lib/services/quick-match.service";

export type QuickMatchActionState = {
  count: number | null;
  submitted: boolean;
};

export const initialQuickMatchActionState: QuickMatchActionState = {
  count: null,
  submitted: false,
};

/**
 * Server action backing the landing page's "Quick Match Profile" (spec
 * §9): takes the three coarse answers, counts how many catalog
 * programmes pass them via `QuickMatchService`, and returns only that
 * number — deliberately no score or reasons, this is a teaser.
 */
export async function quickMatchAction(
  _prevState: QuickMatchActionState,
  formData: FormData,
): Promise<QuickMatchActionState> {
  const fieldOfStudyId = String(formData.get("field_of_study_id") ?? "").trim() || null;
  const countryCode = String(formData.get("country_code") ?? "").trim() || null;
  const budgetRaw = String(formData.get("budget_max_yearly") ?? "").trim();

  const budgetMaxYearly = budgetRaw === "" ? null : Number(budgetRaw);
  if (budgetMaxYearly != null && !Number.isFinite(budgetMaxYearly)) {
    return { count: null, submitted: true };
  }

  try {
    const supabase = await createServerSupabaseClient();
    const count = await new QuickMatchService(supabase).countLikelyMatches({
      fieldOfStudyId,
      countryCode,
      budgetMaxYearly,
    });
    return { count, submitted: true };
  } catch (error) {
    console.error("Quick match failed:", error);
    return { count: null, submitted: true };
  }
}