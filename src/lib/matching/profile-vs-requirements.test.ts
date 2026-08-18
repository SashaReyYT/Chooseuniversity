import { describe, expect, it } from "vitest";
import {
  compareEnglish,
  compareEntranceExam,
  compareGpa,
  compareMathematics,
  compareProfileVsRequirements,
  type VsUserInput,
} from "./profile-vs-requirements";
import { makeProgramme } from "./test-fixtures";
import type { ProgrammeTestRequirement } from "@/lib/repositories/programmes.repository";

function makeInput(overrides: Partial<VsUserInput> = {}): VsUserInput {
  return {
    profile: {
      current_education_level: "bachelor",
      current_gpa: 3.6,
      current_gpa_scale: 4.0,
      english_level: "b2",
      math_background: "good",
    },
    testScores: [
      {
        test_type: "IELTS",
        qualification_id: "qual-ielts",
        score: 7.0,
        score_display: "IELTS 7.0",
        cefr_equivalent: "c1",
      },
    ],
    nmtScores: [{ subject_code: "mathematics", score: 186, max_score: 200 }],
    ...overrides,
  };
}

function makeTestRequirement(
  qualification: Partial<{ code: string; name: string }> = {},
  overrides: Partial<Omit<ProgrammeTestRequirement, "qualification">> = {},
): ProgrammeTestRequirement {
  const code = qualification.code ?? "ielts";
  const name = qualification.name ?? "IELTS";
  return {
    id: "r",
    programme_id: "p",
    qualification_id: `qual-${code}`,
    section: null,
    subject: null,
    minimum_score: 6.5,
    minimum_score_display: "6.5",
    comparison: "greater_or_equal" as const,
    notes: null,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    qualification: {
      id: `qual-${code}`,
      code,
      name,
      category: "language" as const,
      description: null,
      max_score: 9,
      active: true,
      sort_order: 20,
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    },
    ...overrides,
  };
}

describe("compareEnglish (§39)", () => {
  it("meets when the user's test score beats the requirement", () => {
    const programme = makeProgramme({
      test_requirements: [makeTestRequirement()],
    });
    expect(compareEnglish(makeInput(), programme)).toEqual({
      key: "english",
      status: "meets",
      you: "IELTS 7.0",
      requirement: "IELTS 6.5",
    });
  });

  it("fails when the user's test score is below the requirement", () => {
    const programme = makeProgramme({
      test_requirements: [makeTestRequirement({}, { minimum_score: 7.5, minimum_score_display: "7.5" })],
    });
    const row = compareEnglish(makeInput(), programme);
    expect(row.status).toBe("fails");
    expect(row.you).toBe("IELTS 7.0");
    expect(row.requirement).toBe("IELTS 7.5");
  });

  it("compares CEFR levels ordinally when the requirement is CEFR", () => {
    const programme = makeProgramme({
      test_requirements: [
        makeTestRequirement({ code: "cefr", name: "CEFR" }, { minimum_score: 4, minimum_score_display: "B2" }),
      ],
    });
    const input = makeInput({
      testScores: [],
      profile: { ...makeInput().profile, english_level: "b2" },
    });
    expect(compareEnglish(input, programme)).toEqual({
      key: "english",
      status: "meets",
      you: "B2",
      requirement: "B2",
    });
  });

  it("returns unknown when the user has no comparable English data", () => {
    const programme = makeProgramme({
      test_requirements: [
        makeTestRequirement({ code: "toefl", name: "TOEFL" }, { minimum_score: 90, minimum_score_display: "90" }),
      ],
    });
    const input = makeInput({ testScores: [], profile: { ...makeInput().profile, english_level: null } });
    const row = compareEnglish(input, programme);
    expect(row.status).toBe("unknown");
    expect(row.you).toBeNull();
  });

  it("returns unknown with no requirement when the programme lists none", () => {
    const programme = makeProgramme({ test_requirements: [] });
    const row = compareEnglish(makeInput(), programme);
    expect(row.status).toBe("unknown");
    expect(row.requirement).toBeNull();
  });
});

describe("compareMathematics (§39)", () => {
  it("shows the user's NMT score and flags check when admission is exam-gated", () => {
    const programme = makeProgramme({
      academic_requirements: {
        id: "r",
        programme_id: "p",
        min_gpa: null,
        gpa_scale: null,
        required_subjects: [],
        entrance_exam_required: true,
        entrance_exam_notes: null,
        portfolio_required: false,
        interview_required: false,
        notes: null,
        required_degree_level: null,
        required_math_background: null,
      },
    });
    const row = compareMathematics(makeInput(), programme);
    expect(row).toEqual({
      key: "mathematics",
      status: "check",
      you: "NMT 186/200 · good",
      requirement: "Equivalent required qualification / entrance exam",
    });
  });

  it("meets a structured mathematics background requirement", () => {
    const programme = makeProgramme({
      academic_requirements: {
        id: "r",
        programme_id: "p",
        min_gpa: null,
        gpa_scale: null,
        required_subjects: [],
        entrance_exam_required: false,
        entrance_exam_notes: null,
        portfolio_required: false,
        interview_required: false,
        notes: null,
        required_degree_level: null,
        required_math_background: "average",
      },
    });
    expect(compareMathematics(makeInput(), programme).status).toBe("meets");
  });

  it("fails a mathematics background requirement the user is clearly below", () => {
    const programme = makeProgramme({
      academic_requirements: {
        id: "r",
        programme_id: "p",
        min_gpa: null,
        gpa_scale: null,
        required_subjects: [],
        entrance_exam_required: false,
        entrance_exam_notes: null,
        portfolio_required: false,
        interview_required: false,
        notes: null,
        required_degree_level: null,
        required_math_background: "excellent",
      },
    });
    expect(compareMathematics(makeInput(), programme).status).toBe("fails");
  });
});

describe("compareDegreeLevel (§39)", () => {
  it("meets when the user's education level covers the requirement", () => {
    const programme = makeProgramme({
      academic_requirements: {
        id: "r",
        programme_id: "p",
        min_gpa: null,
        gpa_scale: null,
        required_subjects: [],
        entrance_exam_required: false,
        entrance_exam_notes: null,
        portfolio_required: false,
        interview_required: false,
        notes: null,
        required_degree_level: "foundation",
        required_math_background: null,
      },
    });
    expect(compareProfileVsRequirements(makeInput(), programme)[2].status).toBe("meets");
  });

  it("fails when the user's education level is below the requirement", () => {
    const programme = makeProgramme({
      academic_requirements: {
        id: "r",
        programme_id: "p",
        min_gpa: null,
        gpa_scale: null,
        required_subjects: [],
        entrance_exam_required: false,
        entrance_exam_notes: null,
        portfolio_required: false,
        interview_required: false,
        notes: null,
        required_degree_level: "master",
        required_math_background: null,
      },
    });
    expect(compareProfileVsRequirements(makeInput(), programme)[2].status).toBe("fails");
  });
});

describe("compareGpa (§39)", () => {
  it("meets when the normalized user GPA clears the minimum", () => {
    const programme = makeProgramme();
    expect(compareGpa(makeInput(), programme).status).toBe("meets");
  });

  it("fails when the normalized user GPA is below the minimum", () => {
    const programme = makeProgramme({
      academic_requirements: {
        id: "r",
        programme_id: "p",
        min_gpa: 3.8,
        gpa_scale: 4.0,
        required_subjects: [],
        entrance_exam_required: false,
        entrance_exam_notes: null,
        portfolio_required: false,
        interview_required: false,
        notes: null,
        required_degree_level: null,
        required_math_background: null,
      },
    });
    expect(compareGpa(makeInput(), programme).status).toBe("fails");
  });

  it("returns unknown when the user has no GPA on file", () => {
    const input = makeInput({
      profile: { ...makeInput().profile, current_gpa: null, current_gpa_scale: null },
    });
    const row = compareGpa(input, makeProgramme());
    expect(row.status).toBe("unknown");
    expect(row.you).toBeNull();
    expect(row.requirement).toBe("3.2/4.0");
  });
});

describe("compareEntranceExam (§39)", () => {
  it("is a check when an exam is required", () => {
    const programme = makeProgramme({
      academic_requirements: {
        id: "r",
        programme_id: "p",
        min_gpa: null,
        gpa_scale: null,
        required_subjects: [],
        entrance_exam_required: true,
        entrance_exam_notes: "GAP test via SCIO",
        portfolio_required: false,
        interview_required: false,
        notes: null,
        required_degree_level: null,
        required_math_background: null,
      },
    });
    expect(compareEntranceExam(programme)).toEqual({
      key: "entrance_exam",
      status: "check",
      you: null,
      requirement: "GAP test via SCIO",
    });
  });

  it("is a pass when no exam is required", () => {
    const programme = makeProgramme();
    expect(compareEntranceExam(programme).status).toBe("meets");
  });
});

describe("compareProfileVsRequirements (§39)", () => {
  it("always returns the five rows in spec order", () => {
    const rows = compareProfileVsRequirements(makeInput(), makeProgramme());
    expect(rows.map((r) => r.key)).toEqual([
      "english",
      "mathematics",
      "degree_level",
      "gpa",
      "entrance_exam",
    ]);
  });
});