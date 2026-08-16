import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type TypedSupabaseClient = SupabaseClient<Database>;

type UniversityWithCountry =
  Database["public"]["Tables"]["universities"]["Row"] & {
    country: Database["public"]["Tables"]["countries"]["Row"];
  };

export type ProgrammeWithDetails =
  Database["public"]["Tables"]["programmes"]["Row"] & {
    university: UniversityWithCountry;
    field_of_study: Database["public"]["Tables"]["fields_of_study"]["Row"];
    language: Database["public"]["Tables"]["languages"]["Row"];
    academic_requirements:
      | Database["public"]["Tables"]["programme_academic_requirements"]["Row"]
      | null;
    language_requirements: Database["public"]["Tables"]["programme_language_requirements"]["Row"][];
  };

const SELECT_WITH_DETAILS = `*,
  university:universities(*, country:countries(*)),
  field_of_study:fields_of_study(*),
  language:languages(*),
  academic_requirements:programme_academic_requirements(*),
  language_requirements:programme_language_requirements(*)`;

/**
 * Supabase returns every embedded to-one relation (belongs-to a single
 * row via a foreign key) typed as an array, even though the FK guarantees
 * at most one row. This unwraps those so callers get the shape the schema
 * actually guarantees instead of re-checking `Array.isArray` everywhere
 * matching-engine code touches a programme.
 */
function normalizeProgrammeRow(row: {
  university: UniversityWithCountry | UniversityWithCountry[];
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
  language_requirements:
    | Database["public"]["Tables"]["programme_language_requirements"]["Row"][]
    | null;
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
    },
    field_of_study: Array.isArray(row.field_of_study)
      ? row.field_of_study[0]
      : row.field_of_study,
    language: Array.isArray(row.language) ? row.language[0] : row.language,
    academic_requirements: Array.isArray(row.academic_requirements)
      ? (row.academic_requirements[0] ?? null)
      : row.academic_requirements,
    language_requirements: row.language_requirements ?? [],
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
}
