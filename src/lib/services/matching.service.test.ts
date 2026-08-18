import { describe, expect, it } from "vitest";
import { sortRankedMatches, type RankedMatch } from "./matching.service";
import { makeProgramme } from "@/lib/matching/test-fixtures";
import type { MatchResult } from "@/lib/matching/match-types";

function makeMatch(overallScore: number | null): MatchResult {
  return {
    overallScore,
    overallLabel: null,
    dimensions: [],
    reasons: [],
    concerns: [],
    hardRequirements: [],
    confidence: "high",
  };
}

function makeRanked(overrides: {
  id: string;
  overallScore: number | null;
  tuitionMin?: number;
  livingCostMonthly?: number | null;
}): RankedMatch {
  return {
    programme: makeProgramme({
      id: overrides.id,
      // tuition_min is NOT NULL in the schema — a huge placeholder value
      // stands in for "no useful data available" in the tuition test case
      // below rather than an invalid `null`.
      tuition_min: overrides.tuitionMin ?? 999_999,
      estimated_living_cost_monthly: overrides.livingCostMonthly ?? null,
    }),
    match: makeMatch(overrides.overallScore),
  };
}

describe("sortRankedMatches", () => {
  it("sorts by Match Score descending by default (best_match)", () => {
    const ranked = [
      makeRanked({ id: "a", overallScore: 40 }),
      makeRanked({ id: "b", overallScore: 90 }),
      makeRanked({ id: "c", overallScore: 65 }),
    ];

    sortRankedMatches(ranked, undefined);

    expect(ranked.map((r) => r.programme.id)).toEqual(["b", "c", "a"]);
  });

  it("sorts null overallScore last rather than first or dropping it", () => {
    const ranked = [
      makeRanked({ id: "a", overallScore: null }),
      makeRanked({ id: "b", overallScore: 50 }),
    ];

    sortRankedMatches(ranked, "best_match");

    expect(ranked.map((r) => r.programme.id)).toEqual(["b", "a"]);
  });

  it("sorts by tuition ascending for lowest_tuition, ignoring Match Score entirely", () => {
    const ranked = [
      makeRanked({ id: "a", overallScore: 10, tuitionMin: 20000 }),
      makeRanked({ id: "b", overallScore: 99, tuitionMin: 30000 }),
      makeRanked({ id: "c", overallScore: 50, tuitionMin: 9000 }),
    ];

    sortRankedMatches(ranked, "lowest_tuition");

    // Cheapest wins even with a much lower Match Score.
    expect(ranked.map((r) => r.programme.id)).toEqual(["c", "a", "b"]);
  });

  it("sorts by estimated living cost ascending for lowest_cost, unknown cost last", () => {
    const ranked = [
      makeRanked({ id: "a", overallScore: 10, livingCostMonthly: 1200 }),
      makeRanked({ id: "b", overallScore: 99, livingCostMonthly: null }),
      makeRanked({ id: "c", overallScore: 50, livingCostMonthly: 650 }),
    ];

    sortRankedMatches(ranked, "lowest_cost");

    expect(ranked.map((r) => r.programme.id)).toEqual(["c", "a", "b"]);
  });

  it("treats highest_match the same as best_match", () => {
    const ranked = [
      makeRanked({ id: "a", overallScore: 40 }),
      makeRanked({ id: "b", overallScore: 90 }),
    ];

    sortRankedMatches(ranked, "highest_match");

    expect(ranked.map((r) => r.programme.id)).toEqual(["b", "a"]);
  });
});
