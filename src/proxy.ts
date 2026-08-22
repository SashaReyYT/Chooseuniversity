import { createServerClient } from "@supabase/ssr";
import createIntlMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { routing } from "@/i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

/**
 * Locale routing (next-intl) and Supabase session handling both need a
 * single Next.js proxy/middleware, so they're combined here rather than
 * two separate files.
 *
 * Order matters: `intlMiddleware` runs first and returns the response
 * (either a plain pass-through or a locale redirect, e.g. `/` → `/en`).
 * The Supabase step below must mutate *that same* response's cookies
 * rather than constructing a fresh `NextResponse.next()`, or it would
 * silently discard the locale redirect.
 *
 * Anonymous sign-in is NOT used (Supabase "Allow anonymous sign-ins" disabled).
 * The middleware only refreshes existing sessions.
 * Pages that require auth (onboarding, results, etc.) will redirect to sign-up
 * if no authenticated user is found — see `requireRealUser` in session.ts.
 */
export async function proxy(request: NextRequest) {
  const response = intlMiddleware(request);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  // Refresh session if exists; do NOT create anonymous sessions
  // Wrap in try/catch because getUser() may throw if Supabase has
  // anonymous sign-ins disabled and there's an invalid/expired session
  try {
    await supabase.auth.getUser();
  } catch {
    // Session invalid or expired; cookies will be cleared on next request
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};