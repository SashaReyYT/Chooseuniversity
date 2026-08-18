import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type TypedSupabaseClient = SupabaseClient<Database>;

type AcademicRequirementsRow =
  Database["public"]["Tables"]["programme_academic_requirements"]["Row"];
type TestRequirementRow =
  Database["public"]["Tables"]["programme_test_requirements"]["Row"];
type TestRequirementInsert =
  Database["public"]["Tables"]["programme_test_requirements"]["Insert"];
type AccommodationRow =
  Database["public"]["Tables"]["university_accommodation"]["Row"];
type LivingCostRow =
  Database["public"]["Tables"]["programme_living_cost_estimates"]["Row"];
type TuitionVariantRow =
  Database["public"]["Tables"]["programme_tuition_variants"]["Row"];
type TuitionVariantInsert =
  Database["public"]["Tables"]["programme_tuition_variants"]["Insert"];

export type TestRequirementInput = Pick<
  TestRequirementRow,
  "qualification_id" | "section" | "subject" | "minimum_score" | "minimum_score_display" | "comparison" | "notes"
>;

export type TuitionVariantInput = Pick<
  TuitionVariantRow,
  "name" | "tuition_min" | "tuition_max" | "currency" | "period" | "notes"
>;

/** Admin writes for the per-programme costs & requirements tables (§40/§44/§49). */
export class AdminCostsRepository {
  constructor(private readonly supabase: TypedSupabaseClient) {}

  // ---- Academic requirements ----

  async upsertAcademicRequirements(
    programmeId: string,
    changes: Partial<Omit<AcademicRequirementsRow, "programme_id">>,
  ): Promise<AcademicRequirementsRow> {
    const { data, error } = await this.supabase
      .from("programme_academic_requirements")
      .upsert({ programme_id: programmeId, ...changes }, { onConflict: "programme_id" })
      .select("*")
      .single();
    if (error) throw error;
    return data;
  }

  // ---- Test requirements (spec §50) ----

  async listTestRequirementsWithQualification(
    programmeId: string,
  ): Promise<
    (TestRequirementRow & {
      qualification: Database["public"]["Tables"]["qualifications"]["Row"] | null;
    })[]
  > {
    const { data, error } = await this.supabase
      .from("programme_test_requirements")
      .select("*, qualification:qualifications(*)")
      .eq("programme_id", programmeId)
      .order("created_at");
    if (error) throw error;
    return (data ?? []).map((row) => ({
      ...row,
      qualification: Array.isArray(row.qualification)
        ? (row.qualification[0] ?? null)
        : row.qualification,
    })) as (TestRequirementRow & {
      qualification: Database["public"]["Tables"]["qualifications"]["Row"] | null;
    })[];
  }

  /** Replaces the full test-requirement set for a programme. */
  async replaceTestRequirements(
    programmeId: string,
    rows: TestRequirementInput[],
  ): Promise<void> {
    const { error: deleteError } = await this.supabase
      .from("programme_test_requirements")
      .delete()
      .eq("programme_id", programmeId);
    if (deleteError) throw deleteError;

    if (rows.length === 0) return;
    const insertRows: TestRequirementInsert[] = rows.map((r) => ({
      ...r,
      programme_id: programmeId,
    }));
    const { error } = await this.supabase
      .from("programme_test_requirements")
      .insert(insertRows);
    if (error) throw error;
  }

  // ---- Tuition variants (spec §49 "costs") ----

  async listTuitionVariants(
    programmeId: string,
  ): Promise<TuitionVariantRow[]> {
    const { data, error } = await this.supabase
      .from("programme_tuition_variants")
      .select("*")
      .eq("programme_id", programmeId)
      .order("tuition_min", { ascending: true });
    if (error) throw error;
    return data ?? [];
  }

  /** Replaces the full tuition-variant set for a programme. */
  async replaceTuitionVariants(
    programmeId: string,
    rows: TuitionVariantInput[],
  ): Promise<void> {
    const { error: deleteError } = await this.supabase
      .from("programme_tuition_variants")
      .delete()
      .eq("programme_id", programmeId);
    if (deleteError) throw deleteError;

    if (rows.length === 0) return;
    const insertRows: TuitionVariantInsert[] = rows.map((r) => ({
      ...r,
      programme_id: programmeId,
    }));
    const { error } = await this.supabase
      .from("programme_tuition_variants")
      .insert(insertRows);
    if (error) throw error;
  }

  // ---- Accommodation (university-level) ----

  async listAccommodationWithUniversity(): Promise<
    (AccommodationRow & {
      university: Database["public"]["Tables"]["universities"]["Row"] | null;
    })[]
  > {
    const { data, error } = await this.supabase
      .from("university_accommodation")
      .select("*, university:universities(*)");
    if (error) throw error;
    return (data ?? []).map((row) => ({
      ...row,
      university: Array.isArray(row.university)
        ? (row.university[0] ?? null)
        : row.university,
    })) as (AccommodationRow & {
      university: Database["public"]["Tables"]["universities"]["Row"] | null;
    })[];
  }

  async upsertAccommodation(
    universityId: string,
    changes: Partial<Omit<AccommodationRow, "university_id">>,
  ): Promise<AccommodationRow> {
    const { data, error } = await this.supabase
      .from("university_accommodation")
      .upsert({ university_id: universityId, ...changes }, { onConflict: "university_id" })
      .select("*")
      .single();
    if (error) throw error;
    return data;
  }

  // ---- Living cost estimates (programme-level) ----

  async upsertLivingCostEstimates(
    programmeId: string,
    changes: Partial<Omit<LivingCostRow, "programme_id">>,
  ): Promise<LivingCostRow> {
    const { data, error } = await this.supabase
      .from("programme_living_cost_estimates")
      .upsert({ programme_id: programmeId, ...changes }, { onConflict: "programme_id" })
      .select("*")
      .single();
    if (error) throw error;
    return data;
  }
}