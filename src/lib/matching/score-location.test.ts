import { describe, expect, it } from "vitest";
import { scoreLocationFit } from "./score-location";
import { hasMessageKey, makeProfile, makeProgramme, paramsForKey } from "./test-fixtures";

describe("scoreLocationFit", () => {
  it("is not applicable when the user has no country or city preference", () => {
    const profile = makeProfile({ preferred_country_codes: [], preferred_cities: [] });
    const programme = makeProgramme();

    const result = scoreLocationFit(profile, programme);

    expect(result.applicable).toBe(false);
    expect(result.score).toBeNull();
    expect(hasMessageKey(result.concerns, "location.missingLocationPreference")).toBe(
      true,
    );
  });

  it("scores 100 when the programme's country matches preference", () => {
    const profile = makeProfile({ preferred_country_codes: ["NL"], preferred_cities: [] });
    const programme = makeProgramme(); // NL

    const result = scoreLocationFit(profile, programme);

    expect(result.score).toBe(100);
    expect(hasMessageKey(result.reasons, "location.inPreferredCountry")).toBe(true);
    expect(paramsForKey(result.reasons, "location.inPreferredCountry")?.country).toBe(
      "Netherlands",
    );
  });

  it("scores low and adds a concern when the country doesn't match preference", () => {
    const profile = makeProfile({ preferred_country_codes: ["DE"], preferred_cities: [] });
    const programme = makeProgramme(); // NL

    const result = scoreLocationFit(profile, programme);

    expect(result.score).toBe(20);
    expect(hasMessageKey(result.concerns, "location.notPreferredCountry")).toBe(true);
  });

  it("averages country and city signals when both preferences are set", () => {
    const profile = makeProfile({
      preferred_country_codes: ["NL"], // match -> 100
      preferred_cities: ["Amsterdam"], // no match (programme is in Delft) -> 40
    });
    const programme = makeProgramme();

    const result = scoreLocationFit(profile, programme);

    expect(result.score).toBe(70); // (100 + 40) / 2
  });

  it("matches city case-insensitively", () => {
    const profile = makeProfile({ preferred_country_codes: [], preferred_cities: ["delft"] });
    const programme = makeProgramme(); // city: "Delft"

    const result = scoreLocationFit(profile, programme);

    expect(result.score).toBe(100);
  });

  it("scores 100 when ownership matches preference", () => {
    const profile = makeProfile({
      preferred_country_codes: [],
      preferred_cities: [],
      preferred_ownership_type: "public",
    });
    const programme = makeProgramme({
      university: { ...makeProgramme().university, ownership_type: "public" },
    });

    const result = scoreLocationFit(profile, programme);

    expect(result.score).toBe(100);
    expect(hasMessageKey(result.reasons, "location.ownershipMatches")).toBe(true);
    expect(paramsForKey(result.reasons, "location.ownershipMatches")?.type).toBe(
      "public",
    );
  });

  it("scores low and adds a concern when ownership doesn't match preference", () => {
    const profile = makeProfile({
      preferred_country_codes: [],
      preferred_cities: [],
      preferred_ownership_type: "public",
    });
    const programme = makeProgramme({
      university: { ...makeProgramme().university, ownership_type: "private" },
    });

    const result = scoreLocationFit(profile, programme);

    expect(result.score).toBe(30);
    expect(hasMessageKey(result.concerns, "location.ownershipMismatch")).toBe(true);
  });

  it("ignores ownership when the user has no preference or the university's is unknown", () => {
    const noPreference = makeProfile({
      preferred_country_codes: [],
      preferred_cities: [],
      preferred_ownership_type: "no_preference",
    });
    const unknownUniversity = makeProgramme({
      university: { ...makeProgramme().university, ownership_type: null },
    });

    expect(scoreLocationFit(noPreference, unknownUniversity).applicable).toBe(false);
  });

  it("scores 100 when the city size matches preference", () => {
    const profile = makeProfile({
      preferred_country_codes: [],
      preferred_cities: [],
      location_preference_type: "medium_city",
    });
    const programme = makeProgramme({
      university: { ...makeProgramme().university, city_size: "medium" },
    });

    const result = scoreLocationFit(profile, programme);

    expect(result.score).toBe(100);
    expect(hasMessageKey(result.reasons, "location.citySizeMatches")).toBe(true);
  });

  it("scores low and adds a concern when the city size doesn't match preference", () => {
    const profile = makeProfile({
      preferred_country_codes: [],
      preferred_cities: [],
      location_preference_type: "capital_or_large_city",
    });
    const programme = makeProgramme({
      university: { ...makeProgramme().university, city_size: "small" },
    });

    const result = scoreLocationFit(profile, programme);

    expect(result.score).toBe(30);
    expect(hasMessageKey(result.concerns, "location.citySizeMismatch")).toBe(true);
  });

  it("ignores city size for flexible/any-city preferences", () => {
    const flexible = makeProfile({
      preferred_country_codes: [],
      preferred_cities: [],
      location_preference_type: "flexible",
    });
    const programme = makeProgramme({
      university: { ...makeProgramme().university, city_size: "small" },
    });

    expect(scoreLocationFit(flexible, programme).applicable).toBe(false);
  });

  it("averages country, city, ownership and city-size signals together", () => {
    const profile = makeProfile({
      preferred_country_codes: ["NL"], // match -> 100
      preferred_cities: ["Delft"], // match -> 100
      preferred_ownership_type: "private", // uni is public -> 30
      location_preference_type: "small_city", // Delft has no city_size -> skipped
    });
    const programme = makeProgramme({
      university: { ...makeProgramme().university, ownership_type: "public" },
    });

    const result = scoreLocationFit(profile, programme);

    expect(result.score).toBe(77); // round(230 / 3)
    expect(result.reasons.length).toBe(2);
    expect(result.concerns.length).toBe(1);
  });
});
