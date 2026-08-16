import "server-only";
import { redirect } from "next/navigation";
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
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Same as `getCurrentUser`, but redirects to sign-in when there isn't
 * one. For Server Components/layouts behind a protected route — `proxy.ts`
 * also redirects at the edge, but pages call this too so they're safe
 * even if reached directly (e.g. a server action) without relying solely
 * on middleware.
 */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  return user;
}
