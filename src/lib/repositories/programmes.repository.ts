import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type TypedSupabaseClient = SupabaseClient<Database>;

type UniversityWithCountry =
  Database["public"]["Tables"]["universities"]["Row"] & {
    country: Database["public"]["Tables"]["countries"]["Row"];
    sources: ProgrammeSourceLink[];
  };

export type ProgrammeSourceLink = {
  fact_key: string;
  source: Database["public"]["Tables"]["sources"]["Row"];
};

export type ProgrammeTestRequirement =
  Database["public"]["Tables"]["programme_test_requirements"]["Row"] & {
    qualification: Database["public"]["Tables"]["qualifications"]["Row"];
  };

export type ProgrammeWithDetails =
  Database["public"]["Tables"]["programmes"]["Row"] & {
    university: UniversityWithCountry;
    faculty: Database["public"]["Tables"]["faculties"]["Row"] | null;
    field_of_study: Database["public"]["Tables"]["fields_of_study"]["Row"];
    language: Database["public"]["Tables"]["languages"]["Row"];
    academic_requirements:
      | Database["public"]["Tables"]["programme_academic_requirements"]["Row"]
      | null;
    test_requirements: ProgrammeTestRequirement[];
    tuition_variants: Database["public"]["Tables"]["programme_tuition_variants"]["Row"][];
    accommodation:
      | Database["public"]["Tables"]["university_accommodation"]["Row"]
      | null;
    living_cost_estimates:
      | Database["public"]["Tables"]["programme_living_cost_estimates"]["Row"]
      | null;
    sources: ProgrammeSourceLink[];
  };

const SELECT_WITH_DETAILS = `*,
  university:universities(*, country:countries(*), sources:university_sources(source:sources(*))),
  faculty:faculties(*),
  field_of_study:fields_of_study(*),
  language:languages(*),
  academic_requirements:programme_academic_requirements(*),
  test_requirements:programme_test_requirements(qualification:qualifications(*)),
  tuition_variants:programme_tuition_variants(*),
  accommodation:university_accommodation(*),
  living_cost_estimates:programme_living_cost_estimates(*),
  sources:programme_sources(source:sources(*))`;

/**
 * Supabase returns every embedded to-one relation (belongs-to a single
 * row via a foreign key) typed as an array, even though the FK guarantees
 * at most one row. This unwraps those so callers get the shape the schema
 * actually guarantees instead of re-checking `Array.isArray` everywhere
 * matching-engine code touches a programme.
 */
function normalizeProgrammeRow(row: {
  university: UniversityWithCountry | UniversityWithCountry[];
  faculty:
    | Database["public"]["Tables"]["faculties"]["Row"]
    | Database["public"]["Tables"]["faculties"]["Row"][]
    | null;
  field_of_study:
    | Database["public"]["Tables"]["fields_of_study"]["Row"]
    | Database["public"]["Tables"]["fields_of_study"]["Row"][];
  language:
    | Database["public"]["Tables"]["languages"]["Row"]
    | Database["public"]["Tables"]["languages"]["Row"][];
  academic_requirements:
    | Database["public"]["Tables"]["programme_academic_requirements"]["Row"]
    | Database["public"]["Tables"]["programme_academic_requirements"]["Row"][]
    | null;
  test_requirements: ProgrammeTestRequirement[] | null;
  tuition_variants:
    | Database["public"]["Tables"]["programme_tuition_variants"]["Row"][]
    | null;
  accommodation:
    | Database["public"]["Tables"]["university_accommodation"]["Row"]
    | Database["public"]["Tables"]["university_accommodation"]["Row"][]
    | null;
  living_cost_estimates:
    | Database["public"]["Tables"]["programme_living_cost_estimates"]["Row"]
    | Database["public"]["Tables"]["programme_living_cost_estimates"]["Row"][]
    | null;
  sources: ProgrammeSourceLink | ProgrammeSourceLink[] | null;
  [key: string]: unknown;
}): ProgrammeWithDetails {
  const university = Array.isArray(row.university)
    ? row.university[0]
    : row.university;

  return {
    ...row,
    university: {
      ...university,
      country: Array.isArray(university.country)
        ? university.country[0]
        : university.country,
      sources: Array.isArray(university.sources)
        ? university.sources
        : university.sources
          ? [university.sources]
          : [],
    },
    faculty: Array.isArray(row.faculty)
      ? (row.faculty[0] ?? null)
      : row.faculty,
    field_of_study: Array.isArray(row.field_of_study)
      ? row.field_of_study[0]
      : row.field_of_study,
    language: Array.isArray(row.language) ? row.language[0] : row.language,
    academic_requirements: Array.isArray(row.academic_requirements)
      ? (row.academic_requirements[0] ?? null)
      : row.academic_requirements,
    test_requirements: row.test_requirements ?? [],
    tuition_variants: row.tuition_variants ?? [],
    accommodation: Array.isArray(row.accommodation)
      ? (row.accommodation[0] ?? null)
      : row.accommodation,
    living_cost_estimates: Array.isArray(row.living_cost_estimates)
      ? (row.living_cost_estimates[0] ?? null)
      : row.living_cost_estimates,
    sources: Array.isArray(row.sources)
      ? row.sources
      : row.sources
        ? [row.sources]
        : [],
  } as ProgrammeWithDetails;
}

/**
 * Read access to the public programme catalog. No writes here — catalog
 * content is managed server-side (outside this app for now; see the RLS
 * policy comments in `supabase/migrations/0006_row_level_security.sql`).
 */
export class ProgrammesRepository {
  constructor(private readonly supabase: TypedSupabaseClient) {}

  /**
   * Fetch every programme with the structured data the matching engine
   * needs to score it: university (+ its country), field of study,
   * language of instruction, academic requirements, and accepted
   * language tests.
   */
  async listWithDetails(): Promise<ProgrammeWithDetails[]> {
    const { data, error } = await this.supabase
      .from("programmes")
      .select(SELECT_WITH_DETAILS);

    if (error) throw error;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase's generated row type for a multi-level embed doesn't structurally match normalizeProgrammeRow's input shape without this; the shape is enforced at the SELECT_WITH_DETAILS string above instead.
    return (data ?? []).map((row) => normalizeProgrammeRow(row as any));
  }

  async findById(id: string): Promise<ProgrammeWithDetails | null> {
    const { data, error } = await this.supabase
      .from("programmes")
      .select(SELECT_WITH_DETAILS)
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- see listWithDetails above.
    return normalizeProgrammeRow(data as any);
  }

  /** Bulk fetch by id — for hydrating a set of saved/compared programmes without one query per row. Order is not guaranteed to match `ids`; callers that need a specific order should re-sort by their own id list. */
  async findByIds(ids: string[]): Promise<ProgrammeWithDetails[]> {
    if (ids.length === 0) return [];

    const { data, error } = await this.supabase
      .from("programmes")
      .select(SELECT_WITH_DETAILS)
      .in("id", ids);

    if (error) throw error;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- see listWithDetails above.
    return (data ?? []).map((row) => normalizeProgrammeRow(row as any));
  }

  /**
   * Server-side search (§35) with filtering (§36) and sorting.
   *
   * Search supports: university name, programme name, city, country,
   * field of study, degree. All searches are case-insensitive ILIKE
   * queries executed server-side — never fetching all records into
   * the browser.
   */
  async search(params: {
    query?: string;
    fieldOfStudyId?: string;
    degreeLevel?: string;
    city?: string;
    universityId?: string;
    languageCode?: string;
    tuitionMax?: number;
    livingCostMax?: number;
    admissionDifficulty?: string;
    minMatchScore?: number;
    studyFormat?: string;
    sortBy?: "best_match" | "lowest_tuition" | "highest_match" | "lowest_cost";
  }): Promise<ProgrammeWithDetails[]> {
    // Start with the base query
    let query = this.supabase
      .from("programmes")
      .select(SELECT_WITH_DETAILS);

    // Text search — apply via ILIKE on multiple columns
    if (params.query && params.query.trim().length > 0) {
      const search = `%${params.query.trim()}%`;
      // Use Supabase's `or` filter for cross-table text search
      query = query.or(
        `name.ilike.${search},` +
        `university.name.ilike.${search},` +
        `university.city.ilike.${search},` +
        `university.country.name.ilike.${search},` +
        `field_of_study.name.ilike.${search},` +
        `field_of_study.category.ilike.${search},` +
        `degree_level.ilike.${search}`,
      );
    }

    // Filters
    if (params.fieldOfStudyId) {
      query = query.eq("field_of_study_id", params.fieldOfStudyId);
    }

    if (params.degreeLevel) {
      query = query.eq("degree_level", params.degreeLevel as "foundation" | "bachelor" | "master" | "phd");
    }

    if (params.city) {
      query = query.ilike("university.city", `%${params.city}%`);
    }

    if (params.universityId) {
      query = query.eq("university_id", params.universityId);
    }

    if (params.languageCode) {
      query = query.eq("language_code", params.languageCode);
    }

    if (params.tuitionMax != null && params.tuitionMax > 0) {
      query = query.lte("tuition_min", params.tuitionMax);
    }

    if (params.livingCostMax != null && params.livingCostMax > 0) {
      query = query.lte("estimated_living_cost_monthly", params.livingCostMax);
    }

    // Sorting
    switch (params.sortBy) {
      case "lowest_tuition":
        query = query.order("tuition_min", { ascending: true });
        break;
      case "lowest_cost":
        query = query.order("estimated_living_cost_monthly", { ascending: true, nullsFirst: false });
        break;
      case "best_match":
      case "highest_match":
      default:
        // Default sort by programme name, caller will re-sort by match score
        query = query.order("name", { ascending: true });
        break;
    }

    const { data, error } = await query;

    if (error) throw error;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- see listWithDetails above.
    return (data ?? []).map((row) => normalizeProgrammeRow(row as any));
  }

  /**
   * Get distinct cities from universities that have programmes.
   */
  async listCities(): Promise<string[]> {
    const { data, error } = await this.supabase
      .from("universities")
      .select("city")
      .order("city");

    if (error) throw error;
    return [...new Set(data.map((r) => r.city).filter(Boolean))];
  }
}
