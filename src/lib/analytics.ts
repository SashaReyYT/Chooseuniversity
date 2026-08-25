/**
 * Vendor-agnostic funnel events. Plugs into whatever privacy-friendly
 * analytics is enabled (Umami, Plausible, GA4) via their global snippets —
 * when none is present every call is a no-op, so wiring events costs
 * nothing today and lights up the moment a script tag is added.
 *
 * Key funnel: onboarding_started → quiz_submitted → programme_viewed →
 * programme_saved → compare_opened.
 */
export function track(event: string, props?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  const w = window as unknown as {
    umami?: { track?: (e: string, p?: Record<string, unknown>) => void };
    plausible?: (e: string, o?: { props?: Record<string, unknown> }) => void;
    gtag?: (type: string, name: string, params?: Record<string, unknown>) => void;
  };
  w.umami?.track?.(event, props);
  w.plausible?.(event, { props });
  w.gtag?.("event", event, props);
}