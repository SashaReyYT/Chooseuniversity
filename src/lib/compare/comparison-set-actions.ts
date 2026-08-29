"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ComparisonService } from "@/lib/services/comparison.service";
import { redirect } from "@/i18n/navigation";

/**
 * Multiple named comparison sets (spec §38, nice-to-have beyond V1
 * minimum). Purely additive on top of `ComparisonService` — the
 * create/rename/delete methods these call already existed for the
 * single implicit comparison V1 shipped with; this file is the first
 * thing that lets a user reach more than one. `toggleCompareAction`
 * (adding/removing a programme from "the" comparison from a card
 * elsewhere in the app) is untouched: it keeps targeting the most
 * recently created comparison, exactly as it did before this feature
 * existed, so a user who never creates a second set sees no change.
 */

function localeFromForm(formData: FormData): "en" | "uk" {
  const locale = String(formData.get("locale") ?? "");
  return locale === "uk" ? "uk" : "en";
}

/** Creates a new named comparison set and switches the /compare page to it. */
export async function createComparisonSetAction(formData: FormData): Promise<void> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const locale = localeFromForm(formData);
  const name = String(formData.get("name") ?? "").trim();
  // Falls back to a translated default (passed by the calling page, same
  // pattern as `toggleCompareAction`'s `defaultComparisonName`) rather
  // than the repository's hardcoded English default — this is the one
  // path where a user can leave the name blank.
  const defaultName = String(formData.get("defaultName") ?? "").trim();

  const comparison = await new ComparisonService(supabase).createComparison(
    user.id,
    name || defaultName || undefined,
  );

  redirect({
    href: { pathname: "/compare", query: { comparisonId: comparison.id } },
    locale,
  });
}

/** Renames an existing comparison set. RLS (`comparisons` keyed on `auth.uid()`) is the actual authorization boundary here — see `ComparisonsRepository`. */
export async function renameComparisonSetAction(formData: FormData): Promise<void> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const locale = localeFromForm(formData);
  const comparisonId = String(formData.get("comparisonId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!comparisonId || !name) return;

  await new ComparisonService(supabase).renameComparison(comparisonId, name);

  redirect({
    href: { pathname: "/compare", query: { comparisonId } },
    locale,
  });
}

/** Deletes a comparison set. Redirects back to /compare with no `comparisonId`, which falls back to the user's remaining most-recent set (or the empty state if none are left). */
export async function deleteComparisonSetAction(formData: FormData): Promise<void> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const locale = localeFromForm(formData);
  const comparisonId = String(formData.get("comparisonId") ?? "");
  if (!comparisonId) return;

  await new ComparisonService(supabase).deleteComparison(comparisonId);

  redirect({ href: "/compare", locale });
}

/** Removes all programmes from a comparison set (keeps the set). */
export async function clearComparisonAction(formData: FormData): Promise<void> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const locale = localeFromForm(formData);
  const comparisonId = String(formData.get("comparisonId") ?? "");
  if (!comparisonId) return;

  await new ComparisonService(supabase).clearAllProgrammes(comparisonId);

  redirect({ href: { pathname: "/compare", query: { comparisonId } }, locale });
}
