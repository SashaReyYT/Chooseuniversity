import { describe, expect, it } from "vitest";
import { determineBestForLabel } from "./best-for";
import type {
  MatchDimensionKey,
  MatchDimensionResult,
  MatchResult,
} from "./match-types";
import { MATCH_DIMENSION_LABELS } from "./match-types";
import { makeProfile } from "./test-fixtures";

function makeDimension(
  key: MatchDimensionKey,
  score: number | null,
): MatchDimensionResult {
  return {
    key,
    label: MATCH_DIMENSION_LABELS[key],
    score,
    applicable: score != null,
    reasons: [],
    concerns: [],
  };
}

function makeMatch(
  overallScore: number | null,
  dimensions: MatchDimensionResult[],
): MatchResult {
  return {
    overallScore,
    overallLabel: null,
    dimensions,
    reasons: [],
    concerns: [],
    hardRequirements: [],
    confidence: "high",
  };
}

describe("determineBestForLabel (§34)", () => {
  it("returns null when there is no profile — labels are user-specific, never permanent", () => {
    const match = makeMatch(95, [makeDimension("academic", 95)]);
    expect(determineBestForLabel(match, null)).toBeNull();
  });

  it("returns null when the programme has no score", () => {
    expect(determineBestForLabel(makeMatch(null, []), makeProfile())).toBeNull();
  });

  it("returns Best Overall for 90+ with at least three strong dimensions", () => {
    const match = makeMatch(92, [
      makeDimension("academic", 85),
      makeDimension("budget", 90),
      makeDimension("admission", 82),
    ]);
    expect(determineBestForLabel(match, makeProfile())).toBe("Best Overall");
  });

  it("does not return Best Overall when fewer than three dimensions are strong", () => {
    const match = makeMatch(92, [
      makeDimension("academic", 95),
      makeDimension("budget", 40),
    ]);
    expect(determineBestForLabel(match, makeProfile())).toBe("Best Academic");
  });

  it("returns Best Value when only the budget dimension qualifies", () => {
    const match = makeMatch(75, [
      makeDimension("budget", 92),
      makeDimension("academic", 60),
    ]);
    expect(determineBestForLabel(match, makeProfile())).toBe("Best Value");
  });

  it("returns each single-dimension label for a 90+ score in that dimension", () => {
    const cases: [MatchDimensionKey, string][] = [
      ["academic", "Best Academic"],
      ["admission", "Best Admission Fit"],
      ["career", "Best Career Fit"],
      ["location", "Best Location Fit"],
    ];
    for (const [key, expected] of cases) {
      const match = makeMatch(70, [makeDimension(key, 91)]);
      expect(determineBestForLabel(match, makeProfile())).toBe(expected);
    }
  });

  it("prefers Best Value over other single-dimension labels when several qualify", () => {
    const match = makeMatch(85, [
      makeDimension("budget", 95),
      makeDimension("academic", 95),
    ]);
    expect(determineBestForLabel(match, makeProfile())).toBe("Best Value");
  });

  it("ignores non-applicable dimensions (not enough data to score)", () => {
    const match = makeMatch(70, [makeDimension("career", null)]);
    expect(determineBestForLabel(match, makeProfile())).toBeNull();
  });

  it("returns null when no threshold is met — no label is better than a meaningless one", () => {
    const match = makeMatch(72, [
      makeDimension("academic", 70),
      makeDimension("budget", 65),
    ]);
    expect(determineBestForLabel(match, makeProfile())).toBeNull();
  });
});
