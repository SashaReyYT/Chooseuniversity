import type { ProgrammeWithDetails } from "./types";
import type { MatchUserProfile } from "./types";
import type { MatchMessage } from "./messages";

/** True if any message in the list is a translated message with this exact key (params not checked). */
export function hasMessageKey(messages: MatchMessage[], key: string): boolean {
  return messages.some((m) => m.type === "translated" && m.key === key);
}

/** Returns the params of the first translated message with this key, or undefined if none match. */
export function paramsForKey(
  messages: MatchMessage[],
  key: string,
): Record<string, string | number | Date> | undefined {
  const match = messages.find(
    (m): m is MatchMessage & { type: "translated" } =>
      m.type === "translated" && m.key === key,
  );
  return match?.params;
}

/** True if any message in the list is a raw (DB-sourced) message with this exact text. */
export function hasRawMessage(messages: MatchMessage[], text: string): boolean {
  return messages.some((m) => m.type === "raw" && m.text === text);
}


export function makeProgramme(
  overrides: Partial<ProgrammeWithDetails> = {},
): ProgrammeWithDetails {
  return {
    id: "programme-1",
    university_id: "university-1",
    name: "MSc Computer Science",
    degree_level: "master",
    field_of_study_id: "field-cs",
    language_code: "en",
    duration_months: 24,
    tuition_fee_amount: 18500,
    tuition_fee_currency: "EUR",
    tuition_fee_period: "per_year",
    estimated_living_cost_monthly: 1100,
    living_cost_currency: "EUR",
    application_deadline: "2027-01-15",
    intake_start: "2027-09-01",
    description: null,
    programme_url: null,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    university: {
      id: "university-1",
      name: "TU Delft",
      country_code: "NL",
      city: "Delft",
      website_url: null,
      logo_url: null,
      description: null,
      founded_year: 1842,
      dormitory_available: true,
      international_office: true,
      erasmus_participation: true,
      international_support_notes: null,
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
      country: { code: "NL", name: "Netherlands" },
    },
    field_of_study: {
      id: "field-cs",
      name: "Computer Science",
      category: "Engineering & Technology",
    },
    language: { code: "en", name: "English" },
    academic_requirements: {
      id: "req-1",
      programme_id: "programme-1",
      min_gpa: 3.2,
      gpa_scale: 4.0,
      required_subjects: [],
      entrance_exam_required: false,
      entrance_exam_notes: null,
      notes: null,
    },
    language_requirements: [
      {
        id: "lang-req-1",
        programme_id: "programme-1",
        test_type: "IELTS",
        min_score: 6.5,
        min_score_display: "6.5",
        notes: null,
      },
    ],
    ...overrides,
  };
}

export function makeProfile(
  overrides: Partial<MatchUserProfile> = {},
): MatchUserProfile {
  return {
    current_gpa: 3.6,
    current_gpa_scale: 4.0,
    budget_min: null,
    budget_max: 20000,
    budget_currency: "EUR",
    preferred_degree_level: "master",
    preferred_country_codes: ["NL"],
    preferred_cities: [],
    preferred_field_of_study_ids: ["field-cs"],
    preferred_language_codes: ["en"],
    testScores: [{ test_type: "IELTS", score: 7.0 }],
    ...overrides,
  };
}
