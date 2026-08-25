import * as Sentry from "@sentry/nextjs";

/**
 * Server/edge instrumentation (Next.js convention). Sentry stays fully
 * inert until SENTRY_DSN / NEXT_PUBLIC_SENTRY_DSN is provided — no DSN,
 * no network calls, zero overhead beyond the import.
 */
const dsn =
  process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN ?? "";

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1,
  });
}

export async function onRequestError(...args: unknown[]) {
  if (!dsn) return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await Sentry.captureRequestError(...(args as [any, any, any]));
}