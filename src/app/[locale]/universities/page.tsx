import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { routing } from "@/i18n/routing";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { UniLogo } from "@/components/uni-logo";

export const revalidate = 3600;

interface UniversitiesIndexProps {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<Record<string, string | undefined>>;
}

const PAGE = 48;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "UniversitiesIndex" });
  return { title: t("heading"), description: t("description") };
}

export default async function UniversitiesIndexPage({
  params,
  searchParams,
}: UniversitiesIndexProps) {
  const { locale } = await params;
  const sp = (await searchParams) ?? {};
  const countryFilter = sp?.country ?? "";

  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations("UniversitiesIndex");
  const supabase = await createServerSupabaseClient();

  let query = supabase
    .from("universities")
    .select("id, name, slug, city, country_code, founded_year, student_count, ownership_type")
    .eq("published", true)
    .order("name");

  if (countryFilter) query = query.eq("country_code", countryFilter);

  const shownCount = Math.min(
    Math.max(1, Number(sp?.n ?? PAGE) || PAGE),
    100000,
  );
  const [{ data: unis }, { data: countries }] = await Promise.all([
    query,
    supabase.from("countries").select("code, name").eq("supported", true).order("sort_order"),
  ]);

  const rows = unis ?? [];
  const visible = rows.slice(0, shownCount);

  // Preserve country filter in load-more link; drop `n` from filter links.
  const moreHref = `/${locale}/universities?${new URLSearchParams({
    ...(countryFilter ? { country: countryFilter } : {}),
    n: String(shownCount + PAGE),
  })}`;

  const activeQuery = new URLSearchParams(
    countryFilter ? { country: countryFilter } : {},
  );

  return (
    <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-16 space-y-8">
      <header className="space-y-2">
        <h1 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-primary">
          {t("heading")}
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          {t("description")}
        </p>
      </header>

      {/* Country filter chips */}
      <nav className="flex flex-wrap gap-2" aria-label={t("filterLabel")}>
        <Link
          href={`/${locale}/universities`}
          aria-current={!countryFilter ? "true" : undefined}
          className={`font-label-caps text-label-caps rounded-full px-4 py-2 border transition-colors ${
            !countryFilter
              ? "bg-primary text-on-primary border-primary"
              : "border-outline-variant text-on-surface hover:border-primary"
          }`}
        >
          {t("allCountriesChip")}
        </Link>
        {(countries ?? []).map((c) => (
          <Link
            key={c.code}
            href={`/${locale}/universities?${activeQuery.size ? `country=${c.code}` : `country=${c.code}`}`}
            aria-current={countryFilter === c.code ? "true" : undefined}
            className={`font-label-caps text-label-caps rounded-full px-4 py-2 border transition-colors ${
              countryFilter === c.code
                ? "bg-primary text-on-primary border-primary"
                : "border-outline-variant text-on-surface hover:border-primary"
            }`}
          >
            {c.name}
          </Link>
        ))}
      </nav>

      <p className="font-body-sm text-body-sm text-on-surface-variant">
        {t("resultCount", { count: rows.length })}
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((u) => (
          <Link
            key={u.id}
            href={`/${locale}/universities/${u.id}`}
            className="group flex items-start gap-4 rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-5 hover:border-primary/50 transition-colors"
          >
            <UniLogo name={u.name} className="w-12 h-12 text-lg shrink-0" />
            <div className="min-w-0 space-y-1">
              <h2 className="font-body-md text-body-md text-primary line-clamp-2 group-hover:underline">
                {u.name}
              </h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant truncate">
                {u.city}
                {u.founded_year != null && ` · ${t("foundedShort", { year: u.founded_year })}`}
              </p>
              <div className="flex flex-wrap gap-x-3 font-label-caps text-label-caps text-on-surface-variant">
                {u.student_count != null && (
                  <span>{t("studentsShort", { count: u.student_count })}</span>
                )}
                {u.ownership_type && (
                  <span>
                    {u.ownership_type === "public" ? t("public") : t("private")}
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {rows.length > shownCount && (
        <Link
          href={moreHref}
          role="button"
          className="block w-full rounded-full border border-primary py-4 text-center font-label-caps text-label-caps text-primary transition-all hover:bg-surface-container active:scale-[0.99]"
        >
          {t("loadMore")}
        </Link>
      )}
    </main>
  );
}