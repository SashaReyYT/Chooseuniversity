import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type TypedSupabaseClient = SupabaseClient<Database>;
type UserQualificationRow =
  Database["public"]["Tables"]["user_qualifications"]["Row"];
type UserQualificationInsert =
  Database["public"]["Tables"]["user_qualifications"]["Insert"];

/**
 * The user's academic qualifications beyond NMT (spec §21: SAT, ACT, IB,
 * A-Levels, AP, Abitur, Matura, national certificate, other). One row per
 * (user, qualification) — see the unique constraint added in migration
 * 0011 — so re-submitting the questionnaire safely upserts rather than
 * duplicating.
 */
export class UserQualificationsRepository {
  constructor(private readonly supabase: TypedSupabaseClient) {}

  async listByUserId(userId: string): Promise<UserQualificationRow[]> {
    const { data, error } = await this.supabase
      .from("user_qualifications")
      .select("*")
      .eq("user_id", userId);

    if (error) throw error;
    return data ?? [];
  }

  async upsert(
    qualification: UserQualificationInsert,
  ): Promise<UserQualificationRow> {
    const { data, error } = await this.supabase
      .from("user_qualifications")
      .upsert(qualification, { onConflict: "user_id,qualification_id" })
      .select("*")
      .single();

    if (error) throw error;
    return data;
  }

  /** Removes qualifications the user un-selected on a later submission. */
  async deleteNotIn(userId: string, keepQualificationIds: string[]): Promise<void> {
    let query = this.supabase
      .from("user_qualifications")
      .delete()
      .eq("user_id", userId);

    query =
      keepQualificationIds.length > 0
        ? query.not(
            "qualification_id",
            "in",
            `(${keepQualificationIds.join(",")})`,
          )
        : query;

    const { error } = await query;
    if (error) throw error;
  }
}
