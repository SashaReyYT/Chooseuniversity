import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";

interface LegalPageProps {
  params: Promise<{ locale: string }>;
  kind: "privacy" | "terms";
}

/**
 * Shared renderer for the two legal pages. Copy is deliberately concise
 * boilerplate, not legal advice — swap in counsel-reviewed text before
 * scale.
 */
export default async function LegalPage({ params, kind }: LegalPageProps) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations(kind === "privacy" ? "Privacy" : "Terms");

  return (
    <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-16 space-y-8 max-w-3xl">
      <h1 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-primary">
        {t("heading")}
      </h1>
      <p className="font-body-md text-body-md text-on-surface">{t("intro")}</p>

      <section className="space-y-2">
        <h2 className="font-headline-sm text-headline-sm text-primary">{t("s1Heading")}</h2>
        <p className="font-body-md text-body-md text-on-surface">{t("s1Body")}</p>
      </section>
      <section className="space-y-2">
        <h2 className="font-headline-sm text-headline-sm text-primary">{t("s2Heading")}</h2>
        <p className="font-body-md text-body-md text-on-surface">{t("s2Body")}</p>
      </section>
      <section className="space-y-2">
        <h2 className="font-headline-sm text-headline-sm text-primary">{t("s3Heading")}</h2>
        <p className="font-body-md text-body-md text-on-surface">{t("s3Body")}</p>
      </section>
      <section className="space-y-2">
        <h2 className="font-headline-sm text-headline-sm text-primary">{t("s4Heading")}</h2>
        <p className="font-body-md text-body-md text-on-surface">{t("s4Body")}</p>
      </section>

      <p className="font-body-sm text-body-sm text-on-surface-variant border-t border-outline-variant/30 pt-6">
        {t("footerNote")}{" "}
        <Link href={kind === "privacy" ? "/terms" : "/privacy"} className="text-primary underline">
          {kind === "privacy" ? t("otherDocLink") : t("otherDocLink")}
        </Link>
      </p>
    </main>
  );
}