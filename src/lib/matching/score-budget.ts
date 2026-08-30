import type {
  MatchDimensionResult,
  MatchUserProfile,
  ProgrammeWithDetails,
} from "./match-types";
import { MATCH_DIMENSION_LABELS } from "./match-types";
import type { MatchMessage } from "./messages";
import { translated } from "./messages";
import type { CurrencyRateTable } from "./currency";
import { convertAmount } from "./currency";
import { annualLivingCost, roundScore } from "./utils";

/**
 * Rough, internal-only annual ceilings (EUR) for students who answered
 * the budget question qualitatively (spec §15: "How would you describe
 * your budget? Low / Medium / High / I'm not sure") instead of a number.
 * These never get rendered back to the user as if they were a figure the
 * user entered — see `budget.approximateFromMode` — they only let the
 * scoring curve run instead of the dimension going non-applicable.
 * `unknown` deliberately isn't in this table: "I'm not sure" means we
 * genuinely don't score this dimension, same as no answer at all.
 */
const BUDGET_MODE_CEILINGS_EUR: Partial<Record<MatchUserProfile["budget_mode"], number>> = {
  low: 8000,
  medium: 15000,
  high: 30000,
};

/**
 * Budget Fit compares a programme's estimated annual cost (tuition +
 * living costs) against the user's stated budget ceiling.
 *
 * Tuition is a range (`tuition_min`–`tuition_max`, spec §49): the score
 * is honest about the range instead of picking an average. The worst
 * case (`tuition_max`) determines a full fit; a budget that falls
 * inside the range scores proportionally; and if even the cheapest
 * option (`tuition_min`) is over budget, the falloff is computed from
 * that lower bound.
 *
 * Currency conversion (spec §15, §26–§27): when the programme's tuition
 * currency differs from the user's stated budget currency, the total is
 * converted via `rates` (an EUR-based exchange rate table — see
 * `currency.ts` and `supabase/migrations/0012_currency_rates.sql`)
 * before comparing. When no rate is available for either currency, this
 * dimension degrades to UNKNOWN (`applicable: false`, `score: null` —
 * spec §29) rather than silently comparing the raw numbers as if the
 * currencies were equal, which would be a false pass/fail dressed up as
 * a real score.
 *
 * Amounts are passed as raw numbers in message params, not pre-formatted
 * strings — this function doesn't know the active UI locale, and
 * next-intl's `{amount, number}` ICU formatting at render time handles
 * locale-correct grouping/decimals (e.g. "31,700" vs "31 700").
 */
export function scoreBudgetFit(
  profile: MatchUserProfile,
  programme: ProgrammeWithDetails,
  rates: CurrencyRateTable = {},
): MatchDimensionResult {
  const reasons: MatchMessage[] = [];
  const concerns: MatchMessage[] = [];

  const budgetMax = profile.budget_max ?? BUDGET_MODE_CEILINGS_EUR[profile.budget_mode] ?? null;

  if (budgetMax == null) {
    return {
      key: "budget",
      label: MATCH_DIMENSION_LABELS.budget,
      score: null,
      applicable: false,
      reasons,
      concerns: [translated("budget.missingBudget")],
    };
  }

  // Tuition unknown (a programme is catalogued only when its tuition is
  // confirmed — except the Czech pass-2 programmes, whose official pages
  // state no public figure): the cost side of Budget Fit cannot be
  // computed, so the dimension degrades to UNKNOWN (spec §29) instead of
  // pretending a number exists.
  if (
    programme.tuition_min == null ||
    programme.tuition_max == null ||
    programme.tuition_currency == null
  ) {
    return {
      key: "budget",
      label: MATCH_DIMENSION_LABELS.budget,
      score: null,
      applicable: false,
      reasons,
      concerns: [...concerns, translated("budget.tuitionUnknown")],
    };
  }

  const annualLiving = annualLivingCost(programme);
  const programmeCurrency = programme.tuition_currency;
  // The qualitative ceilings (`BUDGET_MODE_CEILINGS_EUR`) are internally
  // EUR-denominated, and the profile form defaults the currency selector
  // to EUR — an explicit budget with no stated currency is treated the
  // same way, rather than being assumed to match whatever currency the
  // programme happens to be priced in.
  const budgetCurrency = profile.budget_currency ?? "EUR";

  let annualCostMin = programme.tuition_min + annualLiving;
  let annualCostMax = programme.tuition_max + annualLiving;
  let currency = programmeCurrency;

  if (budgetCurrency !== programmeCurrency) {
    const convertedMin = convertAmount(annualCostMin, programmeCurrency, budgetCurrency, rates);
    const convertedMax = convertAmount(annualCostMax, programmeCurrency, budgetCurrency, rates);

    if (convertedMin == null || convertedMax == null) {
      // No rate available for this pair — UNKNOWN (spec §29), not a
      // score computed by comparing mismatched currencies as if equal.
      return {
        key: "budget",
        label: MATCH_DIMENSION_LABELS.budget,
        score: null,
        applicable: false,
        reasons,
        concerns: [
          ...concerns,
          translated("budget.currencyMismatch", {
            currency: programmeCurrency,
            budgetCurrency,
          }),
        ],
      };
    }

    annualCostMin = convertedMin;
    annualCostMax = convertedMax;
    currency = budgetCurrency;
    concerns.push(
      translated("budget.currencyConverted", {
        currency: programmeCurrency,
        budgetCurrency,
      }),
    );
  }

  let score: number;

  if (annualCostMax <= budgetMax) {
    // The most expensive option still fits — clean 100.
    score = 100;
    reasons.push(
      translated("budget.fitsBudgetRange", {
        amountMin: Math.round(annualCostMin),
        amountMax: Math.round(annualCostMax),
        currency,
      }),
    );
  } else if (annualCostMin <= budgetMax) {
    // The budget falls inside the programme's cost range: linear
    // 100 (budget at the cheap end) → 50 (budget at the expensive end).
    const span = annualCostMax - annualCostMin || 1;
    const fraction = (budgetMax - annualCostMin) / span;
    score = roundScore(50 + fraction * 50);
    concerns.push(
      translated("budget.partiallyFitsBudget", {
        amountMin: Math.round(annualCostMin),
        amountMax: Math.round(annualCostMax),
        budgetMax,
        currency,
      }),
    );
  } else {
    // Even the cheapest option is over budget. Same falloff shape as
    // before: linear from 100 (at budget) to 50 (at 1.5x budget), then
    // a shallower curve floored at 10 — but measured from `tuition_min`,
    // the best case, so the range can't hide an over-budget programme.
    const overBudgetFraction = (annualCostMin - budgetMax) / (budgetMax * 0.5);
    if (overBudgetFraction <= 1) {
      score = roundScore(100 - overBudgetFraction * 50);
      concerns.push(
        translated("budget.overBudget", {
          amount: Math.round(annualCostMin),
          budgetMax,
          currency,
        }),
      );
    } else {
      score = roundScore(Math.max(10, 50 - (overBudgetFraction - 1) * 40));
      concerns.push(
        translated("budget.significantlyOverBudget", {
          amount: Math.round(annualCostMin),
          budgetMax,
          currency,
        }),
      );
    }
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


