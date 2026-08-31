import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth/session";
import { signOut } from "@/lib/auth/actions";

/**
 * Shared account navigation: signed-in user shows email + sign-out;
 * anonymous shows "Sign in" + "Get started" (the questionnaire gate).
 * Used by both the top `Header` and the landing page hero header.
 */
export async function AuthNav() {
  const t = await getTranslations("Auth");
  const user = await getCurrentUser();
  const isAnonymous = user?.is_anonymous === true;

  if (user && !isAnonymous) {
    return (
      <nav className="flex items-center gap-4 md:gap-6">
        <Link
          href="/profile"
          className="flex items-center justify-center font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors"
        >
          <span className="hidden md:inline">{user.email}</span>
          <span className="material-symbols-outlined md:hidden w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-container" aria-label="Profile">
            account_circle
          </span>
        </Link>
        <form action={signOut} className="hidden md:block">
          <button
            type="submit"
            className="font-label-caps text-label-caps px-4 py-2 rounded-full border border-outline-variant hover:bg-surface-container transition-colors"
          >
            {t("signOut")}
          </button>
        </form>
      </nav>
    );
  }

  return (
    <nav className="flex items-center gap-2 md:gap-3">
      <Link
        href="/sign-in"
        className="hidden md:inline-block font-label-caps text-label-caps px-4 py-2 rounded-full text-primary hover:bg-surface-container transition-colors"
      >
        {t("signIn")}
      </Link>
      <Link
        href="/onboarding"
        className="font-label-caps text-label-caps px-4 py-2 md:px-5 md:py-2 rounded-full bg-primary text-on-primary hover:bg-on-primary-fixed-variant transition-colors text-center"
      >
        {t("getStarted")}
      </Link>
    </nav>
  );
}
