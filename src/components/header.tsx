import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth/session";
import { signOut } from "@/lib/auth/actions";

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
  const t = await getTranslations("Auth");
  const tNav = await getTranslations("Nav");
  const user = await getCurrentUser();
  const isAnonymous = user?.is_anonymous === true;

  return (
    <header className="border-b border-outline-variant/40 bg-surface-container-lowest">
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop h-16 flex items-center justify-between">
        <Link
          href="/"
          className="font-headline-sm text-headline-sm text-primary"
        >
          {tNav("brand")}
        </Link>

        {user && !isAnonymous ? (
          <nav className="flex items-center gap-6">
            <Link
              href="/profile"
              className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors"
            >
              {user.email}
            </Link>
            <form action={signOut}>
              <button
                type="submit"
                className="font-label-caps text-label-caps px-4 py-2 rounded-full border border-outline-variant hover:bg-surface-container transition-colors"
              >
                {t("signOut")}
              </button>
            </form>
          </nav>
        ) : (
          <nav className="flex items-center gap-3">
            <Link
              href="/sign-in"
              className="font-label-caps text-label-caps px-4 py-2 rounded-full text-primary hover:bg-surface-container transition-colors"
            >
              {t("signIn")}
            </Link>
            <Link
              href="/onboarding"
              className="font-label-caps text-label-caps px-5 py-2 rounded-full bg-primary text-on-primary hover:bg-on-primary-fixed-variant transition-colors"
            >
              {t("getStarted")}
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}