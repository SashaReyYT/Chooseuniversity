import type {
  MatchDimensionResult,
  MatchUserProfile,
  ProgrammeWithDetails,
} from "./types";
import { MATCH_DIMENSION_LABELS } from "./types";
import type { MatchMessage } from "./messages";
import { translated } from "./messages";
import { roundScore } from "./utils";

/**
 * Normalizes a programme's tuition to an annual figure so programmes
 * billed per-semester or as a lump sum compare on the same basis as a
 * user's (implicitly annual) budget.
 */
function annualTuition(programme: ProgrammeWithDetails): number {
  switch (programme.tuition_fee_period) {
    case "per_semester":
      return programme.tuition_fee_amount * 2;
    case "total": {
      const years = programme.duration_months / 12;
      return years > 0 ? programme.tuition_fee_amount / years : programme.tuition_fee_amount;
    }
    case "per_year":
    default:
      return programme.tuition_fee_amount;
  }
}

/**
 * Budget Fit compares a programme's estimated annual cost (tuition +
 * living costs) against the user's stated budget ceiling.
 *
 * No currency conversion is performed — there's no FX-rate table in the
 * schema yet. A currency mismatch is surfaced as a concern rather than
 * silently treating different currencies as equal, so the score is never
 * presented as more precise than it actually is.
 *
 * Amounts are passed as raw numbers in message params, not pre-formatted
 * strings — this function doesn't know the active UI locale, and
 * next-intl's `{amount, number}` ICU formatting at render time handles
 * locale-correct grouping/decimals (e.g. "31,700" vs "31 700").
 */
export function scoreBudgetFit(
  profile: MatchUserProfile,
  programme: ProgrammeWithDetails,
): MatchDimensionResult {
  const reasons: MatchMessage[] = [];
  const concerns: MatchMessage[] = [];

  if (profile.budget_max == null) {
    return {
      key: "budget",
      label: MATCH_DIMENSION_LABELS.budget,
      score: null,
      applicable: false,
      reasons,
      concerns: [translated("budget.missingBudget")],
    };
  }

  const annualLivingCost = (programme.estimated_living_cost_monthly ?? 0) * 12;
  const annualCost = annualTuition(programme) + annualLivingCost;
  const currency = programme.tuition_fee_currency;

  if (profile.budget_currency && profile.budget_currency !== currency) {
    concerns.push(
      translated("budget.currencyMismatch", {
        currency,
        budgetCurrency: profile.budget_currency,
      }),
    );
  }

  const budgetMax = profile.budget_max;
  let score: number;

  if (annualCost <= budgetMax) {
    score = 100;
    reasons.push(
      translated("budget.fitsBudget", { amount: Math.round(annualCost), currency }),
    );
  } else if (annualCost <= budgetMax * 1.5) {
    // Linear falloff from 100 (at budget) to 50 (at 1.5x budget).
    const overBudgetFraction = (annualCost - budgetMax) / (budgetMax * 0.5);
    score = roundScore(100 - overBudgetFraction * 50);
    concerns.push(
      translated("budget.overBudget", {
        amount: Math.round(annualCost),
        budgetMax,
        currency,
      }),
    );
  } else {
    // Continue the falloff below 50, floored at 10 so "wildly over
    // budget" is still distinguishable from "just over" rather than both
    // collapsing to 0.
    const overBudgetFraction = (annualCost - budgetMax * 1.5) / (budgetMax * 0.5);
    score = roundScore(Math.max(10, 50 - overBudgetFraction * 40));
    concerns.push(
      translated("budget.significantlyOverBudget", {
        amount: Math.round(annualCost),
        budgetMax,
        currency,
      }),
    );
  }

  return {
    key: "budget",
    label: MATCH_DIMENSION_LABELS.budget,
    score,
    applicable: true,
    reasons,
    concerns,
  };
}
