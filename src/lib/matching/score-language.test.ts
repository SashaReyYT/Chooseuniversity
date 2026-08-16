import { describe, expect, it } from "vitest";
import { scoreLanguageFit } from "./score-language";
import { hasMessageKey, makeProfile, makeProgramme, paramsForKey } from "./test-fixtures";

describe("scoreLanguageFit", () => {
  it("scores 100 when the language matches preference and the test score is met", () => {
    const profile = makeProfile({
      preferred_language_codes: ["en"],
      testScores: [{ test_type: "IELTS", score: 7.0 }],
    });
    const programme = makeProgramme();

    const result = scoreLanguageFit(profile, programme);

    expect(result.score).toBe(100);
    expect(hasMessageKey(result.reasons, "language.matchesPreferredLanguage")).toBe(true);
    expect(hasMessageKey(result.reasons, "language.meetsTestRequirement")).toBe(true);
  });

  it("is not applicable when the user has no language preference and no relevant test score", () => {
    const profile = makeProfile({ preferred_language_codes: [], testScores: [] });
    const programme = makeProgramme();

    const result = scoreLanguageFit(profile, programme);

    expect(result.applicable).toBe(false);
    expect(result.score).toBeNull();
  });

  it("scores using preference alone when no test score is available", () => {
    const profile = makeProfile({ preferred_language_codes: ["en"], testScores: [] });
    const programme = makeProgramme();

    const result = scoreLanguageFit(profile, programme);

    expect(result.score).toBe(100);
    expect(hasMessageKey(result.concerns, "language.addTestScore")).toBe(true);
  });

  it("lowers the score and adds a concern when the language doesn't match preference", () => {
    const profile = makeProfile({ preferred_language_codes: ["de"], testScores: [] });
    const programme = makeProgramme(); // English-taught

    const result = scoreLanguageFit(profile, programme);

    expect(result.score).toBeLessThan(100);
    expect(hasMessageKey(result.concerns, "language.notPreferredLanguage")).toBe(true);
    expect(paramsForKey(result.concerns, "language.notPreferredLanguage")?.language).toBe(
      "English",
    );
  });

  it("adds a concern with the numeric shortfall (as message params) when the test score is below the minimum", () => {
    const profile = makeProfile({
      preferred_language_codes: ["en"],
      testScores: [{ test_type: "IELTS", score: 5.5 }],
    });
    const programme = makeProgramme(); // requires IELTS 6.5

    const result = scoreLanguageFit(profile, programme);

    expect(result.score).toBeLessThan(100);
    expect(hasMessageKey(result.concerns, "language.belowTestRequirement")).toBe(true);
    const params = paramsForKey(result.concerns, "language.belowTestRequirement");
    expect(params?.score).toBe(5.5);
    expect(params?.minScore).toBe("6.5");
  });
});
