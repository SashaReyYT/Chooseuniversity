"use client";

/**
 * Catches errors thrown by the root layout itself (rare — e.g. next-intl
 * failing to load messages at all). Must render its own <html>/<body>
 * since it replaces everything, including [locale]/layout.tsx — which
 * means NextIntlClientProvider isn't guaranteed to be available here, so
 * this is deliberately plain/untranslated rather than trying to call
 * useTranslations in a context that may not exist.
 *
 * `src/app/[locale]/error.tsx` handles the much more common case (a page
 * or Server Component throwing) and is fully translated — this file is
 * only the last-resort fallback underneath it.
 */
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "sans-serif", padding: "4rem 1.5rem" }}>
        <div style={{ maxWidth: "32rem", margin: "0 auto" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 600 }}>
            Something went wrong
          </h1>
          <p style={{ color: "#555", marginTop: "0.5rem" }}>
            We couldn&apos;t load the page. Please try again.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "1.5rem",
              padding: "0.75rem 1.5rem",
              borderRadius: "9999px",
              background: "#031635",
              color: "#fff",
              border: "none",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
