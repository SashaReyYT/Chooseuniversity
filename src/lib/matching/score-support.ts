import type { ProgrammeWithDetails } from "./types";
import type { Database } from "@/types/database";
import { roundScore } from "./utils";

/**
 * Not one of the eight dimensions `computeMatchScore` in `engine.ts`
 * actually runs (academic/budget/language/location/admission/career/
 * format/lifestyle — see `MATCH_DIMENSION_KEYS` in `match-types.ts`) —
 * this scorer predates the `MatchMessage`/`messages.ts` refactor and was
 * never wired into the engine. Kept as its own standalone result shape
 * rather than shoehorned into `MatchDimensionResult` (whose `key` is a
 * closed `MatchDimensionKey` union with no `"support"` member, and whose
 * reasons/concerns are typed `MatchMessage[]`) — wiring a real ninth
 * dimension into the live product (engine, `Matches` translations,
 * `match-card.tsx`'s dimension maps) is a separate decision this file
 * shouldn't make unilaterally.
 */
export interface SupportFitResult {
  key: "support";
  label: string;
  score: number | null;
  applicable: boolean;
  reasons: string[];
  concerns: string[];
}

export type UniversityResourceRow =
  Database["public"]["Tables"]["university_resources"]["Row"];

/**
 * Support Fit reflects how well a university is set up for international
 * students, using the facts the Unikchoose schema actually captures:
 * international-office/student-services resources, Erasmus+ participation,
 * and dormitory housing (`university_accommodation.dormitory_available`).
 *
 * Like Admission Fit, this doesn't depend on the user's profile — there's
 * no "international support preference" field in `user_profiles` yet —
 * so it's an objective property of the university rather than a
 * personalized match. Following Language Fit's pattern: average only the
 * *known* signals, and mark the dimension inapplicable when no fact has
 * been researched for this university.
 *
 * `resources` come from `UniversityResourcesRepository.listByUniversityId`
 * — the resources table records only *presence* of a service (a category
 * row exists because the service does), so absence of a category is
 * "unknown" rather than "no", except for dormitory housing where the
 * accommodation row explicitly records `dormitory_available = false`.
 */
export function scoreSupportFit(
  programme: ProgrammeWithDetails,
  resources: UniversityResourceRow[] = [],
): SupportFitResult {
  const reasons: string[] = [];
  const concerns: string[] = [];

  const hasResource = (category: UniversityResourceRow["category"]) =>
    resources.some((r) => r.category === category);

  const facts: { known: boolean | null; onLabel: string; offLabel: string }[] = [
    {
      known:
        hasResource("international_office") || hasResource("student_services")
          ? true
          : null,
      onLabel: "Has a dedicated international student office.",
      offLabel: "No dedicated international student office found.",
    },
    {
      known: hasResource("erasmus") ? true : null,
      onLabel: "Participates in Erasmus+ exchange.",
      offLabel: "Doesn't appear to participate in Erasmus+.",
    },
    {
      known: programme.accommodation?.dormitory_available ?? null,
      onLabel: "Offers dormitory housing.",
      offLabel: "No university dormitory housing found.",
    },
  ];

  for (const fact of facts) {
    if (fact.known === true) {
      reasons.push(fact.onLabel);
    } else if (fact.known === false) {
      concerns.push(fact.offLabel);
    }
  }

  // Supporting descriptions (buddy programmes, arrival info, ...) surface
  // as extra reasons without affecting the score — the dimension is only
  // applicable once at least one of the boolean facts above is known.
  for (const resource of resources) {
    if (
      (resource.category === "buddy_program" ||
        resource.category === "arrival_info" ||
        resource.category === "visa_support") &&
      resource.description
    ) {
      reasons.push(resource.description);
    }
  }

  const knownSignals = facts
    .map((fact) => (fact.known === true ? 100 : fact.known === false ? 30 : null))
    .filter((s): s is 100 | 30 => s != null);

  const score =
    knownSignals.length > 0
      ? roundScore(knownSignals.reduce((a, b) => a + b, 0) / knownSignals.length)
      : null;

  return {
    key: "support",
    label: "International Support Fit",
    score,
    applicable: score != null,
    reasons,
    concerns,
  };
}