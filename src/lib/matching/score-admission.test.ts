import { describe, expect, it } from "vitest";
import { scoreAdmissionFit } from "./score-admission";
import { hasMessageKey, makeProgramme, paramsForKey } from "./test-fixtures";

describe("scoreAdmissionFit", () => {
  it("is always applicable, even with no user profile involved", () => {
    const programme = makeProgramme();
    const result = scoreAdmissionFit(programme, new Date("2026-01-01"));
    expect(result.applicable).toBe(true);
  });

  it("scores 100 and notes no entrance exam when the deadline is far away", () => {
    const programme = makeProgramme({ application_deadline: "2027-06-01" });
    const result = scoreAdmissionFit(programme, new Date("2026-01-01"));

    expect(result.score).toBe(100);
    expect(hasMessageKey(result.reasons, "admission.noEntranceExam")).toBe(true);
    expect(hasMessageKey(result.reasons, "admission.deadlineInfo")).toBe(true);
    const params = paramsForKey(result.reasons, "admission.deadlineInfo");
    expect(params?.date).toBeInstanceOf(Date);
    expect((params?.date as Date).toISOString().slice(0, 10)).toBe("2027-06-01");
  });

  it("deducts and flags a concern when an entrance exam is required", () => {
    const programme = makeProgramme({
      academic_requirements: {
        id: "req-1",
        programme_id: "programme-1",
        min_gpa: 3.2,
        gpa_scale: 4.0,
        required_subjects: [],
        entrance_exam_required: true,
        entrance_exam_notes: null,
        notes: null,
      },
      application_deadline: "2027-06-01",
    });

    const result = scoreAdmissionFit(programme, new Date("2026-01-01"));

    expect(result.score).toBe(80);
    expect(hasMessageKey(result.concerns, "admission.entranceExamRequired")).toBe(true);
  });

  it("deducts and flags a concern when the deadline is within 30 days", () => {
    const programme = makeProgramme({ application_deadline: "2026-01-15" });
    const result = scoreAdmissionFit(programme, new Date("2026-01-01"));

    expect(result.score).toBe(85);
    expect(hasMessageKey(result.concerns, "admission.deadlineSoon")).toBe(true);
  });

  it("deducts more and flags a concern when the deadline has already passed", () => {
    const programme = makeProgramme({ application_deadline: "2025-12-01" });
    const result = scoreAdmissionFit(programme, new Date("2026-01-01"));

    expect(result.score).toBe(60);
    expect(hasMessageKey(result.concerns, "admission.deadlinePassed")).toBe(true);
  });

  it("combines an entrance exam deduction with a passed-deadline deduction", () => {
    const programme = makeProgramme({
      academic_requirements: {
        id: "req-1",
        programme_id: "programme-1",
        min_gpa: 3.2,
        gpa_scale: 4.0,
        required_subjects: [],
        entrance_exam_required: true,
        entrance_exam_notes: null,
        notes: null,
      },
      application_deadline: "2025-12-01",
    });

    const result = scoreAdmissionFit(programme, new Date("2026-01-01"));

    expect(result.score).toBe(40); // 100 - 20 - 40
  });
});
