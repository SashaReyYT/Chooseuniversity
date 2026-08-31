"use client";

import Link from "next/link";
import { usePathname } from "@/i18n/navigation";

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

interface AppNavClientProps {
  items: NavItem[];
  isLoggedIn: boolean;
}

export function AppNavClient({ items, isLoggedIn }: AppNavClientProps) {
  const pathname = usePathname();

  return (
    <>
      {items.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
        const href = isLoggedIn ? item.href : `/sign-up?next=${encodeURIComponent(item.href)}`;

        return (
          <Link
            key={item.href}
            href={href}
            className={`
              flex flex-1 flex-col items-center justify-center gap-1 py-2.5
              font-label-caps text-label-caps transition-all duration-200
              min-h-[48px] select-none touch-action-manipulation
              md:flex-none md:flex-row md:gap-2 md:px-4 md:py-2 md:rounded-full
              ${
                isActive
                  ? "text-primary font-bold md:bg-surface-container"
                  : "text-on-surface-variant hover:text-primary md:hover:bg-surface-container"
              }
            `}
          >
            <div className="relative flex flex-col items-center">
              <span
                className="material-symbols-outlined text-[22px] md:text-[18px] transition-all"
                aria-hidden="true"
                style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
              >
                {item.icon}
              </span>
              {isActive && (
                <span className="md:hidden absolute -bottom-1 w-1 h-1 rounded-full bg-primary" />
              )}
            </div>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </>
  );
}
