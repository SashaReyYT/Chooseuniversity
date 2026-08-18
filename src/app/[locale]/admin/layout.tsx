import { getTranslations, setRequestLocale } from "next-intl/server";
import { requireAdminForPage, requireAdminLocale } from "@/lib/admin/require-admin";
import { Link } from "@/i18n/navigation";

const NAV_ITEMS = [
  { href: "/admin", key: "navDashboard" },
  { href: "/admin/universities", key: "navUniversities" },
  { href: "/admin/faculties", key: "navFaculties" },
  { href: "/admin/programmes", key: "navProgrammes" },
  { href: "/admin/countries", key: "navCountries" },
  { href: "/admin/study-fields", key: "navStudyFields" },
  { href: "/admin/requirements", key: "navRequirements" },
  { href: "/admin/qualifications", key: "navQualifications" },
  { href: "/admin/costs", key: "navCosts" },
  { href: "/admin/accommodation", key: "navAccommodation" },
  { href: "/admin/sources", key: "navSources" },
  { href: "/admin/imports", key: "navImports" },
  { href: "/admin/settings", key: "navSettings" },
] as const;

export default async function AdminLayout({
  children,
  params,
}: LayoutProps<"/[locale]/admin">) {
  const { locale } = await params;
  requireAdminLocale(locale);
  setRequestLocale(locale);

  await requireAdminForPage(locale);

  const t = await getTranslations("Admin");

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-10">
        <header className="flex items-center justify-between mb-8">
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-primary">
            {t("title")}
          </h1>
          <Link
            href="/"
            className="font-label-caps text-label-caps text-primary underline"
          >
            {t("backToSite")}
          </Link>
        </header>

        <div className="flex flex-col md:flex-row gap-8">
          <nav
            aria-label="Admin"
            className="shrink-0 md:w-56 flex md:flex-col flex-wrap gap-1"
          >
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="font-label-caps text-label-caps px-4 py-2 rounded-full border border-outline-variant text-on-surface-variant hover:bg-surface-container transition-colors"
              >
                {t(item.key)}
              </Link>
            ))}
          </nav>
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}