import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * The current user's id — anonymous or not, `auth.uid()` either way (see
 * `src/proxy.ts` for how anonymous sessions get established). Returns
 * null only if Supabase isn't configured or the session genuinely
 * couldn't be established; under normal operation every visitor has one.
 */
export async function getCurrentUserId(): Promise<string | null> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}
