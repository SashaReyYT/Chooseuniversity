import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type TypedSupabaseClient = SupabaseClient<Database>;

type UniversityRow = Database["public"]["Tables"]["universities"]["Row"];
type UniversityInsert =
  Database["public"]["Tables"]["universities"]["Insert"];
type UniversityUpdate =
  Database["public"]["Tables"]["universities"]["Update"];
type ProgrammeRow = Database["public"]["Tables"]["programmes"]["Row"];
type ProgrammeInsert = Database["public"]["Tables"]["programmes"]["Insert"];
type ProgrammeUpdate = Database["public"]["Tables"]["programmes"]["Update"];

/**
 * Admin writes on the public catalog (universities, programmes, and the
 * small reference tables). Read access is deliberately public per RLS,
 * but every mutation here is only possible because the caller has
 * already passed the admin gate — and RLS independently enforces it
 * (migration 0010, `public.is_admin()` policies).
 */
export class AdminCatalogRepository {
  constructor(private readonly supabase: TypedSupabaseClient) {}

  // ---- Universities ----

  async listUniversities(): Promise<
    (UniversityRow & { country: Database["public"]["Tables"]["countries"]["Row"] | null })[]
  > {
    const { data, error } = await this.supabase
      .from("universities")
      .select("*, country:countries(*)")
      .order("name");
    if (error) throw error;
    return (data ?? []).map((row) => ({
      ...row,
      country: Array.isArray(row.country) ? (row.country[0] ?? null) : row.country,
    })) as (UniversityRow & {
      country: Database["public"]["Tables"]["countries"]["Row"] | null;
    })[];
  }

  async findUniversity(id: string): Promise<UniversityRow | null> {
    const { data, error } = await this.supabase
      .from("universities")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  async createUniversity(input: UniversityInsert): Promise<UniversityRow> {
    const { data, error } = await this.supabase
      .from("universities")
      .insert(input)
      .select("*")
      .single();
    if (error) throw error;
    return data;
  }

  async updateUniversity(
    id: string,
    changes: UniversityUpdate,
  ): Promise<UniversityRow> {
    const { data, error } = await this.supabase
      .from("universities")
      .update(changes)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return data;
  }

  async deleteUniversity(id: string): Promise<void> {
    const { error } = await this.supabase.from("universities").delete().eq("id", id);
    if (error) throw error;
  }

  // ---- Programmes ----

  async listProgrammes(): Promise<
    (ProgrammeRow & {
      university: Database["public"]["Tables"]["universities"]["Row"] | null;
      field_of_study: Database["public"]["Tables"]["fields_of_study"]["Row"] | null;
      language: Database["public"]["Tables"]["languages"]["Row"] | null;
    })[]
  > {
    const { data, error } = await this.supabase
      .from("programmes")
      .select(
        "*, university:universities(*), field_of_study:fields_of_study(*), language:languages(*)",
      )
      .order("name");
    if (error) throw error;
    return (data ?? []).map((row) => ({
      ...row,
      university: Array.isArray(row.university) ? (row.university[0] ?? null) : row.university,
      field_of_study: Array.isArray(row.field_of_study)
        ? (row.field_of_study[0] ?? null)
        : row.field_of_study,
      language: Array.isArray(row.language) ? (row.language[0] ?? null) : row.language,
    })) as (ProgrammeRow & {
      university: Database["public"]["Tables"]["universities"]["Row"] | null;
      field_of_study: Database["public"]["Tables"]["fields_of_study"]["Row"] | null;
      language: Database["public"]["Tables"]["languages"]["Row"] | null;
    })[];
  }

  async findProgramme(id: string): Promise<ProgrammeRow | null> {
    const { data, error } = await this.supabase
      .from("programmes")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  async createProgramme(input: ProgrammeInsert): Promise<ProgrammeRow> {
    const { data, error } = await this.supabase
      .from("programmes")
      .insert(input)
      .select("*")
      .single();
    if (error) throw error;
    return data;
  }

  async updateProgramme(
    id: string,
    changes: ProgrammeUpdate,
  ): Promise<ProgrammeRow> {
    const { data, error } = await this.supabase
      .from("programmes")
      .update(changes)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return data;
  }

  async deleteProgramme(id: string): Promise<void> {
    const { error } = await this.supabase.from("programmes").delete().eq("id", id);
    if (error) throw error;
  }

  // ---- Reference tables ----

  async listCountries(): Promise<Database["public"]["Tables"]["countries"]["Row"][]> {
    const { data, error } = await this.supabase
      .from("countries")
      .select("*")
      .order("sort_order");
    if (error) throw error;
    return data ?? [];
  }

  async toggleCountrySupported(code: string, supported: boolean): Promise<void> {
    const { error } = await this.supabase
      .from("countries")
      .update({ supported })
      .eq("code", code);
    if (error) throw error;
  }

  async listLanguages(): Promise<Database["public"]["Tables"]["languages"]["Row"][]> {
    const { data, error } = await this.supabase.from("languages").select("*").order("name");
    if (error) throw error;
    return data ?? [];
  }

  async createLanguage(
    input: Database["public"]["Tables"]["languages"]["Insert"],
  ): Promise<void> {
    const { error } = await this.supabase.from("languages").insert(input);
    if (error) throw error;
  }

  async listFieldsOfStudy(): Promise<
    Database["public"]["Tables"]["fields_of_study"]["Row"][]
  > {
    const { data, error } = await this.supabase
      .from("fields_of_study")
      .select("*")
      .order("name");
    if (error) throw error;
    return data ?? [];
  }

  async createFieldOfStudy(
    input: Database["public"]["Tables"]["fields_of_study"]["Insert"],
  ): Promise<void> {
    const { error } = await this.supabase.from("fields_of_study").insert(input);
    if (error) throw error;
  }

  // ---- Faculties (spec §48) ----

  async listFaculties(): Promise<
    (Database["public"]["Tables"]["faculties"]["Row"] & {
      university: Database["public"]["Tables"]["universities"]["Row"] | null;
    })[]
  > {
    const { data, error } = await this.supabase
      .from("faculties")
      .select("*, university:universities(*)")
      .order("name");
    if (error) throw error;
    return (data ?? []).map((row) => ({
      ...row,
      university: Array.isArray(row.university)
        ? (row.university[0] ?? null)
        : row.university,
    })) as (Database["public"]["Tables"]["faculties"]["Row"] & {
      university: Database["public"]["Tables"]["universities"]["Row"] | null;
    })[];
  }

  async createFaculty(
    input: Database["public"]["Tables"]["faculties"]["Insert"],
  ): Promise<void> {
    const { error } = await this.supabase.from("faculties").insert(input);
    if (error) throw error;
  }

  async updateFaculty(
    id: string,
    changes: Database["public"]["Tables"]["faculties"]["Update"],
  ): Promise<void> {
    const { error } = await this.supabase
      .from("faculties")
      .update(changes)
      .eq("id", id);
    if (error) throw error;
  }

  async deleteFaculty(id: string): Promise<void> {
    const { error } = await this.supabase.from("faculties").delete().eq("id", id);
    if (error) throw error;
  }

  // ---- Qualifications (spec §51) ----

  async listQualifications(): Promise<
    Database["public"]["Tables"]["qualifications"]["Row"][]
  > {
    const { data, error } = await this.supabase
      .from("qualifications")
      .select("*")
      .order("sort_order")
      .order("name");
    if (error) throw error;
    return data ?? [];
  }

  async createQualification(
    input: Database["public"]["Tables"]["qualifications"]["Insert"],
  ): Promise<void> {
    const { error } = await this.supabase.from("qualifications").insert(input);
    if (error) throw error;
  }

  async updateQualification(
    id: string,
    changes: Database["public"]["Tables"]["qualifications"]["Update"],
  ): Promise<void> {
    const { error } = await this.supabase
      .from("qualifications")
      .update(changes)
      .eq("id", id);
    if (error) throw error;
  }

  async deleteQualification(id: string): Promise<void> {
    const { error } = await this.supabase
      .from("qualifications")
      .delete()
      .eq("id", id);
    if (error) throw error;
  }
}