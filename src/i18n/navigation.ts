import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

/**
 * Locale-aware equivalents of Next.js's `Link`/`redirect`/`useRouter`/
 * `usePathname`. Use these instead of the `next/navigation` /
 * `next/link` originals anywhere a link or redirect should carry the
 * current locale prefix automatically.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
