import { hasLocale } from "next-intl";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Link, redirect } from "@/i18n/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ProfileService } from "@/lib/services/profile.service";
import { MatchingService } from "@/lib/services/matching.service";
import { FavouritesService } from "@/lib/services/favourites.service";
import { ComparisonService } from "@/lib/services/comparison.service";
import {
  ProgrammesRepository,
  type ProgrammeWithDetails,
} from "@/lib/repositories/programmes.repository";
import { toggleSaveAction } from "@/lib/favourites/toggle-save-action";
import { toggleCompareAction } from "@/lib/compare/toggle-compare-action";
import { UserTestScoresRepository } from "@/lib/repositories/user-test-scores.repository";
import { UserNmtScoresRepository } from "@/lib/repositories/user-nmt-scores.repository";
import {
  compareProfileVsRequirements,
  type ProfileVsRequirementRow,
  type VsStatus,
} from "@/lib/matching/profile-vs-requirements";
import type { MatchResult } from "@/lib/matching/engine";
import {
  DIMENSION_KEYS,
  formatTuition,
  LABEL_KEYS,
  renderMatchMessage,
} from "@/components/match-display";
import { annualLivingCost } from "@/lib/matching/utils";
import type { ProgrammeStudyMode, SourceType } from "@/types/database";
import { AppShell } from "@/components/app-shell";
import { Suspense } from "react";
import { ProgrammeSkeleton } from "@/components/skeleton-wrappers";

/** Compile-time checked message keys of the ProgrammeDetails namespace (mirrors DiscoverKey in match-display). */
type ProgrammeDetailsKey = Parameters<
  Awaited<ReturnType<typeof getTranslations<"ProgrammeDetails">>>
>[0];

const STUDY_MODE_KEYS: Record<ProgrammeStudyMode, ProgrammeDetailsKey> = {
  full_time: "studyModeFullTime",
  part_time: "studyModePartTime",
  distance: "studyModeDistance",
  online: "studyModeOnline",
  hybrid: "studyModeHybrid",
};

const SOURCE_TYPE_KEYS: Record<SourceType, ProgrammeDetailsKey> = {
  official_university: "sourceOfficialUniversity",
  official_faculty: "sourceOfficialFaculty",
  official_dormitory: "sourceOfficialDormitory",
  public_reference: "sourcePublicReference",
};

const VS_STATUS_STYLES: Record<
  VsStatus,
  { icon: string; iconClass: string; labelKey: ProgrammeDetailsKey }
> = {
  meets: { icon: "✓", iconClass: "text-success", labelKey: "vsMeets" },
  fails: { icon: "✕", iconClass: "text-error", labelKey: "vsFails" },
  check: { icon: "⚠", iconClass: "text-warning", labelKey: "vsCheckDetails" },
  unknown: { icon: "—", iconClass: "text-neutral-variant", labelKey: "vsNoData" },
};

const VS_ROW_LABEL_KEYS: Record<
  ProfileVsRequirementRow["key"],
  ProgrammeDetailsKey
> = {
  english: "vsEnglish",
  mathematics: "vsMathematics",
  degree_level: "vsDegreeLevel",
  gpa: "vsGpa",
  entrance_exam: "vsEntranceExam",
};

const COST_CATEGORY_KEYS: {
  field: "accommodation" | "food" | "transport" | "utilities" | "internet_phone" | "study_materials" | "other";
  labelKey: ProgrammeDetailsKey;
}[] = [
  { field: "accommodation", labelKey: "costAccommodation" },
  { field: "food", labelKey: "costFood" },
  { field: "transport", labelKey: "costTransport" },
  { field: "utilities", labelKey: "costUtilities" },
  { field: "internet_phone", labelKey: "costInternetPhone" },
  { field: "study_materials", labelKey: "costStudyMaterials" },
  { field: "other", labelKey: "costOther" },
];

export default async function ProgrammeDetailsPage({
  params,
}: PageProps<"/[locale]/programmes/[id]">) {
  const { locale, id } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  const t = await getTranslations("ProgrammeDetails");
  const tDiscover = await getTranslations("Discover");
  const uiLocale = await getLocale();
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Same defensive fallback as every other page here — src/proxy.ts
    // establishes an anonymous session for every visitor, so this
    // shouldn't happen, but a redirect home is more honest than a bare
    // 404 if it somehow does.
    redirect({ href: "/", locale });
    return;
  }

  const favouritesService = new FavouritesService(supabase);
  const comparisonService = new ComparisonService(supabase);

  const [profile, isSaved, comparisons] = await Promise.all([
    new ProfileService(supabase).getForUser(user.id),
    favouritesService.isSaved(user.id, id),
    comparisonService.listForUser(user.id),
  ]);

  // With a profile, reuse MatchingService's own programme fetch instead
  // of also querying ProgrammesRepository directly — it already returns
  // the hydrated programme alongside the match, so this avoids a second
  // identical query for the common (profile exists) case.
  let programme: ProgrammeWithDetails;
  let match: MatchResult | null = null;
  let vsRows: ProfileVsRequirementRow[] | null = null;

  if (profile) {
    const [ranked, testScores, nmtScores] = await Promise.all([
      new MatchingService(supabase).getMatchForProgramme(user.id, id),
      new UserTestScoresRepository(supabase).listByUserId(user.id),
      new UserNmtScoresRepository(supabase).listByUserId(user.id),
    ]);
    if (!ranked) notFound();
    programme = ranked.programme;
    match = ranked.match;
    vsRows = compareProfileVsRequirements(
      {
        profile: {
          current_education_level: profile.current_education_level,
          current_gpa: profile.current_gpa,
          current_gpa_scale: profile.current_gpa_scale,
          english_level: profile.english_level,
          math_background: profile.math_background,
        },
        testScores: testScores.map((s) => ({
          test_type: s.test_type,
          qualification_id: s.qualification_id,
          score: s.score,
          score_display: s.score_display ?? `${s.test_type} ${s.score}`,
          cefr_equivalent: s.cefr_equivalent,
        })),
        nmtScores: nmtScores.map((s) => ({
          subject_code: s.subject_code,
          score: s.score,
          max_score: s.max_score,
        })),
      },
      programme,
    );
  } else {
    const found = await new ProgrammesRepository(supabase).findById(id);
    if (!found) notFound();
    programme = found;
  }

  const isInComparison =
    comparisons[0]?.programmes.some((p) => p.id === programme.id) ?? false;
  const defaultComparisonName = tDiscover("heading");
  const tMatching = match ? await getTranslations("Matching") : null;

  const dateFormatter = new Intl.DateTimeFormat(uiLocale, { dateStyle: "long" });

  const allSources = [
    ...programme.sources,
    ...(programme.university.sources ?? []),
  ];

  const rankingEntries =
    programme.university.ranking_data &&
    typeof programme.university.ranking_data === "object" &&
    !Array.isArray(programme.university.ranking_data)
      ? Object.entries(programme.university.ranking_data)
      : [];

  return (
    <Suspense fallback={<ProgrammeSkeleton />}>
      <AppShell>
        <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-16 space-y-10">
      <Link
        href="/discover"
        className="font-label-caps text-label-caps text-primary underline"
      >
        ← {t("backToDiscover")}
      </Link>

<div className="space-y-8">
          {/* Match + heading */}
          <div className="space-y-3">
            {match?.overallScore != null ? (
              <div className="flex items-center gap-4">
                <p className="font-display-xl text-display-xl text-primary leading-none">
                  {match.overallScore}%
                </p>
                {match.overallLabel && (
                  <p className="font-headline-sm text-headline-sm text-on-surface-variant">
                    {tDiscover(LABEL_KEYS[match.overallLabel])}
                  </p>
                )}
              </div>
            ) : (
              <p className="font-body-sm text-body-sm text-on-surface-variant italic">
                {tDiscover("noScoreHint")}
              </p>
            )}

            <h1 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-primary">
              {programme.name}
            </h1>
            {programme.degree_title && (
              <p className="font-label-caps text-label-caps text-secondary">
                {programme.degree_title}
              </p>
            )}
            <p className="font-body-md text-body-md text-on-surface-variant">
              {programme.university.name} · {programme.university.city},{" "}
              {programme.university.country.name}
            </p>
          </div>

          {/* Can I get in? — Admission outlook */}
          {match && (
            <section className="rounded-xl border border-outline-variant/40 bg-surface-container-low p-6 space-y-4">
              <h2 className="font-headline-sm text-headline-sm text-primary flex items-center gap-2">
                <span className="material-symbols-outlined" aria-hidden="true">how_to_reg</span>
                {t("admissionOutlook")}
              </h2>
              <AdmissionOutlook t={t} profile={profile} programme={programme} />
            </section>
          )}

          {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <form action={toggleSaveAction}>
            <input type="hidden" name="programmeId" value={programme.id} />
            <input type="hidden" name="isSaved" value={String(isSaved)} />
            <button
              type="submit"
              className={`font-label-caps text-label-caps px-6 py-3 rounded-full border transition-all active:scale-95 flex items-center gap-2 ${
                isSaved
                  ? "bg-primary text-on-primary border-primary"
                  : "bg-transparent text-primary border-primary hover:bg-surface-container"
              }`}
            >
              {/* Bookmark icon — outline when unsaved, filled when saved */}
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill={isSaved ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
              {isSaved ? tDiscover("unsave") : tDiscover("save")}
            </button>
          </form>
          <form action={toggleCompareAction}>
            <input type="hidden" name="programmeId" value={programme.id} />
            <input
              type="hidden"
              name="isInComparison"
              value={String(isInComparison)}
            />
            <input
              type="hidden"
              name="defaultComparisonName"
              value={defaultComparisonName}
            />
            <input type="hidden" name="locale" value={locale} />
            <button
              type="submit"
              className={`font-label-caps text-label-caps px-6 py-3 rounded-full border transition-all active:scale-95 ${
                isInComparison
                  ? "bg-secondary-container text-on-secondary-container border-secondary-container"
                  : "bg-transparent text-primary border-primary hover:bg-surface-container"
              }`}
            >
              {isInComparison ? tDiscover("uncompare") : tDiscover("compare")}
            </button>
          </form>
          {programme.programme_url && (
            <a
              href={programme.programme_url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-label-caps text-label-caps px-6 py-3 rounded-full border border-outline-variant text-on-surface-variant hover:bg-surface-container transition-all active:scale-95"
            >
              {t("visitProgrammePage")}
            </a>
          )}
        </div>

        {/* Key facts */}
        <section className="space-y-4">
          <h2 className="font-headline-sm text-headline-sm text-primary">
            {t("keyFacts")}
          </h2>
          <dl className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <Fact
              label={t("factDegreeLevel")}
              value={programme.degree_level}
            />
            {programme.faculty && (
              <Fact label={t("factFaculty")} value={programme.faculty.name} />
            )}
            {programme.study_mode && (
              <Fact
                label={t("factStudyMode")}
                value={t(STUDY_MODE_KEYS[programme.study_mode])}
              />
            )}
            <Fact
              label={t("factFieldOfStudy")}
              value={programme.field_of_study.name}
            />
            <Fact label={t("factLanguage")} value={programme.language.name} />
            <Fact
              label={t("factDuration")}
              value={`${programme.duration_months} ${tDiscover("months")}`}
            />
            <Fact
              label={t("factTuition")}
              value={formatTuition(programme, uiLocale, tDiscover)}
            />
            <Fact
              label={t("factApplicationFee")}
              value={
                programme.application_fee_amount != null &&
                programme.application_fee_currency
                  ? new Intl.NumberFormat(uiLocale, {
                      style: "currency",
                      currency: programme.application_fee_currency,
                      maximumFractionDigits: 0,
                    }).format(programme.application_fee_amount)
                  : t("notSpecified")
              }
            />
            {programme.estimated_living_cost_monthly != null &&
              programme.living_cost_currency && (
                <Fact
                  label={t("factLivingCost")}
                  value={`${new Intl.NumberFormat(uiLocale, {
                    style: "currency",
                    currency: programme.living_cost_currency,
                    maximumFractionDigits: 0,
                  }).format(programme.estimated_living_cost_monthly)} / ${tDiscover("months")}`}
                />
              )}
            {programme.estimated_living_cost_monthly != null &&
              programme.living_cost_currency &&
              programme.living_cost_currency === programme.tuition_currency &&
              programme.tuition_min != null && (
                <Fact
                  label={t("factEstimatedTotalCost")}
                  value={(() => {
                    const living = annualLivingCost(programme);
                    const min = programme.tuition_min! + living;
                    const max = programme.tuition_max! + living;
                    const money = (amount: number) =>
                      new Intl.NumberFormat(uiLocale, {
                        style: "currency",
                        currency: programme.tuition_currency!,
                        maximumFractionDigits: 0,
                      }).format(amount);
                    return max > min
                      ? `${money(min)}–${money(max)}`
                      : money(min);
                  })()}
                />
              )}
            <Fact
              label={t("factApplicationDeadline")}
              value={
                programme.application_deadline
                  ? dateFormatter.format(new Date(programme.application_deadline))
                  : t("notSpecified")
              }
            />
            <Fact
              label={t("factIntakeStart")}
              value={
                programme.intake_start
                  ? dateFormatter.format(new Date(programme.intake_start))
                  : t("notSpecified")
              }
            />
          </dl>
        </section>

        {/* Consolidated Estimated Yearly Cost */}
        {(() => {
          const tuitionMin = programme.tuition_min ?? 0;
          const tuitionMax = programme.tuition_max ?? 0;
          const livingMonthly = programme.estimated_living_cost_monthly ?? 0;
          const accommodationMonthlyMin = programme.accommodation?.estimated_monthly_cost_min ?? 0;
          const accommodationMonthlyMax = programme.accommodation?.estimated_monthly_cost_max ?? accommodationMonthlyMin;
          const applicationFee = programme.application_fee_amount ?? 0;
          const currency = programme.tuition_currency ?? programme.living_cost_currency ?? "EUR";

          const hasCostData = tuitionMin > 0 || livingMonthly > 0 || accommodationMonthlyMin > 0 || applicationFee > 0;
          if (!hasCostData) return null;

          const annualLiving = livingMonthly * 12;
          const annualAccommodationMin = accommodationMonthlyMin * 12;
          const annualAccommodationMax = accommodationMonthlyMax * 12;

          const totalMin = tuitionMin + annualLiving + annualAccommodationMin + applicationFee;
          const totalMax = tuitionMax + annualLiving + annualAccommodationMax + applicationFee;

          const money = (amount: number) =>
            new Intl.NumberFormat(uiLocale, {
              style: "currency",
              currency,
              maximumFractionDigits: 0,
            }).format(amount);

          return (
            <section className="rounded-xl border border-primary/40 bg-primary-fixed/10 p-6 space-y-4" aria-labelledby="yearly-cost-heading">
              <h2 id="yearly-cost-heading" className="font-headline-sm text-headline-sm text-primary flex items-center gap-2">
                <span className="material-symbols-outlined" aria-hidden="true">account_balance_wallet</span>
                {t("estimatedYearlyCost")}
              </h2>
              <dl className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <dt className="font-label-caps text-label-caps text-on-surface-variant">{t("costTuition")}</dt>
                  <dd className="font-data-lg text-data-lg text-primary">
                    {tuitionMin > 0 ? (tuitionMax > tuitionMin ? `${money(tuitionMin)}–${money(tuitionMax)}` : money(tuitionMin)) : t("notSpecified")}
                  </dd>
                </div>
                <div className="space-y-1">
                  <dt className="font-label-caps text-label-caps text-on-surface-variant">{t("costLiving")}</dt>
                  <dd className="font-data-lg text-data-lg text-primary">
                    {livingMonthly > 0 ? money(annualLiving) : t("notSpecified")}
                  </dd>
                </div>
                <div className="space-y-1">
                  <dt className="font-label-caps text-label-caps text-on-surface-variant">{t("costAccommodation")}</dt>
                  <dd className="font-data-lg text-data-lg text-primary">
                    {accommodationMonthlyMin > 0 ? (annualAccommodationMax > annualAccommodationMin ? `${money(annualAccommodationMin)}–${money(annualAccommodationMax)}` : money(annualAccommodationMin)) : t("notSpecified")}
                  </dd>
                </div>
                <div className="space-y-1">
                  <dt className="font-label-caps text-label-caps text-on-surface-variant">{t("costApplicationFee")}</dt>
                  <dd className="font-data-lg text-data-lg text-primary">
                    {applicationFee > 0 ? money(applicationFee) : t("notSpecified")}
                  </dd>
                </div>
              </dl>
              <div className="pt-4 border-t border-primary/20 flex items-center justify-between">
                <p className="font-headline-md text-headline-md text-primary">
                  {t("costTotalYearly")}
                </p>
                <p className="font-display-md text-display-md text-primary">
                  {totalMax > totalMin ? `${money(totalMin)}–${money(totalMax)}` : money(totalMin)}
                </p>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                {t("costEstimateDisclaimer")}
              </p>
            </section>
          );
        })()}

        {/* What you should know — prominent concerns */}
        {match && match.concerns.length > 0 && (
          <section className="rounded-xl border border-warning/40 bg-warning-fixed/10 p-6 space-y-4" aria-labelledby="what-you-should-know-heading">
            <h2 id="what-you-should-know-heading" className="font-headline-sm text-headline-sm text-warning flex items-center gap-2">
              <span className="material-symbols-outlined" aria-hidden="true">priority_high</span>
              {t("whatYouShouldKnow")}
            </h2>
            <ul className="space-y-2">
              {match.concerns.slice(0, 3).map((concern, index) => (
                <li key={index} className="font-body-sm text-body-sm text-on-surface flex items-start gap-2">
                  <span className="shrink-0 text-warning" aria-hidden="true">⚠</span>
                  <span>{tMatching && renderMatchMessage(concern, tMatching)}</span>
                </li>
              ))}
            </ul>
            {match.concerns.length > 3 && (
              <details className="group">
                <summary className="cursor-pointer font-label-caps text-label-caps text-warning underline list-none inline-flex items-center gap-1">
                  {t("showMoreConcerns", { count: match.concerns.length - 3 })}
                  <span className="transition-transform group-open:rotate-180" aria-hidden="true">▾</span>
                </summary>
                <ul className="mt-2 space-y-2">
                  {match.concerns.slice(3).map((concern, index) => (
                    <li key={index} className="font-body-sm text-body-sm text-on-surface flex items-start gap-2">
                      <span className="shrink-0 text-warning" aria-hidden="true">⚠</span>
                      <span>{tMatching && renderMatchMessage(concern, tMatching)}</span>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </section>
        )}

        {/* Data confidence & freshness indicator */}
        {match && (
          <section className="rounded-lg border border-outline-variant/40 bg-surface-container-low p-4" aria-labelledby="data-confidence-heading">
            <h3 id="data-confidence-heading" className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wide flex items-center gap-2">
              <span className="material-symbols-outlined" aria-hidden="true">verified</span>
              {t("dataConfidence")}
            </h3>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm">
              <span className="flex items-center gap-1">
                <span className={`inline-block w-2 h-2 rounded-full ${
                  match.confidence === "high" ? "bg-success" : match.confidence === "medium" ? "bg-warning" : "bg-error"
                }`} aria-hidden="true"></span>
                {t(match.confidence === "high" ? "confidenceHigh" : match.confidence === "medium" ? "confidenceMedium" : "confidenceLow")}
              </span>
              {programme.tuition_updated_at && (
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs" aria-hidden="true">calendar_today</span>
                  {t("tuitionVerified", { date: new Intl.DateTimeFormat(uiLocale, { dateStyle: "medium" }).format(new Date(programme.tuition_updated_at)) })}
                </span>
              )}
              {programme.requirements_updated_at && (
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs" aria-hidden="true">calendar_today</span>
                  {t("requirementsVerified", { date: new Intl.DateTimeFormat(uiLocale, { dateStyle: "medium" }).format(new Date(programme.requirements_updated_at)) })}
                </span>
              )}
            </div>
          </section>
        )}

        {/* About this programme */}
        {programme.description && (
          <section className="space-y-2">
            <h2 className="font-headline-sm text-headline-sm text-primary">
              {t("aboutProgramme")}
            </h2>
            <p className="font-body-md text-body-md text-on-surface whitespace-pre-line">
              {programme.description}
            </p>
          </section>
        )}

        {/* Academic requirements */}
        <section className="space-y-2">
          <h2 className="font-headline-sm text-headline-sm text-primary">
            {t("academicRequirements")}
          </h2>
          <ul className="space-y-1 font-body-sm text-body-sm text-on-surface">
            <li>
              {programme.academic_requirements?.min_gpa != null &&
              programme.academic_requirements.gpa_scale != null
                ? t("minGpa", {
                    gpa: programme.academic_requirements.min_gpa,
                    scale: programme.academic_requirements.gpa_scale,
                  })
                : t("gpaNotSpecified")}
            </li>
            {programme.academic_requirements?.required_subjects &&
              programme.academic_requirements.required_subjects.length > 0 && (
                <li>
                  {t("requiredSubjects", {
                    subjects:
                      programme.academic_requirements.required_subjects.join(
                        ", ",
                      ),
                  })}
                </li>
              )}
            <li>
              {programme.academic_requirements?.entrance_exam_required
                ? t("entranceExamRequired")
                : t("entranceExamNotRequired")}
            </li>
            {programme.academic_requirements?.entrance_exam_notes && (
              <li>{programme.academic_requirements.entrance_exam_notes}</li>
            )}
            {programme.academic_requirements?.notes && (
              <li>{programme.academic_requirements.notes}</li>
            )}
          </ul>
        </section>

        {/* Test requirements (language + academic qualifications, §50) */}
        <section className="space-y-2">
          <h2 className="font-headline-sm text-headline-sm text-primary">
            {t("languageRequirements")}
          </h2>
          {programme.test_requirements.length > 0 ? (
            <ul className="space-y-1 font-body-sm text-body-sm text-on-surface">
              {programme.test_requirements.map((req) => (
                <li key={req.id}>
                  {req.qualification.name}:{" "}
                  {req.minimum_score_display ?? req.minimum_score}
                  {req.notes ? ` — ${req.notes}` : ""}
                </li>
              ))}
            </ul>
          ) : (
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              {t("noLanguageRequirements")}
            </p>
          )}
        </section>

        {/* Tuition by option (§49) */}
        {programme.tuition_variants.length > 0 && (
          <section className="space-y-2">
            <h2 className="font-headline-sm text-headline-sm text-primary">
              {t("tuitionByOption")}
            </h2>
            <ul className="space-y-2">
              {programme.tuition_variants.map((variant) => {
                const money = (amount: number) =>
                  new Intl.NumberFormat(uiLocale, {
                    style: "currency",
                    currency: variant.currency,
                    maximumFractionDigits: 0,
                  }).format(amount);
                const periodKey =
                  variant.period === "per_semester"
                    ? "perSemester"
                    : variant.period === "total"
                      ? "total"
                      : "perYear";
                return (
                  <li
                    key={variant.id}
                    className="rounded-lg border border-outline-variant bg-surface-container-low p-4"
                  >
                    <p className="font-headline-sm text-headline-sm text-primary">
                      {variant.name}
                    </p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      {variant.tuition_max > variant.tuition_min
                        ? `${money(variant.tuition_min)}–${money(variant.tuition_max)}`
                        : money(variant.tuition_min)}{" "}
                      {tDiscover(periodKey)}
                      {variant.notes ? ` — ${variant.notes}` : ""}
                    </p>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* Your profile vs requirements (§39) */}
        {vsRows && (
          <section className="space-y-4">
            <h2 className="font-headline-sm text-headline-sm text-primary">
              {t("profileVsRequirements")}
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wide">
                    <th className="py-2 pr-4 font-normal">{t("vsRequirement")}</th>
                    <th className="py-2 pr-4 font-normal">{t("vsYou")}</th>
                    <th className="py-2 pr-4 font-normal">{t("vsStatus")}</th>
                  </tr>
                </thead>
                <tbody>
                  {vsRows.map((row) => {
                    const style = VS_STATUS_STYLES[row.status];
                    const needsProfileData =
                      row.you === null && row.key !== "entrance_exam";
                    return (
                      <tr
                        key={row.key}
                        className="border-t border-outline-variant/40 align-top"
                      >
                        <td className="py-3 pr-4">
                          <p className="font-body-sm text-body-sm text-on-surface">
                            {t(VS_ROW_LABEL_KEYS[row.key])}
                          </p>
                          {row.requirement && (
                            <p className="font-body-sm text-body-sm text-on-surface-variant">
                              {row.requirement}
                            </p>
                          )}
                        </td>
                        <td className="py-3 pr-4">
                          {row.you ? (
                            <p className="font-body-sm text-body-sm text-on-surface">
                              {row.you}
                            </p>
                          ) : needsProfileData ? (
                            <Link
                              href="/profile"
                              className="font-body-sm text-body-sm text-primary underline"
                            >
                              {t("vsAddProfile")}
                            </Link>
                          ) : (
                            <p className="font-body-sm text-body-sm text-on-surface-variant">
                              —
                            </p>
                          )}
                        </td>
                        <td className="py-3">
                          <p
                            className={`font-body-sm text-body-sm flex items-center gap-2 ${style.iconClass}`}
                          >
                            <span aria-hidden="true">{style.icon}</span>
                            <span>{t(style.labelKey)}</span>
                          </p>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Match breakdown */}
        {match && tMatching && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-headline-sm text-headline-sm text-primary">
                {t("matchBreakdown")}
              </h2>
              <MatchTransparencyHint t={t} />
            </div>

            {match.dimensions.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {match.dimensions.map((dimension) => (
                  <div key={dimension.key} className="space-y-1">
                    <p className="font-label-caps text-label-caps text-on-surface-variant">
                      {tDiscover(DIMENSION_KEYS[dimension.key])}
                    </p>
                    <p
                      className={`font-data-lg text-data-lg ${
                        dimension.applicable
                          ? "text-primary"
                          : "text-on-surface-variant"
                      }`}
                    >
                      {dimension.applicable
                        ? `${dimension.score}%`
                        : tDiscover("notApplicable")}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {match.reasons.length > 0 && (
              <div className="space-y-1">
                <p className="font-label-caps text-label-caps text-on-surface-variant">
                  {tDiscover("whyItMatches")}
                </p>
                <ul className="space-y-1">
                  {match.reasons.map((reason, index) => (
                    <li
                      key={index}
                      className="font-body-sm text-body-sm text-on-surface flex items-start gap-2"
                    >
                      <span className="text-success shrink-0" aria-hidden="true">
                        ✓
                      </span>
                      <span>{renderMatchMessage(reason, tMatching)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {match.concerns.length > 0 && (
              <div className="space-y-1">
                <p className="font-label-caps text-label-caps text-on-surface-variant">
                  {tDiscover("potentialConcerns")}
                </p>
                <ul className="space-y-1">
                  {match.concerns.map((concern, index) => (
                    <li
                      key={index}
                      className="font-body-sm text-body-sm text-warning flex items-start gap-2"
                    >
                      <span className="shrink-0" aria-hidden="true">
                        ⚠
                      </span>
                      <span>{renderMatchMessage(concern, tMatching)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {/* Required documents (§40) */}
        <section className="space-y-2">
          <h2 className="font-headline-sm text-headline-sm text-primary">
            {t("requiredDocuments")}
          </h2>
          {programme.required_documents.length > 0 ? (
            <ul className="list-disc list-inside space-y-1 font-body-sm text-body-sm text-on-surface">
              {programme.required_documents.map((doc) => (
                <li key={doc}>{doc}</li>
              ))}
            </ul>
          ) : (
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              {t("noRequiredDocuments")}
            </p>
          )}
        </section>

        {/* Scholarships (§40) */}
        <section className="space-y-2">
          <h2 className="font-headline-sm text-headline-sm text-primary">
            {t("scholarships")}
          </h2>
          {programme.scholarship_notes ? (
            <p className="font-body-sm text-body-sm text-on-surface whitespace-pre-line">
              {programme.scholarship_notes}
            </p>
          ) : (
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              {t("noScholarshipData")}
            </p>
          )}
        </section>

        {/* Career information (§40) */}
        <section className="space-y-2">
          <h2 className="font-headline-sm text-headline-sm text-primary">
            {t("careerInformation")}
          </h2>
          {programme.career_notes ? (
            <p className="font-body-sm text-body-sm text-on-surface whitespace-pre-line">
              {programme.career_notes}
            </p>
          ) : (
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              {t("noCareerData")}
            </p>
          )}
        </section>

        {/* Accommodation (§40) */}
        <section className="space-y-2">
          <h2 className="font-headline-sm text-headline-sm text-primary">
            {t("accommodation")}
          </h2>
          {programme.accommodation ? (
            <div className="space-y-1 font-body-sm text-body-sm text-on-surface">
              <p
                className={
                  programme.accommodation.dormitory_available
                    ? "text-success"
                    : "text-on-surface-variant"
                }
              >
                {programme.accommodation.dormitory_available
                  ? t("dormitoryAvailable")
                  : t("dormitoryNotAvailable")}
              </p>
              {programme.accommodation.dormitory_name && (
                <p>
                  {programme.accommodation.dormitory_name}
                  {programme.accommodation.room_type
                    ? ` · ${programme.accommodation.room_type}`
                    : ""}
                </p>
              )}
              {programme.accommodation.estimated_monthly_cost_min != null &&
                programme.accommodation.currency && (
                  <p>
                    {t("accommodationCostRange", {
                      min: formatMoney(
                        programme.accommodation.estimated_monthly_cost_min,
                        programme.accommodation.currency,
                        uiLocale,
                      ),
                      max: formatMoney(
                        programme.accommodation.estimated_monthly_cost_max ??
                          programme.accommodation.estimated_monthly_cost_min,
                        programme.accommodation.currency,
                        uiLocale,
                      ),
                    })}{" "}
                    {tDiscover("months")}
                  </p>
                )}
              {programme.accommodation.estimated_deposit != null &&
                programme.accommodation.currency && (
                  <p>
                    {t("accommodationDeposit", {
                      amount: formatMoney(
                        programme.accommodation.estimated_deposit,
                        programme.accommodation.currency,
                        uiLocale,
                      ),
                    })}
                  </p>
                )}
              {programme.accommodation.estimated_capacity != null && (
                <p>
                  {t("accommodationCapacity", {
                    count: programme.accommodation.estimated_capacity,
                  })}
                </p>
              )}
              {programme.accommodation.distance_from_campus_km != null && (
                <p>
                  {t("accommodationDistance", {
                    km: programme.accommodation.distance_from_campus_km,
                  })}
                </p>
              )}
              {programme.accommodation.official_link && (
                <a
                  href={programme.accommodation.official_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-primary underline"
                >
                  {t("accommodationOfficialLink")}
                </a>
              )}
            </div>
          ) : (
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              {t("noAccommodationData")}
            </p>
          )}
        </section>

        {/* Living cost breakdown (§40) */}
        <section className="space-y-2">
          <h2 className="font-headline-sm text-headline-sm text-primary">
            {t("livingCostBreakdown")}
          </h2>
          {programme.living_cost_estimates ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wide">
                    <th className="py-2 pr-4 font-normal">{t("costTotal")}</th>
                    <th className="py-2 pr-4 font-normal text-right">
                      {tDiscover("months")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {COST_CATEGORY_KEYS.map(({ field, labelKey }) => {
                    const min = programme.living_cost_estimates![`${field}_min`];
                    const max = programme.living_cost_estimates![`${field}_max`];
                    if (min == null && max == null) return null;
                    return (
                      <tr
                        key={field}
                        className="border-t border-outline-variant/40"
                      >
                        <td className="py-2 pr-4 font-body-sm text-body-sm text-on-surface">
                          {t(labelKey)}
                        </td>
                        <td className="py-2 font-body-sm text-body-sm text-on-surface text-right whitespace-nowrap">
                          {formatCostRange(
                            min,
                            max,
                            programme.living_cost_estimates!.currency,
                            uiLocale,
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {programme.living_cost_estimates.total_min != null && (
                    <tr className="border-t border-outline-variant">
                      <td className="py-2 pr-4 font-body-sm text-body-sm font-semibold text-on-surface">
                        {t("costTotal")}
                      </td>
                      <td className="py-2 font-body-sm text-body-sm font-semibold text-on-surface text-right whitespace-nowrap">
                        {formatCostRange(
                          programme.living_cost_estimates.total_min,
                          programme.living_cost_estimates.total_max,
                          programme.living_cost_estimates.currency,
                          uiLocale,
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              {t("noLivingCostData")}
            </p>
          )}
        </section>

        {/* Sources (§41) */}
        {allSources.length > 0 && (
          <section className="space-y-2">
            <h2 className="font-headline-sm text-headline-sm text-primary">
              {t("sources")}
            </h2>
            <ul className="space-y-1">
              {allSources.map((link) => (
                <li key={`${link.fact_key}-${link.source.id}`}>
                  <a
                    href={link.source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-body-sm text-body-sm text-primary underline"
                  >
                    {link.source.name || t(SOURCE_TYPE_KEYS[link.source.type])}
                  </a>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    {" "}
                    · {t(SOURCE_TYPE_KEYS[link.source.type])}
                  </span>
                  {link.source.notes && (
                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                      {" "}
                      — {link.source.notes}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* About the university */}
        <section className="space-y-2 pt-4 border-t border-outline-variant/40">
          <h2 className="font-headline-sm text-headline-sm text-primary">
            {t("aboutUniversity")}
          </h2>
          <p className="font-body-md text-body-md text-primary">
            {programme.university.name}
          </p>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            {programme.university.city}, {programme.university.country.name}
            {programme.university.founded_year != null &&
              ` · ${t("founded", { year: programme.university.founded_year })}`}
          </p>
          {programme.university.student_count != null && (
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              {t("studentCount", { count: programme.university.student_count })}
            </p>
          )}
          {programme.university.international_student_percentage != null && (
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              {t("internationalStudents", {
                percent: programme.university.international_student_percentage,
              })}
            </p>
          )}
          {rankingEntries.length > 0 && (
              <div className="space-y-1">
                <p className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wide">
                  {t("ranking")}
                </p>
                <ul className="space-y-1">
                  {rankingEntries.map(([source, rank]) => (
                    <li
                      key={source}
                      className="font-body-sm text-body-sm text-on-surface"
                    >
                      {source.toUpperCase()}: {String(rank)}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {rankingEntries.length === 0 && (
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                {t("rankingUnavailable")}
              </p>
            )}
          {programme.university.description && (
            <p className="font-body-sm text-body-sm text-on-surface whitespace-pre-line">
              {programme.university.description}
            </p>
          )}
          {programme.university.website_url && (
            <a
              href={programme.university.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block font-label-caps text-label-caps text-primary underline"
            >
              {t("visitWebsite")}
            </a>
          )}
          {programme.university.official_application_url && (
            <a
              href={programme.university.official_application_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block font-label-caps text-label-caps text-primary underline ml-4"
            >
              {t("officialApplicationLink")}
            </a>
          )}
        </section>
      </div>

      {/* Next steps */}
      {match && (
        <NextSteps t={t} programme={programme} />
      )}

      </main>
      </AppShell>
    </Suspense>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <dt className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wide">
        {label}
      </dt>
      <dd className="font-body-sm text-body-sm text-on-surface">{value}</dd>
    </div>
  );
}

/** Admission outlook — human-readable "Can I get in?" summary. */
function AdmissionOutlook({
  t,
  profile,
  programme,
}: {
  t: Awaited<ReturnType<typeof getTranslations<"ProgrammeDetails">>>;
  profile: { english_level: string | null; math_background: string | null; current_education_level: string | null; current_gpa: number | null } | null;
  programme: { academic_requirements: { entrance_exam_required: boolean | null; min_gpa: number | null; gpa_scale: number | null } | null; test_requirements: Array<{ qualification: { name: string } }> | null } | null;
}) {
  const checks = [];

  // Education level
  if (profile?.current_education_level) {
    checks.push({
      label: "Education requirement",
      status: "meets" as const,
      detail: t("admissionCheckEducation", { level: profile.current_education_level }),
    });
  }

  // GPA
  if (profile?.current_gpa != null && programme?.academic_requirements?.min_gpa != null) {
    const meets = profile.current_gpa >= programme.academic_requirements.min_gpa!;
    checks.push({
      label: "GPA",
      status: meets ? "meets" : "fails" as const,
      detail: meets
        ? t("admissionCheckGpaMet", { your: profile.current_gpa, required: programme.academic_requirements.min_gpa })
        : t("admissionCheckGpaBelow", { your: profile.current_gpa, required: programme.academic_requirements.min_gpa }),
    });
  } else if (programme?.academic_requirements?.min_gpa != null) {
    checks.push({
      label: "GPA",
      status: "check" as const,
      detail: t("admissionCheckGpaUnknown", { required: programme.academic_requirements.min_gpa }),
    });
  }

  // English level
  if (profile?.english_level) {
    const userLevel = profile.english_level;
    const levelOrder = { a0: 0, a1: 1, a2: 2, b1: 3, b2: 4, c1: 5, c2: 6 };
    const requiredLevel = "b2"; // default assumption
    const userIdx = levelOrder[userLevel as keyof typeof levelOrder] ?? 3;
    const reqIdx = levelOrder[requiredLevel as keyof typeof levelOrder] ?? 3;
    const meets = userIdx >= reqIdx;
    checks.push({
      label: "Language",
      status: meets ? "meets" : "check" as const,
      detail: meets
        ? t("admissionCheckLanguageMet", { level: userLevel.toUpperCase() })
        : t("admissionCheckLanguageBelow", { level: userLevel.toUpperCase(), required: requiredLevel.toUpperCase() }),
    });
  } else if (programme?.test_requirements?.length) {
    checks.push({
      label: "Language",
      status: "check" as const,
      detail: t("admissionCheckLanguageRequired"),
    });
  }

  // Entrance exam
  if (programme?.academic_requirements?.entrance_exam_required) {
    checks.push({
      label: "Entrance exam",
      status: "check" as const,
      detail: t("admissionCheckExamRequired"),
    });
  }

  // Application deadline
  checks.push({
    label: "Application deadline",
    status: "check" as const,
    detail: t("admissionCheckDeadline"),
  });

  // Overall outlook
  const fails = checks.filter((c) => c.status === "fails").length;
  const outlook = fails === 0 ? "Good" : fails === 1 ? "Competitive" : "Challenging";

  return (
    <div className="space-y-3">
      <dl className="space-y-3">
        {checks.map((check, idx) => (
          <div key={idx} className="flex items-start gap-3">
            <span className={`shrink-0 material-symbols-outlined text-base ${
              check.status === "meets" ? "text-success" : check.status === "fails" ? "text-error" : "text-warning"
            }`} aria-hidden="true">
              {check.status === "meets" ? "check_circle" : check.status === "fails" ? "cancel" : "help"}
            </span>
            <div>
              <p className="font-body-sm text-body-sm text-on-surface">
                <span className="font-medium">{check.label}:</span> {check.detail}
              </p>
            </div>
          </div>
        ))}
      </dl>
      <p className="font-label-caps text-label-caps text-primary pt-2 border-t border-outline-variant/40">
        {t("admissionOutlook", { outlook: t(`admissionOutlook${outlook}`) })}
      </p>
    </div>
  );
}

/** Next steps — what to do after choosing this programme. */
function NextSteps({
  t,
  programme,
}: {
  t: Awaited<ReturnType<typeof getTranslations<"ProgrammeDetails">>>;
  programme: ProgrammeWithDetails;
}) {
  const deadline = programme.application_deadline ? new Date(programme.application_deadline) : null;
  const hasDeadline = deadline && deadline > new Date();

  return (
    <section className="rounded-xl border border-outline-variant/40 bg-surface-container-low p-6 space-y-4">
      <h2 className="font-headline-sm text-headline-sm text-primary flex items-center gap-2">
        <span className="material-symbols-outlined" aria-hidden="true">directions</span>
        {t("nextSteps")}
      </h2>
      <ol className="space-y-3">
        <li className="flex items-start gap-3">
          <span className="shrink-0 w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center font-label-caps text-label-caps text-xs">1</span>
          <div>
            <p className="font-body-sm text-body-sm text-on-surface">{t("nextStepCheckEligibility")}</p>
            <p className="font-body-xs text-body-xs text-on-surface-variant">{t("nextStepCheckEligibilityDesc")}</p>
          </div>
        </li>
        <li className="flex items-start gap-3">
          <span className="shrink-0 w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center font-label-caps text-label-caps text-xs">2</span>
          <div>
            <p className="font-body-sm text-body-sm text-on-surface">{t("nextStepLanguageCert")}</p>
            <p className="font-body-xs text-body-xs text-on-surface-variant">{t("nextStepLanguageCertDesc")}</p>
          </div>
        </li>
        <li className="flex items-start gap-3">
          <span className="shrink-0 w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center font-label-caps text-label-caps text-xs">3</span>
          <div>
            <p className="font-body-sm text-body-sm text-on-surface">{t("nextStepPrepareDocs")}</p>
            <p className="font-body-xs text-body-xs text-on-surface-variant">{t("nextStepPrepareDocsDesc")}</p>
          </div>
        </li>
        {hasDeadline && (
          <li className="flex items-start gap-3">
            <span className="shrink-0 w-6 h-6 rounded-full bg-warning text-on-warning flex items-center justify-center font-label-caps text-label-caps text-xs">4</span>
            <div>
              <p className="font-body-sm text-body-sm text-on-surface">{t("nextStepApplyBefore", { date: deadline.toLocaleDateString() })}</p>
              <p className="font-body-xs text-body-xs text-on-surface-variant">{t("nextStepApplyBeforeDesc")}</p>
            </div>
          </li>
        )}
      </ol>
      {(programme.application_url || programme.university.official_application_url) && (
        <a
          href={programme.application_url || programme.university.official_application_url!}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-4 font-label-caps text-label-caps px-6 py-3 rounded-full bg-primary text-on-primary hover:bg-on-primary-fixed-variant transition-all active:scale-95 shadow-md"
        >
          {t("viewOfficialApplication")}
          <span className="material-symbols-outlined" aria-hidden="true">open_in_new</span>
        </a>
      )}
    </section>
  );
}

/** Match transparency hint — "How is this score calculated?" */
function MatchTransparencyHint({ t }: { t: Awaited<ReturnType<typeof getTranslations<"ProgrammeDetails">>> }) {
  return (
    <details className="group rounded-lg border border-outline-variant/40 bg-surface-container-low p-4 space-y-2">
      <summary className="flex items-center gap-2 font-label-caps text-label-caps text-primary cursor-pointer list-none">
        <span className="material-symbols-outlined" aria-hidden="true">info</span>
        {t("howIsScoreCalculated")}
        <span className="material-symbols-outlined ml-auto transition-transform group-open:rotate-180" aria-hidden="true">expand_more</span>
      </summary>
      <div className="pl-9 space-y-1 font-body-sm text-body-sm text-on-surface-variant">
        <p>{t("scoreCalculationExplanation")}</p>
        <ul className="list-disc list-inside space-y-1">
          <li>{t("scoreDimAcademic")}</li>
          <li>{t("scoreDimBudget")}</li>
          <li>{t("scoreDimAdmission")}</li>
          <li>{t("scoreDimLanguage")}</li>
          <li>{t("scoreDimLocation")}</li>
          <li>{t("scoreDimFormat")}</li>
          <li>{t("scoreDimSupport")}</li>
        </ul>
        <p className="pt-2">{t("scoreCalculationNote")}</p>
      </div>
    </details>
  );
}

function formatMoney(
  amount: number,
  currency: string,
  uiLocale: string,
): string {
  return new Intl.NumberFormat(uiLocale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatCostRange(
  min: number | null,
  max: number | null,
  currency: string | null,
  uiLocale: string,
): string {
  if (min == null && max == null) return "—";
  if (min == null || max == null || min === max) {
    return formatMoney(min ?? max!, currency ?? "EUR", uiLocale);
  }
  return `${formatMoney(min, currency ?? "EUR", uiLocale)}–${formatMoney(
    max,
    currency ?? "EUR",
    uiLocale,
  )}`;
}
