import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getGuide, getGuides } from "@/content/guides";
import { UniLogo } from "@/components/uni-logo";

interface GuidePageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    getGuides("en").map((g) => ({ locale, slug: g.slug })),
  );
}

export async function generateMetadata({
  params,
}: GuidePageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const guide = getGuide(locale, slug);
  if (!guide) return {};
  return {
    title: guide.title,
    description: guide.metaDescription,
  };
}

export default async function GuidePage({ params }: GuidePageProps) {
  const { locale, slug } = await params;

  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const guide = getGuide(locale, slug);
  if (!guide) notFound();

  const t = await getTranslations("Guides");
  const supabase = await createServerSupabaseClient();
  const relatedUnis = await supabase
    .from("universities")
    .select("id, name, slug")
    .eq("country_code", guide.countryCode)
    .eq("published", true)
    .limit(6);
  const unis = relatedUnis.data ?? [];

  return (
    <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-16 space-y-10 max-w-3xl">
      {/* SEO structured data — Article */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: guide.title,
            description: guide.metaDescription,
            dateModified: guide.updated,
            author: { "@type": "Organization", name: "Unifind" },
          }),
        }}
      />

      <div className="space-y-2">
        <Link href="/guides" className="font-label-caps text-label-caps text-primary underline">
          ← {t("backToGuides")}
        </Link>
        <h1 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-primary">
          {guide.title}
        </h1>
        <p className="font-label-caps text-label-caps text-on-surface-variant">
          {t("updatedLabel", { date: new Date(guide.updated) })}
        </p>
      </div>

      <article className="space-y-8">
        {guide.sections.map((section, i) => (
          <section key={i} className="space-y-3">
            <h2 className="font-headline-sm text-headline-sm text-primary">
              {section.heading}
            </h2>
            {section.body.map((paragraph, j) => (
              <p key={j} className="font-body-md text-body-md text-on-surface leading-relaxed">
                {paragraph}
              </p>
            ))}
          </section>
        ))}
      </article>

      {/* Related universities in this country */}
      {unis.length > 0 && (
        <section className="space-y-4" aria-labelledby="related-unis-heading">
          <h2 id="related-unis-heading" className="font-headline-sm text-headline-sm text-primary">
            {t("relatedUniversities")}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {unis.map((u) => (
              <Link
                key={u.id}
                href={`/universities/${u.id}`}
                className="flex items-center gap-3 rounded-lg border border-outline-variant/40 bg-surface-container-lowest p-3 hover:border-primary/50 transition-colors"
              >
                <UniLogo name={u.name} className="w-9 h-9 text-sm" />
                <span className="font-body-sm text-body-sm text-primary line-clamp-2 group-hover:underline">
                  {u.name}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* CTA into the questionnaire */}
      <section className="rounded-xl border border-primary/40 bg-primary-fixed/10 p-6 md:p-8 space-y-3 text-center">
        <h2 className="font-headline-sm text-headline-sm text-primary">{t("ctaTitle")}</h2>
        <p className="font-body-md text-body-md text-on-surface-variant">{t("ctaBody")}</p>
        <Link
          href="/onboarding"
          className="inline-block font-label-caps text-label-caps text-on-primary bg-primary rounded-full px-8 py-4 hover:bg-primary/90 transition-all active:scale-95 shadow-md"
        >
          {t("ctaButton")}
        </Link>
      </section>

      <p className="font-body-xs text-body-xs text-on-surface-variant border-t border-outline-variant/30 pt-6">
        {t("disclaimer")}
      </p>
    </main>
  );
}