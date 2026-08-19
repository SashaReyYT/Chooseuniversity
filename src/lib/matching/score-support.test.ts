import { describe, expect, it } from "vitest";
import { scoreSupportFit } from "./score-support";
import type { UniversityResourceRow } from "./score-support";
import { makeProgramme, makeProfile } from "./test-fixtures";

function makeResource(
  category: UniversityResourceRow["category"],
  description: string | null = null,
): UniversityResourceRow {
  return {
    id: `res-${category}`,
    university_id: "university-1",
    category,
    title: category,
    description,
    link_title: null,
    link_url: null,
    link_type: null,
    contact_type: null,
    contact_value: null,
    contact_label: null,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  };
}

function programmeWithResources(
  resources: UniversityResourceRow[],
  overrides: Partial<ReturnType<typeof makeProgramme>> = {},
) {
  return makeProgramme({
    ...overrides,
    university: {
      ...makeProgramme().university,
      resources,
    },
  });
}

/** The translated message keys a result produced, in order. */
function translatedKeys(messages: { type: "translated" | "raw"; key?: string }[]) {
  return messages
    .filter((m) => m.type === "translated")
    .map((m) => m.key);
}

describe("scoreSupportFit", () => {
  it("is not applicable when the user hasn't stated a support preference", () => {
    const result = scoreSupportFit(
      makeProfile({ support_preference: null }),
      programmeWithResources([makeResource("erasmus")]),
    );

    expect(result.applicable).toBe(false);
    expect(result.score).toBeNull();
  });

  it("is not applicable when the user explicitly opted out", () => {
    const result = scoreSupportFit(
      makeProfile({ support_preference: "no_preference" }),
      programmeWithResources([makeResource("erasmus")]),
    );

    expect(result.applicable).toBe(false);
    expect(result.score).toBeNull();
  });

  it("scores 100 when all three known facts are positive", () => {
    const programme = makeProgramme({
      accommodation: {
        id: "acc-1",
        university_id: "university-1",
        dormitory_available: true,
        dormitory_name: null,
        room_type: null,
        estimated_monthly_cost_min: null,
        estimated_monthly_cost_max: null,
        currency: null,
        estimated_deposit: null,
        estimated_capacity: null,
        distance_from_campus_km: null,
        official_link: null,
        source_url: null,
        source_name: null,
        source_date: null,
        notes: null,
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
      },
    });
    const resources = [
      makeResource("international_office"),
      makeResource("erasmus"),
    ];

    const result = scoreSupportFit(
      makeProfile({ support_preference: "wants_support" }),
      programmeWithResources(resources, programme),
    );

    expect(result.score).toBe(100);
    expect(translatedKeys(result.reasons)).toEqual([
      "support.internationalOffice",
      "support.erasmus",
      "support.dormitory",
    ]);
    expect(result.concerns.length).toBe(0);
  });

  it("averages only the known signals, ignoring unresearched facts", () => {
    const programme = makeProgramme({
      accommodation: {
        id: "acc-1",
        university_id: "university-1",
        dormitory_available: false,
        dormitory_name: null,
        room_type: null,
        estimated_monthly_cost_min: null,
        estimated_monthly_cost_max: null,
        currency: null,
        estimated_deposit: null,
        estimated_capacity: null,
        distance_from_campus_km: null,
        official_link: null,
        source_url: null,
        source_name: null,
        source_date: null,
        notes: null,
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
      },
    });
    const resources = [makeResource("international_office")]; // 100, erasmus unknown -> excluded

    const result = scoreSupportFit(
      makeProfile({ support_preference: "wants_support" }),
      programmeWithResources(resources, programme),
    );

    expect(result.score).toBe(65); // (100 + 30) / 2
    expect(translatedKeys(result.reasons)).toEqual(["support.internationalOffice"]);
    expect(translatedKeys(result.concerns)).toEqual(["support.noDormitory"]);
  });

  it("surfaces supporting-service descriptions as raw reasons without affecting the score", () => {
    const result = scoreSupportFit(
      makeProfile({ support_preference: "wants_support" }),
      programmeWithResources([
        makeResource("buddy_program", "Runs a buddy-system for incoming students."),
      ]),
    );

    // Descriptions alone don't make the dimension applicable — no boolean fact is known.
    expect(result.applicable).toBe(false);
    expect(result.reasons).toContainEqual({
      type: "raw",
      text: "Runs a buddy-system for incoming students.",
    });
  });

  it("stays inapplicable with no researched facts even when support is wanted", () => {
    const result = scoreSupportFit(
      makeProfile({ support_preference: "wants_support" }),
      programmeWithResources([]),
    );

    expect(result.applicable).toBe(false);
    expect(result.score).toBeNull();
  });
});