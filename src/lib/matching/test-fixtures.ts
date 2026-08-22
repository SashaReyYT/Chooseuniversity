import type { ProgrammeWithDetails } from "./match-types";
import type { MatchUserProfile } from "./match-types";
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
    faculty_id: null,
    name: "MSc Computer Science",
    slug: null,
    degree_level: "master",
    degree_title: null,
    field_of_study_id: "field-cs",
    language_code: "en",
    duration_months: 24,
    study_mode: null,
    tuition_min: 18500,
    tuition_max: 18500,
    tuition_currency: "EUR",
    estimated_living_cost_monthly: 1100,
    living_cost_currency: "EUR",
    application_deadline: "2027-01-15",
    intake_start: "2027-09-01",
    description: null,
    programme_url: null,
    application_url: null,
    application_fee_amount: null,
    application_fee_currency: null,
    required_documents: [],
    scholarship_notes: null,
    career_notes: null,
    published: true,
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
      ownership_type: null,
      city_size: null,
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
      country: { code: "NL", name: "Netherlands", supported: false, sort_order: 100 },
      sources: [],
      resources: [],
    },
    faculty: null,
    field_of_study: {
      id: "field-cs",
      name: "Computer Science",
      category: "Engineering & Technology",
      subcategory: "Software & AI",
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
      required_degree_level: null,
      required_math_background: null,
      portfolio_required: false,
      interview_required: false,
    },
    test_requirements: [
      {
        id: "test-req-1",
        programme_id: "programme-1",
        qualification_id: "qual-ielts",
        section: null,
        subject: null,
        minimum_score: 6.5,
        minimum_score_display: "6.5",
        comparison: "greater_or_equal",
        notes: null,
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
        qualification: {
          id: "qual-ielts",
          code: "ielts",
          name: "IELTS",
          category: "language",
          description: null,
          max_score: 9,
          active: true,
          sort_order: 20,
          created_at: "2026-01-01T00:00:00.000Z",
          updated_at: "2026-01-01T00:00:00.000Z",
        },
      },
    ],
    tuition_variants: [],
    ...overrides,
    // Undefined from Partial<...> spread overrides explicit null, so
    // re-null these to keep the type checker happy.
    accommodation: overrides.accommodation ?? null,
    living_cost_estimates: overrides.living_cost_estimates ?? null,
  } as ProgrammeWithDetails;
}

export function makeProfile(
  overrides: Partial<MatchUserProfile> = {},
): MatchUserProfile {
  return {
    current_education_level: "bachelor",
    current_gpa: 3.6,
    current_gpa_scale: 4.0,
    budget_min: null,
    budget_max: 20000,
    budget_currency: "EUR",
    budget_mode: "exact",
    preferred_degree_level: "master",
    preferred_country_codes: ["NL"],
    preferred_cities: [],
    preferred_field_of_study_ids: ["field-cs"],
    preferred_language_codes: ["en"],
    location_preference_type: null,
    preferred_ownership_type: null,
    preferred_study_format: "either",
    support_preference: null,
    english_level: "b2",
    math_background: "good",
    career_priorities: [],
    lifestyle_preferences: [],
    testScores: [
      { test_type: "IELTS", qualification_id: "qual-ielts", score: 7.0, cefr_equivalent: "c1" },
    ],
    nmtScores: [],
    qualifications: [],
    ...overrides,
  };
}
