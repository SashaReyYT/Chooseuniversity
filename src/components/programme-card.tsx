import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { toggleSaveAction } from "@/lib/favourites/toggle-save-action";
import { toggleCompareAction } from "@/lib/compare/toggle-compare-action";
import type { MatchResult } from "@/lib/matching/engine";
import type { ProgrammeWithDetails } from "@/lib/repositories/programmes.repository";
import {
  BEST_FOR_KEYS,
  DIMENSION_KEYS,
  formatTuition,
  LABEL_KEYS,
  renderMatchMessage,
  type DiscoverTranslator,
} from "@/components/match-display";
import { determineBestForLabel } from "@/lib/matching/best-for";
import type { MatchUserProfile } from "@/lib/matching/match-types";
import { getDimensionExplanation } from "@/lib/matching/explanations";

interface ProgrammeCardProps {
  programme: ProgrammeWithDetails;
  /** Null when browsing without a profile — the card degrades gracefully rather than requiring a match to render at all. */
  match: MatchResult | null;
  profile: MatchUserProfile | null;
  isSaved: boolean;
  isInComparison: boolean;
  t: DiscoverTranslator;
  /** Name given to a user's comparison set if this action has to create one — see `toggleCompareAction`. */
  defaultComparisonName: string;
}

/**
 * Applies the product spec's core visual hierarchy (§32), in order:
 *
 *  1. Match badge — score + label (§33), the largest element on the card,
 *     plus the contextual "Best For" label when one applies (§34).
 *  2. University name → Programme name → City, Country.
 *  3. Compact metrics — Academic, Budget, Admission, followed by a
 *     deliberately quieter facts line (tuition · duration · language).
 *  4. Why it matches you — the strongest reasons (up to 3).
 *  5. One thing to know — the top concern highlighted.
 *  6. Actions — View Full Details, Save, Compare.
 *  7. Detailed information — collapsed by default.
 *
 * Not every element is equally visually dominant on purpose: the user
 * should know whether a programme fits them within a few seconds.
 */
export async function ProgrammeCard({
  programme,
  match,
  profile,
  isSaved,
  isInComparison,
  t,
  defaultComparisonName,
}: ProgrammeCardProps) {
  const locale = await getLocale();
  const tMatching = match ? await getTranslations("Matching") : null;

  // §32 shows the "Why it matches you" list up front (the design example
  // has three entries); anything beyond that moves to the collapsed
  // details section so the card stays scannable.
  const visibleReasons = match?.reasons.slice(0, 3) ?? [];
  const restReasons = match?.reasons.slice(3) ?? [];
  const [topConcern, ...restConcerns] = match?.concerns ?? [];
  const hasMoreDetails = restReasons.length > 0 || restConcerns.length > 0;

  const bestForLabel = match ? determineBestForLabel(match, profile) : null;

  // Compact metrics: Academic, Budget, Admission - now with human-readable explanations
  const compactMetrics = match?.dimensions
    .filter((d) => ["academic", "budget", "admission"].includes(d.key))
    .filter((d) => d.applicable && d.score != null)
    .map((dim) => ({
      ...dim,
      explanation: getDimensionExplanation(dim, tMatching),
    })) ?? [];

  return (
    <article className="bg-surface-container-lowest border border-outline-variant/40 rounded-lg p-6 md:p-8 ambient-shadow space-y-5">
      {/* 1. Match badge */}
      {match?.overallScore != null ? (
        <div className="flex items-center gap-4 flex-wrap">
          <p className="font-display-xl text-display-xl text-primary leading-none">
            {match.overallScore}%
          </p>
          {match.overallLabel && (
            <p className="font-headline-sm text-headline-sm text-on-surface-variant">
              {t(LABEL_KEYS[match.overallLabel])}
            </p>
          )}
          {/* Best For label */}
          {bestForLabel && (
            <span className="font-label-caps text-label-caps text-success border border-success/40 rounded-full px-3 py-1">
              {t(BEST_FOR_KEYS[bestForLabel])}
            </span>
          )}
        </div>
      ) : (
        <p className="font-body-sm text-body-sm text-on-surface-variant italic">
          {t("noScoreHint")}
        </p>
      )}

      {/* 2. University name, Programme name, City, Country */}
      <div className="space-y-1">
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          {programme.university.name}
        </p>
        <h2 className="font-headline-sm text-headline-sm text-primary">
          <Link href={`programmes/${programme.id}`} className="hover:underline">
            {programme.name}
          </Link>
        </h2>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          {programme.university.city}
          {programme.university.country?.name ? `, ${programme.university.country.name}` : ""}
        </p>
      </div>

      {/* 3. Compact metrics — Academic, Budget, Admission with human-readable summaries */}
      {compactMetrics.length > 0 && (
        <div className="flex flex-wrap gap-4">
          {compactMetrics.map((dim) => (
            <div key={dim.key} className="flex items-center gap-2">
              <span className={`font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wide ${
                dim.explanation.icon === "success" ? "text-success" :
                dim.explanation.icon === "warning" ? "text-warning" : "text-info"
              }`}>
                {t(DIMENSION_KEYS[dim.key])}
              </span>
              <span className="font-data-lg text-data-lg text-primary">
                {dim.score}%
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant hidden sm:inline">
                — {dim.explanation.summary}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Key facts — visible but deliberately quieter than the metrics above */}
      <p className="font-body-sm text-body-sm text-on-surface-variant">
        {formatTuition(programme, locale, t)} · {programme.duration_months}{" "}
        {t("months")} · {programme.language.name}
      </p>

      {/* 4. Why it matches you — strongest reasons first (§32) */}
      {visibleReasons.length > 0 && tMatching && (
        <div className="space-y-1">
          <p className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wide">
            {t("whyItMatches")}
          </p>
          <ul className="space-y-1">
            {visibleReasons.map((reason, index) => (
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

      {/* 5. One thing to know — top concern */}
      {topConcern && tMatching && (
        <div className="space-y-1">
          <p className="font-label-caps text-label-caps text-on-surface-variant">
            {t("oneThingToKnow")}
          </p>
          <p className="font-body-sm text-body-sm text-warning flex items-start gap-2">
            <span aria-hidden="true">⚠</span>
            <span>{renderMatchMessage(topConcern, tMatching)}</span>
          </p>
        </div>
      )}

      {/* 6. Actions */}
      <div className="flex flex-wrap gap-3 pt-2 border-t border-outline-variant/20">
        <Link
          href={`programmes/${programme.id}`}
          className="font-label-caps text-label-caps text-primary border border-primary rounded-full px-6 py-3 hover:bg-surface-container transition-all active:scale-95"
        >
          {t("viewDetails")}
        </Link>
        <form action={toggleSaveAction} className="inline-block">
          <input type="hidden" name="programmeId" value={programme.id} />
          <input type="hidden" name="isSaved" value={String(isSaved)} />
          <button
            type="submit"
            aria-label={isSaved ? t("unsave") : t("save")}
            className={`font-label-caps text-label-caps px-4 py-3 rounded-full border transition-all active:scale-95 flex items-center gap-2 ${
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
            {isSaved ? t("unsave") : t("save")}
          </button>
        </form>
        <form action={toggleCompareAction} className="inline-block">
          <input type="hidden" name="programmeId" value={programme.id} />
          <input type="hidden" name="isInComparison" value={String(isInComparison)} />
          <input type="hidden" name="defaultComparisonName" value={defaultComparisonName} />
          <button
            type="submit"
            className={`font-label-caps text-label-caps px-6 py-3 rounded-full border transition-all active:scale-95 ${
              isInComparison
                ? "bg-secondary-container text-on-secondary-container border-secondary-container"
                : "bg-transparent text-primary border-primary hover:bg-surface-container"
            }`}
          >
            {isInComparison ? t("uncompare") : t("compare")}
          </button>
        </form>
      </div>

      {/* 7. Detailed information — collapsed by default */}
      {(hasMoreDetails || (match && match.dimensions.length > 0)) && (
        <details className="group pt-1">
          <summary className="cursor-pointer font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wide list-none inline-flex items-center gap-1">
            {t("showDetails")}
            <span
              className="transition-transform group-open:rotate-180"
              aria-hidden="true"
            >
              ▾
            </span>
          </summary>

          <div className="mt-4 space-y-4">
            {match && match.dimensions.length > 0 && (
              <>
                <div className="space-y-3">
                  <p className="font-label-caps text-label-caps text-on-surface-variant">
                    {t("matchBreakdown" as any)}
                  </p>
                  <div className="space-y-2">
                    {match.dimensions
                      .filter((d) => d.applicable && d.score != null)
                      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
                      .map((dimension) => {
                        const explanation = getDimensionExplanation(dimension, tMatching);
                        return (
                          <div key={dimension.key} className="rounded-lg border border-outline-variant/40 bg-surface-container-low p-4 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className={`material-symbols-outlined ${
                                  explanation.icon === "success" ? "text-success" :
                                  explanation.icon === "warning" ? "text-warning" : "text-info"
                                }`} aria-hidden="true">
                                  {explanation.icon === "success" ? "check_circle" :
                                   explanation.icon === "warning" ? "warning" : "info"}
                                </span>
                                <span className="font-headline-sm text-headline-sm text-primary">
                                  {explanation.label}
                                </span>
                              </div>
                              <span className="font-data-lg text-data-lg text-primary">
                                {dimension.score}%
                              </span>
                            </div>
                            <p className="font-body-sm text-body-sm text-on-surface-variant">
                              {explanation.summary}
                            </p>
                            {explanation.details.length > 0 && (
                              <ul className="space-y-1 ml-6">
                                {explanation.details.slice(0, 3).map((detail, idx) => (
                                  <li key={idx} className="font-body-sm text-body-sm text-on-surface-variant flex items-start gap-2">
                                    <span className="shrink-0" aria-hidden="true">•</span>
                                    <span>{detail}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>
              </>
            )}

            {restReasons.length > 0 && tMatching && (
              <div className="space-y-1">
                <p className="font-label-caps text-label-caps text-on-surface-variant">
                  {t("whyItMatches")}
                </p>
                <ul className="space-y-1">
                  {restReasons.map((reason, index) => (
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

            {restConcerns.length > 0 && tMatching && (
              <div className="space-y-1">
                <p className="font-label-caps text-label-caps text-on-surface-variant">
                  {t("potentialConcerns")}
                </p>
                <ul className="space-y-1">
                  {restConcerns.map((concern, index) => (
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
          </div>
        </details>
      )}
    </article>
  );
}