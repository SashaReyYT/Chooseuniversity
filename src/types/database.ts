/**
 * Supabase database types.
 *
 * Hand-authored to match `supabase/migrations/*.sql` exactly (verified
 * column-by-column against `information_schema.columns` on a locally
 * validated instance of the schema — the CLI's own `gen types typescript`
 * needs Docker, which isn't available in every environment this repo is
 * developed in).
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

export type Database = {
  public: {
    Tables: {
      countries: {
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
        };
        Insert: {
          id?: string;
          name: string;
          category: string;
        };
        Update: {
          id?: string;
          name?: string;
          category?: string;
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
          dormitory_available: boolean | null;
          international_office: boolean | null;
          erasmus_participation: boolean | null;
          international_support_notes: string | null;
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
          dormitory_available?: boolean | null;
          international_office?: boolean | null;
          erasmus_participation?: boolean | null;
          international_support_notes?: string | null;
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
          dormitory_available?: boolean | null;
          international_office?: boolean | null;
          erasmus_participation?: boolean | null;
          international_support_notes?: string | null;
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
      university_resources: {
        Row: {
          id: string;
          university_id: string;
          category: string;
          title: string;
          description: string | null;
          link_title: string | null;
          link_url: string | null;
          link_type: string | null;
          contact_type: string | null;
          contact_value: string | null;
          contact_label: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          university_id: string;
          category: string;
          title: string;
          description?: string | null;
          link_title?: string | null;
          link_url?: string | null;
          link_type?: string | null;
          contact_type?: string | null;
          contact_value?: string | null;
          contact_label?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          university_id?: string;
          category?: string;
          title?: string;
          description?: string | null;
          link_title?: string | null;
          link_url?: string | null;
          link_type?: string | null;
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
      programmes: {
        Row: {
          id: string;
          university_id: string;
          name: string;
          degree_level: DegreeLevel;
          field_of_study_id: string;
          language_code: string;
          duration_months: number;
          tuition_fee_amount: number;
          tuition_fee_currency: string;
          tuition_fee_period: TuitionFeePeriod;
          estimated_living_cost_monthly: number | null;
          living_cost_currency: string | null;
          application_deadline: string | null;
          intake_start: string | null;
          description: string | null;
          programme_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          university_id: string;
          name: string;
          degree_level: DegreeLevel;
          field_of_study_id: string;
          language_code: string;
          duration_months: number;
          tuition_fee_amount: number;
          tuition_fee_currency: string;
          tuition_fee_period?: TuitionFeePeriod;
          estimated_living_cost_monthly?: number | null;
          living_cost_currency?: string | null;
          application_deadline?: string | null;
          intake_start?: string | null;
          description?: string | null;
          programme_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          university_id?: string;
          name?: string;
          degree_level?: DegreeLevel;
          field_of_study_id?: string;
          language_code?: string;
          duration_months?: number;
          tuition_fee_amount?: number;
          tuition_fee_currency?: string;
          tuition_fee_period?: TuitionFeePeriod;
          estimated_living_cost_monthly?: number | null;
          living_cost_currency?: string | null;
          application_deadline?: string | null;
          intake_start?: string | null;
          description?: string | null;
          programme_url?: string | null;
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
      programme_language_requirements: {
        Row: {
          id: string;
          programme_id: string;
          test_type: string;
          min_score: number;
          min_score_display: string;
          notes: string | null;
        };
        Insert: {
          id?: string;
          programme_id: string;
          test_type: string;
          min_score: number;
          min_score_display: string;
          notes?: string | null;
        };
        Update: {
          id?: string;
          programme_id?: string;
          test_type?: string;
          min_score?: number;
          min_score_display?: string;
          notes?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "programme_language_requirements_programme_id_fkey";
            columns: ["programme_id"];
            referencedRelation: "programmes";
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
        ];
      };
      user_test_scores: {
        Row: {
          id: string;
          user_id: string;
          test_type: string;
          score: number;
          score_display: string;
          test_date: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          test_type: string;
          score: number;
          score_display: string;
          test_date?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          test_type?: string;
          score?: number;
          score_display?: string;
          test_date?: string | null;
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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      degree_level: DegreeLevel;
      tuition_fee_period: TuitionFeePeriod;
      education_level: EducationLevel;
    };
  };
};
