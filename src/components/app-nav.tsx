import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/auth/session";

const NAV_ITEMS = [
  { href: "/discover" as const, key: "navDiscover" as const, icon: "explore" },
  { href: "/saved" as const, key: "navSaved" as const, icon: "bookmark" },
  { href: "/compare" as const, key: "navCompare" as const, icon: "compare_arrows" },
  { href: "/profile" as const, key: "navProfile" as const, icon: "person" },
];

/**
 * Section 7 of the product spec: exactly four nav concepts
 * (Discover/Saved/Compare/Profile), mobile bottom nav with an adapted
 * desktop layout. One component handles both — `hidden`/`flex` swap at
 * the `md` breakpoint rather than two separate components, since the
 * link list and labels are identical either way.
 *
 * Protected pages (discover, saved, compare, profile) redirect to
 * sign-up when the visitor is not authenticated.
 */
export async function AppNav() {
  const t = await getTranslations("Nav");
  const user = await getCurrentUser();
  const isLoggedIn = user && user.is_anonymous !== true;

  return (
    <nav
      aria-label={t("brand")}
      className="
        fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-around
        bg-surface-container-lowest border-t border-outline-variant/40
        md:static md:inset-auto md:z-auto md:justify-start md:gap-2
        md:border-t-0 md:border-b md:px-margin-desktop md:py-3
      "
    >
      {NAV_ITEMS.map((item) => (
        <Link
          key={item.href}
          href={isLoggedIn ? item.href : `/sign-up?next=${encodeURIComponent(item.href)}`}
          className="
            flex flex-1 flex-col items-center justify-center gap-1 py-2
            font-label-caps text-label-caps text-on-surface-variant
            hover:text-primary transition-colors
            md:flex-none md:flex-row md:gap-2 md:px-4 md:py-2 md:rounded-full
            md:hover:bg-surface-container
          "
        >
          <span
            className="material-symbols-outlined text-[22px] md:text-[18px]"
            aria-hidden="true"
          >
            {item.icon}
          </span>
          <span>{t(item.key)}</span>
        </Link>
      ))}
    </nav>
  );
}
