import type {
  MatchDimensionResult,
  MatchUserProfile,
  ProgrammeWithDetails,
} from "./match-types";
import { MATCH_DIMENSION_LABELS } from "./match-types";
import type { MatchMessage } from "./messages";
import { translated } from "./messages";
import { roundScore } from "./utils";

const CITY_SIZE_PREFERENCES = [
  "capital_or_large_city",
  "medium_city",
  "small_city",
  "student_city",
] as const;

const CITY_SIZE_PARAMS: Record<string, string> = {
  capital_or_large: "large",
  medium: "medium",
  small: "small",
  student: "student",
};

/**
 * Location Fit checks the programme's country, city, ownership type and
 * city size against the user's preferences independently, then averages
 * whichever of the four the user actually specified. A user who only set
 * a country preference isn't penalized for not also naming a city
 * (P1#7: ownership + city-size signals ported from the legacy location
 * scorer — public/private is a verifiable legal fact, and city size
 * comes from the population-band classification on `universities.city_size`).
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

  const ownership = profile.preferred_ownership_type;
  if (ownership === "public" || ownership === "private") {
    const uniOwnership = programme.university.ownership_type;
    if (uniOwnership === "public" || uniOwnership === "private") {
      const match = uniOwnership === ownership;
      signals.push(match ? 100 : 30);
      const params = {
        name: programme.university.name,
        type: uniOwnership,
      };
      if (match) {
        reasons.push(translated("location.ownershipMatches", params));
      } else {
        concerns.push(translated("location.ownershipMismatch", params));
      }
    }
  }

  const citySizePreference = profile.location_preference_type;
  if (
    CITY_SIZE_PREFERENCES.some((p) => p === citySizePreference) &&
    programme.university.city_size != null
  ) {
    const citySize = programme.university.city_size;
    const match =
      (citySizePreference === "capital_or_large_city" &&
        citySize === "capital_or_large") ||
      (citySizePreference === "medium_city" && citySize === "medium") ||
      (citySizePreference === "small_city" && citySize === "small") ||
      (citySizePreference === "student_city" && citySize === "student");
    signals.push(match ? 100 : 30);
    const params = {
      city: programme.university.city,
      size: CITY_SIZE_PARAMS[citySize] ?? citySize,
    };
    if (match) {
      reasons.push(translated("location.citySizeMatches", params));
    } else {
      concerns.push(translated("location.citySizeMismatch", params));
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