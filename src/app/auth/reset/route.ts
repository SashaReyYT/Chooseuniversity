import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Supabase recovery-link landing (PKCE): the emailed link carries `?code=`
 * which we exchange for a session here, then hand the user to the
 * new-password form.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}/en/reset-password`);
    }
  }

  return NextResponse.redirect(`${origin}/en/forgot-password?error=1`);
}