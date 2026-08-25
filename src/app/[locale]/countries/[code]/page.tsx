import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { routing } from "@/i18n/routing";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getGuide } from "@/content/guides";
import { UniLogo } from "@/components/uni-logo";

export const revalidate = 3600;

/** Monthly living-cost band per country (EUR), mirrors bulk migrations. */
const COST_BANDS: Record<string, [number, number]> = {
  CZ: [550, 850], UA: [400, 700], DE: [850, 1200], AT: [900, 1250],
  CH: [1600, 2300], PL: [550, 850], NL: [1050, 1550], FR: [950, 1400],
  ES: [800, 1200], IT: [800, 1200], PT: [700, 1000], GB: [1150, 1700],
  IE: [1150, 1650], US: [1300, 2000], CA: [1000, 1500], SE: [950, 1400],
  DK: [950, 1400], FI: [900, 1350], NO: [1000, 1500],
};

interface CountryPageProps {
  params: Promise<{ locale: string; code: string }>;
}

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    ["CZ", "UA", "DE", "AT", "CH", "PL", "NL", "FR", "ES", "IT", "PT", "GB", "IE", "US", "CA", "SE", "DK", "FI", "NO"].map(
      (code) => ({ locale, code }),
    ),
  );
}

export async function generateMetadata({
  params,
}: CountryPageProps): Promise<Metadata> {
  const { locale, code } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "CountryPage" });
  // Generic template title — country display name comes from the DB in the
  // rendered page; metadata stays build-safe.
  return {
    title: `${t("titlePrefix")} ${code.toUpperCase()}`,
    description: t("description"),
  };
}

export default async function CountryPage({ params }: CountryPageProps) {
  const { locale, code } = await params;
  const upper = code.toUpperCase();

  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations("CountryPage");
  const supabase = await createServerSupabaseClient();

  const [{ data: country }, { data: unis }] = await Promise.all([
    supabase.from("countries").select("code, name").eq("code", upper).single(),
    supabase
      .from("universities")
      .select("id, name, city, founded_year, student_count")
      .eq("country_code", upper)
      .eq("published", true)
      .order("student_count", { ascending: false })
      .limit(12),
  ]);

  if (!country) notFound();

  const guide = getGuide(locale, guideSlugFor(upper));
  const band = COST_BANDS[upper];

  const fmt = new Intl.NumberFormat(locale === "uk" ? "uk" : "en", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  });

  return (
    <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-16 space-y-10">
      <header className="space-y-2">
        <p className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wide">
          {t("eyebrow")}
        </p>
        <h1 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-primary">
          {t("heading", { country: country.name })}
        </h1>
        {band && (
          <p className="font-body-md text-body-md text-on-surface-variant">
            {t("costBand", { min: fmt.format(band[0]), max: fmt.format(band[1]) })}
          </p>
        )}
      </header>

      {guide && (
        <section className="rounded-xl border border-primary/40 bg-primary-fixed/10 p-6 space-y-3">
          <h2 className="font-headline-sm text-headline-sm text-primary">{guide.title}</h2>
          <p className="font-body-md text-body-md text-on-surface-variant line-clamp-3">
            {guide.metaDescription}
          </p>
          <Link
            href={`/${locale}/guides/${guide.slug}`}
            className="inline-block font-label-caps text-label-caps text-primary underline"
          >
            {t("readGuide")}
          </Link>
        </section>
      )}

      <section className="space-y-4" aria-labelledby="country-unis-heading">
        <h2 id="country-unis-heading" className="font-headline-md text-headline-md text-primary">
          {t("universitiesHeading", { count: unis?.length ?? 0 })}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(unis ?? []).map((u) => (
            <Link
              key={u.id}
              href={`/${locale}/universities/${u.id}`}
              className="group flex items-start gap-4 rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-5 hover:border-primary/50 transition-colors"
            >
              <UniLogo name={u.name} className="w-12 h-12 text-lg shrink-0" />
              <div className="min-w-0 space-y-1">
                <h3 className="font-body-md text-body-md text-primary line-clamp-2 group-hover:underline">
                  {u.name}
                </h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant truncate">{u.city}</p>
              </div>
            </Link>
          ))}
        </div>
        <Link
          href={`/${locale}/universities?country=${upper}`}
          className="inline-block font-label-caps text-label-caps text-primary underline"
        >
          {t("allUniversitiesLink")}
        </Link>
      </section>

      {/* CTA */}
      <section className="rounded-xl border border-primary/40 bg-primary-fixed/10 p-6 md:p-8 space-y-3 text-center">
        <h2 className="font-headline-sm text-headline-sm text-primary">{t("ctaTitle")}</h2>
        <Link
          href="/onboarding"
          className="inline-block font-label-caps text-label-caps text-on-primary bg-primary rounded-full px-8 py-4 hover:bg-primary/90 transition-all active:scale-95 shadow-md"
        >
          {t("ctaButton")}
        </Link>
      </section>

      <p className="font-body-xs text-body-xs text-on-surface-variant">{t("disclaimer")}</p>
    </main>
  );
}

function guideSlugFor(countryCode: string): string {
  const map: Record<string, string> = {
    CZ: "study-in-czech-republic",
    PL: "study-in-poland",
    DE: "study-in-germany",
    IT: "study-in-italy",
    NL: "study-in-netherlands",
    ES: "study-in-spain",
  };
  return map[countryCode] ?? "";
}