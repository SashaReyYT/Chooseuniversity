import * as Sentry from "@sentry/nextjs";

/**
 * Browser instrumentation (Next.js App Router convention). Fully inert
 * without a DSN — safe to keep in the bundle for when monitoring is on.
 */
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN ?? "";

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1,
    replaysOnErrorSampleRate: 0.5,
  });
}