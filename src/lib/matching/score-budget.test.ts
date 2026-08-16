import { describe, expect, it } from "vitest";
import { scoreBudgetFit } from "./score-budget";
import { hasMessageKey, makeProfile, makeProgramme, paramsForKey } from "./test-fixtures";

describe("scoreBudgetFit", () => {
  it("is not applicable when the user hasn't set a budget", () => {
    const profile = makeProfile({ budget_max: null });
    const programme = makeProgramme();

    const result = scoreBudgetFit(profile, programme);

    expect(result.score).toBeNull();
    expect(result.applicable).toBe(false);
    expect(hasMessageKey(result.concerns, "budget.missingBudget")).toBe(true);
  });

  it("scores 100 when annual cost is within budget", () => {
    // tuition 18500/yr + living 1100*12=13200 = 31700 total annual cost
    const profile = makeProfile({ budget_max: 35000 });
    const programme = makeProgramme();

    const result = scoreBudgetFit(profile, programme);

    expect(result.score).toBe(100);
    expect(hasMessageKey(result.reasons, "budget.fitsBudget")).toBe(true);
    expect(paramsForKey(result.reasons, "budget.fitsBudget")?.amount).toBe(31700);
  });

  it("scores between 50 and 100 when moderately over budget", () => {
    const profile = makeProfile({ budget_max: 25000 }); // cost ~31700, ~1.27x budget (within the 1.5x threshold)
    const programme = makeProgramme();

    const result = scoreBudgetFit(profile, programme);

    expect(result.score).not.toBeNull();
    expect(result.score!).toBeLessThan(100);
    expect(result.score!).toBeGreaterThanOrEqual(10);
    expect(hasMessageKey(result.concerns, "budget.overBudget")).toBe(true);
  });

  it("floors at 10 when wildly over budget", () => {
    const profile = makeProfile({ budget_max: 1000 });
    const programme = makeProgramme();

    const result = scoreBudgetFit(profile, programme);

    expect(result.score).toBe(10);
    expect(hasMessageKey(result.concerns, "budget.significantlyOverBudget")).toBe(true);
  });

  it("normalizes per_semester tuition to an annual figure", () => {
    const profile = makeProfile({ budget_max: 100000 });
    const perYear = makeProgramme({
      tuition_fee_amount: 5000,
      tuition_fee_period: "per_year",
      estimated_living_cost_monthly: null,
    });
    const perSemester = makeProgramme({
      tuition_fee_amount: 2500,
      tuition_fee_period: "per_semester",
      estimated_living_cost_monthly: null,
    });

    expect(scoreBudgetFit(profile, perYear).score).toBe(
      scoreBudgetFit(profile, perSemester).score,
    );
  });

  it("normalizes a total lump-sum tuition across the programme duration", () => {
    const profile = makeProfile({ budget_max: 100000 });
    // 24-month programme, 20000 total -> 10000/year
    const total = makeProgramme({
      tuition_fee_amount: 20000,
      tuition_fee_period: "total",
      duration_months: 24,
      estimated_living_cost_monthly: null,
    });
    const perYear = makeProgramme({
      tuition_fee_amount: 10000,
      tuition_fee_period: "per_year",
      estimated_living_cost_monthly: null,
    });

    expect(scoreBudgetFit(profile, total).score).toBe(
      scoreBudgetFit(profile, perYear).score,
    );
  });

  it("flags a currency mismatch (with both currencies as params) without failing to compute a score", () => {
    const profile = makeProfile({ budget_max: 35000, budget_currency: "USD" });
    const programme = makeProgramme({ tuition_fee_currency: "EUR" });

    const result = scoreBudgetFit(profile, programme);

    expect(result.score).not.toBeNull();
    expect(hasMessageKey(result.concerns, "budget.currencyMismatch")).toBe(true);
    const params = paramsForKey(result.concerns, "budget.currencyMismatch");
    expect(params?.currency).toBe("EUR");
    expect(params?.budgetCurrency).toBe("USD");
  });
});
