import { scoreAcademicFit } from "./score-academic";
import { scoreAdmissionFit } from "./score-admission";
import { scoreBudgetFit } from "./score-budget";
import { scoreLanguageFit } from "./score-language";
import { scoreLocationFit } from "./score-location";
import type {
  MatchDimensionResult,
  MatchResult,
  MatchUserProfile,
  ProgrammeWithDetails,
} from "./types";
import { labelForScore } from "./types";
import type { MatchMessage } from "./messages";
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
 * The overall score is a simple average of whichever dimensions had
 * enough data to be scored (a dimension with `applicable: false` — e.g.
 * "Budget Fit" with no budget set — is excluded rather than penalizing
 * the user for missing profile data). All five dimensions are weighted
 * equally; there's no product signal yet that any one dimension should
 * dominate the others, so unequal weights would be an unjustified guess.
 *
 * `now` is threaded through to `scoreAdmissionFit` for deterministic
 * deadline-proximity testing — see that module.
 */
export function computeMatchScore(
  profile: MatchUserProfile,
  programme: ProgrammeWithDetails,
  now: Date = new Date(),
): MatchResult {
  const dimensions: MatchDimensionResult[] = [
    scoreAcademicFit(profile, programme),
    scoreBudgetFit(profile, programme),
    scoreLanguageFit(profile, programme),
    scoreLocationFit(profile, programme),
    scoreAdmissionFit(programme, now),
  ];

  const applicableScores = dimensions.filter(
    (d): d is MatchDimensionResult & { score: number } =>
      d.applicable && d.score != null,
  );

  const overallScore =
    applicableScores.length > 0
      ? roundScore(
          applicableScores.reduce((sum, d) => sum + d.score, 0) /
            applicableScores.length,
        )
      : null;

  const reasons = dedupeMessages(dimensions.flatMap((d) => d.reasons));
  const concerns = dedupeMessages(dimensions.flatMap((d) => d.concerns));

  return {
    overallScore,
    overallLabel: overallScore != null ? labelForScore(overallScore) : null,
    dimensions,
    reasons,
    concerns,
  };
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
} from "./types";
export { MATCH_DIMENSION_LABELS, MATCH_LABEL_THRESHOLDS } from "./types";
export type { MatchMessage } from "./messages";
