import { hasLocale } from "next-intl";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ProgrammesRepository } from "@/lib/repositories/programmes.repository";
import { ReferenceDataRepository } from "@/lib/repositories/reference-data.repository";
import { AppShell } from "@/components/app-shell";
import { formatTuition } from "@/components/match-display";
import { Suspense } from "react";
import { UniversitySkeleton } from "@/components/skeleton-wrappers";
import type { ProgrammeWithDetails } from "@/lib/repositories/programmes.repository";

type UniversityPageProps = PageProps<"/[locale]/universities/[id]">;

export default async function UniversityPage({ params }: UniversityPageProps) {
  const { locale, id } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  const t = await getTranslations("University");
  const tDiscover = await getTranslations("Discover");
  const uiLocale = await getLocale();
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}`);
    return;
  }

  const referenceData = new ReferenceDataRepository(supabase);
  const programmesRepo = new ProgrammesRepository(supabase);

  const [university, programmes] = await Promise.all([
    referenceData.getUniversityWithDetails(id),
    programmesRepo.search({ universityId: id, sortBy: "best_match" }),
  ]);

  if (!university) notFound();

  const rankingEntries =
    university.ranking_data &&
    typeof university.ranking_data === "object" &&
    !Array.isArray(university.ranking_data)
      ? Object.entries(university.ranking_data)
      : [];

  const programmesByLevel = programmes.reduce(
    (acc, p) => {
      const level = p.degree_level;
      if (!acc[level]) acc[level] = [];
      acc[level].push(p);
      return acc;
    },
    {} as Record<string, ProgrammeWithDetails[]>,
  );

  return (
    <Suspense fallback={<UniversitySkeleton />}>
      <AppShell>
      <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-16 space-y-10">
        <Link
          href="/discover"
          className="font-label-caps text-label-caps text-primary underline"
        >
          ← {t("backToDiscover")}
        </Link>

        <header className="space-y-4">
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-primary">
            {university.name}
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            {university.city}, {university.country.name}
            {university.founded_year != null && ` · ${t("founded", { year: university.founded_year })}`}
          </p>

          <div className="flex flex-wrap gap-2">
            <span className="font-label-caps text-label-caps text-on-surface-variant border border-outline-variant rounded-full px-4 py-2">
              {university.ownership_type === "public" ? t("public") : t("private")}
            </span>
            {university.city_size && (
              <span className="font-label-caps text-label-caps text-on-surface-variant border border-outline-variant rounded-full px-4 py-2">
                {(() => {
                  switch (university.city_size) {
                    case "large":
                      return t("citySizeLarge");
                    case "medium":
                      return t("citySizeMedium");
                    case "small":
                      return t("citySizeSmall");
                    default:
                      return university.city_size;
                  }
                })()}
              </span>
            )}
            {university.student_count && (
              <span className="font-label-caps text-label-caps text-on-surface-variant border border-outline-variant rounded-full px-4 py-2">
                {t("studentCount", { count: university.student_count })}
              </span>
            )}
            {university.international_student_percentage != null && (
              <span className="font-label-caps text-label-caps text-on-surface-variant border border-outline-variant rounded-full px-4 py-2">
                {t("internationalStudents", { percent: university.international_student_percentage })}
              </span>
            )}
          </div>
        </header>

        {university.description && (
          <section className="space-y-2">
            <h2 className="font-headline-sm text-headline-sm text-primary">
              {t("aboutUniversity")}
            </h2>
            <p className="font-body-md text-body-md text-on-surface whitespace-pre-line">
              {university.description}
            </p>
          </section>
        )}

        {rankingEntries.length > 0 && (
          <section className="space-y-2">
            <h2 className="font-headline-sm text-headline-sm text-primary">
              {t("ranking")}
            </h2>
            <ul className="space-y-1">
              {rankingEntries.map(([source, rank]) => (
                <li key={source} className="font-body-sm text-body-sm text-on-surface">
                  {source.toUpperCase()}: #{String(rank)}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="space-y-4">
          <h2 className="font-headline-sm text-headline-sm text-primary">
            {t("whyStudentsChoose")}
          </h2>
          <ul className="space-y-2 list-disc list-inside font-body-sm text-body-sm text-on-surface">
            {university.student_count && (
              <li>{t("reasonAcademicReputation")}</li>
            )}
            {university.international_student_percentage != null && university.international_student_percentage > 5 && (
              <li>{t("reasonInternationalCommunity")}</li>
            )}
            {university.ownership_type === "public" && (
              <li>{t("reasonPublicUniversity")}</li>
            )}
            {programmes.some((p) => p.language.code === "en") && (
              <li>{t("reasonEnglishProgrammes")}</li>
            )}
            {university.accommodation?.dormitory_available && (
              <li>{t("reasonDormitory")}</li>
            )}
            <li>{t("reasonStudentLife")}</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="font-headline-sm text-headline-sm text-primary">
            {t("studentLife")}
          </h2>
          <div className="space-y-2">
            <p className="font-body-md text-body-md text-on-surface">
              {t("studentLifeDescription", { city: university.city, country: university.country.name })}
            </p>
            {university.accommodation?.dormitory_available && (
              <div className="rounded-lg border border-outline-variant/40 bg-surface-container-low p-4 space-y-2">
                <p className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wide">
                  {t("accommodation")}
                </p>
                <p className="font-body-sm text-body-sm text-success">
                  {t("dormitoryAvailable")}
                </p>
                {university.accommodation.dormitory_name && (
                  <p className="font-body-sm text-body-sm text-on-surface">
                    {university.accommodation.dormitory_name}
                    {university.accommodation.room_type && ` · ${university.accommodation.room_type}`}
                  </p>
                )}
                {university.accommodation.estimated_monthly_cost_min != null &&
                  university.accommodation.currency && (
                    <p className="font-body-sm text-body-sm text-on-surface">
                      {t("accommodationCostRange", {
                        min: formatMoney(
                          university.accommodation.estimated_monthly_cost_min,
                          university.accommodation.currency,
                          uiLocale,
                        ),
                        max: formatMoney(
                          university.accommodation.estimated_monthly_cost_max ??
                            university.accommodation.estimated_monthly_cost_min,
                          university.accommodation.currency,
                          uiLocale,
                        ),
                      })} / {tDiscover("months")}
                    </p>
                  )}
                {university.accommodation.official_link && (
                  <a
                    href={university.accommodation.official_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block font-label-caps text-label-caps text-primary underline"
                  >
                    {t("accommodationOfficialLink")}
                  </a>
                )}
              </div>
            )}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-headline-sm text-headline-sm text-primary">
            {t("programmes")}
          </h2>
          {programmes.length === 0 ? (
            <p className="font-body-md text-body-md text-on-surface-variant">
              {t("noProgrammes")}
            </p>
          ) : (
            <div className="space-y-6">
              {Object.entries(programmesByLevel).map(([level, progs]) => (
                <div key={level} className="space-y-4">
                  <h3 className="font-headline-sm text-headline-sm text-primary capitalize">
                    {level}
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {progs.map((programme) => (
                      <Link
                        key={programme.id}
                        href={`/${locale}/programmes/${programme.id}`}
                        className="rounded-xl border border-outline-variant/40 bg-surface-container-low p-4 hover:border-primary/50 transition-colors"
                      >
                        <h4 className="font-headline-sm text-headline-sm text-primary line-clamp-1">
                          {programme.name}
                        </h4>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">
                          {programme.field_of_study.name} · {programme.language.name}
                        </p>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">
                          {formatTuition(programme, uiLocale, tDiscover)} · {programme.duration_months} {tDiscover("months")}
                        </p>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-4 pt-4 border-t border-outline-variant/40">
          <h2 className="font-headline-sm text-headline-sm text-primary">
            {t("usefulLinks")}
          </h2>
          <div className="flex flex-wrap gap-4">
            {university.website_url && (
              <a
                href={university.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-label-caps text-label-caps px-6 py-3 rounded-full border border-outline-variant text-on-surface-variant hover:bg-surface-container transition-all active:scale-95"
              >
                {t("visitWebsite")}
              </a>
            )}
            {university.official_application_url && (
              <a
                href={university.official_application_url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-label-caps text-label-caps px-6 py-3 rounded-full bg-primary text-on-primary hover:bg-primary/90 transition-all active:scale-95 shadow-md"
              >
                {t("officialApplicationLink")}
              </a>
            )}
            {university.international_office_url && (
              <a
                href={university.international_office_url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-label-caps text-label-caps px-6 py-3 rounded-full border border-outline-variant text-on-surface-variant hover:bg-surface-container transition-all active:scale-95"
              >
                {t("internationalOfficeLink")}
              </a>
            )}
            {university.housing_url && (
              <a
                href={university.housing_url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-label-caps text-label-caps px-6 py-3 rounded-full border border-outline-variant text-on-surface-variant hover:bg-surface-container transition-all active:scale-95"
              >
                {t("housingLink")}
              </a>
            )}
            {university.visa_support_url && (
              <a
                href={university.visa_support_url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-label-caps text-label-caps px-6 py-3 rounded-full border border-outline-variant text-on-surface-variant hover:bg-surface-container transition-all active:scale-95"
              >
                {t("visaSupportLink")}
              </a>
            )}
            {university.arrival_info_url && (
              <a
                href={university.arrival_info_url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-label-caps text-label-caps px-6 py-3 rounded-full border border-outline-variant text-on-surface-variant hover:bg-surface-container transition-all active:scale-95"
              >
                {t("arrivalInfoLink")}
              </a>
            )}
          </div>
        </section>
      </main>
      </AppShell>
    </Suspense>
  );
}

function formatMoney(amount: number, currency: string, uiLocale: string): string {
  return new Intl.NumberFormat(uiLocale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}