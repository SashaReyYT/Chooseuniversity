import type {
  MatchDimensionResult,
  MatchUserProfile,
  ProgrammeWithDetails,
} from "./match-types";
import { MATCH_DIMENSION_LABELS } from "./match-types";
import type { MatchMessage } from "./messages";
import { translated } from "./messages";
import { roundScore } from "./utils";

/**
 * Language Fit combines two independent signals:
 *
 *  1. Preference — does the user want to study in this programme's
 *     language of instruction?
 *  2. Proficiency — does the user have a qualifying test score for one of
 *     the programme's accepted language tests?
 *
 * Either signal alone is meaningful (a user might not have entered a test
 * score yet but still clearly wants an English-taught programme), so
 * neither dominates the other; a confirmed proficiency match can push the
 * score to 100 even without a stated preference, and vice versa.
 */
export function scoreLanguageFit(
  profile: MatchUserProfile,
  programme: ProgrammeWithDetails,
): MatchDimensionResult {
  const reasons: MatchMessage[] = [];
  const concerns: MatchMessage[] = [];

  const hasPreferences = profile.preferred_language_codes.length > 0;
  const preferenceMatch = hasPreferences
    ? profile.preferred_language_codes.includes(programme.language_code)
    : null;

  const requirements = programme.test_requirements;

  // A user's score matches a requirement by qualification identity
  // (spec §50–§51). Legacy rows with no qualification_id fall back to a
  // case-insensitive match on the qualification's name.
  const userScoreForRequirement = (qualificationId: string, qualificationName: string) =>
    profile.testScores.find(
      (s) =>
        (s.qualification_id != null && s.qualification_id === qualificationId) ||
        (s.qualification_id == null &&
          s.test_type.toLowerCase() === qualificationName.toLowerCase()),
    );

  const languageRequirements = requirements.filter((r) =>
    r.qualification.category === "language",
  );
  let proficiencyMatch: boolean | null = null;

  if (languageRequirements.length > 0) {
    // A requirement row without a minimum_score means the test is
    // accepted but no threshold is published — any recorded score meets.
    const scoreMeets = (requirement: (typeof languageRequirements)[number], userScore: number) =>
      requirement.minimum_score == null || userScore >= requirement.minimum_score;

    const userTestsForProgramme = languageRequirements.filter((r) =>
      userScoreForRequirement(r.qualification_id, r.qualification.name),
    );

    if (userTestsForProgramme.length === 0) {
      proficiencyMatch = null;
      concerns.push(
        translated("language.addTestScore", {
          testTypes: languageRequirements
            .map((r) => r.qualification.name)
            .join(" / "),
        }),
      );
    } else {
      const meetsAny = userTestsForProgramme.some((r) => {
        const user = userScoreForRequirement(r.qualification_id, r.qualification.name)!;
        return scoreMeets(r, user.score);
      });
      proficiencyMatch = meetsAny;

      if (meetsAny) {
        const met = userTestsForProgramme.find((r) => {
          const user = userScoreForRequirement(r.qualification_id, r.qualification.name)!;
          return scoreMeets(r, user.score);
        })!;
        const userScore = userScoreForRequirement(met.qualification_id, met.qualification.name)!;
        reasons.push(
          translated("language.meetsTestRequirement", {
            testType: met.qualification.name,
            score: userScore.score,
            minScore: met.minimum_score_display ?? String(met.minimum_score ?? ""),
          }),
        );
      } else {
        const closest = userTestsForProgramme[0];
        const userScore = userScoreForRequirement(closest.qualification_id, closest.qualification.name)!;
        concerns.push(
          translated("language.belowTestRequirement", {
            testType: closest.qualification.name,
            score: userScore.score,
            minScore: closest.minimum_score_display ?? String(closest.minimum_score ?? ""),
          }),
        );
      }
    }
  }

  if (preferenceMatch === null && proficiencyMatch === null) {
    return {
      key: "language",
      label: MATCH_DIMENSION_LABELS.language,
      score: null,
      applicable: false,
      reasons,
      concerns,
    };
  }

  if (preferenceMatch) {
    reasons.push(
      translated("language.matchesPreferredLanguage", {
        language: programme.language.name,
      }),
    );
  } else if (preferenceMatch === false) {
    concerns.push(
      translated("language.notPreferredLanguage", {
        language: programme.language.name,
      }),
    );
  }

  // Weight: preference and proficiency contribute equally when both are
  // known; when only one is known, that signal alone determines the score
  // rather than being diluted by an unknown counted as neutral.
  const signals = [
    preferenceMatch === null ? null : preferenceMatch ? 100 : 30,
    proficiencyMatch === null ? null : proficiencyMatch ? 100 : 30,
  ].filter((s): s is number => s != null);

  const score = roundScore(signals.reduce((a, b) => a + b, 0) / signals.length);

  return {
    key: "language",
    label: MATCH_DIMENSION_LABELS.language,
    score,
    applicable: true,
    reasons,
    concerns,
  };
}
