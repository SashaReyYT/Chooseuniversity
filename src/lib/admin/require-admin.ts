import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { redirect } from "@/i18n/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Admin access control (§44). Membership lives in `admin_users`; the
 * RLS policies in migration 0010 gate every catalog write through
 * `public.is_admin()`, so the app-side check here is defense in depth
 * (and what decides whether the admin pages render at all).
 */

export class AdminAccessDeniedError extends Error {
  constructor() {
    super("Admin access required");
    this.name = "AdminAccessDeniedError";
  }
}

/** Same locale guard as the public pages, shared so every admin page narrows `locale` to the app union. */
export function requireAdminLocale(
  locale: string,
): asserts locale is "en" | "uk" {
  if (!hasLocale(routing.locales, locale)) notFound();
}

async function isAdmin(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();
  return data != null;
}

/** For admin pages/layouts: redirects non-admins back to the site root. */
export async function requireAdminForPage(locale: string) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await isAdmin(supabase, user.id))) {
    redirect({ href: "/", locale: locale as "en" | "uk" });
    return null;
  }
  return supabase;
}

/** For server actions: throws instead of redirecting (actions can't assume a page context). */
export async function requireAdminForAction() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await isAdmin(supabase, user.id))) {
    throw new AdminAccessDeniedError();
  }
  return supabase;
}