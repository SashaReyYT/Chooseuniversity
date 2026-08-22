import { describe, expect, it } from "vitest";
import { computeMatchScore } from "./engine";
import { makeProfile, makeProgramme } from "./test-fixtures";

describe("Profile update → Match recalculation integration", () => {
  const programme = makeProgramme();

  it("changing budget priority should recalculate Budget Fit and change overall score", () => {
    // Profile A: high budget, matches programme tuition
    const profileA = makeProfile({
      budget_max: 25000,
      budget_currency: "EUR",
      budget_mode: "exact",
    });

    const resultA = computeMatchScore(profileA, programme, new Date("2026-01-01"));

    // Profile B: low budget, doesn't match programme tuition
    const profileB = makeProfile({
      budget_max: 15000,
      budget_currency: "EUR",
      budget_mode: "exact",
    });

    const resultB = computeMatchScore(profileB, programme, new Date("2026-01-01"));

    // Budget Fit should be different
    const budgetDimA = resultA.dimensions.find(d => d.key === "budget");
    const budgetDimB = resultB.dimensions.find(d => d.key === "budget");

    expect(budgetDimA?.applicable).toBe(true);
    expect(budgetDimB?.applicable).toBe(true);
    expect(budgetDimA?.score).not.toBeNull();
    expect(budgetDimB?.score).not.toBeNull();

    // Low budget should score lower on Budget Fit
    expect(budgetDimB!.score!).toBeLessThan(budgetDimA!.score!);

    // Overall score should change
    expect(resultA.overallScore).not.toBeNull();
    expect(resultB.overallScore).not.toBeNull();
    expect(resultB.overallScore!).toBeLessThan(resultA.overallScore!);
  });

  it("changing location priority (preferred country) should recalculate Location Fit", () => {
    const profileA = makeProfile({
      preferred_country_codes: ["NL"],
    });

    const resultA = computeMatchScore(profileA, programme, new Date("2026-01-01"));

    const profileB = makeProfile({
      preferred_country_codes: ["US"],
    });

    const resultB = computeMatchScore(profileB, programme, new Date("2026-01-01"));

    const locationDimA = resultA.dimensions.find(d => d.key === "location");
    const locationDimB = resultB.dimensions.find(d => d.key === "location");

    expect(locationDimA?.applicable).toBe(true);
    expect(locationDimB?.applicable).toBe(true);

    // Matching country should score higher
    expect(locationDimA!.score!).toBeGreaterThan(locationDimB!.score!);

    // Overall score should change
    expect(resultA.overallScore).not.toBeNull();
    expect(resultB.overallScore).not.toBeNull();
    expect(resultA.overallScore!).toBeGreaterThan(resultB.overallScore!);
  });

  it("changing language priority should recalculate Language Fit", () => {
    const profileA = makeProfile({
      preferred_language_codes: ["en"],
      testScores: [{ test_type: "IELTS", qualification_id: "qual-ielts", score: 7.0, cefr_equivalent: "c1" }],
    });

    const resultA = computeMatchScore(profileA, programme, new Date("2026-01-01"));

    const profileB = makeProfile({
      preferred_language_codes: ["fr"],
      testScores: [{ test_type: "IELTS", qualification_id: "qual-ielts", score: 7.0, cefr_equivalent: "c1" }],
    });

    const resultB = computeMatchScore(profileB, programme, new Date("2026-01-01"));

    const langDimA = resultA.dimensions.find(d => d.key === "language");
    const langDimB = resultB.dimensions.find(d => d.key === "language");

    expect(langDimA?.applicable).toBe(true);
    expect(langDimB?.applicable).toBe(true);

    // English matches programme language, French doesn't
    expect(langDimA!.score!).toBeGreaterThan(langDimB!.score!);

    // Overall score should change
    expect(resultA.overallScore).not.toBeNull();
    expect(resultB.overallScore).not.toBeNull();
    expect(resultA.overallScore!).toBeGreaterThan(resultB.overallScore!);
  });

  it("changing career priority should recalculate Career Fit", () => {
    const programmeWithCareer = makeProgramme({
      career_tags: ["research", "tech"],
    });

    const profileA = makeProfile({
      career_priorities: ["research"],
    });

    const resultA = computeMatchScore(profileA, programmeWithCareer, new Date("2026-01-01"));

    const profileB = makeProfile({
      career_priorities: ["management"],
    });

    const resultB = computeMatchScore(profileB, programmeWithCareer, new Date("2026-01-01"));

    const careerDimA = resultA.dimensions.find(d => d.key === "career");
    const careerDimB = resultB.dimensions.find(d => d.key === "career");

    expect(careerDimA?.applicable).toBe(true);
    expect(careerDimB?.applicable).toBe(true);

    expect(careerDimA!.score!).toBeGreaterThan(careerDimB!.score!);

    expect(resultA.overallScore!).toBeGreaterThan(resultB.overallScore!);
  });

  it("changing lifestyle priority should recalculate Lifestyle Fit", () => {
    const programmeWithLifestyle = makeProgramme({
      lifestyle_tags: ["student-life", "affordable-living"],
    });

    const profileA = makeProfile({
      lifestyle_preferences: ["student-life"],
    });

    const resultA = computeMatchScore(profileA, programmeWithLifestyle, new Date("2026-01-01"));

    const profileB = makeProfile({
      lifestyle_preferences: ["nightlife"],
    });

    const resultB = computeMatchScore(profileB, programmeWithLifestyle, new Date("2026-01-01"));

    const lifestyleDimA = resultA.dimensions.find(d => d.key === "lifestyle");
    const lifestyleDimB = resultB.dimensions.find(d => d.key === "lifestyle");

    expect(lifestyleDimA?.applicable).toBe(true);
    expect(lifestyleDimB?.applicable).toBe(true);

    expect(lifestyleDimA!.score!).toBeGreaterThan(lifestyleDimB!.score!);

    expect(resultA.overallScore!).toBeGreaterThan(resultB.overallScore!);
  });

  it("changing academic priority (GPA) should recalculate Academic Fit", () => {
    const profileA = makeProfile({
      current_gpa: 3.8,
      current_gpa_scale: 4.0,
    });

    const resultA = computeMatchScore(profileA, programme, new Date("2026-01-01"));

    const profileB = makeProfile({
      current_gpa: 2.5,
      current_gpa_scale: 4.0,
    });

    const resultB = computeMatchScore(profileB, programme, new Date("2026-01-01"));

    const academicDimA = resultA.dimensions.find(d => d.key === "academic");
    const academicDimB = resultB.dimensions.find(d => d.key === "academic");

    expect(academicDimA?.applicable).toBe(true);
    expect(academicDimB?.applicable).toBe(true);

    expect(academicDimA!.score!).toBeGreaterThan(academicDimB!.score!);

    expect(resultA.overallScore!).toBeGreaterThan(resultB.overallScore!);
  });

  it("changing math priority should recalculate Academic Fit (math component)", () => {
    const profileA = makeProfile({
      math_background: "excellent",
    });

    const resultA = computeMatchScore(profileA, programme, new Date("2026-01-01"));

    const profileB = makeProfile({
      math_background: "weak",
    });

    const resultB = computeMatchScore(profileB, programme, new Date("2026-01-01"));

    const academicDimA = resultA.dimensions.find(d => d.key === "academic");
    const academicDimB = resultB.dimensions.find(d => d.key === "academic");

    expect(academicDimA?.applicable).toBe(true);
    expect(academicDimB?.applicable).toBe(true);

    // Excellent math should score higher
    expect(academicDimA!.score!).toBeGreaterThanOrEqual(academicDimB!.score!);
  });

  it("score changes should be deterministic and meaningful", () => {
    const profileBase = makeProfile();

    const result1 = computeMatchScore(profileBase, programme, new Date("2026-01-01"));
    const result2 = computeMatchScore(profileBase, programme, new Date("2026-01-01"));

    // Same inputs = same outputs (deterministic)
    expect(result1.overallScore).toBe(result2.overallScore);
    expect(result1.dimensions).toEqual(result2.dimensions);
    expect(result1.reasons).toEqual(result2.reasons);
    expect(result1.concerns).toEqual(result2.concerns);
  });

  it("banner-worthy changes: any priority change that affects score should produce different overall score", () => {
    const baseProfile = makeProfile();
    const baseResult = computeMatchScore(baseProfile, programme, new Date("2026-01-01"));

    const priorityChanges = [
      { key: "budget_max", value: 10000 },
      { key: "preferred_country_codes", value: ["DE"] },
      { key: "preferred_language_codes", value: ["fr"] },
      { key: "current_gpa", value: 2.5 },
    ];

    for (const change of priorityChanges) {
      const modifiedProfile = makeProfile({
        [change.key]: change.value,
      });

      const result = computeMatchScore(modifiedProfile, programme, new Date("2026-01-01"));

      expect(result.overallScore).not.toBeNull();
      expect(baseResult.overallScore).not.toBeNull();

      // Score should be different (banner would show)
      expect(result.overallScore).not.toBe(baseResult.overallScore);
    }
  });

  it("dimension-level score changes are logically consistent", () => {
    const profileA = makeProfile({
      budget_max: 25000,
      budget_currency: "EUR",
      budget_mode: "exact",
    });

    const resultA = computeMatchScore(profileA, programme, new Date("2026-01-01"));

    const profileB = makeProfile({
      budget_max: 15000,
      budget_currency: "EUR",
      budget_mode: "exact",
    });

    const resultB = computeMatchScore(profileB, programme, new Date("2026-01-01"));

    // Budget dimension should change
    const budgetA = resultA.dimensions.find(d => d.key === "budget")!;
    const budgetB = resultB.dimensions.find(d => d.key === "budget")!;

    expect(budgetB.score!).toBeLessThan(budgetA.score!);

    // Other dimensions should remain the same (since only budget changed)
    for (const dimKey of ["academic", "language", "admission", "location", "career", "lifestyle", "format", "support"]) {
      const dimA = resultA.dimensions.find(d => d.key === dimKey);
      const dimB = resultB.dimensions.find(d => d.key === dimKey);

      if (dimA?.applicable && dimB?.applicable) {
        expect(dimB.score).toBe(dimA.score);
      }
    }
  });
});