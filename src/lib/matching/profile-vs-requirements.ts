import type {
  MatchUserProfile,
  ProgrammeWithDetails,
} from "./match-types";
import type { CefrLevel } from "@/types/database";

/**
 * "Your profile vs requirements" (§39) — the per-fact comparison between
 * what the user has on file and what a programme actually requires.
 * Pure and deterministic like the rest of `src/lib/matching`; the UI
 * renders the returned rows, it never renders scores.
 *
 * Output rows carry language-neutral display strings (`you`/`requirement`
 * like "IELTS 7.0", "NMT 186/200", "C1", "bachelor", "Excellent" — these
 * are domain values, not UI copy) and a status the page maps to
 * ✓ Meets / ⚠ Check details / ✗ Does not meet / grey "not enough data".
 */

export type VsRowKey =
  | "english"
  | "mathematics"
  | "degree_level"
  | "gpa"
  | "entrance_exam";

export type VsStatus = "yes" | "no";

export interface ProfileVsRequirementRow {
  key: VsRowKey;
  status: VsStatus;
  /** What the user has on file; null when nothing comparable is recorded. */
  you: string | null;
  /** What the programme requires; null when the programme publishes nothing. */
  requirement: string | null;
  /** Human-readable reason for the status (especially for "no"). */
  reason: string | null;
}

export interface VsUserInput {
  profile: Pick<
    MatchUserProfile,
    | "current_education_level"
    | "current_gpa"
    | "current_gpa_scale"
    | "english_level"
    | "math_background"
  >;
  testScores: {
    test_type: string;
    qualification_id: string | null;
    score: number;
    score_display: string;
    cefr_equivalent: CefrLevel | null;
  }[];
  nmtScores: { subject_code: string; score: number; max_score: number }[];
}

/** A1=1 … C2=6, native counts as C2. */
const CEFR_ORDINAL: Record<string, number> = {
  a1: 1,
  a2: 2,
  b1: 3,
  b2: 4,
  c1: 5,
  c2: 6,
  native: 6,
};

const MATH_ORDINAL: Record<string, number> = {
  excellent: 4,
  good: 3,
  average: 2,
  weak: 1,
};

const EDUCATION_ORDINAL: Record<string, number> = {
  high_school: 0,
  foundation: 0,
  bachelor: 1,
  master: 2,
  phd: 3,
};

function userCefrOrdinal(
  profile: VsUserInput["profile"],
  testScores: VsUserInput["testScores"],
): number | null {
  for (const score of testScores) {
    if (score.cefr_equivalent && CEFR_ORDINAL[score.cefr_equivalent] != null) {
      return CEFR_ORDINAL[score.cefr_equivalent];
    }
  }
  if (profile.english_level && CEFR_ORDINAL[profile.english_level] != null) {
    return CEFR_ORDINAL[profile.english_level];
  }
  return null;
}

/** Best user English on record, for the "You" column even when no requirement matches. */
function bestUserEnglish(input: VsUserInput): string | null {
  const scored = input.testScores
    .filter((s) => s.score != null)
    .sort((a, b) => b.score - a.score);
  if (scored.length > 0) return scored[0].score_display;
  const cefr = userCefrOrdinal(input.profile, input.testScores);
  if (cefr != null) {
    return CEFR_ORDINAL_KEYS[cefr]?.toUpperCase() ?? null;
  }
  return null;
}

const CEFR_ORDINAL_KEYS = ["", "a1", "a2", "b1", "b2", "c1", "c2"];

/** "7" → "7.0", "6.5" → "6.5" — keeps the trailing zero scores usually carry. */
function formatScore(value: number): string {
  return Number.isInteger(value) ? value.toFixed(1) : String(value);
}

export function compareEnglish(
  input: VsUserInput,
  programme: ProgrammeWithDetails,
): ProfileVsRequirementRow {
  // English row is driven by language-category test requirements (§50).
  const reqs = programme.test_requirements.filter(
    (r) => r.qualification.category === "language",
  );
  if (reqs.length === 0) {
    return {
      key: "english",
      status: "no",
      you: bestUserEnglish(input),
      requirement: null,
      reason: "Програма не вимагає мовного сертифіката",
    };
  }

  const userScoreForRequirement = (
    qualificationId: string,
    qualificationName: string,
  ) =>
    input.testScores.find(
      (s) =>
        (s.qualification_id != null && s.qualification_id === qualificationId) ||
        (s.qualification_id == null &&
          s.test_type.toLowerCase() === qualificationName.toLowerCase()),
    );

  // Exact test match first: user IELTS 7.0 vs requirement IELTS 6.5.
  for (const req of reqs) {
    const user = userScoreForRequirement(req.qualification_id, req.qualification.name);
    if (user && user.score != null) {
      const meets = req.minimum_score == null || user.score >= req.minimum_score;
      return {
        key: "english",
        status: meets ? "yes" : "no",
        you: `${req.qualification.name} ${formatScore(user.score)}`,
        requirement: `${req.qualification.name} ${req.minimum_score_display ?? ""}`,
        reason: meets ? null : `Ваш бал ${formatScore(user.score)} нижче ніж потрібні ${req.minimum_score_display ?? req.minimum_score}`,
      };
    }
  }

  // CEFR requirement: compare ordinals (A1=1 … C2=6).
  const cefrReq = reqs.find((r) => r.qualification.code.toLowerCase() === "cefr");
  if (cefrReq) {
    const userOrdinal = userCefrOrdinal(input.profile, input.testScores);
    if (userOrdinal != null) {
      const meets = userOrdinal >= Math.round(cefrReq.minimum_score ?? 0);
      return {
        key: "english",
        status: meets ? "yes" : "no",
        you: CEFR_ORDINAL_KEYS[userOrdinal]?.toUpperCase() ?? null,
        requirement: cefrReq.minimum_score_display ?? cefrReq.qualification.name,
        reason: meets ? null : `Ваш рівень ${CEFR_ORDINAL_KEYS[userOrdinal]?.toUpperCase()} нижче ніж потрібний ${cefrReq.minimum_score_display ?? cefrReq.qualification.name}`,
      };
    }
    return {
      key: "english",
      status: "no",
      you: null,
      requirement: cefrReq.minimum_score_display ?? cefrReq.qualification.name,
      reason: "Немає даних про рівень англійської",
    };
  }

  return {
    key: "english",
    status: "no",
    you: bestUserEnglish(input),
    requirement: reqs
      .map((r) => `${r.qualification.name} ${r.minimum_score_display ?? ""}`.trim())
      .join(" / "),
    reason: "Немає відповідного мовного сертифіката",
  };
}

export function compareMathematics(
  input: VsUserInput,
  programme: ProgrammeWithDetails,
): ProfileVsRequirementRow {
  const req = programme.academic_requirements;
  const nmtMath = input.nmtScores.find((s) => s.subject_code === "mathematics");

  const youParts: string[] = [];
  if (nmtMath) youParts.push(`NMT ${nmtMath.score}/${nmtMath.max_score}`);
  if (input.profile.math_background) youParts.push(input.profile.math_background);
  const you = youParts.length > 0 ? youParts.join(" · ") : null;

  const reqMath = req?.required_math_background ?? null;
  if (reqMath) {
    const reqOrdinal = MATH_ORDINAL[reqMath];
    const userOrdinal = input.profile.math_background
      ? MATH_ORDINAL[input.profile.math_background]
      : null;
    if (userOrdinal != null && reqOrdinal != null) {
      const meets = userOrdinal >= reqOrdinal;
      return {
        key: "mathematics",
        status: meets ? "yes" : "no",
        you,
        requirement: reqMath,
        reason: meets ? null : `Ваш рівень математики (${input.profile.math_background}) нижче ніж потрібний ${reqMath}`,
      };
    }
    return {
      key: "mathematics",
      status: "no",
      you,
      requirement: reqMath,
      reason: "Не вказано рівень математики",
    };
  }

  // No structured mathematics requirement — per §39 this is a "check the
  // details" case (e.g. "Equivalent required qualification / entrance
  // exam") when the programme still gates admission, otherwise nothing
  // is published to compare against.
  if (req?.entrance_exam_required) {
    return {
      key: "mathematics",
      status: "no",
      you,
      requirement: req.entrance_exam_notes ?? "Equivalent required qualification / entrance exam",
      reason: "Потрібний вступний іспит з математики",
    };
  }
  return { key: "mathematics", status: "no", you, requirement: null, reason: "Програма не вимагає математики" };
}

export function compareDegreeLevel(
  input: VsUserInput,
  programme: ProgrammeWithDetails,
): ProfileVsRequirementRow | null {
  const req = programme.academic_requirements?.required_degree_level ?? null;
  const you = input.profile.current_education_level ?? null;
  if (!req) {
    return null;
  }
  const userOrdinal = input.profile.current_education_level
    ? EDUCATION_ORDINAL[input.profile.current_education_level]
    : null;
  if (userOrdinal == null) {
    return {
      key: "degree_level",
      status: "no",
      you: null,
      requirement: req,
      reason: "Не вказано рівень освіти",
    };
  }
  const meets = userOrdinal >= EDUCATION_ORDINAL[req];
  return {
    key: "degree_level",
    status: meets ? "yes" : "no",
    you,
    requirement: req,
    reason: meets ? null : `Ваш рівень освіти (${you}) нижче ніж потрібний ${req}`,
  };
}

export function compareGpa(
  input: VsUserInput,
  programme: ProgrammeWithDetails,
): ProfileVsRequirementRow {
  const req = programme.academic_requirements;
  const you =
    input.profile.current_gpa != null && input.profile.current_gpa_scale != null
      ? `${formatScore(input.profile.current_gpa)}/${formatScore(input.profile.current_gpa_scale)}`
      : null;
  if (req?.min_gpa == null || req.gpa_scale == null) {
    return { key: "gpa", status: "no", you, requirement: null, reason: "Програма не вимагає середній бал" };
  }
  const requirement = `${formatScore(req.min_gpa)}/${formatScore(req.gpa_scale)}`;
  if (
    input.profile.current_gpa == null ||
    input.profile.current_gpa_scale == null
  ) {
    return { key: "gpa", status: "no", you: null, requirement, reason: "Не вказано середній бал" };
  }
  const meets =
    input.profile.current_gpa / input.profile.current_gpa_scale >=
    req.min_gpa / req.gpa_scale;
  return { key: "gpa", status: meets ? "yes" : "no", you, requirement, reason: meets ? null : `Ваш середній бал (${you}) нижче ніж потрібні ${requirement}` };
}

export function compareEntranceExam(
  programme: ProgrammeWithDetails,
): ProfileVsRequirementRow {
  const req = programme.academic_requirements;
  if (!req || !req.entrance_exam_required) {
    return {
      key: "entrance_exam",
      status: req ? "yes" : "no",
      you: null,
      requirement: req ? "Not required" : null,
      reason: req ? null : "Програма не вимагає вступного іспиту",
    };
  }
  return {
    key: "entrance_exam",
    status: "no",
    you: null,
    requirement: req.entrance_exam_notes ?? "Required",
    reason: "Потрібний вступний іспит",
  };
}

/** All "your profile vs requirements" rows for one programme (§39). */
export function compareProfileVsRequirements(
  input: VsUserInput,
  programme: ProgrammeWithDetails,
): ProfileVsRequirementRow[] {
  const rows: ProfileVsRequirementRow[] = [
    compareEnglish(input, programme),
    compareMathematics(input, programme),
    compareGpa(input, programme),
    compareEntranceExam(programme),
  ];
  const degreeLevel = compareDegreeLevel(input, programme);
  if (degreeLevel) rows.push(degreeLevel);
  return rows;
}