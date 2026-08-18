import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type TypedSupabaseClient = SupabaseClient<Database>;

type SourceRow = Database["public"]["Tables"]["sources"]["Row"];

export type SourceWithLinkCounts = SourceRow & {
  programme_count: number;
  university_count: number;
};

/** Admin management of the sources tables (§41/§44). */
export class AdminSourcesRepository {
  constructor(private readonly supabase: TypedSupabaseClient) {}

  async listSources(): Promise<SourceWithLinkCounts[]> {
    const { data, error } = await this.supabase
      .from("sources")
      .select("*, programme_count:programme_sources(count), university_count:university_sources(count)")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((row) => ({
      ...row,
      programme_count:
        typeof row.programme_count === "number"
          ? row.programme_count
          : (row.programme_count?.[0]?.count ?? 0),
      university_count:
        typeof row.university_count === "number"
          ? row.university_count
          : (row.university_count?.[0]?.count ?? 0),
    })) as SourceWithLinkCounts[];
  }

  async createSource(
    input: Database["public"]["Tables"]["sources"]["Insert"],
  ): Promise<SourceRow> {
    const { data, error } = await this.supabase
      .from("sources")
      .insert(input)
      .select("*")
      .single();
    if (error) throw error;
    return data;
  }

  async deleteSource(id: string): Promise<void> {
    const { error } = await this.supabase.from("sources").delete().eq("id", id);
    if (error) throw error;
  }

  async linkToProgramme(
    programmeId: string,
    sourceId: string,
    factKey: string,
  ): Promise<void> {
    const { error } = await this.supabase
      .from("programme_sources")
      .upsert({ programme_id: programmeId, source_id: sourceId, fact_key: factKey }, { onConflict: "programme_id,source_id,fact_key" });
    if (error) throw error;
  }

  async linkToUniversity(
    universityId: string,
    sourceId: string,
    factKey: string,
  ): Promise<void> {
    const { error } = await this.supabase
      .from("university_sources")
      .upsert({ university_id: universityId, source_id: sourceId, fact_key: factKey }, { onConflict: "university_id,source_id,fact_key" });
    if (error) throw error;
  }
}