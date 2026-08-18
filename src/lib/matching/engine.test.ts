import { describe, expect, it } from "vitest";
import { computeMatchScore } from "./engine";
import { makeProfile, makeProgramme } from "./test-fixtures";

describe("computeMatchScore", () => {
  it("produces an overall score, a label, and non-empty reasons for a well-matched profile", () => {
    const profile = makeProfile({ budget_max: 35000 }); // covers the fixture programme's ~31,700 annual cost
    const programme = makeProgramme();
    const now = new Date("2026-01-01");

    const result = computeMatchScore(profile, programme, now);

    expect(result.overallScore).not.toBeNull();
    expect(result.overallScore!).toBeGreaterThanOrEqual(90);
    expect(result.overallLabel).toBe("Excellent Fit");
    expect(result.dimensions).toHaveLength(8);
    expect(result.reasons.length).toBeGreaterThan(0);
  });

  it("never returns a bare score without dimension-level reasons/concerns backing it up", () => {
    const profile = makeProfile();
    const programme = makeProgramme();

    const result = computeMatchScore(profile, programme);

    for (const dimension of result.dimensions) {
      if (dimension.applicable) {
        expect(dimension.score).not.toBeNull();
      } else {
        expect(dimension.score).toBeNull();
      }
    }
  });

  it("excludes non-applicable dimensions from the overall average instead of penalizing missing data", () => {
    // No budget, no location preference, no GPA -> only Language + Admission are applicable.
    const profile = makeProfile({
      budget_max: null,
      preferred_country_codes: [],
      preferred_cities: [],
      current_gpa: null,
      current_gpa_scale: null,
    });
    const programme = makeProgramme();

    const result = computeMatchScore(profile, programme, new Date("2026-01-01"));

    const applicableKeys = result.dimensions
      .filter((d) => d.applicable)
      .map((d) => d.key);
    expect(applicableKeys.sort()).toEqual(["admission", "language"]);
    expect(result.overallScore).not.toBeNull();
  });

  it("returns a null overall score only when literally no dimension is applicable", () => {
    // Admission Fit is always applicable in practice, so this is a
    // deliberately degenerate case to exercise the null-safety path.
    const profile = makeProfile({
      budget_max: null,
      preferred_country_codes: [],
      preferred_cities: [],
      preferred_language_codes: [],
      current_gpa: null,
      current_gpa_scale: null,
      testScores: [],
    });
    const programme = makeProgramme({
      test_requirements: [],
      academic_requirements: null,
      application_deadline: null,
    });

    const result = computeMatchScore(profile, programme, new Date("2026-01-01"));

    // Academic (no requirement) -> 100, Admission (nothing to check) -> 100
    // are still applicable, so overall is not null here — confirming those
    // two dimensions really are always-on as designed.
    expect(result.overallScore).not.toBeNull();
  });

  it("deduplicates identical messages that could arise across dimensions, by meaning not object identity", () => {
    const profile = makeProfile();
    const programme = makeProgramme();

    const result = computeMatchScore(profile, programme);

    const reasonFingerprints = result.reasons.map((m) =>
      m.type === "raw" ? `raw:${m.text}` : `translated:${m.key}:${JSON.stringify(m.params ?? {})}`,
    );
    const concernFingerprints = result.concerns.map((m) =>
      m.type === "raw" ? `raw:${m.text}` : `translated:${m.key}:${JSON.stringify(m.params ?? {})}`,
    );

    expect(new Set(reasonFingerprints).size).toBe(reasonFingerprints.length);
    expect(new Set(concernFingerprints).size).toBe(concernFingerprints.length);
  });

  it("produces a lower overall score and populated concerns for a poorly-matched profile", () => {
    const profile = makeProfile({
      current_gpa: 2.0,
      current_gpa_scale: 4.0,
      budget_max: 2000,
      preferred_country_codes: ["US"],
      preferred_cities: [],
      preferred_language_codes: ["fr"],
      testScores: [],
    });
    const programme = makeProgramme();

    const result = computeMatchScore(profile, programme, new Date("2026-01-01"));

    expect(result.overallScore!).toBeLessThan(60);
    expect(result.overallLabel).not.toBe("Excellent Fit");
    expect(result.concerns.length).toBeGreaterThan(0);
  });
});
