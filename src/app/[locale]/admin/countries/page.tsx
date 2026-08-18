import { getTranslations, setRequestLocale } from "next-intl/server";
import { requireAdminForPage, requireAdminLocale } from "@/lib/admin/require-admin";
import { AdminCatalogRepository } from "@/lib/repositories/admin/admin-catalog.repository";
import { toggleCountryAction } from "@/lib/admin/admin-actions";
import { adminPrimaryButtonClassName } from "../admin-field";

export default async function AdminCountriesPage({
  params,
}: PageProps<"/[locale]/admin/countries">) {
  const { locale } = await params;
  requireAdminLocale(locale);
  setRequestLocale(locale);

  const supabase = await requireAdminForPage(locale);
  const t = await getTranslations("Admin");

  const countries = await new AdminCatalogRepository(
    supabase!,
  ).listCountries();

  return (
    <div className="space-y-6">
      <h2 className="font-headline-sm text-headline-sm text-primary">
        {t("countriesHeading")}
      </h2>
      <ul className="space-y-2">
        {countries.map((c) => (
          <li
            key={c.code}
            className="rounded-lg border border-outline-variant/60 bg-surface-container-lowest p-4 flex items-center justify-between gap-4"
          >
            <div>
              <p className="font-body-md text-body-md text-on-surface">
                {c.name}
                <span className="text-on-surface-variant"> ({c.code})</span>
              </p>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                {t("countriesSortOrder")}: {c.sort_order}
              </p>
            </div>
            <form action={toggleCountryAction}>
              <input type="hidden" name="code" value={c.code} />
              <input
                type="hidden"
                name="supported"
                value={String(!c.supported)}
              />
              <button type="submit" className={adminPrimaryButtonClassName}>
                {c.supported ? t("countriesSupported") : t("countriesToggle")}
              </button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}