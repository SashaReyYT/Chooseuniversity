import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth/session";
import { AppNavClient } from "@/components/app-nav-client";

const NAV_ITEMS = [
  { href: "/discover" as const, key: "navDiscover" as const, icon: "explore" },
  { href: "/saved" as const, key: "navSaved" as const, icon: "bookmark" },
  { href: "/compare" as const, key: "navCompare" as const, icon: "compare_arrows" },
  { href: "/profile" as const, key: "navProfile" as const, icon: "person" },
];

/**
 * Section 7 of the product spec: exactly four nav concepts
 * (Discover/Saved/Compare/Profile), mobile bottom nav with an adapted
 * desktop layout. One component handles both — flex/hidden swap at
 * the md breakpoint, and safe area inset support.
 */
export async function AppNav() {
  const t = await getTranslations("Nav");
  const user = await getCurrentUser();
  const isLoggedIn = !!user && user.is_anonymous !== true;

  const items = NAV_ITEMS.map((item) => ({
    href: item.href,
    icon: item.icon,
    label: t(item.key),
  }));

  return (
    <nav
      aria-label={t("brand")}
      className="
        fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-around
        bg-surface-container-lowest border-t border-outline-variant/40
        pb-safe
        md:static md:inset-auto md:z-auto md:justify-start md:gap-2
        md:border-t-0 md:border-b md:px-margin-desktop md:py-3 md:pb-3
      "
    >
      <AppNavClient items={items} isLoggedIn={isLoggedIn} />
    </nav>
  );
}
