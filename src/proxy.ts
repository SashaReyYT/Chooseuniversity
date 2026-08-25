import { createServerClient } from "@supabase/ssr";
import createIntlMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "@/i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

/** Per-instance rate-limit buckets keyed by `ip:path`. */
const rateLimitBuckets = new Map<string, { start: number; count: number }>();
let lastSweep = 0;

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
  // Basic in-memory rate limit for API routes: 30 req/min per IP+path.
  // Per-instance state is acceptable for a single-region deployment; swap
  // to Upstash when horizontally scaled.
  const url = new URL(request.url);
  if (url.pathname.startsWith("/api/")) {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
    const key = `${ip}:${url.pathname}`;
    const now = Date.now();
    const bucket = rateLimitBuckets.get(key);
    if (bucket && now - bucket.start < 60_000 && bucket.count >= 30) {
      return new NextResponse(JSON.stringify({ error: "rate_limited" }), {
        status: 429,
        headers: { "Content-Type": "application/json" },
      });
    }
    rateLimitBuckets.set(
      key,
      bucket && now - bucket.start < 60_000
        ? { start: bucket.start, count: bucket.count + 1 }
        : { start: now, count: 1 },
    );
    // Opportunistic cleanup every ~5000 entries AND every 60s window.
    if (rateLimitBuckets.size > 5000) {
      for (const [k, v] of rateLimitBuckets) {
        if (now - v.start >= 60_000) rateLimitBuckets.delete(k);
      }
    }
    // Time-based sweep regardless of size — prevents slow memory growth
    // on low-traffic instances where the 5000 threshold is never hit.
    if (now - lastSweep > 300_000) {
      lastSweep = now;
      for (const [k, v] of rateLimitBuckets) {
        if (now - v.start >= 120_000) rateLimitBuckets.delete(k);
      }
    }
  }

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