import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";

/**
 * Landing page. Functional real screen, but note: this is built from the
 * design tokens in `globals.css` (ported from the Stitch mockup reference
 * for Stage 0) and the product spec embedded in the matching engine's
 * comments — not a pixel-exact rebuild of the original
 * `unifind_premium_landing_page` mockup file, which isn't part of this
 * repository upload. Swap in real screenshots/exports of that mockup and
 * this can be brought to full fidelity.
 */
export default async function Home() {
  const user = await getCurrentUser();
  const primaryHref = user ? "/dashboard" : "/sign-up";

  return (
    <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-16 space-y-12">
      <section className="space-y-4 max-w-2xl">
        <h1 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-primary">
          Find the universities that actually fit you.
        </h1>
        <p className="font-body-md text-body-md md:font-body-lg md:text-body-lg text-on-surface-variant max-w-xl">
          Unifind scores every programme against your grades, budget,
          language, location, and admission chances — and always shows you
          why. Match Score is a fit measure, not an admission guarantee.
        </p>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-lg p-6 ambient-shadow">
          <p className="font-label-caps text-label-caps text-on-surface-variant mb-2">
            Match score
          </p>
          <p className="font-headline-md text-headline-md text-primary">94%</p>
          <p className="font-body-sm text-body-sm text-success mt-1">
            Excellent Fit
          </p>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-lg p-6 ambient-shadow space-y-2">
          <p className="font-body-sm text-body-sm text-on-surface flex items-center gap-2">
            <span className="text-success">✓</span> English-taught programme
          </p>
          <p className="font-body-sm text-body-sm text-on-surface flex items-center gap-2">
            <span className="text-warning">⚠</span> Entrance requirement may
            apply
          </p>
        </div>
      </section>

      <div className="flex flex-wrap gap-4">
        <Link
          href={primaryHref}
          className="bg-primary text-on-primary font-label-caps text-label-caps px-8 py-4 rounded-full hover:bg-on-primary-fixed-variant transition-all active:scale-95 shadow-md"
        >
          {user ? "See My Matches" : "Find My Universities"}
        </Link>
        {!user && (
          <Link
            href="/sign-in"
            className="bg-transparent text-primary font-label-caps text-label-caps px-8 py-4 rounded-full border border-primary hover:bg-surface-container transition-all active:scale-95"
          >
            Sign In
          </Link>
        )}
      </div>
    </main>
  );
}
