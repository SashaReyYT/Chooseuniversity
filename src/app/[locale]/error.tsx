"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { Link } from "@/i18n/navigation";
import { formPrimaryButtonClassName } from "@/components/form-styles";

/**
 * Catches errors thrown anywhere in this segment's Server/Client
 * Components (e.g. a Supabase request failing) and renders this instead
 * of Next.js's default error page. Discovered the need for this the hard
 * way: `/onboarding` crashed with a raw 500 when Supabase was
 * unreachable, since `Promise.all([...repository calls])` had nothing
 * catching a rejected fetch.
 *
 * Must be a Client Component (Next.js requirement for error.tsx). Still
 * renders inside the [locale] layout, so NextIntlClientProvider's context
 * is available here.
 */
export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("ErrorBoundary");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-16 space-y-6">
      <div className="space-y-2 max-w-xl">
        <h1 className="font-headline-md text-headline-md text-primary">
          {t("heading")}
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          {t("description")}
        </p>
      </div>
      <div className="flex flex-wrap gap-4">
        <button
          type="button"
          onClick={reset}
          className={formPrimaryButtonClassName}
        >
          {t("retry")}
        </button>
        <Link
          href="/"
          className="font-label-caps text-label-caps text-primary border border-primary rounded-full px-8 py-4 hover:bg-surface-container transition-all active:scale-95"
        >
          {t("home")}
        </Link>
      </div>
    </main>
  );
}
