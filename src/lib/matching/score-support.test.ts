import { describe, expect, it } from "vitest";
import { scoreSupportFit } from "./score-support";
import { makeProgramme } from "./test-fixtures";

describe("scoreSupportFit", () => {
  it("is not applicable when none of the three facts are known", () => {
    const programme = makeProgramme({
      university: {
        ...makeProgramme().university,
        international_office: null,
        erasmus_participation: null,
        dormitory_available: null,
      },
    });

    const result = scoreSupportFit(programme);

    expect(result.applicable).toBe(false);
    expect(result.score).toBeNull();
  });

  it("scores 100 when all three known facts are positive", () => {
    const programme = makeProgramme({
      university: {
        ...makeProgramme().university,
        international_office: true,
        erasmus_participation: true,
        dormitory_available: true,
      },
    });

    const result = scoreSupportFit(programme);

    expect(result.score).toBe(100);
    expect(result.reasons.length).toBe(3);
    expect(result.concerns.length).toBe(0);
  });

  it("averages only the known signals, ignoring unresearched facts", () => {
    const programme = makeProgramme({
      university: {
        ...makeProgramme().university,
        international_office: true, // 100
        erasmus_participation: null, // unknown -> excluded
        dormitory_available: false, // 30
      },
    });

    const result = scoreSupportFit(programme);

    expect(result.score).toBe(65); // (100 + 30) / 2
    expect(result.reasons.length).toBe(1);
    expect(result.concerns.length).toBe(1);
  });

  it("surfaces international_support_notes as a reason without affecting the score", () => {
    const programme = makeProgramme({
      university: {
        ...makeProgramme().university,
        international_office: null,
        erasmus_participation: null,
        dormitory_available: null,
        international_support_notes: "Runs a buddy-system for incoming students.",
      },
    });

    const result = scoreSupportFit(programme);

    // Notes alone don't make the dimension applicable — no boolean fact is known.
    expect(result.applicable).toBe(false);
    expect(result.reasons).toContain(
      "Runs a buddy-system for incoming students.",
    );
  });

  it("doesn't depend on the user profile", () => {
    const programme = makeProgramme();

    expect(scoreSupportFit(programme).applicable).toBe(true);
  });
});
