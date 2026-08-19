import { describe, expect, it } from "vitest";
import { scoreAcademicFit } from "./score-academic";
import {
  hasMessageKey,
  hasRawMessage,
  makeProfile,
  makeProgramme,
  paramsForKey,
} from "./test-fixtures";

describe("scoreAcademicFit", () => {
  it("scores 100 and adds a reason when the user's GPA meets the requirement exactly", () => {
    const profile = makeProfile({ current_gpa: 3.2, current_gpa_scale: 4.0 });
    const programme = makeProgramme();

    const result = scoreAcademicFit(profile, programme);

    expect(result.score).toBe(100);
    expect(result.applicable).toBe(true);
    expect(hasMessageKey(result.reasons, "academic.meetsGpa")).toBe(true);
  });

  it("scores 100 when the user's GPA exceeds the requirement, even on a different scale", () => {
    // User's 8.5/10 (normalized 0.85) vs a requirement of 3.2/4.0 (normalized 0.8)
    const profile = makeProfile({ current_gpa: 8.5, current_gpa_scale: 10 });
    const programme = makeProgramme();

    const result = scoreAcademicFit(profile, programme);

    expect(result.score).toBe(100);
  });

  it("scores proportionally below 100 when GPA falls short, and adds a concern", () => {
    // normalized 0.6 vs required 0.8 -> ratio 0.75 -> score 75
    const profile = makeProfile({ current_gpa: 2.4, current_gpa_scale: 4.0 });
    const programme = makeProgramme();

    const result = scoreAcademicFit(profile, programme);

    expect(result.score).toBe(75);
    expect(result.concerns.length).toBeGreaterThan(0);
  });

  it("is not applicable when the user hasn't entered a GPA but the programme has a requirement", () => {
    const profile = makeProfile({ current_gpa: null, current_gpa_scale: null });
    const programme = makeProgramme();

    const result = scoreAcademicFit(profile, programme);

    expect(result.score).toBeNull();
    expect(result.applicable).toBe(false);
    expect(hasMessageKey(result.concerns, "academic.missingGpa")).toBe(true);
  });

  it("scores 100 when the programme has no GPA requirement at all", () => {
    const profile = makeProfile({ current_gpa: null, current_gpa_scale: null });
    const programme = makeProgramme({
      academic_requirements: {
        id: "req-1",
        programme_id: "programme-1",
        min_gpa: null,
        gpa_scale: null,
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

    const result = scoreAcademicFit(profile, programme);

    expect(result.score).toBe(100);
    expect(result.applicable).toBe(true);
  });

  it("flags required subjects as a concern, with subjects passed as a message param, without affecting the numeric score", () => {
    const profile = makeProfile();
    const programme = makeProgramme({
      academic_requirements: {
        id: "req-1",
        programme_id: "programme-1",
        min_gpa: 3.2,
        gpa_scale: 4.0,
        required_subjects: ["Mathematics", "Physics"],
        entrance_exam_required: false,
        entrance_exam_notes: null,
        portfolio_required: false,
        interview_required: false,
        notes: null,
        required_degree_level: null,
        required_math_background: null,
      },
    });

    const result = scoreAcademicFit(profile, programme);

    expect(result.score).toBe(100);
    expect(hasMessageKey(result.concerns, "academic.requiredSubjects")).toBe(true);
    expect(paramsForKey(result.concerns, "academic.requiredSubjects")?.subjects).toBe(
      "Mathematics, Physics",
    );
  });

  it("flags an entrance exam requirement as a generic translated concern when there are no custom notes", () => {
    const profile = makeProfile();
    const programme = makeProgramme({
      academic_requirements: {
        id: "req-1",
        programme_id: "programme-1",
        min_gpa: 3.2,
        gpa_scale: 4.0,
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

    const result = scoreAcademicFit(profile, programme);

    expect(hasMessageKey(result.concerns, "academic.entranceExamGeneric")).toBe(true);
  });

  it("uses the programme's own entrance exam notes verbatim (raw, untranslated) when present", () => {
    const profile = makeProfile();
    const programme = makeProgramme({
      academic_requirements: {
        id: "req-1",
        programme_id: "programme-1",
        min_gpa: 3.2,
        gpa_scale: 4.0,
        required_subjects: [],
        entrance_exam_required: true,
        entrance_exam_notes: "Entrance test in mathematics and logical reasoning.",
        notes: null,
        required_degree_level: null,
        required_math_background: null,
        portfolio_required: false,
        interview_required: false,
      },
    });

    const result = scoreAcademicFit(profile, programme);

    expect(
      hasRawMessage(
        result.concerns,
        "Entrance test in mathematics and logical reasoning.",
      ),
    ).toBe(true);
    // Should NOT also emit the generic translated fallback.
    expect(hasMessageKey(result.concerns, "academic.entranceExamGeneric")).toBe(false);
  });

  it("adds a field-of-study match reason (with the field name as a param) without affecting the score", () => {
    const profile = makeProfile({
      current_gpa: 2.0,
      current_gpa_scale: 4.0,
      preferred_field_of_study_ids: ["field-cs"],
    });
    const programme = makeProgramme({ field_of_study_id: "field-cs" });

    const result = scoreAcademicFit(profile, programme);

    expect(hasMessageKey(result.reasons, "academic.fieldMatch")).toBe(true);
    expect(paramsForKey(result.reasons, "academic.fieldMatch")?.field).toBe(
      "Computer Science",
    );
    // Score is still purely GPA-derived (0.5 / 0.8 = 0.625 -> 63).
    expect(result.score).toBe(63);
  });

  it("scores 100 when an NMT subject requirement is met by the user's NMT score", () => {
    const profile = makeProfile({
      current_gpa: 3.2,
      current_gpa_scale: 4.0,
      nmtScores: [{ subject_code: "mathematics", score: 186, max_score: 200 }],
    });
    const programme = makeProgramme({
      test_requirements: [
        ...makeProgramme().test_requirements,
        {
          id: "test-req-nmt",
          programme_id: "programme-1",
          qualification_id: "qual-nmt",
          section: "NMT",
          subject: "mathematics",
          minimum_score: 60,
          minimum_score_display: "60",
          comparison: "greater_or_equal",
          notes: null,
          created_at: "2026-01-01T00:00:00.000Z",
          updated_at: "2026-01-01T00:00:00.000Z",
          qualification: {
            id: "qual-nmt",
            code: "nmt",
            name: "NMT",
            category: "national",
            description: null,
            max_score: 200,
            active: true,
            sort_order: 1,
            created_at: "2026-01-01T00:00:00.000Z",
            updated_at: "2026-01-01T00:00:00.000Z",
          },
        },
      ],
    });

    const result = scoreAcademicFit(profile, programme);

    expect(result.score).toBe(100);
    expect(hasMessageKey(result.reasons, "academic.meetsTestRequirement")).toBe(true);
    expect(
      paramsForKey(result.reasons, "academic.meetsTestRequirement")?.testType,
    ).toBe("NMT mathematics");
  });

  it("lowers the score when the user's NMT subject score is below the requirement, and adds a concern", () => {
    const profile = makeProfile({
      current_gpa: 3.2,
      current_gpa_scale: 4.0,
      nmtScores: [{ subject_code: "mathematics", score: 45, max_score: 200 }],
    });
    const programme = makeProgramme({
      test_requirements: [
        ...makeProgramme().test_requirements,
        {
          id: "test-req-nmt",
          programme_id: "programme-1",
          qualification_id: "qual-nmt",
          section: "NMT",
          subject: "mathematics",
          minimum_score: 60,
          minimum_score_display: "60",
          comparison: "greater_or_equal",
          notes: null,
          created_at: "2026-01-01T00:00:00.000Z",
          updated_at: "2026-01-01T00:00:00.000Z",
          qualification: {
            id: "qual-nmt",
            code: "nmt",
            name: "NMT",
            category: "national",
            description: null,
            max_score: 200,
            active: true,
            sort_order: 1,
            created_at: "2026-01-01T00:00:00.000Z",
            updated_at: "2026-01-01T00:00:00.000Z",
          },
        },
      ],
    });

    const result = scoreAcademicFit(profile, programme);

    expect(result.score).toBe(65); // (100 GPA + 30 below) / 2
    expect(hasMessageKey(result.concerns, "academic.belowTestRequirement")).toBe(true);
  });

  it("adds a concern (without a score penalty) when the user has no evidence for a required test", () => {
    const profile = makeProfile({
      current_gpa: 3.2,
      current_gpa_scale: 4.0,
      nmtScores: [{ subject_code: "czech_language", score: 90, max_score: 100 }],
    });
    const programme = makeProgramme({
      test_requirements: [
        ...makeProgramme().test_requirements,
        {
          id: "test-req-nmt",
          programme_id: "programme-1",
          qualification_id: "qual-nmt",
          section: "NMT",
          subject: "mathematics",
          minimum_score: 60,
          minimum_score_display: "60",
          comparison: "greater_or_equal",
          notes: null,
          created_at: "2026-01-01T00:00:00.000Z",
          updated_at: "2026-01-01T00:00:00.000Z",
          qualification: {
            id: "qual-nmt",
            code: "nmt",
            name: "NMT",
            category: "national",
            description: null,
            max_score: 200,
            active: true,
            sort_order: 1,
            created_at: "2026-01-01T00:00:00.000Z",
            updated_at: "2026-01-01T00:00:00.000Z",
          },
        },
      ],
    });

    const result = scoreAcademicFit(profile, programme);

    expect(result.score).toBe(100); // GPA only — missing evidence isn't a penalty
    expect(hasMessageKey(result.concerns, "academic.missingTestRequirement")).toBe(true);
  });

  it("meets an SAT requirement via a recorded test score", () => {
    const profile = makeProfile({
      current_gpa: 3.2,
      current_gpa_scale: 4.0,
      testScores: [
        { test_type: "SAT", qualification_id: "qual-sat", score: 1350, cefr_equivalent: null },
      ],
    });
    const programme = makeProgramme({
      test_requirements: [
        ...makeProgramme().test_requirements,
        {
          id: "test-req-sat",
          programme_id: "programme-1",
          qualification_id: "qual-sat",
          section: null,
          subject: null,
          minimum_score: 1200,
          minimum_score_display: "1200",
          comparison: "greater_or_equal",
          notes: null,
          created_at: "2026-01-01T00:00:00.000Z",
          updated_at: "2026-01-01T00:00:00.000Z",
          qualification: {
            id: "qual-sat",
            code: "sat",
            name: "SAT",
            category: "academic",
            description: null,
            max_score: 1600,
            active: true,
            sort_order: 5,
            created_at: "2026-01-01T00:00:00.000Z",
            updated_at: "2026-01-01T00:00:00.000Z",
          },
        },
      ],
    });

    const result = scoreAcademicFit(profile, programme);

    expect(result.score).toBe(100);
    expect(hasMessageKey(result.reasons, "academic.meetsTestRequirement")).toBe(true);
  });

  it("counts a held qualification without a published threshold as meeting the requirement", () => {
    const profile = makeProfile({
      current_gpa: 3.2,
      current_gpa_scale: 4.0,
      qualifications: [{ qualification_id: "qual-a", year: 2025 }],
    });
    const programme = makeProgramme({
      test_requirements: [
        ...makeProgramme().test_requirements,
        {
          id: "test-req-a",
          programme_id: "programme-1",
          qualification_id: "qual-a",
          section: null,
          subject: null,
          minimum_score: null,
          minimum_score_display: null,
          comparison: "greater_or_equal",
          notes: null,
          created_at: "2026-01-01T00:00:00.000Z",
          updated_at: "2026-01-01T00:00:00.000Z",
          qualification: {
            id: "qual-a",
            code: "a_levels",
            name: "A-Levels",
            category: "academic",
            description: null,
            max_score: null,
            active: true,
            sort_order: 8,
            created_at: "2026-01-01T00:00:00.000Z",
            updated_at: "2026-01-01T00:00:00.000Z",
          },
        },
      ],
    });

    const result = scoreAcademicFit(profile, programme);

    expect(result.score).toBe(100);
    expect(hasMessageKey(result.reasons, "academic.hasQualification")).toBe(true);
  });

  it("treats a held qualification as unverified (score penalty, no silent pass) when a threshold is published", () => {
    const profile = makeProfile({
      current_gpa: 3.2,
      current_gpa_scale: 4.0,
      qualifications: [{ qualification_id: "qual-a", year: 2025 }],
    });
    const programme = makeProgramme({
      test_requirements: [
        ...makeProgramme().test_requirements,
        {
          id: "test-req-a",
          programme_id: "programme-1",
          qualification_id: "qual-a",
          section: null,
          subject: null,
          minimum_score: 120,
          minimum_score_display: "120 UCAS points",
          comparison: "greater_or_equal",
          notes: null,
          created_at: "2026-01-01T00:00:00.000Z",
          updated_at: "2026-01-01T00:00:00.000Z",
          qualification: {
            id: "qual-a",
            code: "a_levels",
            name: "A-Levels",
            category: "academic",
            description: null,
            max_score: null,
            active: true,
            sort_order: 8,
            created_at: "2026-01-01T00:00:00.000Z",
            updated_at: "2026-01-01T00:00:00.000Z",
          },
        },
      ],
    });

    const result = scoreAcademicFit(profile, programme);

    expect(result.score).toBe(65); // (100 GPA + 30 unverified) / 2
    expect(hasMessageKey(result.concerns, "academic.qualificationUnverified")).toBe(true);
  });
});
