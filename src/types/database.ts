export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      admin_users: {
        Row: {
          created_at: string
          granted_by: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          granted_by?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          granted_by?: string | null
          user_id?: string
        }
        Relationships: []
      }
      career_priorities: {
        Row: {
          code: string
          label: string
        }
        Insert: {
          code: string
          label: string
        }
        Update: {
          code?: string
          label?: string
        }
        Relationships: []
      }
      city_accommodation_estimates: {
        Row: {
          city: string
          country_code: string
          currency: string | null
          estimated_monthly_cost_max: number | null
          estimated_monthly_cost_min: number | null
          id: string
          notes: string | null
          source_date: string | null
          source_name: string | null
          source_type: string | null
          source_url: string | null
        }
        Insert: {
          city: string
          country_code: string
          currency?: string | null
          estimated_monthly_cost_max?: number | null
          estimated_monthly_cost_min?: number | null
          id?: string
          notes?: string | null
          source_date?: string | null
          source_name?: string | null
          source_type?: string | null
          source_url?: string | null
        }
        Update: {
          city?: string
          country_code?: string
          currency?: string | null
          estimated_monthly_cost_max?: number | null
          estimated_monthly_cost_min?: number | null
          id?: string
          notes?: string | null
          source_date?: string | null
          source_name?: string | null
          source_type?: string | null
          source_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "city_accommodation_estimates_country_code_fkey"
            columns: ["country_code"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["code"]
          },
        ]
      }
      comparison_items: {
        Row: {
          comparison_id: string
          created_at: string
          id: string
          position: number
          programme_id: string
        }
        Insert: {
          comparison_id: string
          created_at?: string
          id?: string
          position?: number
          programme_id: string
        }
        Update: {
          comparison_id?: string
          created_at?: string
          id?: string
          position?: number
          programme_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comparison_items_comparison_id_fkey"
            columns: ["comparison_id"]
            isOneToOne: false
            referencedRelation: "comparisons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comparison_items_programme_id_fkey"
            columns: ["programme_id"]
            isOneToOne: false
            referencedRelation: "programmes"
            referencedColumns: ["id"]
          },
        ]
      }
      comparisons: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      countries: {
        Row: {
          code: string
          name: string
          sort_order: number
          supported: boolean
        }
        Insert: {
          code: string
          name: string
          sort_order?: number
          supported?: boolean
        }
        Update: {
          code?: string
          name?: string
          sort_order?: number
          supported?: boolean
        }
        Relationships: []
      }
      currency_rates: {
        Row: {
          currency: string
          rate_to_eur: number
          updated_at: string
        }
        Insert: {
          currency: string
          rate_to_eur: number
          updated_at?: string
        }
        Update: {
          currency?: string
          rate_to_eur?: number
          updated_at?: string
        }
        Relationships: []
      }
      faculties: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          university_id: string
          updated_at: string
          website_url: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          university_id: string
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          university_id?: string
          updated_at?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "faculties_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      fields_of_study: {
        Row: {
          category: string
          id: string
          name: string
          subcategory: string | null
        }
        Insert: {
          category: string
          id?: string
          name: string
          subcategory?: string | null
        }
        Update: {
          category?: string
          id?: string
          name?: string
          subcategory?: string | null
        }
        Relationships: []
      }
      import_errors: {
        Row: {
          created_at: string
          field: string | null
          id: string
          import_id: string
          message: string
          raw_row: Json | null
          row_number: number | null
        }
        Insert: {
          created_at?: string
          field?: string | null
          id?: string
          import_id: string
          message: string
          raw_row?: Json | null
          row_number?: number | null
        }
        Update: {
          created_at?: string
          field?: string | null
          id?: string
          import_id?: string
          message?: string
          raw_row?: Json | null
          row_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "import_errors_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "imports"
            referencedColumns: ["id"]
          },
        ]
      }
      imports: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string | null
          error_count: number
          format: string
          id: string
          imported_count: number
          row_count: number
          source_name: string
          source_url: string | null
          status: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          error_count?: number
          format: string
          id?: string
          imported_count?: number
          row_count?: number
          source_name: string
          source_url?: string | null
          status?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          error_count?: number
          format?: string
          id?: string
          imported_count?: number
          row_count?: number
          source_name?: string
          source_url?: string | null
          status?: string
        }
        Relationships: []
      }
      languages: {
        Row: {
          code: string
          name: string
        }
        Insert: {
          code: string
          name: string
        }
        Update: {
          code?: string
          name?: string
        }
        Relationships: []
      }
      nmt_subjects: {
        Row: {
          available_from_year: number | null
          available_until_year: number | null
          code: string
          name: string
        }
        Insert: {
          available_from_year?: number | null
          available_until_year?: number | null
          code: string
          name: string
        }
        Update: {
          available_from_year?: number | null
          available_until_year?: number | null
          code?: string
          name?: string
        }
        Relationships: []
      }
      programme_academic_requirements: {
        Row: {
          entrance_exam_notes: string | null
          entrance_exam_required: boolean
          gpa_scale: number | null
          id: string
          interview_required: boolean
          min_gpa: number | null
          notes: string | null
          portfolio_required: boolean
          programme_id: string
          required_degree_level:
            | Database["public"]["Enums"]["degree_level"]
            | null
          required_math_background:
            | Database["public"]["Enums"]["math_background"]
            | null
          required_subjects: string[]
        }
        Insert: {
          entrance_exam_notes?: string | null
          entrance_exam_required?: boolean
          gpa_scale?: number | null
          id?: string
          interview_required?: boolean
          min_gpa?: number | null
          notes?: string | null
          portfolio_required?: boolean
          programme_id: string
          required_degree_level?:
            | Database["public"]["Enums"]["degree_level"]
            | null
          required_math_background?:
            | Database["public"]["Enums"]["math_background"]
            | null
          required_subjects?: string[]
        }
        Update: {
          entrance_exam_notes?: string | null
          entrance_exam_required?: boolean
          gpa_scale?: number | null
          id?: string
          interview_required?: boolean
          min_gpa?: number | null
          notes?: string | null
          portfolio_required?: boolean
          programme_id?: string
          required_degree_level?:
            | Database["public"]["Enums"]["degree_level"]
            | null
          required_math_background?:
            | Database["public"]["Enums"]["math_background"]
            | null
          required_subjects?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "programme_academic_requirements_programme_id_fkey"
            columns: ["programme_id"]
            isOneToOne: true
            referencedRelation: "programmes"
            referencedColumns: ["id"]
          },
        ]
      }
      programme_living_cost_estimates: {
        Row: {
          accommodation_max: number | null
          accommodation_min: number | null
          created_at: string
          currency: string | null
          food_max: number | null
          food_min: number | null
          id: string
          internet_phone_max: number | null
          internet_phone_min: number | null
          notes: string | null
          other_max: number | null
          other_min: number | null
          programme_id: string
          source_date: string | null
          source_name: string | null
          source_type: string | null
          source_url: string | null
          study_materials_max: number | null
          study_materials_min: number | null
          total_max: number | null
          total_min: number | null
          transport_max: number | null
          transport_min: number | null
          updated_at: string
          utilities_max: number | null
          utilities_min: number | null
        }
        Insert: {
          accommodation_max?: number | null
          accommodation_min?: number | null
          created_at?: string
          currency?: string | null
          food_max?: number | null
          food_min?: number | null
          id?: string
          internet_phone_max?: number | null
          internet_phone_min?: number | null
          notes?: string | null
          other_max?: number | null
          other_min?: number | null
          programme_id: string
          source_date?: string | null
          source_name?: string | null
          source_type?: string | null
          source_url?: string | null
          study_materials_max?: number | null
          study_materials_min?: number | null
          total_max?: number | null
          total_min?: number | null
          transport_max?: number | null
          transport_min?: number | null
          updated_at?: string
          utilities_max?: number | null
          utilities_min?: number | null
        }
        Update: {
          accommodation_max?: number | null
          accommodation_min?: number | null
          created_at?: string
          currency?: string | null
          food_max?: number | null
          food_min?: number | null
          id?: string
          internet_phone_max?: number | null
          internet_phone_min?: number | null
          notes?: string | null
          other_max?: number | null
          other_min?: number | null
          programme_id?: string
          source_date?: string | null
          source_name?: string | null
          source_type?: string | null
          source_url?: string | null
          study_materials_max?: number | null
          study_materials_min?: number | null
          total_max?: number | null
          total_min?: number | null
          transport_max?: number | null
          transport_min?: number | null
          updated_at?: string
          utilities_max?: number | null
          utilities_min?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "programme_living_cost_estimates_programme_id_fkey"
            columns: ["programme_id"]
            isOneToOne: true
            referencedRelation: "programmes"
            referencedColumns: ["id"]
          },
        ]
      }
      programme_sources: {
        Row: {
          fact_key: string
          programme_id: string
          source_id: string
        }
        Insert: {
          fact_key?: string
          programme_id: string
          source_id: string
        }
        Update: {
          fact_key?: string
          programme_id?: string
          source_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "programme_sources_programme_id_fkey"
            columns: ["programme_id"]
            isOneToOne: false
            referencedRelation: "programmes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programme_sources_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      programme_test_requirements: {
        Row: {
          comparison: string
          created_at: string
          id: string
          minimum_score: number | null
          minimum_score_display: string | null
          notes: string | null
          programme_id: string
          qualification_id: string
          section: string | null
          subject: string | null
          updated_at: string
        }
        Insert: {
          comparison?: string
          created_at?: string
          id?: string
          minimum_score?: number | null
          minimum_score_display?: string | null
          notes?: string | null
          programme_id: string
          qualification_id: string
          section?: string | null
          subject?: string | null
          updated_at?: string
        }
        Update: {
          comparison?: string
          created_at?: string
          id?: string
          minimum_score?: number | null
          minimum_score_display?: string | null
          notes?: string | null
          programme_id?: string
          qualification_id?: string
          section?: string | null
          subject?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "programme_test_requirements_programme_id_fkey"
            columns: ["programme_id"]
            isOneToOne: false
            referencedRelation: "programmes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programme_test_requirements_qualification_id_fkey"
            columns: ["qualification_id"]
            isOneToOne: false
            referencedRelation: "qualifications"
            referencedColumns: ["id"]
          },
        ]
      }
      programme_tuition_variants: {
        Row: {
          created_at: string
          currency: string
          id: string
          name: string
          notes: string | null
          period: Database["public"]["Enums"]["tuition_fee_period"]
          programme_id: string
          tuition_max: number
          tuition_min: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency: string
          id?: string
          name: string
          notes?: string | null
          period?: Database["public"]["Enums"]["tuition_fee_period"]
          programme_id: string
          tuition_max: number
          tuition_min: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          id?: string
          name?: string
          notes?: string | null
          period?: Database["public"]["Enums"]["tuition_fee_period"]
          programme_id?: string
          tuition_max?: number
          tuition_min?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "programme_tuition_variants_programme_id_fkey"
            columns: ["programme_id"]
            isOneToOne: false
            referencedRelation: "programmes"
            referencedColumns: ["id"]
          },
        ]
      }
      programmes: {
        Row: {
          application_deadline: string | null
          application_fee_amount: number | null
          application_fee_currency: string | null
          application_url: string | null
          career_notes: string | null
          created_at: string
          degree_level: Database["public"]["Enums"]["degree_level"]
          degree_title: string | null
          description: string | null
          duration_months: number
          estimated_living_cost_monthly: number | null
          faculty_id: string | null
          field_of_study_id: string
          id: string
          intake_start: string | null
          language_code: string
          living_cost_currency: string | null
          name: string
          programme_url: string | null
          published: boolean
          required_documents: string[]
          scholarship_notes: string | null
          slug: string | null
          study_mode: Database["public"]["Enums"]["programme_study_mode"] | null
          tuition_currency: string | null
          tuition_max: number | null
          tuition_min: number | null
          university_id: string
          updated_at: string
        }
        Insert: {
          application_deadline?: string | null
          application_fee_amount?: number | null
          application_fee_currency?: string | null
          application_url?: string | null
          career_notes?: string | null
          created_at?: string
          degree_level: Database["public"]["Enums"]["degree_level"]
          degree_title?: string | null
          description?: string | null
          duration_months: number
          estimated_living_cost_monthly?: number | null
          faculty_id?: string | null
          field_of_study_id: string
          id?: string
          intake_start?: string | null
          language_code: string
          living_cost_currency?: string | null
          name: string
          programme_url?: string | null
          published?: boolean
          required_documents?: string[]
          scholarship_notes?: string | null
          slug?: string | null
          study_mode?:
            | Database["public"]["Enums"]["programme_study_mode"]
            | null
          tuition_currency?: string | null
          tuition_max?: number | null
          tuition_min?: number | null
          university_id: string
          updated_at?: string
        }
        Update: {
          application_deadline?: string | null
          application_fee_amount?: number | null
          application_fee_currency?: string | null
          application_url?: string | null
          career_notes?: string | null
          created_at?: string
          degree_level?: Database["public"]["Enums"]["degree_level"]
          degree_title?: string | null
          description?: string | null
          duration_months?: number
          estimated_living_cost_monthly?: number | null
          faculty_id?: string | null
          field_of_study_id?: string
          id?: string
          intake_start?: string | null
          language_code?: string
          living_cost_currency?: string | null
          name?: string
          programme_url?: string | null
          published?: boolean
          required_documents?: string[]
          scholarship_notes?: string | null
          slug?: string | null
          study_mode?:
            | Database["public"]["Enums"]["programme_study_mode"]
            | null
          tuition_currency?: string | null
          tuition_max?: number | null
          tuition_min?: number | null
          university_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "programmes_faculty_id_fkey"
            columns: ["faculty_id"]
            isOneToOne: false
            referencedRelation: "faculties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programmes_field_of_study_id_fkey"
            columns: ["field_of_study_id"]
            isOneToOne: false
            referencedRelation: "fields_of_study"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programmes_language_code_fkey"
            columns: ["language_code"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "programmes_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      qualifications: {
        Row: {
          active: boolean
          category: string
          code: string
          created_at: string
          description: string | null
          id: string
          max_score: number | null
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          category?: string
          code: string
          created_at?: string
          description?: string | null
          id?: string
          max_score?: number | null
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          category?: string
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          max_score?: number | null
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      saved_programmes: {
        Row: {
          created_at: string
          id: string
          note: string | null
          programme_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          note?: string | null
          programme_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          note?: string | null
          programme_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_programmes_programme_id_fkey"
            columns: ["programme_id"]
            isOneToOne: false
            referencedRelation: "programmes"
            referencedColumns: ["id"]
          },
        ]
      }
      sources: {
        Row: {
          created_at: string
          id: string
          name: string
          notes: string | null
          type: Database["public"]["Enums"]["source_type"]
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          type: Database["public"]["Enums"]["source_type"]
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          type?: Database["public"]["Enums"]["source_type"]
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      universities: {
        Row: {
          city: string
          city_size: string | null
          country_code: string
          cover_image_url: string | null
          created_at: string
          description: string | null
          founded_year: number | null
          id: string
          international_student_percentage: number | null
          latitude: number | null
          logo_url: string | null
          longitude: number | null
          name: string
          official_application_url: string | null
          ownership_type: string | null
          published: boolean
          ranking_data: Json | null
          short_description: string | null
          slug: string | null
          student_count: number | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          city: string
          city_size?: string | null
          country_code: string
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          founded_year?: number | null
          id?: string
          international_student_percentage?: number | null
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          name: string
          official_application_url?: string | null
          ownership_type?: string | null
          published?: boolean
          ranking_data?: Json | null
          short_description?: string | null
          slug?: string | null
          student_count?: number | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          city?: string
          city_size?: string | null
          country_code?: string
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          founded_year?: number | null
          id?: string
          international_student_percentage?: number | null
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          name?: string
          official_application_url?: string | null
          ownership_type?: string | null
          published?: boolean
          ranking_data?: Json | null
          short_description?: string | null
          slug?: string | null
          student_count?: number | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "universities_country_code_fkey"
            columns: ["country_code"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["code"]
          },
        ]
      }
      university_accommodation: {
        Row: {
          created_at: string
          currency: string | null
          distance_from_campus_km: number | null
          dormitory_available: boolean
          dormitory_name: string | null
          estimated_capacity: number | null
          estimated_deposit: number | null
          estimated_monthly_cost_max: number | null
          estimated_monthly_cost_min: number | null
          id: string
          notes: string | null
          official_link: string | null
          room_type: string | null
          source_date: string | null
          source_name: string | null
          source_url: string | null
          university_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string | null
          distance_from_campus_km?: number | null
          dormitory_available?: boolean
          dormitory_name?: string | null
          estimated_capacity?: number | null
          estimated_deposit?: number | null
          estimated_monthly_cost_max?: number | null
          estimated_monthly_cost_min?: number | null
          id?: string
          notes?: string | null
          official_link?: string | null
          room_type?: string | null
          source_date?: string | null
          source_name?: string | null
          source_url?: string | null
          university_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string | null
          distance_from_campus_km?: number | null
          dormitory_available?: boolean
          dormitory_name?: string | null
          estimated_capacity?: number | null
          estimated_deposit?: number | null
          estimated_monthly_cost_max?: number | null
          estimated_monthly_cost_min?: number | null
          id?: string
          notes?: string | null
          official_link?: string | null
          room_type?: string | null
          source_date?: string | null
          source_name?: string | null
          source_url?: string | null
          university_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "university_accommodation_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: true
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      university_resources: {
        Row: {
          category: string
          contact_label: string | null
          contact_type: string | null
          contact_value: string | null
          created_at: string
          description: string | null
          id: string
          link_title: string | null
          link_type: string | null
          link_url: string | null
          title: string
          university_id: string
          updated_at: string
        }
        Insert: {
          category: string
          contact_label?: string | null
          contact_type?: string | null
          contact_value?: string | null
          created_at?: string
          description?: string | null
          id?: string
          link_title?: string | null
          link_type?: string | null
          link_url?: string | null
          title: string
          university_id: string
          updated_at?: string
        }
        Update: {
          category?: string
          contact_label?: string | null
          contact_type?: string | null
          contact_value?: string | null
          created_at?: string
          description?: string | null
          id?: string
          link_title?: string | null
          link_type?: string | null
          link_url?: string | null
          title?: string
          university_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "university_resources_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      university_sources: {
        Row: {
          fact_key: string
          source_id: string
          university_id: string
        }
        Insert: {
          fact_key?: string
          source_id: string
          university_id: string
        }
        Update: {
          fact_key?: string
          source_id?: string
          university_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "university_sources_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "university_sources_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      user_language_proficiency: {
        Row: {
          language_code: string
          level: string
          user_id: string
        }
        Insert: {
          language_code: string
          level: string
          user_id: string
        }
        Update: {
          language_code?: string
          level?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_language_proficiency_language_code_fkey"
            columns: ["language_code"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["code"]
          },
        ]
      }
      user_match_weights: {
        Row: {
          academic: number
          admission: number
          budget: number
          career: number
          format: number
          language: number
          lifestyle: number
          location: number
          support: number
          updated_at: string
          user_id: string
        }
        Insert: {
          academic?: number
          admission?: number
          budget?: number
          career?: number
          format?: number
          language?: number
          lifestyle?: number
          location?: number
          support?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          academic?: number
          admission?: number
          budget?: number
          career?: number
          format?: number
          language?: number
          lifestyle?: number
          location?: number
          support?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_nmt_scores: {
        Row: {
          created_at: string
          id: string
          max_score: number
          score: number
          score_is_expected: boolean
          subject_code: string
          test_year: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          max_score?: number
          score: number
          score_is_expected?: boolean
          subject_code: string
          test_year?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          max_score?: number
          score?: number
          score_is_expected?: boolean
          subject_code?: string
          test_year?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_nmt_scores_subject_code_fkey"
            columns: ["subject_code"]
            isOneToOne: false
            referencedRelation: "nmt_subjects"
            referencedColumns: ["code"]
          },
        ]
      }
      user_profiles: {
        Row: {
          admission_preference:
            | Database["public"]["Enums"]["admission_preference"]
            | null
          budget_currency: string | null
          budget_max: number | null
          budget_min: number | null
          budget_mode: Database["public"]["Enums"]["budget_mode"]
          career_priorities: string[]
          created_at: string
          current_education_level:
            | Database["public"]["Enums"]["education_level"]
            | null
          current_gpa: number | null
          current_gpa_scale: number | null
          education_stage: Database["public"]["Enums"]["education_stage"] | null
          english_level: Database["public"]["Enums"]["cefr_level"] | null
          full_name: string | null
          graduation_year: number | null
          has_graduated: boolean | null
          id: string
          living_cost_mode: Database["public"]["Enums"]["budget_mode"]
          location_preference_type:
            | Database["public"]["Enums"]["location_preference_type"]
            | null
          math_background: Database["public"]["Enums"]["math_background"] | null
          national_exam_type: string | null
          nationality_country_code: string | null
          open_to_additional_exams: boolean | null
          open_to_other_cities: boolean | null
          preferred_cities: string[]
          preferred_country_codes: string[]
          preferred_degree_level:
            | Database["public"]["Enums"]["degree_level"]
            | null
          preferred_field_of_study_ids: string[]
          preferred_language_codes: string[]
          preferred_ownership_type: string | null
          preferred_study_format:
            | Database["public"]["Enums"]["study_format"]
            | null
          primary_field_of_study_id: string | null
          residence_city: string | null
          residence_country_code: string | null
          start_year: number | null
          support_preference: string | null
          updated_at: string
          wants_dormitory: boolean | null
          wants_scholarship: boolean | null
          wants_stay_after_graduation: boolean | null
          wants_work_during_study: boolean | null
        }
        Insert: {
          admission_preference?:
            | Database["public"]["Enums"]["admission_preference"]
            | null
          budget_currency?: string | null
          budget_max?: number | null
          budget_min?: number | null
          budget_mode?: Database["public"]["Enums"]["budget_mode"]
          career_priorities?: string[]
          created_at?: string
          current_education_level?:
            | Database["public"]["Enums"]["education_level"]
            | null
          current_gpa?: number | null
          current_gpa_scale?: number | null
          education_stage?:
            | Database["public"]["Enums"]["education_stage"]
            | null
          english_level?: Database["public"]["Enums"]["cefr_level"] | null
          full_name?: string | null
          graduation_year?: number | null
          has_graduated?: boolean | null
          id: string
          living_cost_mode?: Database["public"]["Enums"]["budget_mode"]
          location_preference_type?:
            | Database["public"]["Enums"]["location_preference_type"]
            | null
          math_background?:
            | Database["public"]["Enums"]["math_background"]
            | null
          national_exam_type?: string | null
          nationality_country_code?: string | null
          open_to_additional_exams?: boolean | null
          open_to_other_cities?: boolean | null
          preferred_cities?: string[]
          preferred_country_codes?: string[]
          preferred_degree_level?:
            | Database["public"]["Enums"]["degree_level"]
            | null
          preferred_field_of_study_ids?: string[]
          preferred_language_codes?: string[]
          preferred_ownership_type?: string | null
          preferred_study_format?:
            | Database["public"]["Enums"]["study_format"]
            | null
          primary_field_of_study_id?: string | null
          residence_city?: string | null
          residence_country_code?: string | null
          start_year?: number | null
          support_preference?: string | null
          updated_at?: string
          wants_dormitory?: boolean | null
          wants_scholarship?: boolean | null
          wants_stay_after_graduation?: boolean | null
          wants_work_during_study?: boolean | null
        }
        Update: {
          admission_preference?:
            | Database["public"]["Enums"]["admission_preference"]
            | null
          budget_currency?: string | null
          budget_max?: number | null
          budget_min?: number | null
          budget_mode?: Database["public"]["Enums"]["budget_mode"]
          career_priorities?: string[]
          created_at?: string
          current_education_level?:
            | Database["public"]["Enums"]["education_level"]
            | null
          current_gpa?: number | null
          current_gpa_scale?: number | null
          education_stage?:
            | Database["public"]["Enums"]["education_stage"]
            | null
          english_level?: Database["public"]["Enums"]["cefr_level"] | null
          full_name?: string | null
          graduation_year?: number | null
          has_graduated?: boolean | null
          id?: string
          living_cost_mode?: Database["public"]["Enums"]["budget_mode"]
          location_preference_type?:
            | Database["public"]["Enums"]["location_preference_type"]
            | null
          math_background?:
            | Database["public"]["Enums"]["math_background"]
            | null
          national_exam_type?: string | null
          nationality_country_code?: string | null
          open_to_additional_exams?: boolean | null
          open_to_other_cities?: boolean | null
          preferred_cities?: string[]
          preferred_country_codes?: string[]
          preferred_degree_level?:
            | Database["public"]["Enums"]["degree_level"]
            | null
          preferred_field_of_study_ids?: string[]
          preferred_language_codes?: string[]
          preferred_ownership_type?: string | null
          preferred_study_format?:
            | Database["public"]["Enums"]["study_format"]
            | null
          primary_field_of_study_id?: string | null
          residence_city?: string | null
          residence_country_code?: string | null
          start_year?: number | null
          support_preference?: string | null
          updated_at?: string
          wants_dormitory?: boolean | null
          wants_scholarship?: boolean | null
          wants_stay_after_graduation?: boolean | null
          wants_work_during_study?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_nationality_country_code_fkey"
            columns: ["nationality_country_code"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "user_profiles_primary_field_of_study_id_fkey"
            columns: ["primary_field_of_study_id"]
            isOneToOne: false
            referencedRelation: "fields_of_study"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_profiles_residence_country_code_fkey"
            columns: ["residence_country_code"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["code"]
          },
        ]
      }
      user_qualifications: {
        Row: {
          created_at: string
          details: Json
          id: string
          notes: string | null
          qualification_id: string
          user_id: string
          year: number | null
        }
        Insert: {
          created_at?: string
          details?: Json
          id?: string
          notes?: string | null
          qualification_id: string
          user_id: string
          year?: number | null
        }
        Update: {
          created_at?: string
          details?: Json
          id?: string
          notes?: string | null
          qualification_id?: string
          user_id?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_qualifications_qualification_id_fkey"
            columns: ["qualification_id"]
            isOneToOne: false
            referencedRelation: "qualifications"
            referencedColumns: ["id"]
          },
        ]
      }
      user_subject_strengths: {
        Row: {
          level: string
          subject_code: string
          user_id: string
        }
        Insert: {
          level: string
          subject_code: string
          user_id: string
        }
        Update: {
          level?: string
          subject_code?: string
          user_id?: string
        }
        Relationships: []
      }
      user_test_scores: {
        Row: {
          cefr_equivalent: Database["public"]["Enums"]["cefr_level"] | null
          created_at: string
          id: string
          qualification_id: string | null
          score: number
          score_display: string
          test_date: string | null
          test_type: string
          user_id: string
        }
        Insert: {
          cefr_equivalent?: Database["public"]["Enums"]["cefr_level"] | null
          created_at?: string
          id?: string
          qualification_id?: string | null
          score: number
          score_display: string
          test_date?: string | null
          test_type: string
          user_id: string
        }
        Update: {
          cefr_equivalent?: Database["public"]["Enums"]["cefr_level"] | null
          created_at?: string
          id?: string
          qualification_id?: string | null
          score?: number
          score_display?: string
          test_date?: string | null
          test_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_test_scores_qualification_id_fkey"
            columns: ["qualification_id"]
            isOneToOne: false
            referencedRelation: "qualifications"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      admission_preference:
        | "safest"
        | "balanced"
        | "competitive"
        | "no_preference"
      budget_mode: "exact" | "low" | "medium" | "high" | "unknown"
      cefr_level:
        | "a1"
        | "a2"
        | "b1"
        | "b2"
        | "c1"
        | "c2"
        | "native"
        | "not_sure"
      degree_level: "foundation" | "bachelor" | "master" | "phd"
      education_level: "high_school" | "bachelor" | "master"
      education_stage:
        | "grade_9"
        | "grade_10"
        | "grade_11"
        | "finished_school"
        | "college"
        | "other"
      location_preference_type:
        | "specific_city"
        | "any_city"
        | "capital_or_large_city"
        | "medium_city"
        | "small_city"
        | "student_city"
        | "flexible"
      math_background: "excellent" | "good" | "average" | "weak" | "not_sure"
      programme_study_mode:
        | "full_time"
        | "part_time"
        | "distance"
        | "online"
        | "hybrid"
      source_type:
        | "official_university"
        | "official_faculty"
        | "official_dormitory"
        | "public_reference"
      study_format: "full_time" | "part_time" | "either"
      tuition_fee_period: "per_year" | "per_semester" | "total"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      admission_preference: [
        "safest",
        "balanced",
        "competitive",
        "no_preference",
      ],
      budget_mode: ["exact", "low", "medium", "high", "unknown"],
      cefr_level: ["a1", "a2", "b1", "b2", "c1", "c2", "native", "not_sure"],
      degree_level: ["foundation", "bachelor", "master", "phd"],
      education_level: ["high_school", "bachelor", "master"],
      education_stage: [
        "grade_9",
        "grade_10",
        "grade_11",
        "finished_school",
        "college",
        "other",
      ],
      location_preference_type: [
        "specific_city",
        "any_city",
        "capital_or_large_city",
        "medium_city",
        "small_city",
        "student_city",
        "flexible",
      ],
      math_background: ["excellent", "good", "average", "weak", "not_sure"],
      programme_study_mode: [
        "full_time",
        "part_time",
        "distance",
        "online",
        "hybrid",
      ],
      source_type: [
        "official_university",
        "official_faculty",
        "official_dormitory",
        "public_reference",
      ],
      study_format: ["full_time", "part_time", "either"],
      tuition_fee_period: ["per_year", "per_semester", "total"],
    },
  },
} as const

export type DegreeLevel = Enums<"degree_level">;
export type TuitionFeePeriod = Enums<"tuition_fee_period">;
export type EducationLevel = Enums<"education_level">;
export type StudyFormat = Enums<"study_format">;
export type LocationPreferenceType = Enums<"location_preference_type">;
export type BudgetMode = Enums<"budget_mode">;
export type CefrLevel = Enums<"cefr_level">;
export type MathBackground = Enums<"math_background">;
export type AdmissionPreference = Enums<"admission_preference">;
export type ProgrammeStudyMode = Enums<"programme_study_mode">;
export type SourceType = Enums<"source_type">;
export type EducationStage = Enums<"education_stage">;
export type ImportFormat = "json" | "csv";
