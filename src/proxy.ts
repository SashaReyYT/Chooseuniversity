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
 * The Supabase part refreshes the session, and — because V1 has no
 * signup/login — silently establishes an anonymous session for any
 * visitor who doesn't have one yet. Supabase's anonymous sign-in
 * (`auth.signInAnonymously()`) creates a real `auth.users` row (flagged
 * `is_anonymous`) with a stable UUID, persisted via the same session
 * cookies as a normal account. That means the existing schema and RLS
 * policies (all keyed on `auth.uid()`, see
 * `supabase/migrations/0006_row_level_security.sql`) work completely
 * unchanged for anonymous visitors — a saved programme or profile row is
 * just as owner-scoped as it would be for a signed-up user.
 *
 * This is also the upgrade path the product spec asks for ("design the
 * data model so future authenticated profiles can be attached to a user
 * ID"): Supabase supports linking an email/password (or OAuth identity)
 * onto an existing anonymous session later via `auth.updateUser()`,
 * which keeps the same `auth.uid()` — so a future "create an account"
 * flow can convert an anonymous user in place, with all their existing
 * saved programmes/profile intact, rather than needing a migration.
 */
export async function proxy(request: NextRequest) {
  const response = intlMiddleware(request);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  // Skip Supabase session handling for auth pages to avoid conflicts
  const url = new URL(request.url);
  const isAuthPage = url.pathname.includes("/sign-in") || url.pathname.includes("/sign-up") || url.pathname.includes("/onboarding");

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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !isAuthPage) {
    const { error } = await supabase.auth.signInAnonymously();
    if (error) {
      console.error("Failed to start an anonymous session:", error.message);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
