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

  it("scores 100 when the most expensive option fits the budget", () => {
    // tuition 18500/yr + living 1100*12=13200 = 31700 total annual cost
    const profile = makeProfile({ budget_max: 35000 });
    const programme = makeProgramme();

    const result = scoreBudgetFit(profile, programme);

    expect(result.score).toBe(100);
    expect(hasMessageKey(result.reasons, "budget.fitsBudgetRange")).toBe(true);
    expect(paramsForKey(result.reasons, "budget.fitsBudgetRange")).toMatchObject({
      amountMin: 31700,
      amountMax: 31700,
    });
  });

  it("scores proportionally (50–100) when the budget falls inside the cost range", () => {
    // range 18500–28500, budget 23500 → halfway between min and max → ~75
    const profile = makeProfile({ budget_max: 23500 });
    const programme = makeProgramme({
      tuition_max: 28500,
      estimated_living_cost_monthly: null,
    });

    const result = scoreBudgetFit(profile, programme);

    expect(result.score).toBe(75);
    expect(hasMessageKey(result.concerns, "budget.partiallyFitsBudget")).toBe(true);
  });

  it("scores between 50 and 100 when moderately over budget (measured from the cheapest option)", () => {
    const profile = makeProfile({ budget_max: 25000 }); // min cost 31700, ~1.27x budget (within the 1.5x threshold)
    const programme = makeProgramme();

    const result = scoreBudgetFit(profile, programme);

    expect(result.score).not.toBeNull();
    expect(result.score!).toBeLessThan(100);
    expect(result.score!).toBeGreaterThanOrEqual(50);
    expect(hasMessageKey(result.concerns, "budget.overBudget")).toBe(true);
  });

  it("floors at 10 when wildly over budget", () => {
    const profile = makeProfile({ budget_max: 1000 });
    const programme = makeProgramme();

    const result = scoreBudgetFit(profile, programme);

    expect(result.score).toBe(10);
    expect(hasMessageKey(result.concerns, "budget.significantlyOverBudget")).toBe(true);
  });

  it("a wide range never inflates the score: over-budget programmes are measured from tuition_min", () => {
    // Whole range above budget, but the max is far above the min —
    // the falloff still starts from the cheapest option.
    const profile = makeProfile({ budget_max: 20000 });
    const wide = makeProgramme({
      tuition_min: 30000,
      tuition_max: 60000,
      estimated_living_cost_monthly: null,
    });
    const narrow = makeProgramme({
      tuition_min: 30000,
      tuition_max: 30000,
      estimated_living_cost_monthly: null,
    });

    expect(scoreBudgetFit(profile, wide).score).toBe(
      scoreBudgetFit(profile, narrow).score,
    );
    expect(hasMessageKey(scoreBudgetFit(profile, wide).concerns, "budget.overBudget")).toBe(true);
  });

  it("same currency: no conversion note and no currency-mismatch concern", () => {
    const profile = makeProfile({ budget_max: 35000, budget_currency: "EUR" });
    const programme = makeProgramme({ tuition_currency: "EUR" });

    const result = scoreBudgetFit(profile, programme, { EUR: 1 });

    expect(result.score).toBe(100);
    expect(hasMessageKey(result.concerns, "budget.currencyConverted")).toBe(false);
    expect(hasMessageKey(result.concerns, "budget.currencyMismatch")).toBe(false);
  });

  it("cross-currency with a known rate: converts and produces a real score, not just a concern flag", () => {
    // Programme cost is 31700 EUR (18500 tuition + 1100*12 living).
    // rate_to_eur: EUR=1, USD=0.5 (1 USD = 0.5 EUR, i.e. 2 USD per EUR)
    // → 31700 EUR converts to 63400 USD.
    const profile = makeProfile({ budget_max: 65000, budget_currency: "USD" });
    const programme = makeProgramme({ tuition_currency: "EUR" });
    const rates = { EUR: 1, USD: 0.5 };

    const result = scoreBudgetFit(profile, programme, rates);

    expect(result.applicable).toBe(true);
    expect(result.score).toBe(100);
    expect(hasMessageKey(result.concerns, "budget.currencyConverted")).toBe(true);
    const convertedParams = paramsForKey(result.concerns, "budget.currencyConverted");
    expect(convertedParams?.currency).toBe("EUR");
    expect(convertedParams?.budgetCurrency).toBe("USD");
    expect(hasMessageKey(result.reasons, "budget.fitsBudgetRange")).toBe(true);
    expect(paramsForKey(result.reasons, "budget.fitsBudgetRange")).toMatchObject({
      amountMin: 63400,
      amountMax: 63400,
      currency: "USD",
    });
  });

  it("cross-currency with no known rate: degrades to UNKNOWN instead of crashing or assuming equal value", () => {
    const profile = makeProfile({ budget_max: 35000, budget_currency: "GBP" });
    const programme = makeProgramme({ tuition_currency: "EUR" });

    // No GBP rate in the table (EUR alone isn't enough to convert).
    const result = scoreBudgetFit(profile, programme, { EUR: 1 });

    expect(result.score).toBeNull();
    expect(result.applicable).toBe(false);
    expect(hasMessageKey(result.concerns, "budget.currencyMismatch")).toBe(true);
    const params = paramsForKey(result.concerns, "budget.currencyMismatch");
    expect(params?.currency).toBe("EUR");
    expect(params?.budgetCurrency).toBe("GBP");
  });

  it("cross-currency with an entirely empty rate table: still degrades to UNKNOWN, never throws", () => {
    const profile = makeProfile({ budget_max: 35000, budget_currency: "USD" });
    const programme = makeProgramme({ tuition_currency: "EUR" });

    expect(() => scoreBudgetFit(profile, programme)).not.toThrow();
    const result = scoreBudgetFit(profile, programme);

    expect(result.score).toBeNull();
    expect(result.applicable).toBe(false);
    expect(hasMessageKey(result.concerns, "budget.currencyMismatch")).toBe(true);
  });
});