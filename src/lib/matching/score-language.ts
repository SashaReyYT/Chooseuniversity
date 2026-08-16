import type {
  MatchDimensionResult,
  MatchUserProfile,
  ProgrammeWithDetails,
} from "./types";
import { MATCH_DIMENSION_LABELS } from "./types";
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

  const requirements = programme.language_requirements;
  let proficiencyMatch: boolean | null = null;
  const scoresByTestType = new Map(
    profile.testScores.map((s) => [s.test_type, s.score]),
  );

  if (requirements.length > 0) {
    const userTestTypesForProgramme = requirements.filter((r) =>
      scoresByTestType.has(r.test_type),
    );

    if (userTestTypesForProgramme.length === 0) {
      proficiencyMatch = null;
      concerns.push(
        translated("language.addTestScore", {
          testTypes: requirements.map((r) => r.test_type).join(" / "),
        }),
      );
    } else {
      const meetsAny = userTestTypesForProgramme.some(
        (r) => (scoresByTestType.get(r.test_type) ?? 0) >= r.min_score,
      );
      proficiencyMatch = meetsAny;

      if (meetsAny) {
        const met = userTestTypesForProgramme.find(
          (r) => (scoresByTestType.get(r.test_type) ?? 0) >= r.min_score,
        )!;
        reasons.push(
          translated("language.meetsTestRequirement", {
            testType: met.test_type,
            score: scoresByTestType.get(met.test_type)!,
            minScore: met.min_score_display,
          }),
        );
      } else {
        const closest = userTestTypesForProgramme[0];
        concerns.push(
          translated("language.belowTestRequirement", {
            testType: closest.test_type,
            score: scoresByTestType.get(closest.test_type)!,
            minScore: closest.min_score_display,
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
