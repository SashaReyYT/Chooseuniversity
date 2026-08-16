"use client";

import { hasLocale, useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { useTransition } from "react";

/**
 * A plain <select> rather than a set of link/buttons: with only two
 * locales today this is a matter of taste, but a <select> scales to a
 * third language later (see the comment in `src/i18n/routing.ts`)
 * without needing a layout change.
 *
 * Deliberately doesn't read/preserve the query string — no page has one
 * yet. When a page with real query params (e.g. catalog filters) needs a
 * locale switch that preserves them, add `useSearchParams` there with its
 * own `<Suspense>` boundary rather than forcing one onto every page that
 * happens to render this component.
 */
export function LanguageSwitcher() {
  const t = useTranslations("LanguageSwitcher");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const nextLocale = event.target.value;
    if (!hasLocale(routing.locales, nextLocale)) return;

    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
    });
  }

  return (
    <label className="inline-flex items-center gap-2">
      <span className="sr-only">{t("label")}</span>
      <select
        value={locale}
        onChange={handleChange}
        disabled={isPending}
        aria-label={t("label")}
        className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wide bg-transparent border border-outline-variant rounded-full px-4 py-2 cursor-pointer hover:border-primary transition-colors disabled:opacity-60"
      >
        {routing.locales.map((loc) => (
          <option key={loc} value={loc}>
            {t(loc)}
          </option>
        ))}
      </select>
    </label>
  );
}
