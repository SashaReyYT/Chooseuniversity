import { checkHardRequirements } from "./hard-requirements";
import { scoreAcademicFit } from "./score-academic";
import { scoreAdmissionFit } from "./score-admission";
import { scoreBudgetFit } from "./score-budget";
import { scoreCareerFit, scoreFormatFit, scoreLifestyleFit } from "./score-extended";
import { scoreLanguageFit } from "./score-language";
import { scoreLocationFit } from "./score-location";
import type {
  MatchDimensionResult,
  MatchResult,
  MatchUserProfile,
  MatchWeights,
  ProgrammeWithDetails,
} from "./match-types";
import { labelForScore } from "./match-types";
import type { MatchMessage } from "./messages";
import type { CurrencyRateTable } from "./currency";
import { roundScore } from "./utils";

/**
 * Computes an explainable Match Score for one (user, programme) pair.
 *
 * Deterministic by design, per the product spec: no AI/LLM in this path,
 * ever. Every number this returns is derived from structured fields on
 * `profile`/`programme`, and every dimension carries the reasons/concerns
 * that justify its score — the overall percentage is never returned on
 * its own. See the individual `score-*.ts` files for each dimension's
 * scoring rules.
 *
 * Reasons/concerns are structured `MatchMessage`s (translation key +
 * params, or raw DB-sourced text), not plain strings — see
 * `messages.ts`. Render them via next-intl at the UI layer; this module
 * has no locale awareness and shouldn't need any.
 *
 * The overall score is a WEIGHTED average of whichever dimensions had
 * enough data to be scored (spec §26–§27). Per-user weights come in via
 * the optional `weights` parameter; dimensions that weren't specified
 * default to weight 1 (equal weighting). Weights are normalized before
 * computing, so absolute scale doesn't matter — only the ratios do.
 *
 * A dimension with `applicable: false` (e.g. "Budget Fit" with no budget
 * set) is excluded rather than penalizing the user for missing profile
 * data. Programme data being incomplete must never produce a false
 * perfect score — this is handled by the per-dimension `UNKNOWN` states
 * (spec §29) and surfaced to the user as "Match based on available
 * programme data" rather than silently scoring 100.
 *
 * Hard requirements (spec §28) don't directly change the weighted score —
 * they gate it. `hardRequirements` reports each gate's PASS/FAIL/UNKNOWN
 * status so the UI can show "Does not meet current admission requirement"
 * without the overall percentage misleadingly staying high.
 *
 * `now` is threaded through to `scoreAdmissionFit` for deterministic
 * deadline-proximity testing — see that module. `currencyRates` is
 * threaded through to `scoreBudgetFit` for cross-currency comparisons
 * (spec §15) — an EUR-based rate table the caller loads via
 * `ReferenceDataRepository.listCurrencyRates()`; omitting it (or a
 * currency missing from it) degrades that dimension to UNKNOWN rather
 * than failing the whole match.
 */
export function computeMatchScore(
  profile: MatchUserProfile,
  programme: ProgrammeWithDetails,
  now: Date = new Date(),
  weights: MatchWeights = {},
  currencyRates: CurrencyRateTable = {},
): MatchResult {
  const dimensions: MatchDimensionResult[] = [
    scoreAcademicFit(profile, programme),
    scoreBudgetFit(profile, programme, currencyRates),
    scoreLanguageFit(profile, programme),
    scoreLocationFit(profile, programme),
    scoreAdmissionFit(programme, now),
    scoreCareerFit(profile, programme),
    scoreFormatFit(profile, programme),
    scoreLifestyleFit(profile, programme),
  ];

  const applicableDimensions = dimensions.filter(
    (d): d is MatchDimensionResult & { score: number } =>
      d.applicable && d.score != null,
  );

  const weightOf = (d: MatchDimensionResult): number => weights[d.key] ?? 1;
  const totalWeight = applicableDimensions.reduce(
    (sum, d) => sum + weightOf(d),
    0,
  );

  const overallScore =
    applicableDimensions.length > 0 && totalWeight > 0
      ? roundScore(
          applicableDimensions.reduce(
            (sum, d) => sum + d.score * weightOf(d),
            0,
          ) / totalWeight,
        )
      : null;

  const reasons = dedupeMessages(dimensions.flatMap((d) => d.reasons));
  const concerns = dedupeMessages(dimensions.flatMap((d) => d.concerns));
  const hardRequirements = checkHardRequirements(profile, programme);

  return {
    overallScore,
    overallLabel: overallScore != null ? labelForScore(overallScore) : null,
    dimensions,
    reasons,
    concerns,
    hardRequirements,
    confidence: computeConfidence(profile, dimensions),
  };
}

/**
 * Data confidence (spec §30): low / medium / high. More applicable
 * dimensions scored from real user data → higher confidence. A score
 * built from very little data is still shown honestly, labeled with low
 * confidence, rather than pretending completeness.
 */
function computeConfidence(
  profile: MatchUserProfile,
  dimensions: MatchDimensionResult[],
): "low" | "medium" | "high" {
  const applicable = dimensions.filter((d) => d.applicable && d.score != null).length;

  // Few or no profile fields populated → low confidence even if a couple
  // of dimensions happen to be applicable (e.g. admission is always-on).
  const profileDataPoints = [
    profile.current_gpa != null,
    profile.current_gpa_scale != null,
    profile.budget_max != null || profile.budget_mode !== "unknown",
    profile.preferred_degree_level != null,
    profile.preferred_country_codes.length > 0,
    profile.preferred_cities.length > 0,
    profile.preferred_language_codes.length > 0,
    profile.english_level != null,
    profile.math_background != null,
  ].filter(Boolean).length;

  if (applicable >= 5 && profileDataPoints >= 6) return "high";
  if (applicable >= 3 && profileDataPoints >= 3) return "medium";
  return "low";
}

/**
 * Dedupes by a message's meaning (translated key + its params, or the raw
 * text), not by object identity — two dimensions could in principle
 * produce the identical translated message with identical params.
 */
function dedupeMessages(messages: MatchMessage[]): MatchMessage[] {
  const seen = new Set<string>();
  const result: MatchMessage[] = [];

  for (const message of messages) {
    const fingerprint =
      message.type === "raw"
        ? `raw:${message.text}`
        : `translated:${message.key}:${JSON.stringify(message.params ?? {})}`;

    if (!seen.has(fingerprint)) {
      seen.add(fingerprint);
      result.push(message);
    }
  }

  return result;
}

export type {
  MatchDimensionKey,
  MatchDimensionResult,
  MatchLabel,
  MatchResult,
  MatchUserProfile,
  MatchWeights,
} from "./match-types";
export { MATCH_DIMENSION_LABELS, MATCH_LABEL_THRESHOLDS } from "./match-types";
export type { HardRequirementCheck, MatchConfidence } from "./match-types";
export type { MatchMessage } from "./messages";
export type { CurrencyRateTable } from "./currency";