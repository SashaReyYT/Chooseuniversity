import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { routing } from "@/i18n/routing";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const revalidate = 3600;

interface CompareUniProps {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<Record<string, string | undefined>>;
}

const MAX = 3;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "CompareUni" });
  return { title: t("heading"), description: t("description") };
}

interface UniRow {
  id: string;
  name: string;
  city: string;
  country_code: string;
  founded_year: number | null;
  student_count: number | null;
  international_student_percentage: number | null;
  ownership_type: string | null;
  website_url: string | null;
}

export default async function CompareUniversitiesPage({
  params,
  searchParams,
}: CompareUniProps) {
  const { locale } = await params;
  const sp = (await searchParams) ?? {};

  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations("CompareUni");
  const supabase = await createServerSupabaseClient();

  const idsRaw = sp?.ids;
  const idList = (Array.isArray(idsRaw) ? idsRaw : [idsRaw])
    .map((s) => (s ?? "").trim())
    .filter(Boolean)
    .slice(0, MAX);

  const selected: UniRow[] =
    idList.length > 0
      ? await supabase
          .from("universities")
          .select(
            "id, name, city, country_code, founded_year, student_count, international_student_percentage, ownership_type, website_url",
          )
          .in("id", idList)
          .eq("published", true)
          .then(({ data }) => (data as UniRow[]) ?? [])
      : [];

  // Picker options — everything published, capped for payload size.
  const { data: allUnis } = await supabase
    .from("universities")
    .select("id, name")
    .eq("published", true)
    .order("name");

  const fmt = new Intl.NumberFormat(locale === "uk" ? "uk" : "en");

  const rows: { label: string; render: (u: UniRow) => React.ReactNode }[] = [
    { label: t("rowCity"), render: (u) => u.city },
    {
      label: t("rowCountry"),
      render: (u) => u.country_code.toUpperCase(),
    },
    {
      label: t("rowFounded"),
      render: (u) => (u.founded_year != null ? String(u.founded_year) : "—"),
    },
    {
      label: t("rowStudents"),
      render: (u) => (u.student_count != null ? fmt.format(u.student_count) : "—"),
    },
    {
      label: t("rowInternational"),
      render: (u) =>
        u.international_student_percentage != null
          ? `${Math.round(u.international_student_percentage)}%`
          : "—",
    },
    {
      label: t("rowOwnership"),
      render: (u) =>
        u.ownership_type === "public" ? t("public") : u.ownership_type === "private" ? t("private") : "—",
    },
    {
      label: t("rowWebsite"),
      render: (u) =>
        u.website_url ? (
          <a href={u.website_url} target="_blank" rel="noopener noreferrer" className="text-primary underline">
            {t("visitWebsite")}
          </a>
        ) : (
          "—"
        ),
    },
  ];

  return (
    <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-16 space-y-8 overflow-x-auto">
      <header className="space-y-2">
        <h1 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-primary">
          {t("heading")}
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant">{t("description")}</p>
      </header>

      {/* Picker — GET form keeps the selection shareable via ?ids=a&ids=b */}
      <form method="GET" className="flex flex-col md:flex-row gap-3 items-end">
        {[0, 1, 2].map((slot) => (
          <div key={slot} className="flex-1 min-w-0 w-full">
            <label htmlFor={`uni-${slot}`} className="sr-only">
              {t("pickLabel", { slot: slot + 1 })}
            </label>
            <select
              id={`uni-${slot}`}
              name="ids"
              defaultValue={idList[slot] ?? ""}
              className="w-full font-body-sm text-body-sm bg-surface-container-lowest border border-outline-variant rounded-lg px-4 py-3"
            >
              <option value="">{t("pickLabel", { slot: slot + 1 })}</option>
              {(allUnis ?? []).map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
        ))}
        <button
          type="submit"
          className="font-label-caps text-label-caps text-on-primary bg-primary rounded-full px-6 py-3 hover:bg-primary/90 transition-all active:scale-95 whitespace-nowrap"
        >
          {t("compareCta")}
        </button>
      </form>

      {selected.length > 0 && (
        <table className="min-w-full border-separate border-spacing-0">
          <thead>
            <tr>
              <th className="text-left align-bottom pb-4 pr-4 min-w-[10rem]" aria-hidden="true" />
              {selected.map((u) => (
                <th key={u.id} className="text-left align-bottom pb-4 px-4 min-w-[14rem] border-b border-outline-variant/40">
                  <span className="font-headline-sm text-headline-sm text-primary">{u.name}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label}>
                <th scope="row" className="text-left align-top py-4 pr-4 font-label-caps text-label-caps uppercase tracking-wide text-on-surface-variant border-b border-outline-variant/20 whitespace-nowrap">
                  {row.label}
                </th>
                {selected.map((u) => (
                  <td key={u.id} className="align-top py-4 px-4 font-body-sm text-body-sm text-on-surface border-b border-outline-variant/20">
                    {row.render(u)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}