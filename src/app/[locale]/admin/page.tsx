import { getTranslations, setRequestLocale } from "next-intl/server";
import { requireAdminForPage, requireAdminLocale } from "@/lib/admin/require-admin";
import { AdminDashboardRepository } from "@/lib/repositories/admin/admin-dashboard.repository";
import { Link } from "@/i18n/navigation";

export default async function AdminDashboardPage({
  params,
}: PageProps<"/[locale]/admin">) {
  const { locale } = await params;
  requireAdminLocale(locale);
  setRequestLocale(locale);

  const supabase = await requireAdminForPage(locale);
  const t = await getTranslations("Admin");

  const metrics = await new AdminDashboardRepository(supabase!).getMetrics();
  const dateFormatter = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });

  const cards = [
    { label: t("dashboardUniversities"), value: metrics.universities },
    { label: t("dashboardPublishedUniversities"), value: metrics.publishedUniversities },
    { label: t("dashboardProgrammes"), value: metrics.programmes },
    { label: t("dashboardCountries"), value: metrics.countries },
    { label: t("dashboardParsingErrors"), value: metrics.importErrorCount },
  ];

  const usageCards = [
    { label: t("metricsCompletedQuestionnaires"), value: metrics.completedQuestionnaires },
    { label: t("metricsSavedProgrammes"), value: metrics.savedProgrammesCount },
    { label: t("metricsComparisons"), value: metrics.comparisonsCount },
  ];

  return (
    <div className="space-y-8">
      <h2 className="font-headline-sm text-headline-sm text-primary">
        {t("dashboardHeading")}
      </h2>

      <dl className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-5 space-y-1"
          >
            <dt className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wide">
              {card.label}
            </dt>
            <dd className="font-data-lg text-data-lg text-primary">
              {card.value}
            </dd>
          </div>
        ))}
      </dl>

      <section className="space-y-3">
        <h3 className="font-headline-sm text-headline-sm text-primary">
          {t("metricsUsageHeading")}
        </h3>
        <dl className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {usageCards.map((card) => (
            <div
              key={card.label}
              className="rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-5 space-y-1"
            >
              <dt className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wide">
                {card.label}
              </dt>
              <dd className="font-data-lg text-data-lg text-primary">
                {card.value}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="space-y-3">
        <h3 className="font-headline-sm text-headline-sm text-primary">
          {t("dashboardRecentImports")}
        </h3>
        {metrics.recentImports.length > 0 ? (
          <ul className="space-y-2">
            {metrics.recentImports.map((imp) => (
              <li
                key={imp.id}
                className="rounded-lg border border-outline-variant/60 bg-surface-container-lowest p-4 flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <p className="font-body-sm text-body-sm text-on-surface truncate">
                    {imp.source_name}
                  </p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    {imp.format.toUpperCase()} · {imp.row_count} {t("importsRows")} ·{" "}
                    {dateFormatter.format(new Date(imp.created_at))}
                  </p>
                </div>
                <span className="font-label-caps text-label-caps text-on-surface-variant shrink-0">
                  {imp.status}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            {t("dashboardNoImports")}
          </p>
        )}
        <Link
          href="/admin/imports"
          className="inline-block font-label-caps text-label-caps text-primary underline"
        >
          {t("dashboardViewAll")}
        </Link>
      </section>

      <section className="space-y-3">
        <h3 className="font-headline-sm text-headline-sm text-primary">
          {t("issuesTitle")}
        </h3>
        <Link
          href="/admin/issues"
          className="inline-block font-label-caps text-label-caps text-primary border border-primary rounded-full px-6 py-3 hover:bg-surface-container transition-colors"
        >
          {t("issuesOpenList")}
        </Link>
      </section>
    </div>
  );
}