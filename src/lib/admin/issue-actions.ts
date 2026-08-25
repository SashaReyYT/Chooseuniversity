"use server";

import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "@/i18n/navigation";

/**
 * Marks a crowdsourced data-issue report resolved. Admin-only: RLS already
 * scopes UPDATE to is_admin(); the explicit user check here just avoids a
 * confusing PostgREST error for non-admins poking the form.
 */
export async function resolveIssueAction(formData: FormData): Promise<void> {
  const issueId = String(formData.get("issueId") ?? "");
  if (!issueId) return;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!user || !isAdmin) return;

  await supabase
    .from("data_issue_reports")
    .update({ status: "resolved" })
    .eq("id", issueId);

  revalidatePath("/admin/issues");
  revalidatePath("/admin");

  const locale = await getLocale();
  redirect({ href: "/admin/issues", locale });
}