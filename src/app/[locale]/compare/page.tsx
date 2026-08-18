import { hasLocale } from "next-intl";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Link, redirect } from "@/i18n/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ComparisonService, type ComparisonWithProgrammes } from "@/lib/services/comparison.service";
import { MatchingService } from "@/lib/services/matching.service";
import { ProfileService } from "@/lib/services/profile.service";
import { toggleCompareAction } from "@/lib/compare/toggle-compare-action";
import {
  createComparisonSetAction,
  deleteComparisonSetAction,
  renameComparisonSetAction,
} from "@/lib/compare/comparison-set-actions";
import type { ProgrammeWithDetails } from "@/lib/repositories/programmes.repository";
import type { MatchResult } from "@/lib/matching/engine";
import type { MatchDimensionKey } from "@/lib/matching/match-types";
import { DIMENSION_KEYS, type DiscoverTranslator } from "@/components/match-display";
import { annualLivingCost } from "@/lib/matching/utils";
import { formDangerButtonClassName, formInputClassName, formSecondaryButtonClassName } from "@/components/form-styles";

export default async function ComparePage({
  params,
  searchParams,
}: PageProps<"/[locale]/compare"> & {
  searchParams?: Promise<Record<string, string | undefined>>;
}) {
  const { locale } = await params;
  const sp = await searchParams;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  const t = await getTranslations("Compare");
  const tDiscover = await getTranslations("Discover");
  const uiLocale = await getLocale();
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Shouldn't happen — src/proxy.ts establishes an anonymous session for
    // every visitor — but if it somehow does (session establishment
    // failed, cookies blocked), send the visitor home rather than a bare
    // 404, which would misleadingly imply the page itself doesn't exist.
    //
    // The extra `return` below is deliberate, not dead code: next-intl's
    // `redirect` is typed to return `never`, but its signature is complex
    // enough (generic/conditional on path params) that TypeScript's
    // control-flow narrowing doesn't reliably pick that up — without this
    // `return`, TS still treats `user` as possibly null afterwards even
    // though this branch always exits at runtime.
    redirect({ href: "/", locale });
    return;
  }

  const comparisons = await new ComparisonService(supabase).listForUser(user.id);
  // Multiple named comparison sets (spec §38, nice-to-have): `?comparisonId=`
  // selects which set is shown. Falls back to the most recently created
  // one — the same set every other page's "add to compare" targets via
  // `getOrCreateDefaultComparison` — so a user who never creates a second
  // set sees exactly the V1 single-comparison behavior.
  const activeComparison: ComparisonWithProgrammes | null =
    comparisons.find((c) => c.id === sp?.comparisonId) ?? comparisons[0] ?? null;
  const programmes = activeComparison?.programmes ?? [];

  // Compute matches when a profile exists — needed for match-score rows
  const matchById = new Map<string, MatchResult>();
  if (programmes.length > 0) {
    const profile = await new ProfileService(supabase).getForUser(user.id);
    if (profile) {
      const matches = await new MatchingService(supabase).listMatchesForUser(user.id);
      for (const ranked of matches) {
        matchById.set(ranked.programme.id, ranked.match);
      }
    }
  }

  const showMaxReachedNotice = sp?.notice === "compare-limit";

  return (
    <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-16 space-y-8">
      <div className="space-y-1">
        <h1 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-primary">
          {t("heading")}
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          {t("description")}
        </p>
      </div>

      {showMaxReachedNotice && (
        <p
          role="status"
          className="font-body-sm text-body-sm text-warning border border-warning/40 rounded-lg px-4 py-3"
        >
          {t("noticeMaxReached")}
        </p>
      )}

      <ComparisonSetSwitcher
        comparisons={comparisons}
        activeComparisonId={activeComparison?.id ?? null}
        locale={locale}
        defaultName={t("heading")}
        t={t}
      />

      {programmes.length === 0 ? (
        <div className="space-y-4">
          <p className="font-body-md text-body-md text-on-surface-variant">
            {t("empty")}
          </p>
          <Link
            href="/discover"
            className="inline-block font-label-caps text-label-caps text-primary underline"
          >
            {t("browseCta")}
          </Link>
        </div>
      ) : (
        <ComparisonTable
          programmes={programmes}
          matchById={matchById}
          locale={uiLocale}
          t={t}
          tDiscover={tDiscover}
        />
      )}
    </main>
  );
}

/**
 * Tabs to switch between named comparison sets, plus inline
 * create/rename/delete forms (spec §38 nice-to-have). Renders nothing
 * beyond the "new set" form when the user has zero comparisons yet —
 * that's still the everyday case (a comparison is normally born from
 * "add to compare" on a card, not from this page).
 */
function ComparisonSetSwitcher({
  comparisons,
  activeComparisonId,
  locale,
  defaultName,
  t,
}: {
  comparisons: ComparisonWithProgrammes[];
  activeComparisonId: string | null;
  locale: string;
  defaultName: string;
  t: Awaited<ReturnType<typeof getTranslations<"Compare">>>;
}) {
  const active = comparisons.find((c) => c.id === activeComparisonId) ?? null;

  return (
    <div className="space-y-4" aria-label={t("manageSetsLabel")}>
      {comparisons.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {comparisons.map((c) => (
            <Link
              key={c.id}
              href={{ pathname: "/compare", query: { comparisonId: c.id } }}
              className={`font-label-caps text-label-caps rounded-full px-4 py-2 border transition-colors ${
                c.id === activeComparisonId
                  ? "bg-primary text-on-primary border-primary"
                  : "border-outline-variant text-on-surface hover:border-primary"
              }`}
            >
              {c.name}
            </Link>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <form action={createComparisonSetAction} className="flex items-center gap-2">
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="defaultName" value={defaultName} />
          <input
            type="text"
            name="name"
            placeholder={t("newSetNamePlaceholder")}
            className={`${formInputClassName} w-56`}
          />
          <button type="submit" className={formSecondaryButtonClassName}>
            {t("newSetCta")}
          </button>
        </form>

        {active && (
          <>
            <form action={renameComparisonSetAction} className="flex items-center gap-2">
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="comparisonId" value={active.id} />
              <input
                type="text"
                name="name"
                defaultValue={active.name}
                placeholder={t("renameSetPlaceholder")}
                className={`${formInputClassName} w-56`}
              />
              <button type="submit" className={formSecondaryButtonClassName}>
                {t("renameSetCta")}
              </button>
            </form>

            <form action={deleteComparisonSetAction}>
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="comparisonId" value={active.id} />
              <button type="submit" className={formDangerButtonClassName}>
                {t("deleteSetCta")}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

interface ComparisonRow {
  label: string;
  render: (p: ProgrammeWithDetails) => string | null;
}

function buildRows(
  t: Awaited<ReturnType<typeof getTranslations<"Compare">>>,
  tDiscover: DiscoverTranslator,
  matchById: Map<string, MatchResult>,
  locale: string,
): ComparisonRow[] {
  const rows: ComparisonRow[] = [];

  const formatMoney = (amount: number, currency: string) =>
    new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);

  // Match Score + category scores — only when profile-based matching is
  // available (§38: comparison includes Match Score and category scores).
  if (matchById.size > 0) {
    rows.push({
      label: t("attrMatchScore"),
      render: (p) => {
        const match = matchById.get(p.id);
        return match?.overallScore != null ? `${match.overallScore}%` : null;
      },
    });

    const dimensionKeys = Object.keys(DIMENSION_KEYS) as MatchDimensionKey[];
    for (const key of dimensionKeys) {
      rows.push({
        label: tDiscover(DIMENSION_KEYS[key]),
        render: (p) => {
          const match = matchById.get(p.id);
          const dim = match?.dimensions.find((d) => d.key === key);
          return dim?.applicable && dim.score != null ? `${dim.score}%` : null;
        },
      });
    }
  }

  rows.push(
    {
      label: t("attrUniversity"),
      render: (p) => `${p.university.name} · ${p.university.city}`,
    },
    { label: t("attrProgramme"), render: (p) => p.name },
    { label: t("attrDegreeLevel"), render: (p) => p.degree_level },
    { label: t("attrFieldOfStudy"), render: (p) => p.field_of_study.name },
    { label: t("attrLanguage"), render: (p) => p.language.name },
    {
      label: t("attrDuration"),
      render: (p) => `${p.duration_months} ${tDiscover("months")}`,
    },
    {
      label: t("attrTuition"),
      render: (p) => {
        const money = (amount: number) => formatMoney(amount, p.tuition_currency);
        const amount =
          p.tuition_max > p.tuition_min
            ? `${money(p.tuition_min)}–${money(p.tuition_max)}`
            : money(p.tuition_min);
        return `${amount} ${tDiscover("perYear")}`;
      },
    },
    {
      label: t("attrApplicationFee"),
      render: (p) =>
        p.application_fee_amount != null && p.application_fee_currency
          ? formatMoney(p.application_fee_amount, p.application_fee_currency)
          : null,
    },
    {
      label: t("attrLivingCost"),
      render: (p) =>
        p.estimated_living_cost_monthly != null && p.living_cost_currency
          ? `${formatMoney(p.estimated_living_cost_monthly, p.living_cost_currency)}/${tDiscover("months")}`
          : null,
    },
    {
      label: t("attrTotalCostYearly"),
      render: (p) =>
        p.estimated_living_cost_monthly != null &&
        p.living_cost_currency === p.tuition_currency
          ? (() => {
              const living = annualLivingCost(p);
              const min = p.tuition_min + living;
              const max = p.tuition_max + living;
              return max > min
                ? `${formatMoney(min, p.tuition_currency)}–${formatMoney(max, p.tuition_currency)}`
                : formatMoney(min, p.tuition_currency);
            })()
          : null,
    },
  );

  // Accommodation row — renders "not specified" when no programme has data
  rows.push({
    label: t("attrAccommodation"),
    render: (p) => {
      const a = p.accommodation;
      if (!a) return null;
      const parts: string[] = [];
      if (a.dormitory_available) parts.push(t("attrDormitoryAvailable"));
      if (a.estimated_monthly_cost_min != null && a.estimated_monthly_cost_max != null)
        parts.push(
          `${formatMoney(a.estimated_monthly_cost_min, a.currency ?? "EUR")}–${formatMoney(a.estimated_monthly_cost_max, a.currency ?? "EUR")}/${tDiscover("months")}`,
        );
      return parts.join(" · ") || null;
    },
  });

  rows.push(
    {
      label: t("attrAdmissionRequirements"),
      render: (p) => {
        const req = p.academic_requirements;
        return [
          req?.min_gpa != null && req.gpa_scale != null
            ? `GPA ${req.min_gpa}/${req.gpa_scale}`
            : null,
          req?.required_subjects?.length ? req.required_subjects.join(", ") : null,
        ]
          .filter(Boolean)
          .join(" · ") || null;
      },
    },
    {
      label: t("attrEnglishRequirements"),
      render: (p) =>
        p.test_requirements.length > 0
          ? p.test_requirements
              .map(
                (r) =>
                  `${r.qualification.name} ${r.minimum_score_display ?? ""}`.trim(),
              )
              .join(" · ")
          : null,
    },
    {
      label: t("attrMathRequirements"),
      render: (p) => p.academic_requirements?.required_math_background ?? null,
    },
    {
      label: t("attrEntranceExam"),
      render: (p) =>
        p.academic_requirements?.entrance_exam_required
          ? (p.academic_requirements.entrance_exam_notes ?? "Required")
          : "Not required",
    },
    {
      label: t("attrDeadline"),
      render: (p) =>
        p.application_deadline
          ? new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(new Date(p.application_deadline))
          : null,
    },
    {
      label: t("attrGpaRequirement"),
      render: (p) =>
        p.academic_requirements?.min_gpa != null && p.academic_requirements.gpa_scale != null
          ? `${p.academic_requirements.min_gpa} / ${p.academic_requirements.gpa_scale}`
          : null,
    },
    {
      label: t("attrAcademicReputation"),
      render: (p) => {
        const ranking = p.university.ranking_data;
        if (!ranking || typeof ranking !== "object" || Object.keys(ranking).length === 0) {
          return null;
        }
        return Object.entries(ranking)
          .map(([org, value]) => `${org.toUpperCase()} #${value}`)
          .join(" · ");
      },
    },
    {
      label: t("attrCareerInfo"),
      render: (p) => p.career_notes ?? null,
    },
    {
      label: t("attrLocation"),
      render: (p) => `${p.university.city}, ${p.university.country.name}`,
    },
    {
      label: t("attrOfficialLinks"),
      render: (p) => {
        const links = [
          p.university.official_application_url,
          p.programme_url,
          p.university.website_url,
        ].filter((u): u is string => Boolean(u));
        return links.length > 0 ? links.join(" · ") : null;
      },
    },
  );

  return rows;
}

function ComparisonTable({
  programmes,
  matchById,
  locale,
  t,
  tDiscover,
}: {
  programmes: ProgrammeWithDetails[];
  matchById: Map<string, MatchResult>;
  locale: string;
  t: Awaited<ReturnType<typeof getTranslations<"Compare">>>;
  tDiscover: DiscoverTranslator;
}) {
  const rows = buildRows(t, tDiscover, matchById, locale);
  const hasDifferences = rows.some((row) => {
    const values = programmes.map((p) => row.render(p)).filter((v) => v !== null);
    return new Set(values).size > 1;
  });

  return (
    <div>
      {hasDifferences && (
        <p className="font-body-sm text-body-sm text-on-surface-variant mb-4">
          {t("differsLegend")}
        </p>
      )}
      <div className="overflow-x-auto -mx-margin-mobile px-margin-mobile md:mx-0 md:px-0">
        <table className="min-w-full border-separate border-spacing-0">
          <thead>
            <tr>
              <th className="text-left align-bottom pb-4 pr-4 min-w-[10rem]" aria-label=" " />
              {programmes.map((programme) => (
                <th
                  key={programme.id}
                  className="text-left align-bottom pb-4 px-4 min-w-[16rem] border-b border-outline-variant/40"
                >
                  <div className="space-y-2">
                    <p className="font-headline-sm text-headline-sm text-primary">
                      <Link href={`/programmes/${programme.id}`} className="hover:underline">
                        {programme.name}
                      </Link>
                    </p>
                    <form action={toggleCompareAction}>
                      <input type="hidden" name="programmeId" value={programme.id} />
                      <input type="hidden" name="isInComparison" value="true" />
                      <button
                        type="submit"
                        className="font-label-caps text-label-caps text-primary border border-primary rounded-full px-4 py-2 hover:bg-surface-container transition-all active:scale-95"
                      >
                        {t("remove")}
                      </button>
                    </form>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const values = programmes.map((p) => row.render(p));
              const uniqueValueCount = new Set(values.filter((v) => v !== null)).size;
              const allSame = uniqueValueCount <= 1;
              return (
                <tr key={row.label}>
                  <th
                    scope="row"
                    className={`sticky left-0 z-10 bg-surface-container-lowest text-left align-top py-4 pr-4 font-label-caps text-label-caps uppercase tracking-wide border-b border-outline-variant/20 whitespace-nowrap ${allSame ? "text-on-surface-variant" : "text-primary"}`}
                  >
                    {row.label}
                  </th>
                  {programmes.map((programme, idx) => {
                    const value = values[idx];
                    return (
                      <td
                        key={programme.id}
                        className={`align-top py-4 px-4 font-body-sm text-body-sm border-b border-outline-variant/20 ${
                          value === null
                            ? "text-on-surface-variant italic"
                            : !allSame
                              ? "text-primary font-semibold"
                              : "text-on-surface"
                        }`}
                      >
                        {value ?? tDiscover("notApplicable")}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}