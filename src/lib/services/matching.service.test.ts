import { describe, expect, it } from "vitest";
import { sortRankedMatches, type RankedMatch } from "./matching.service";
import { makeProgramme } from "@/lib/matching/test-fixtures";
import type { MatchResult } from "@/lib/matching/match-types";

function makeMatch(overallScore: number | null, overrides: {
  confidence?: "high" | "medium" | "low";
  hardReqFails?: number;
  concernsCount?: number;
} = {}): MatchResult {
  return {
    overallScore,
    overallLabel: null,
    dimensions: [],
    reasons: [],
    concerns: Array(overrides.concernsCount ?? 0).fill({ type: "raw", text: "c" }),
    hardRequirements: Array(overrides.hardReqFails ?? 0).fill({ type: "degree_level", status: "fail", message: "" }),
    confidence: overrides.confidence ?? "high",
  };
}

function makeRanked(overrides: {
  id: string;
  overallScore: number | null;
  tuitionMin?: number;
  confidence?: "high" | "medium" | "low";
  hardReqFails?: number;
  concernsCount?: number;
  uniName?: string;
}): RankedMatch {
  const base = makeProgramme({
    id: overrides.id,
    tuition_min: overrides.tuitionMin ?? 999_999,
  });
  if (overrides.uniName) {
    base.university = {
      ...base.university,
      name: overrides.uniName,
      id: "university-" + overrides.id,
    };
  }
  return {
    programme: base,
    match: {
      overallScore: overrides.overallScore,
      overallLabel: null,
      dimensions: [],
      reasons: [],
      concerns: Array(overrides.concernsCount ?? 0).fill({ type: "raw", text: "c" }),
      hardRequirements: Array(overrides.hardReqFails ?? 0).fill({ type: "degree_level", status: "fail", message: "" }),
      confidence: overrides.confidence ?? "high",
    },
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

    expect(ranked.map((r) => r.programme.id)).toEqual(["c", "a", "b"]);
  });

  it("sorts by estimated living cost ascending for lowest_cost, unknown cost last", () => {
    const ranked = [
      makeRanked({ id: "a", overallScore: 10 }),
      makeRanked({ id: "b", overallScore: 99 }),
      makeRanked({ id: "c", overallScore: 50 }),
    ];
    ranked[0].programme = makeProgramme({ id: "a", estimated_living_cost_monthly: 1200 });
    ranked[1].programme = makeProgramme({ id: "b", estimated_living_cost_monthly: null });
    ranked[2].programme = makeProgramme({ id: "c", estimated_living_cost_monthly: 650 });

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

  // --- Tie-breaking tests (deterministic winner among equal scores) ---

  it("breaks ties on 100% by confidence (high > medium > low)", () => {
    const ranked = [
      makeRanked({ id: "low", overallScore: 100, confidence: "low" }),
      makeRanked({ id: "high", overallScore: 100, confidence: "high" }),
      makeRanked({ id: "medium", overallScore: 100, confidence: "medium" }),
    ];
    sortRankedMatches(ranked, "best_match");
    expect(ranked.map((r) => r.programme.id)).toEqual(["high", "medium", "low"]);
  });

  it("breaks ties by fewer failed hard requirements", () => {
    const ranked = [
      makeRanked({ id: "fail2", overallScore: 100, hardReqFails: 2 }),
      makeRanked({ id: "fail0", overallScore: 100, hardReqFails: 0 }),
      makeRanked({ id: "fail1", overallScore: 100, hardReqFails: 1 }),
    ];
    sortRankedMatches(ranked, "best_match");
    expect(ranked.map((r) => r.programme.id)).toEqual(["fail0", "fail1", "fail2"]);
  });

  it("breaks ties by fewer concerns", () => {
    const ranked = [
      makeRanked({ id: "c3", overallScore: 100, concernsCount: 3 }),
      makeRanked({ id: "c0", overallScore: 100, concernsCount: 0 }),
      makeRanked({ id: "c1", overallScore: 100, concernsCount: 1 }),
    ];
    sortRankedMatches(ranked, "best_match");
    expect(ranked.map((r) => r.programme.id)).toEqual(["c0", "c1", "c3"]);
  });

  it("breaks ties by lower tuition", () => {
    const ranked = [
      makeRanked({ id: "expensive", overallScore: 100, tuitionMin: 20000 }),
      makeRanked({ id: "cheap", overallScore: 100, tuitionMin: 5000 }),
      makeRanked({ id: "mid", overallScore: 100, tuitionMin: 12000 }),
    ];
    sortRankedMatches(ranked, "best_match");
    expect(ranked.map((r) => r.programme.id)).toEqual(["cheap", "mid", "expensive"]);
  });

  it("breaks ties by university name (stable)", () => {
    const ranked = [
      makeRanked({ id: "z", overallScore: 100, uniName: "Zeta Uni" }),
      makeRanked({ id: "a", overallScore: 100, uniName: "Alpha Uni" }),
      makeRanked({ id: "m", overallScore: 100, uniName: "Mu Uni" }),
    ];
    sortRankedMatches(ranked, "best_match");
    expect(ranked.map((r) => r.programme.id)).toEqual(["a", "m", "z"]);
  });
});
