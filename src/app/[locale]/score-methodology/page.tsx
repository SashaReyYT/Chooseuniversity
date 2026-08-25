import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";

const DIMENSIONS = [
  { key: "academic", icon: "school" },
  { key: "budget", icon: "attach_money" },
  { key: "admission", icon: "how_to_reg" },
  { key: "language", icon: "translate" },
  { key: "location", icon: "location_on" },
  { key: "career", icon: "work" },
  { key: "format", icon: "schedule" },
  { key: "lifestyle", icon: "favorite" },
  { key: "support", icon: "support_agent" },
] as const;

export default async function ScoreMethodologyPage({
  params,
}: PageProps<"/[locale]/score-methodology">) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations("ScoreMethodology");

  return (
    <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-16 space-y-10 max-w-3xl">
      <div className="space-y-2">
        <Link href="/discover" className="font-label-caps text-label-caps text-primary underline">
          ← {t("back")}
        </Link>
        <h1 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-primary">
          {t("heading")}
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant">
          {t("intro")}
        </p>
      </div>

      <section className="space-y-4" aria-label={t("dimensionsHeading")}>
        <h2 className="font-headline-md text-headline-md text-primary">
          {t("dimensionsHeading")}
        </h2>
        <ul className="space-y-3">
          {DIMENSIONS.map(({ key, icon }) => (
            <li
              key={key}
              className="flex items-start gap-4 rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-5"
            >
              <span className="material-symbols-outlined text-primary shrink-0" aria-hidden="true">
                {icon}
              </span>
              <div className="space-y-1">
                <p className="font-headline-sm text-headline-sm text-primary">
                  {t(`dim_${key}_label`)}
                </p>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  {t(`dim_${key}`)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3" aria-label={t("weightsHeading")}>
        <h2 className="font-headline-md text-headline-md text-primary">{t("weightsHeading")}</h2>
        <p className="font-body-md text-body-md text-on-surface">{t("weightsBody")}</p>
      </section>

      <section className="space-y-3" aria-label={t("hardReqsHeading")}>
        <h2 className="font-headline-md text-headline-md text-primary">{t("hardReqsHeading")}</h2>
        <p className="font-body-md text-body-md text-on-surface">{t("hardReqsBody")}</p>
      </section>

      <section className="space-y-3" aria-label={t("unknownHeading")}>
        <h2 className="font-headline-md text-headline-md text-primary">{t("unknownHeading")}</h2>
        <p className="font-body-md text-body-md text-on-surface">{t("unknownBody")}</p>
      </section>

      <section className="space-y-3" aria-label={t("confidenceHeading")}>
        <h2 className="font-headline-md text-headline-md text-primary">{t("confidenceHeading")}</h2>
        <p className="font-body-md text-body-md text-on-surface">{t("confidenceBody")}</p>
      </section>

      <p className="font-body-sm text-body-sm text-on-surface-variant border-t border-outline-variant/30 pt-6">
        {t("disclaimer")}
      </p>
    </main>
  );
}