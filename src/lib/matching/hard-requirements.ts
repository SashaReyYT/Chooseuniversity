import type {
  HardRequirementCheck,
  MatchUserProfile,
  ProgrammeWithDetails,
} from "./match-types";
import { translated } from "./messages";

/**
 * Hard requirements (spec §28): things that gate a programme
 * rather than merely affecting its score. If the user clearly fails a hard
 * requirement, the programme must not receive an artificially high Match
 * Score — the UI shows "Does not meet current admission requirement".
 *
 * Each check returns PASS, FAIL, or UNKNOWN (spec §29). UNKNOWN is the
 * honest third state: missing user data is never assumed to satisfy a
 * requirement, and never assumed to fail it either.
 */

/**
 * Degree-level hard requirement. A programme that requires a minimum
 * degree level (e.g. a Master's programme requiring a Bachelor's) is
 * failed if the user's current education level is clearly below it.
 */
export function checkDegreeLevel(
  profile: MatchUserProfile,
  programme: ProgrammeWithDetails,
): HardRequirementCheck {
  const required = programme.academic_requirements?.required_degree_level;
  if (!required) {
    return { type: "degree_level", status: "pass", message: "" };
  }

  const userLevel = profile.current_education_level;
  if (!userLevel) {
    return {
      type: "degree_level",
      status: "unknown",
      message: "hardRequirement.degreeLevelUnknown",
    };
  }

  // Ordering: high_school < foundation < bachelor < master < phd.
  // A user at or above the required level passes; below it fails.
  const ORDER: Record<string, number> = {
    high_school: 0,
    foundation: 1,
    bachelor: 2,
    master: 3,
    phd: 4,
  };

  const userRank = ORDER[userLevel] ?? -1;
  const requiredRank = ORDER[required] ?? -1;

  if (userRank >= requiredRank) {
    return { type: "degree_level", status: "pass", message: "" };
  }
  return {
    type: "degree_level",
    status: "fail",
    message: "hardRequirement.degreeLevelFail",
  };
}

/**
 * Mathematics background hard requirement. A programme that requires a
 * minimum mathematics background is failed if the user's self-assessed level
 * is clearly below it.
 */
export function checkMathBackground(
  profile: MatchUserProfile,
  programme: ProgrammeWithDetails,
): HardRequirementCheck {
  const required = programme.academic_requirements?.required_math_background;
  if (!required) {
    return { type: "math_background", status: "pass", message: "" };
  }

  const userLevel = profile.math_background;
  if (!userLevel) {
    return {
      type: "math_background",
      status: "unknown",
      message: "hardRequirement.mathBackgroundUnknown",
    };
  }

  // Ordering: weak < average < good < excellent. `not_sure` is treated as
  // unknown — the user said they don't know, which is neither pass nor fail.
  if (userLevel === "not_sure") {
    return {
      type: "math_background",
      status: "unknown",
      message: "hardRequirement.mathBackgroundUnknown",
    };
  }

  const ORDER: Record<string, number> = {
    weak: 0,
    average: 1,
    good: 2,
    excellent: 3,
  };

  const userRank = ORDER[userLevel] ?? -1;
  const requiredRank = ORDER[required] ?? -1;

  if (userRank >= requiredRank) {
    return { type: "math_background", status: "pass", message: "" };
  }
  return {
    type: "math_background",
    status: "fail",
    message: "hardRequirement.mathBackgroundFail",
  };
}

/**
 * Language proficiency hard requirement. A programme with a minimum
 * English requirement is failed if the user's CEFR level is clearly below
 * it, or if they have a test score below the programme's minimum.
 */
export function checkLanguageProficiency(
  profile: MatchUserProfile,
  programme: ProgrammeWithDetails,
): HardRequirementCheck {
  const requirements = programme.test_requirements.filter(
    (r) => r.qualification.category === "language",
  );
  if (requirements.length === 0) {
    return { type: "language_proficiency", status: "pass", message: "" };
  }

  // Match by qualification identity first, with a case-insensitive
  // name fallback for legacy rows (mirrors score-language.ts).
  const userScoreForRequirement = (qualificationId: string, qualificationName: string) =>
    profile.testScores.find(
      (s) =>
        (s.qualification_id != null && s.qualification_id === qualificationId) ||
        (s.qualification_id == null &&
          s.test_type.toLowerCase() === qualificationName.toLowerCase()),
    );

  // If the user has a test score meeting any accepted test's minimum,
  // that's a pass regardless of self-assessed CEFR.
  const scoreMeets = (r: (typeof requirements)[number], score: number) =>
    r.minimum_score == null || score >= r.minimum_score;

  const userTestsForProgramme = requirements.filter((r) =>
    userScoreForRequirement(r.qualification_id, r.qualification.name),
  );
  const meetsAnyTest = userTestsForProgramme.some((r) => {
    const user = userScoreForRequirement(r.qualification_id, r.qualification.name)!;
    return scoreMeets(r, user.score);
  });
  if (meetsAnyTest) {
    return { type: "language_proficiency", status: "pass", message: "" };
  }

  // No test score meeting the minimum. If the user has a test score below the
  // minimum, that's a clear fail.
  if (userTestsForProgramme.length > 0) {
    return {
      type: "language_proficiency",
      status: "fail",
      message: "hardRequirement.languageFail",
    };
  }

  // No test score at all. Fall back to self-assessed CEFR if the
  // programme specifies a CEFR requirement (via a qualification that maps to
  // CEFR, e.g. "CEFR" or "IELTS" with CEFR equivalent).
  const cefrRequirement = requirements.find((r) =>
    ["CEFR", "cefr", "English"].includes(r.qualification.name),
  );
  if (cefrRequirement && profile.english_level) {
    const CEFR_ORDER: Record<string, number> = {
      a1: 1,
      a2: 2,
      b1: 3,
      b2: 4,
      c1: 5,
      c2: 6,
      native: 7,
    };
    const userRank = CEFR_ORDER[profile.english_level] ?? -1;
    const requiredRank =
      CEFR_ORDER[cefrRequirement.minimum_score_display?.toLowerCase() ?? ""] ?? -1;
    if (requiredRank > 0 && userRank >= requiredRank) {
      return { type: "language_proficiency", status: "pass", message: "" };
    }
    if (requiredRank > 0 && userRank < requiredRank) {
      return {
        type: "language_proficiency",
        status: "fail",
        message: "hardRequirement.languageFail",
      };
    }
  }

  // No test score and no usable CEFR signal — unknown.
  return {
    type: "language_proficiency",
    status: "unknown",
    message: "hardRequirement.languageUnknown",
  };
}

/** Runs all hard-requirement checks for a (user, programme) pair. */
export function checkHardRequirements(
  profile: MatchUserProfile,
  programme: ProgrammeWithDetails,
): HardRequirementCheck[] {
  return [
    checkDegreeLevel(profile, programme),
    checkMathBackground(profile, programme),
    checkLanguageProficiency(profile, programme),
  ];
}

/** True if any hard requirement is a clear FAIL. */
export function hasHardRequirementFailure(
  checks: HardRequirementCheck[],
): boolean {
  return checks.some((c) => c.status === "fail");
}

/** Re-export for callers that want the message-key helper. */
export { translated };