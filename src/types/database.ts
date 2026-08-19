/**
 * Supabase database types.
 *
 * Hand-authored to match `supabase/migrations/*.sql` exactly (verified
 * column-by-column against `information_schema.columns` on a locally
 * validated instance of the schema).
 *
 * Once a real Supabase project is linked, prefer regenerating this file
 * with the CLI so it can never drift from the live schema:
 *
 *   npx supabase gen types typescript --linked > src/types/database.ts
 *
 * If you hand-edit this file in the meantime, keep it in sync with the
 * migrations — nothing enforces that automatically.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type DegreeLevel = "foundation" | "bachelor" | "master" | "phd";
export type TuitionFeePeriod = "per_year" | "per_semester" | "total";
export type EducationLevel = "high_school" | "bachelor" | "master";
export type StudyFormat = "full_time" | "part_time" | "either";
export type LocationPreferenceType =
  | "specific_city"
  | "any_city"
  | "capital_or_large_city"
  | "medium_city"
  | "small_city"
  | "student_city"
  | "flexible";
export type BudgetMode = "exact" | "low" | "medium" | "high" | "unknown";
export type QualificationCategory =
  | "national"
  | "academic"
  | "language"
  | "other";
export type RequirementComparison =
  | "greater_or_equal"
  | "greater"
  | "equal";
export type CefrLevel =
  | "a1"
  | "a2"
  | "b1"
  | "b2"
  | "c1"
  | "c2"
  | "native"
  | "not_sure";
export type MathBackground =
  | "excellent"
  | "good"
  | "average"
  | "weak"
  | "not_sure";
export type AdmissionPreference =
  | "safest"
  | "balanced"
  | "competitive"
  | "no_preference";
export type ProgrammeStudyMode =
  | "full_time"
  | "part_time"
  | "distance"
  | "online"
  | "hybrid";
export type SourceType =
  | "official_university"
  | "official_faculty"
  | "official_dormitory"
  | "public_reference";
export type SourceProvenance = "official" | "external";
export type ImportFormat = "json" | "csv";
export type ImportStatus =
  | "parsed"
  | "validated"
  | "review"
  | "imported"
  | "failed";

export type UniversityResourceCategory =
  | "international_office"
  | "housing"
  | "visa_support"
  | "buddy_program"
  | "student_services"
  | "erasmus"
  | "arrival_info";

export type UniversityResourceLinkType =
  | "official"
  | "guide"
  | "portal";

export type Database = {
  public: {
    Tables: {
      countries: {
        Row: {
          code: string;
          name: string;
          supported: boolean;
          sort_order: number;
        };
        Insert: {
          code: string;
          name: string;
          supported?: boolean;
          sort_order?: number;
        };
        Update: {
          code?: string;
          name?: string;
          supported?: boolean;
          sort_order?: number;
        };
        Relationships: [];
      };

      languages: {
        Row: {
          code: string;
          name: string;
        };
        Insert: {
          code: string;
          name: string;
        };
        Update: {
          code?: string;
          name?: string;
        };
        Relationships: [];
      };

      fields_of_study: {
        Row: {
          id: string;
          name: string;
          category: string;
          subcategory: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          category: string;
          subcategory?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          category?: string;
          subcategory?: string | null;
        };
        Relationships: [];
      };

      currency_rates: {
        Row: {
          currency: string;
          rate_to_eur: number;
          updated_at: string;
        };
        Insert: {
          currency: string;
          rate_to_eur: number;
          updated_at?: string;
        };
        Update: {
          currency?: string;
          rate_to_eur?: number;
          updated_at?: string;
        };
        Relationships: [];
      };

      universities: {
        Row: {
          id: string;
          name: string;
          country_code: string;
          city: string;
          website_url: string | null;
          logo_url: string | null;
          description: string | null;
          founded_year: number | null;
          ownership_type: string | null;
          city_size: string | null;
          slug: string | null;
          short_description: string | null;
          cover_image_url: string | null;
          official_application_url: string | null;
          ranking_data: Json | null;
          student_count: number | null;
          international_student_percentage: number | null;
          latitude: number | null;
          longitude: number | null;
          published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          country_code: string;
          city: string;
          website_url?: string | null;
          logo_url?: string | null;
          description?: string | null;
          founded_year?: number | null;
          ownership_type?: string | null;
          city_size?: string | null;
          slug?: string | null;
          short_description?: string | null;
          cover_image_url?: string | null;
          official_application_url?: string | null;
          ranking_data?: Json | null;
          student_count?: number | null;
          international_student_percentage?: number | null;
          latitude?: number | null;
          longitude?: number | null;
          published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          country_code?: string;
          city?: string;
          website_url?: string | null;
          logo_url?: string | null;
          description?: string | null;
          founded_year?: number | null;
          ownership_type?: string | null;
          city_size?: string | null;
          slug?: string | null;
          short_description?: string | null;
          cover_image_url?: string | null;
          official_application_url?: string | null;
          ranking_data?: Json | null;
          student_count?: number | null;
          international_student_percentage?: number | null;
          latitude?: number | null;
          longitude?: number | null;
          published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "universities_country_code_fkey";
            columns: ["country_code"];
            referencedRelation: "countries";
            referencedColumns: ["code"];
          },
        ];
      };

      programmes: {
        Row: {
          id: string;
          university_id: string;
          faculty_id: string | null;
          name: string;
          slug: string | null;
          degree_level: DegreeLevel;
          degree_title: string | null;
          field_of_study_id: string;
          language_code: string;
          duration_months: number;
          study_mode: ProgrammeStudyMode | null;
          tuition_min: number;
          tuition_max: number;
          tuition_currency: string;
          estimated_living_cost_monthly: number | null;
          living_cost_currency: string | null;
          application_deadline: string | null;
          intake_start: string | null;
          description: string | null;
          programme_url: string | null;
          application_url: string | null;
          application_fee_amount: number | null;
          application_fee_currency: string | null;
          required_documents: string[];
          scholarship_notes: string | null;
          career_notes: string | null;
          published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          university_id: string;
          faculty_id?: string | null;
          name: string;
          slug?: string | null;
          degree_level: DegreeLevel;
          degree_title?: string | null;
          field_of_study_id: string;
          language_code: string;
          duration_months: number;
          study_mode?: ProgrammeStudyMode | null;
          tuition_min: number;
          tuition_max: number;
          tuition_currency: string;
          estimated_living_cost_monthly?: number | null;
          living_cost_currency?: string | null;
          application_deadline?: string | null;
          intake_start?: string | null;
          description?: string | null;
          programme_url?: string | null;
          application_url?: string | null;
          application_fee_amount?: number | null;
          application_fee_currency?: string | null;
          required_documents?: string[];
          scholarship_notes?: string | null;
          career_notes?: string | null;
          published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          university_id?: string;
          faculty_id?: string | null;
          name?: string;
          slug?: string | null;
          degree_level?: DegreeLevel;
          degree_title?: string | null;
          field_of_study_id?: string;
          language_code?: string;
          duration_months?: number;
          study_mode?: ProgrammeStudyMode | null;
          tuition_min?: number;
          tuition_max?: number;
          tuition_currency?: string;
          estimated_living_cost_monthly?: number | null;
          living_cost_currency?: string | null;
          application_deadline?: string | null;
          intake_start?: string | null;
          description?: string | null;
          programme_url?: string | null;
          application_url?: string | null;
          application_fee_amount?: number | null;
          application_fee_currency?: string | null;
          required_documents?: string[];
          scholarship_notes?: string | null;
          career_notes?: string | null;
          published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "programmes_university_id_fkey";
            columns: ["university_id"];
            referencedRelation: "universities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "programmes_faculty_id_fkey";
            columns: ["faculty_id"];
            referencedRelation: "faculties";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "programmes_field_of_study_id_fkey";
            columns: ["field_of_study_id"];
            referencedRelation: "fields_of_study";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "programmes_language_code_fkey";
            columns: ["language_code"];
            referencedRelation: "languages";
            referencedColumns: ["code"];
          },
        ];
      };

      faculties: {
        Row: {
          id: string;
          university_id: string;
          name: string;
          description: string | null;
          website_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          university_id: string;
          name: string;
          description?: string | null;
          website_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          university_id?: string;
          name?: string;
          description?: string | null;
          website_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "faculties_university_id_fkey";
            columns: ["university_id"];
            referencedRelation: "universities";
            referencedColumns: ["id"];
          },
        ];
      };

      qualifications: {
        Row: {
          id: string;
          code: string;
          name: string;
          category: QualificationCategory;
          description: string | null;
          max_score: number | null;
          active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          category?: QualificationCategory;
          description?: string | null;
          max_score?: number | null;
          active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          name?: string;
          category?: QualificationCategory;
          description?: string | null;
          max_score?: number | null;
          active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      programme_tuition_variants: {
        Row: {
          id: string;
          programme_id: string;
          name: string;
          tuition_min: number;
          tuition_max: number;
          currency: string;
          period: TuitionFeePeriod;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          programme_id: string;
          name: string;
          tuition_min: number;
          tuition_max: number;
          currency: string;
          period?: TuitionFeePeriod;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          programme_id?: string;
          name?: string;
          tuition_min?: number;
          tuition_max?: number;
          currency?: string;
          period?: TuitionFeePeriod;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "programme_tuition_variants_programme_id_fkey";
            columns: ["programme_id"];
            referencedRelation: "programmes";
            referencedColumns: ["id"];
          },
        ];
      };

      programme_academic_requirements: {
        Row: {
          id: string;
          programme_id: string;
          min_gpa: number | null;
          gpa_scale: number | null;
          required_subjects: string[];
          entrance_exam_required: boolean;
          entrance_exam_notes: string | null;
          notes: string | null;
          required_degree_level: DegreeLevel | null;
          required_math_background: MathBackground | null;
          portfolio_required: boolean;
          interview_required: boolean;
        };
        Insert: {
          id?: string;
          programme_id: string;
          min_gpa?: number | null;
          gpa_scale?: number | null;
          required_subjects?: string[];
          entrance_exam_required?: boolean;
          entrance_exam_notes?: string | null;
          notes?: string | null;
          required_degree_level?: DegreeLevel | null;
          required_math_background?: MathBackground | null;
          portfolio_required?: boolean;
          interview_required?: boolean;
        };
        Update: {
          id?: string;
          programme_id?: string;
          min_gpa?: number | null;
          gpa_scale?: number | null;
          required_subjects?: string[];
          entrance_exam_required?: boolean;
          entrance_exam_notes?: string | null;
          notes?: string | null;
          required_degree_level?: DegreeLevel | null;
          required_math_background?: MathBackground | null;
          portfolio_required?: boolean;
          interview_required?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "programme_academic_requirements_programme_id_fkey";
            columns: ["programme_id"];
            referencedRelation: "programmes";
            referencedColumns: ["id"];
          },
        ];
      };

      programme_test_requirements: {
        Row: {
          id: string;
          programme_id: string;
          qualification_id: string;
          section: string | null;
          subject: string | null;
          minimum_score: number | null;
          minimum_score_display: string | null;
          comparison: RequirementComparison;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          programme_id: string;
          qualification_id: string;
          section?: string | null;
          subject?: string | null;
          minimum_score?: number | null;
          minimum_score_display?: string | null;
          comparison?: RequirementComparison;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          programme_id?: string;
          qualification_id?: string;
          section?: string | null;
          subject?: string | null;
          minimum_score?: number | null;
          minimum_score_display?: string | null;
          comparison?: RequirementComparison;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "programme_test_requirements_programme_id_fkey";
            columns: ["programme_id"];
            referencedRelation: "programmes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "programme_test_requirements_qualification_id_fkey";
            columns: ["qualification_id"];
            referencedRelation: "qualifications";
            referencedColumns: ["id"];
          },
        ];
      };

      university_accommodation: {
        Row: {
          id: string;
          university_id: string;
          dormitory_available: boolean;
          dormitory_name: string | null;
          room_type: string | null;
          estimated_monthly_cost_min: number | null;
          estimated_monthly_cost_max: number | null;
          currency: string | null;
          estimated_deposit: number | null;
          estimated_capacity: number | null;
          distance_from_campus_km: number | null;
          official_link: string | null;
          source_url: string | null;
          source_name: string | null;
          source_date: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          university_id: string;
          dormitory_available?: boolean;
          dormitory_name?: string | null;
          room_type?: string | null;
          estimated_monthly_cost_min?: number | null;
          estimated_monthly_cost_max?: number | null;
          currency?: string | null;
          estimated_deposit?: number | null;
          estimated_capacity?: number | null;
          distance_from_campus_km?: number | null;
          official_link?: string | null;
          source_url?: string | null;
          source_name?: string | null;
          source_date?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          university_id?: string;
          dormitory_available?: boolean;
          dormitory_name?: string | null;
          room_type?: string | null;
          estimated_monthly_cost_min?: number | null;
          estimated_monthly_cost_max?: number | null;
          currency?: string | null;
          estimated_deposit?: number | null;
          estimated_capacity?: number | null;
          distance_from_campus_km?: number | null;
          official_link?: string | null;
          source_url?: string | null;
          source_name?: string | null;
          source_date?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "university_accommodation_university_id_fkey";
            columns: ["university_id"];
            referencedRelation: "universities";
            referencedColumns: ["id"];
          },
        ];
      };

      city_accommodation_estimates: {
        Row: {
          id: string;
          country_code: string;
          city: string;
          estimated_monthly_cost_min: number | null;
          estimated_monthly_cost_max: number | null;
          currency: string | null;
          source_url: string | null;
          source_name: string | null;
          source_type: SourceProvenance | null;
          source_date: string | null;
          notes: string | null;
        };
        Insert: {
          id?: string;
          country_code: string;
          city: string;
          estimated_monthly_cost_min?: number | null;
          estimated_monthly_cost_max?: number | null;
          currency?: string | null;
          source_url?: string | null;
          source_name?: string | null;
          source_type?: SourceProvenance | null;
          source_date?: string | null;
          notes?: string | null;
        };
        Update: {
          id?: string;
          country_code?: string;
          city?: string;
          estimated_monthly_cost_min?: number | null;
          estimated_monthly_cost_max?: number | null;
          currency?: string | null;
          source_url?: string | null;
          source_name?: string | null;
          source_type?: SourceProvenance | null;
          source_date?: string | null;
          notes?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "city_accommodation_estimates_country_code_fkey";
            columns: ["country_code"];
            referencedRelation: "countries";
            referencedColumns: ["code"];
          },
        ];
      };

      programme_living_cost_estimates: {
        Row: {
          id: string;
          programme_id: string;
          accommodation_min: number | null;
          accommodation_max: number | null;
          food_min: number | null;
          food_max: number | null;
          transport_min: number | null;
          transport_max: number | null;
          utilities_min: number | null;
          utilities_max: number | null;
          internet_phone_min: number | null;
          internet_phone_max: number | null;
          study_materials_min: number | null;
          study_materials_max: number | null;
          other_min: number | null;
          other_max: number | null;
          total_min: number | null;
          total_max: number | null;
          currency: string | null;
          source_url: string | null;
          source_name: string | null;
          source_type: SourceProvenance | null;
          source_date: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          programme_id: string;
          accommodation_min?: number | null;
          accommodation_max?: number | null;
          food_min?: number | null;
          food_max?: number | null;
          transport_min?: number | null;
          transport_max?: number | null;
          utilities_min?: number | null;
          utilities_max?: number | null;
          internet_phone_min?: number | null;
          internet_phone_max?: number | null;
          study_materials_min?: number | null;
          study_materials_max?: number | null;
          other_min?: number | null;
          other_max?: number | null;
          total_min?: number | null;
          total_max?: number | null;
          currency?: string | null;
          source_url?: string | null;
          source_name?: string | null;
          source_type?: SourceProvenance | null;
          source_date?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          programme_id?: string;
          accommodation_min?: number | null;
          accommodation_max?: number | null;
          food_min?: number | null;
          food_max?: number | null;
          transport_min?: number | null;
          transport_max?: number | null;
          utilities_min?: number | null;
          utilities_max?: number | null;
          internet_phone_min?: number | null;
          internet_phone_max?: number | null;
          study_materials_min?: number | null;
          study_materials_max?: number | null;
          other_min?: number | null;
          other_max?: number | null;
          total_min?: number | null;
          total_max?: number | null;
          currency?: string | null;
          source_url?: string | null;
          source_name?: string | null;
          source_type?: SourceProvenance | null;
          source_date?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "programme_living_cost_estimates_programme_id_fkey";
            columns: ["programme_id"];
            referencedRelation: "programmes";
            referencedColumns: ["id"];
          },
        ];
      };

      nmt_subjects: {
        Row: {
          code: string;
          name: string;
          available_from_year: number | null;
          available_until_year: number | null;
        };
        Insert: {
          code: string;
          name: string;
          available_from_year?: number | null;
          available_until_year?: number | null;
        };
        Update: {
          code?: string;
          name?: string;
          available_from_year?: number | null;
          available_until_year?: number | null;
        };
        Relationships: [];
      };

      user_nmt_scores: {
        Row: {
          id: string;
          user_id: string;
          subject_code: string;
          score: number;
          max_score: number;
          test_year: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          subject_code: string;
          score: number;
          max_score?: number;
          test_year?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          subject_code?: string;
          score?: number;
          max_score?: number;
          test_year?: number | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_nmt_scores_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "auth.users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_nmt_scores_subject_code_fkey";
            columns: ["subject_code"];
            referencedRelation: "nmt_subjects";
            referencedColumns: ["code"];
          },
        ];
      };

      user_qualifications: {
        Row: {
          id: string;
          user_id: string;
          qualification_id: string;
          details: Json;
          year: number | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          qualification_id: string;
          details?: Json;
          year?: number | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          qualification_id?: string;
          details?: Json;
          year?: number | null;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_qualifications_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "auth.users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_qualifications_qualification_id_fkey";
            columns: ["qualification_id"];
            referencedRelation: "qualifications";
            referencedColumns: ["id"];
          },
        ];
      };

      career_priorities: {
        Row: {
          code: string;
          label: string;
        };
        Insert: {
          code: string;
          label: string;
        };
        Update: {
          code?: string;
          label?: string;
        };
        Relationships: [];
      };

      user_match_weights: {
        Row: {
          user_id: string;
          academic: number;
          admission: number;
          budget: number;
          language: number;
          location: number;
          career: number;
          format: number;
          lifestyle: number;
          support: number;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          academic?: number;
          admission?: number;
          budget?: number;
          language?: number;
          location?: number;
          career?: number;
          format?: number;
          lifestyle?: number;
          support?: number;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          academic?: number;
          admission?: number;
          budget?: number;
          language?: number;
          location?: number;
          career?: number;
          format?: number;
          lifestyle?: number;
          support?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_match_weights_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "auth.users";
            referencedColumns: ["id"];
          },
        ];
      };

      user_profiles: {
        Row: {
          id: string;
          full_name: string | null;
          nationality_country_code: string | null;
          current_education_level: EducationLevel | null;
          current_gpa: number | null;
          current_gpa_scale: number | null;
          budget_min: number | null;
          budget_max: number | null;
          budget_currency: string | null;
          preferred_degree_level: DegreeLevel | null;
          preferred_country_codes: string[];
          preferred_cities: string[];
          preferred_field_of_study_ids: string[];
          preferred_language_codes: string[];
          preferred_study_format: StudyFormat | null;
          location_preference_type: LocationPreferenceType | null;
          preferred_ownership_type: string | null;
          support_preference: string | null;
          open_to_other_cities: boolean | null;
          budget_mode: BudgetMode;
          primary_field_of_study_id: string | null;
          graduation_year: number | null;
          has_graduated: boolean | null;
          english_level: CefrLevel | null;
          math_background: MathBackground | null;
          admission_preference: AdmissionPreference | null;
          career_priorities: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          nationality_country_code?: string | null;
          current_education_level?: EducationLevel | null;
          current_gpa?: number | null;
          current_gpa_scale?: number | null;
          budget_min?: number | null;
          budget_max?: number | null;
          budget_currency?: string | null;
          preferred_degree_level?: DegreeLevel | null;
          preferred_country_codes?: string[];
          preferred_cities?: string[];
          preferred_field_of_study_ids?: string[];
          preferred_language_codes?: string[];
          preferred_study_format?: StudyFormat | null;
          location_preference_type?: LocationPreferenceType | null;
          preferred_ownership_type?: string | null;
          support_preference?: string | null;
          open_to_other_cities?: boolean | null;
          budget_mode?: BudgetMode;
          primary_field_of_study_id?: string | null;
          graduation_year?: number | null;
          has_graduated?: boolean | null;
          english_level?: CefrLevel | null;
          math_background?: MathBackground | null;
          admission_preference?: AdmissionPreference | null;
          career_priorities?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          nationality_country_code?: string | null;
          current_education_level?: EducationLevel | null;
          current_gpa?: number | null;
          current_gpa_scale?: number | null;
          budget_min?: number | null;
          budget_max?: number | null;
          budget_currency?: string | null;
          preferred_degree_level?: DegreeLevel | null;
          preferred_country_codes?: string[];
          preferred_cities?: string[];
          preferred_field_of_study_ids?: string[];
          preferred_language_codes?: string[];
          preferred_study_format?: StudyFormat | null;
          location_preference_type?: LocationPreferenceType | null;
          preferred_ownership_type?: string | null;
          support_preference?: string | null;
          open_to_other_cities?: boolean | null;
          budget_mode?: BudgetMode;
          primary_field_of_study_id?: string | null;
          graduation_year?: number | null;
          has_graduated?: boolean | null;
          english_level?: CefrLevel | null;
          math_background?: MathBackground | null;
          admission_preference?: AdmissionPreference | null;
          career_priorities?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_profiles_nationality_country_code_fkey";
            columns: ["nationality_country_code"];
            referencedRelation: "countries";
            referencedColumns: ["code"];
          },
          {
            foreignKeyName: "user_profiles_primary_field_of_study_id_fkey";
            columns: ["primary_field_of_study_id"];
            referencedRelation: "fields_of_study";
            referencedColumns: ["id"];
          },
        ];
      };

      user_test_scores: {
        Row: {
          id: string;
          user_id: string;
          test_type: string;
          qualification_id: string | null;
          score: number;
          score_display: string;
          test_date: string | null;
          cefr_equivalent: CefrLevel | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          test_type: string;
          qualification_id?: string | null;
          score: number;
          score_display: string;
          test_date?: string | null;
          cefr_equivalent?: CefrLevel | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          test_type?: string;
          qualification_id?: string | null;
          score?: number;
          score_display?: string;
          test_date?: string | null;
          cefr_equivalent?: CefrLevel | null;
          created_at?: string;
        };
        Relationships: [];
      };

      saved_programmes: {
        Row: {
          id: string;
          user_id: string;
          programme_id: string;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          programme_id: string;
          note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          programme_id?: string;
          note?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "saved_programmes_programme_id_fkey";
            columns: ["programme_id"];
            referencedRelation: "programmes";
            referencedColumns: ["id"];
          },
        ];
      };

      comparisons: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      comparison_items: {
        Row: {
          id: string;
          comparison_id: string;
          programme_id: string;
          position: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          comparison_id: string;
          programme_id: string;
          position?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          comparison_id?: string;
          programme_id?: string;
          position?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "comparison_items_comparison_id_fkey";
            columns: ["comparison_id"];
            referencedRelation: "comparisons";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "comparison_items_programme_id_fkey";
            columns: ["programme_id"];
            referencedRelation: "programmes";
            referencedColumns: ["id"];
          },
        ];
      };

      sources: {
        Row: {
          id: string;
          url: string;
          name: string;
          type: SourceType;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          url: string;
          name: string;
          type: SourceType;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          url?: string;
          name?: string;
          type?: SourceType;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      programme_sources: {
        Row: {
          programme_id: string;
          source_id: string;
          fact_key: string;
        };
        Insert: {
          programme_id: string;
          source_id: string;
          fact_key?: string;
        };
        Update: {
          programme_id?: string;
          source_id?: string;
          fact_key?: string;
        };
        Relationships: [
          {
            foreignKeyName: "programme_sources_programme_id_fkey";
            columns: ["programme_id"];
            referencedRelation: "programmes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "programme_sources_source_id_fkey";
            columns: ["source_id"];
            referencedRelation: "sources";
            referencedColumns: ["id"];
          },
        ];
      };

      university_sources: {
        Row: {
          university_id: string;
          source_id: string;
          fact_key: string;
        };
        Insert: {
          university_id: string;
          source_id: string;
          fact_key?: string;
        };
        Update: {
          university_id?: string;
          source_id?: string;
          fact_key?: string;
        };
        Relationships: [
          {
            foreignKeyName: "university_sources_university_id_fkey";
            columns: ["university_id"];
            referencedRelation: "universities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "university_sources_source_id_fkey";
            columns: ["source_id"];
            referencedRelation: "sources";
            referencedColumns: ["id"];
          },
        ];
      };

      university_resources: {
        Row: {
          id: string;
          university_id: string;
          category: UniversityResourceCategory;
          title: string;
          description: string | null;
          link_title: string | null;
          link_url: string | null;
          link_type: UniversityResourceLinkType | null;
          contact_type: string | null;
          contact_value: string | null;
          contact_label: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          university_id: string;
          category: UniversityResourceCategory;
          title: string;
          description?: string | null;
          link_title?: string | null;
          link_url?: string | null;
          link_type?: UniversityResourceLinkType | null;
          contact_type?: string | null;
          contact_value?: string | null;
          contact_label?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          university_id?: string;
          category?: UniversityResourceCategory;
          title?: string;
          description?: string | null;
          link_title?: string | null;
          link_url?: string | null;
          link_type?: UniversityResourceLinkType | null;
          contact_type?: string | null;
          contact_value?: string | null;
          contact_label?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "university_resources_university_id_fkey";
            columns: ["university_id"];
            referencedRelation: "universities";
            referencedColumns: ["id"];
          },
        ];
      };

      imports: {
        Row: {
          id: string;
          source_name: string;
          source_url: string | null;
          format: ImportFormat;
          status: ImportStatus;
          row_count: number;
          imported_count: number;
          error_count: number;
          created_by: string | null;
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          source_name: string;
          source_url?: string | null;
          format: ImportFormat;
          status?: ImportStatus;
          row_count?: number;
          imported_count?: number;
          error_count?: number;
          created_by?: string | null;
          created_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          source_name?: string;
          source_url?: string | null;
          format?: ImportFormat;
          status?: ImportStatus;
          row_count?: number;
          imported_count?: number;
          error_count?: number;
          created_by?: string | null;
          created_at?: string;
          completed_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "imports_created_by_fkey";
            columns: ["created_by"];
            referencedRelation: "auth.users";
            referencedColumns: ["id"];
          },
        ];
      };

      import_errors: {
        Row: {
          id: string;
          import_id: string;
          row_number: number | null;
          field: string | null;
          message: string;
          raw_row: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          import_id: string;
          row_number?: number | null;
          field?: string | null;
          message: string;
          raw_row?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          import_id?: string;
          row_number?: number | null;
          field?: string | null;
          message?: string;
          raw_row?: Json | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "import_errors_import_id_fkey";
            columns: ["import_id"];
            referencedRelation: "imports";
            referencedColumns: ["id"];
          },
        ];
      };

      admin_users: {
        Row: {
          user_id: string;
          granted_by: string | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          granted_by?: string | null;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          granted_by?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "admin_users_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "auth.users";
            referencedColumns: ["id"];
          },
        ];
      };
    };

    Views: Record<string, never>;

    Functions: Record<string, never>;

    Enums: {
      degree_level: DegreeLevel;
      tuition_fee_period: TuitionFeePeriod;
      education_level: EducationLevel;
      study_format: StudyFormat;
      location_preference_type: LocationPreferenceType;
      budget_mode: BudgetMode;
      cefr_level: CefrLevel;
      math_background: MathBackground;
      admission_preference: AdmissionPreference;
      programme_study_mode: ProgrammeStudyMode;
      source_type: SourceType;
    };
  };
};