import { describe, expect, it } from "vitest";
import {
  checkDegreeLevel,
  checkMathBackground,
} from "./hard-requirements";
import { makeProfile, makeProgramme } from "./test-fixtures";

describe("checkDegreeLevel (C1 regression)", () => {
  it("school graduate applying to bachelor's programme PASSES", () => {
    const profile = makeProfile({
      current_education_level: "high_school",
    });
    const programme = makeProgramme({
      degree_level: "bachelor",
      academic_requirements: {
        ...makeProgramme().academic_requirements!,
        required_degree_level: null,
      },
    });

    const result = checkDegreeLevel(profile, programme);
    expect(result.status).not.toBe("fail");
  });

  it("school graduate applying to master's programme FAILS", () => {
    const profile = makeProfile({
      current_education_level: "high_school",
    });
    const programme = makeProgramme({
      degree_level: "master",
      academic_requirements: {
        ...makeProgramme().academic_requirements!,
        required_degree_level: "bachelor",
      },
    });

    const result = checkDegreeLevel(profile, programme);
    expect(result.status).toBe("fail");
  });

  it("no required_degree_level set → always pass", () => {
    const profile = makeProfile({ current_education_level: "high_school" });
    const programme = makeProgramme({
      academic_requirements: {
        ...makeProgramme().academic_requirements!,
        required_degree_level: null,
      },
    });

    const result = checkDegreeLevel(profile, programme);
    expect(result.status).toBe("pass");
  });

  it("bachelor holder applying to master's PASSES", () => {
    const profile = makeProfile({
      current_education_level: "bachelor",
    });
    const programme = makeProgramme({
      degree_level: "master",
      academic_requirements: {
        ...makeProgramme().academic_requirements!,
        required_degree_level: "bachelor",
      },
    });

    const result = checkDegreeLevel(profile, programme);
    expect(result.status).toBe("pass");
  });
});

describe("checkMathBackground (audit M7)", () => {
  it("weak math against good requirement does NOT hard-fail", () => {
    const profile = makeProfile({ math_background: "weak" });
    const programme = makeProgramme({
      academic_requirements: {
        ...makeProgramme().academic_requirements!,
        required_math_background: "good",
      },
    });

    const result = checkMathBackground(profile, programme);
    expect(result.status).not.toBe("fail");
  });

  it("good math against average requirement PASSES", () => {
    const profile = makeProfile({ math_background: "good" });
    const programme = makeProgramme({
      academic_requirements: {
        ...makeProgramme().academic_requirements!,
        required_math_background: "average",
      },
    });

    const result = checkMathBackground(profile, programme);
    expect(result.status).toBe("pass");
  });
});