"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

const TABS = [
  { href: "/" as const, icon: "explore", key: "navDiscover" as const },
  { href: "/catalog" as const, icon: "search", key: "navCatalog" as const },
  { href: "/favourites" as const, icon: "bookmark", key: "navSaved" as const },
  { href: "/matches" as const, icon: "star", key: "navMatches" as const },
  { href: "/profile" as const, icon: "person", key: "navProfile" as const },
];

/**
 * Persistent bottom tab bar, matching the nav chrome shown in every
 * Stitch mockup screen (Discover / Saved / Matches / Profile — a
 * Catalog tab is added here since browsing wasn't a separate mockup
 * screen but is a separate route in this app). Global in
 * `[locale]/layout.tsx` rather than per-page so every screen gets it for
 * free and active-state highlighting stays in one place.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const t = useTranslations("Nav");
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 pb-20">{children}</div>

      <nav
        aria-label={t("brand")}
        className="fixed bottom-0 inset-x-0 z-40 bg-surface-container-lowest border-t border-outline-variant/40"
      >
        <ul className="max-w-container-max mx-auto grid grid-cols-5">
          {TABS.map((tab) => {
            const isActive =
              tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
            return (
              <li key={tab.href}>
                <Link
                  href={tab.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex flex-col items-center gap-1 py-3 transition-colors ${
                    isActive
                      ? "text-primary"
                      : "text-on-surface-variant hover:text-primary"
                  }`}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{
                      fontSize: 22,
                      fontVariationSettings: isActive
                        ? "'FILL' 1"
                        : "'FILL' 0",
                    }}
                    aria-hidden="true"
                  >
                    {tab.icon}
                  </span>
                  <span className="font-label-caps text-[10px] tracking-wide">
                    {t(tab.key)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
