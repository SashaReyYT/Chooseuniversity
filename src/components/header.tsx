import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { AuthNav } from "@/components/auth-nav";
import { GlobalSearch } from "@/components/global-search";

/**
 * Top app bar. Navigation lives in `AppNav` (the single nav concept —
 * Discover/Saved/Compare/Profile), so this header only carries the brand
 * and account actions, matching the mockup's minimal top bars.
 *
 * Anonymous visitors get "Sign in" + "Get started" — and "Get started"
 * leads straight into the questionnaire (not a sign-up wall): the quiz
 * runs on the anonymous session and Supabase's anonymous→sign-up upgrade
 * keeps the same user id, so nothing is lost when they register later.
 */
export async function Header() {
  const tNav = await getTranslations("Nav");

  return (
    <header className="border-b border-outline-variant/40 bg-surface-container-lowest">
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop h-16 flex items-center justify-between">
        <Link
          href="/"
          className="font-headline-sm text-headline-sm text-primary"
        >
          {tNav("brand")}
        </Link>

        <div className="flex items-center gap-3">
          <GlobalSearch />
          <AuthNav />
        </div>
      </div>
    </header>
  );
}
