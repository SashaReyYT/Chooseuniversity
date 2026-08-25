import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { getGuides } from "@/content/guides";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "Guides" });
  return {
    title: t("heading"),
    description: t("description"),
  };
}

export default async function GuidesIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations("Guides");
  const guides = getGuides(locale);

  const countryFlags: Record<string, string> = {
    CZ: "🇨🇿",
    PL: "🇵🇱",
    DE: "🇩🇪",
    IT: "🇮🇹",
    NL: "🇳🇱",
    ES: "🇪🇸",
  };

  return (
    <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-16 space-y-10 max-w-4xl">
      <header className="space-y-2">
        <h1 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-primary">
          {t("heading")}
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant">
          {t("description")}
        </p>
      </header>

      <div className="space-y-4">
        {guides.map((guide) => (
          <Link
            key={guide.slug}
            href={`/guides/${guide.slug}`}
            className="block rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-6 hover:border-primary/50 transition-colors space-y-2"
          >
            <p className="font-label-caps text-label-caps text-on-surface-variant">
              {countryFlags[guide.countryCode] ?? "🌍"}{" "}
              {t("updatedLabel", { date: new Date(guide.updated) })}
            </p>
            <h2 className="font-headline-sm text-headline-sm text-primary group-hover:underline">
              {guide.title}
            </h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2">
              {guide.metaDescription}
            </p>
            <span className="inline-block font-label-caps text-label-caps text-primary underline">
              {t("readGuide")}
            </span>
          </Link>
        ))}
      </div>

      {/* CTA into the questionnaire */}
      <section className="rounded-xl border border-primary/40 bg-primary-fixed/10 p-6 md:p-8 space-y-3 text-center">
        <h2 className="font-headline-sm text-headline-sm text-primary">
          {t("ctaTitle")}
        </h2>
        <p className="font-body-md text-body-md text-on-surface-variant">
          {t("ctaBody")}
        </p>
        <Link
          href="/onboarding"
          className="inline-block font-label-caps text-label-caps text-on-primary bg-primary rounded-full px-8 py-4 hover:bg-primary/90 transition-all active:scale-95 shadow-md"
        >
          {t("ctaButton")}
        </Link>
      </section>
    </main>
  );
}