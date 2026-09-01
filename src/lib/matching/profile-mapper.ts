import type { Database } from "@/types/database";
import type { MatchUserProfile } from "@/lib/matching/match-types";

type UserProfileRow = Database["public"]["Tables"]["user_profiles"]["Row"];
type UserNmtScoreRow = Database["public"]["Tables"]["user_nmt_scores"]["Row"];
type UserTestScoreRow = Database["public"]["Tables"]["user_test_scores"]["Row"];
type UserQualificationRow = Database["public"]["Tables"]["user_qualifications"]["Row"];

interface FullProfileData {
  profile: UserProfileRow | null;
  nmtScores: UserNmtScoreRow[];
  testScores: UserTestScoreRow[];
  qualifications: UserQualificationRow[];
}

/**
 * Single source of truth for mapping a DB profile row into the shape
 * the matching engine expects.
 */
export function toMatchProfile(data: FullProfileData): MatchUserProfile | null {
  if (!data.profile) return null;
  const p = data.profile;
  return {
    current_education_level: p.current_education_level,
    current_gpa: p.current_gpa,
    current_gpa_scale: p.current_gpa_scale,
    budget_min: p.budget_min,
    budget_max: p.budget_max,
    budget_currency: p.budget_currency,
    budget_mode: p.budget_mode,
    living_cost_mode: p.living_cost_mode,
    preferred_degree_level: p.preferred_degree_level,
    preferred_country_codes: p.preferred_country_codes ?? [],
    preferred_cities: p.preferred_cities ?? [],
    preferred_field_of_study_ids: p.preferred_field_of_study_ids ?? [],
    preferred_language_codes: p.preferred_language_codes ?? [],
    location_preference_type: p.location_preference_type,
    preferred_ownership_type: p.preferred_ownership_type,
    preferred_study_format: p.preferred_study_format,
    support_preference: p.support_preference,
    english_level: p.english_level,
    math_background: p.math_background,
    has_graduated: p.has_graduated,
    career_priorities: p.career_priorities ?? [],
    lifestyle_preferences: p.lifestyle_preferences ?? [],
    wants_dormitory: p.wants_dormitory,
    wants_scholarship: p.wants_scholarship,
    wants_work_during_study: p.wants_work_during_study,
    wants_stay_after_graduation: p.wants_stay_after_graduation,
    open_to_additional_exams: p.open_to_additional_exams,
    testScores: data.testScores.map((s) => ({
      test_type: s.test_type,
      qualification_id: s.qualification_id,
      score: s.score,
      cefr_equivalent: s.cefr_equivalent,
    })),
    nmtScores: data.nmtScores.map((s) => ({
      subject_code: s.subject_code,
      score: s.score,
      max_score: s.max_score,
    })),
    qualifications: data.qualifications.map((q) => ({
      qualification_id: q.qualification_id,
      year: q.year,
    })),
  };
}