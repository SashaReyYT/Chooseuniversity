import type { ProgrammeWithDetails } from "./match-types";
import type { Database } from "@/types/database";
import { roundScore } from "./utils";
import type { MatchDimensionResult, MatchUserProfile } from "./match-types";
import { translated, type MatchMessage } from "./messages";

export type UniversityResourceRow =
  Database["public"]["Tables"]["university_resources"]["Row"];

/**
 * Support Fit — the ninth Match Score dimension (spec: "International
 * Support Fit"). Unlike the other user-driven dimensions this one is
 * *gated* by an explicit user preference: it only runs when the student
 * said they want strong international-student support
 * (`support_preference = 'wants_support'`). Students who didn't care get
 * the dimension skipped entirely instead of a meaningless score — a
 * preference someone explicitly opted out of must never drag their
 * overall score down (or up).
 *
 * The score itself is an objective property of the university, built from
 * facts the Unikchoose schema captures: international-office /
 * student-services resources, Erasmus+ participation, and dormitory
 * housing (`university_accommodation.dormitory_available`). Resources are
 * embedded on the programme via the programmes repository's
 * `university:universities(*, resources:university_resources(*))` embed,
 * so the engine signature stays unchanged.
 *
 * The resources table records only *presence* of a service (a category
 * row exists because the service does), so absence of a category is
 * "unknown" rather than "no" — except dormitory housing, where the
 * accommodation row explicitly records `dormitory_available = false`.
 * Following Language Fit's pattern: average only the *known* signals
 * (true = 100, false = 30), and mark the dimension inapplicable when no
 * fact has been researched for this university.
 */
export function scoreSupportFit(
  profile: MatchUserProfile,
  programme: ProgrammeWithDetails,
): MatchDimensionResult {
  const resources: UniversityResourceRow[] =
    programme.university.resources ?? [];

  const reasons: MatchMessage[] = [];
  const concerns: MatchMessage[] = [];

  const facts: {
    known: boolean | null;
    onKey: Parameters<typeof translated>[0];
    offKey: Parameters<typeof translated>[0];
  }[] = [
    {
      known:
        resources.some((r) => r.category === "international_office") ||
        resources.some((r) => r.category === "student_services")
          ? true
          : null,
      onKey: "support.internationalOffice",
      offKey: "support.noInternationalOffice",
    },
    {
      known: resources.some((r) => r.category === "erasmus") ? true : null,
      onKey: "support.erasmus",
      offKey: "support.noErasmus",
    },
  ];

  // Dormitory fact — always checked, but weighted extra when user wants it
  const dormitoryAvailable = programme.accommodation?.dormitory_available ?? null;
  facts.push({
    known: dormitoryAvailable,
    onKey: "support.dormitory",
    offKey: "support.noDormitory",
  });

  for (const fact of facts) {
    if (fact.known === true) {
      reasons.push(translated(fact.onKey));
    } else if (fact.known === false) {
      concerns.push(translated(fact.offKey));
    }
  }

  // Scholarship — user explicitly wants scholarship support
  if (profile.wants_scholarship) {
    const hasNotes = programme.scholarship_notes != null && programme.scholarship_notes.trim().length > 0;
    if (hasNotes) {
      reasons.push(translated("support.scholarshipAvailable"));
    } else {
      concerns.push(translated("support.scholarshipInfoMissing"));
    }
  }

  // Dormitory — user explicitly wants dormitory, flag if unavailable
  if (profile.wants_dormitory && dormitoryAvailable === false) {
    concerns.push(translated("support.dormitoryWantedUnavailable"));
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
      reasons.push({ type: "raw", text: resource.description });
    }
  }

  const knownSignals = facts
    .map((fact) => (fact.known === true ? 100 : fact.known === false ? 30 : null))
    .filter((s): s is 100 | 30 => s != null);

  const score =
    knownSignals.length > 0
      ? roundScore(knownSignals.reduce((a, b) => a + b, 0) / knownSignals.length)
      : null;

  const applicable =
    (profile.support_preference === "wants_support" ||
      profile.wants_dormitory === true ||
      profile.wants_scholarship === true) &&
    score != null;

  return {
    key: "support",
    label: "International Support Fit",
    score: applicable ? score : null,
    applicable,
    reasons,
    concerns,
  };
}