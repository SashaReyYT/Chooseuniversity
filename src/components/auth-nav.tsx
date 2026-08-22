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
    );
  }

  return (
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
  );
}
