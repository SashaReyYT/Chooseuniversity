import { describe, expect, it } from "vitest";
import {
  isGraduateStage,
  listField,
  mapEnglishLevel,
  mapMathStrength,
  mapStage,
  optionalNumber,
  optionalText,
  parseBudgetMode,
  parseEnum,
} from "./profile-mapping";

function form(entries: [string, string][]): FormData {
  const f = new FormData();
  for (const [key, value] of entries) f.append(key, value);
  return f;
}

describe("mapStage", () => {
  it("maps school stages to high_school / not graduated / bachelor", () => {
    for (const stage of ["grade_9", "grade_10", "grade_11"]) {
      expect(mapStage(stage)).toEqual({
        currentEducationLevel: "high_school",
        hasGraduated: false,
        preferredDegreeLevel: "bachelor",
      });
    }
  });

  it("maps graduates (finished school / college) to graduated", () => {
    for (const stage of ["finished_school", "college"]) {
      expect(mapStage(stage)).toEqual({
        currentEducationLevel: "high_school",
        hasGraduated: true,
        preferredDegreeLevel: "bachelor",
      });
    }
  });

  it("returns nulls for unknown stages", () => {
    expect(mapStage("other")).toEqual({
      currentEducationLevel: null,
      hasGraduated: null,
      preferredDegreeLevel: null,
    });
    expect(mapStage(null)).toEqual({
      currentEducationLevel: null,
      hasGraduated: null,
      preferredDegreeLevel: null,
    });
  });
});

describe("isGraduateStage", () => {
  it("is true only for finished_school and college", () => {
    expect(isGraduateStage("finished_school")).toBe(true);
    expect(isGraduateStage("college")).toBe(true);
    expect(isGraduateStage("grade_11")).toBe(false);
    expect(isGraduateStage("grade_9")).toBe(false);
    expect(isGraduateStage("other")).toBe(false);
    expect(isGraduateStage(null)).toBe(false);
  });
});

describe("mapMathStrength", () => {
  it("derives the engine's math_background from the Q9 answer", () => {
    expect(mapMathStrength("good")).toBe("excellent");
    expect(mapMathStrength("average")).toBe("average");
    expect(mapMathStrength("poor")).toBe("weak");
    expect(mapMathStrength("not_sure")).toBeNull();
    expect(mapMathStrength(null)).toBeNull();
  });
});

describe("mapEnglishLevel", () => {
  it("derives the engine's english_level from the Q7 'en' proficiency", () => {
    expect(mapEnglishLevel("good")).toBe("b2");
    expect(mapEnglishLevel("average")).toBe("b1");
    expect(mapEnglishLevel("poor")).toBe("a2");
    expect(mapEnglishLevel("not_sure")).toBe("not_sure");
    expect(mapEnglishLevel(null)).toBeNull();
  });
});

describe("form parsing helpers", () => {
  it("optionalText trims and nulls empties", () => {
    expect(optionalText(form([["a", "  Kyiv "]]), "a")).toBe("Kyiv");
    expect(optionalText(form([["a", ""]]), "a")).toBeNull();
    expect(optionalText(new FormData(), "a")).toBeNull();
  });

  it("listField collects repeated values in order", () => {
    expect(
      listField(form([["c", "CZ"], ["c", "PL"], ["c", ""]]), "c"),
    ).toEqual(["CZ", "PL"]);
    expect(listField(new FormData(), "c")).toEqual([]);
  });

  it("optionalNumber returns null for empty/invalid input", () => {
    expect(optionalNumber(form([["n", "180"]]), "n")).toBe(180);
    expect(optionalNumber(form([["n", ""]]), "n")).toBeNull();
    expect(optionalNumber(form([["n", "abc"]]), "n")).toBeNull();
  });

  it("parseEnum only accepts allowed values", () => {
    expect(parseEnum("grade_10", ["grade_9", "grade_10", "grade_11"])).toBe("grade_10");
    expect(parseEnum("nope", ["grade_9", "grade_10", "grade_11"])).toBeNull();
    expect(parseEnum(null, ["grade_9"])).toBeNull();
  });

  it("parseBudgetMode covers the low/medium/high/unknown values", () => {
    expect(parseBudgetMode("medium")).toBe("medium");
    expect(parseBudgetMode("unknown")).toBe("unknown");
    expect(parseBudgetMode("exact")).toBeNull();
    expect(parseBudgetMode(null)).toBeNull();
  });
});