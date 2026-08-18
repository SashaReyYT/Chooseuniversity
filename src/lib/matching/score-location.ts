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
 * Location Fit checks the programme's country and city against the
 * user's preference lists independently, then averages whichever of the
 * two the user actually specified. A user who only set a country
 * preference isn't penalized for not also naming a city.
 */
export function scoreLocationFit(
  profile: MatchUserProfile,
  programme: ProgrammeWithDetails,
): MatchDimensionResult {
  const reasons: MatchMessage[] = [];
  const concerns: MatchMessage[] = [];
  const signals: number[] = [];

  if (profile.preferred_country_codes.length > 0) {
    const countryMatch = profile.preferred_country_codes.includes(
      programme.university.country.code,
    );
    signals.push(countryMatch ? 100 : 20);

    if (countryMatch) {
      reasons.push(
        translated("location.inPreferredCountry", {
          country: programme.university.country.name,
        }),
      );
    } else {
      concerns.push(
        translated("location.notPreferredCountry", {
          country: programme.university.country.name,
        }),
      );
    }
  }

  if (profile.preferred_cities.length > 0) {
    const cityMatch = profile.preferred_cities.some(
      (city) => city.toLowerCase() === programme.university.city.toLowerCase(),
    );
    signals.push(cityMatch ? 100 : 40);

    if (cityMatch) {
      reasons.push(
        translated("location.inPreferredCity", { city: programme.university.city }),
      );
    }
  }

  if (signals.length === 0) {
    return {
      key: "location",
      label: MATCH_DIMENSION_LABELS.location,
      score: null,
      applicable: false,
      reasons,
      concerns: [translated("location.missingLocationPreference")],
    };
  }

  const score = roundScore(signals.reduce((a, b) => a + b, 0) / signals.length);

  return {
    key: "location",
    label: MATCH_DIMENSION_LABELS.location,
    score,
    applicable: true,
    reasons,
    concerns,
  };
}
