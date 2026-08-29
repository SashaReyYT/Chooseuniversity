import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { AppShell } from "@/components/app-shell";

export default async function NotFoundPage({
  params,
}: {
  params?: Promise<{ locale: string }>;
}) {
  const locale = params ? (await params).locale : routing.defaultLocale;
  if (!hasLocale(routing.locales, locale)) {
    return null;
  }
  const t = await getTranslations({ locale, namespace: "NotFound" });

  return (
    <AppShell>
      <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-24 text-center space-y-6">
        <p className="font-display-xl text-display-xl text-primary">404</p>
        <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary">
          {t("title")}
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-md mx-auto">
          {t("description")}
        </p>
        <Link
          href="/"
          className="inline-block font-label-caps text-label-caps px-8 py-3 rounded-full bg-primary text-on-primary hover:bg-primary/90 transition-all active:scale-95"
        >
          {t("backHome")}
        </Link>
      </main>
    </AppShell>
  );
}
