import "server-only";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import type { User } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * The current authenticated user, or null if signed out. Uses
 * `auth.getUser()` (not `getSession()`) — it revalidates the session
 * against Supabase Auth rather than trusting a cookie's contents, which
 * is the check Supabase's own docs call out as the safe one to use in
 * Server Components/Route Handlers.
 */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createServerSupabaseClient();
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}

/**
 * Same as `getCurrentUser`, but redirects home when there isn't one.
 * V1 has no signup/login UI (see `proxy.ts`) — every visitor gets an
 * anonymous Supabase session at the edge, so this is a last-resort
 * fallback (e.g. cookies blocked) rather than a real auth gate. It
 * redirects to the locale-prefixed home page rather than a `/sign-in`
 * route, which doesn't exist in this app.
 */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    const locale = await getLocale();
    redirect(`/${locale}`);
  }
  return user;
}

/**
 * Auth-first gate for the "find your university" flow: the questionnaire
 * and match results are account features, so an anonymous visitor (or a
 * session-less request) is asked to create an account / sign in first.
 * `nextPath` is where the auth screens send them afterwards — the quiz,
 * per the product flow ("authorize first, then the test").
 */
export async function requireRealUser(nextPath: string): Promise<User> {
  const user = await getCurrentUser();
  if (!user || user.is_anonymous === true) {
    const locale = await getLocale();
    redirect(
      `/${locale}/sign-up?next=${encodeURIComponent(nextPath)}`,
    );
  }
  return user;
}
