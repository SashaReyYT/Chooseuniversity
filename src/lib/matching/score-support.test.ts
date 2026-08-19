import { describe, expect, it } from "vitest";
import { scoreSupportFit } from "./score-support";
import type { UniversityResourceRow } from "./score-support";
import { makeProgramme } from "./test-fixtures";

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

describe("scoreSupportFit", () => {
  it("is not applicable when none of the three facts are known", () => {
    const programme = makeProgramme();

    const result = scoreSupportFit(programme, []);

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

    const result = scoreSupportFit(programme, resources);

    expect(result.score).toBe(100);
    expect(result.reasons.length).toBe(3);
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

    const result = scoreSupportFit(programme, resources);

    expect(result.score).toBe(65); // (100 + 30) / 2
    expect(result.reasons.length).toBe(1);
    expect(result.concerns.length).toBe(1);
  });

  it("surfaces supporting-service descriptions as reasons without affecting the score", () => {
    const programme = makeProgramme();
    const resources = [
      makeResource("buddy_program", "Runs a buddy-system for incoming students."),
    ];

    const result = scoreSupportFit(programme, resources);

    // Descriptions alone don't make the dimension applicable — no boolean fact is known.
    expect(result.applicable).toBe(false);
    expect(result.reasons).toContain(
      "Runs a buddy-system for incoming students.",
    );
  });

  it("doesn't depend on the user profile", () => {
    const programme = makeProgramme();
    const resources = [makeResource("erasmus")];

    expect(scoreSupportFit(programme, resources).applicable).toBe(true);
  });
});