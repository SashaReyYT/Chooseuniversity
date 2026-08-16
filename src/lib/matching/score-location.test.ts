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
});
