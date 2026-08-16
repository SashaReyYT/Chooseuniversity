import type { ProgrammeWithDetails } from "./types";
import { roundScore } from "./utils";

/**
 * Not one of the five dimensions `computeMatchScore` in `engine.ts`
 * actually runs (academic/budget/language/location/admission — see
 * `MATCH_DIMENSION_KEYS` in `types.ts`) — this scorer predates the
 * `MatchMessage`/`messages.ts` refactor (reasons/concerns here are plain
 * strings, not `MatchMessage[]`) and was never wired into the engine or
 * migrated alongside it. Kept as its own standalone result shape rather
 * than shoehorned into `MatchDimensionResult` (whose `key` is a closed
 * `MatchDimensionKey` union with no `"support"` member, and whose
 * reasons/concerns are typed `MatchMessage[]`) — wiring a real sixth
 * dimension into the live product (engine, `Matches` translations,
 * `match-card.tsx`'s dimension maps) is a separate decision this file
 * shouldn't make unilaterally.
 */
export interface SupportFitResult {
  key: "support";
  label: string;
  score: number | null;
  applicable: boolean;
  reasons: string[];
  concerns: string[];
}

/**
 * Support Fit reflects how well a university is set up for international
 * students, using three facts ported from Nevora's research (see
 * `0008`/`0009_..._support_and_scholarships.SQL`): whether it has a
 * dedicated international office, participates in Erasmus, and offers
 * dormitory housing.
 *
 * Like Admission Fit, this doesn't depend on the user's profile — there's
 * no "international support preference" field in `user_profiles` yet —
 * so it's an objective property of the university rather than a
 * personalized match. Unlike Admission Fit, coverage here is genuinely
 * partial (see 0009's header: "where a fact couldn't be evidenced either
 * way, it's left NULL"), so this follows Language Fit's pattern instead:
 * average only the *known* signals, and mark the dimension inapplicable
 * when none of the three facts have been researched for this university.
 */
export function scoreSupportFit(
  programme: ProgrammeWithDetails,
): SupportFitResult {
  const reasons: string[] = [];
  const concerns: string[] = [];
  const { university } = programme;

  const facts: { known: boolean | null; onLabel: string; offLabel: string }[] = [
    {
      known: university.international_office,
      onLabel: "Has a dedicated international student office.",
      offLabel: "No dedicated international student office found.",
    },
    {
      known: university.erasmus_participation,
      onLabel: "Participates in Erasmus+ exchange.",
      offLabel: "Doesn't appear to participate in Erasmus+.",
    },
    {
      known: university.dormitory_available,
      onLabel: "Offers on-campus dormitory housing.",
      offLabel: "No on-campus dormitory — you'd need private housing.",
    },
  ];

  const signals: number[] = [];
  for (const fact of facts) {
    if (fact.known === null) continue;
    if (fact.known) {
      reasons.push(fact.onLabel);
      signals.push(100);
    } else {
      concerns.push(fact.offLabel);
      signals.push(30);
    }
  }

  if (university.international_support_notes) {
    reasons.push(university.international_support_notes);
  }

  if (signals.length === 0) {
    return {
      key: "support",
      label: "Support Fit",
      score: null,
      applicable: false,
      reasons,
      concerns,
    };
  }

  const score = roundScore(
    signals.reduce((a, b) => a + b, 0) / signals.length,
  );

  return {
    key: "support",
    label: "Support Fit",
    score,
    applicable: true,
    reasons,
    concerns,
  };
}
