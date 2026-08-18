import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type TypedSupabaseClient = SupabaseClient<Database>;
type UserNmtScoreRow = Database["public"]["Tables"]["user_nmt_scores"]["Row"];
type UserNmtScoreInsert =
  Database["public"]["Tables"]["user_nmt_scores"]["Insert"];

export class UserNmtScoresRepository {
  constructor(private readonly supabase: TypedSupabaseClient) {}

  async listByUserId(userId: string): Promise<UserNmtScoreRow[]> {
    const { data, error } = await this.supabase
      .from("user_nmt_scores")
      .select("*")
      .eq("user_id", userId);

    if (error) throw error;
    return data ?? [];
  }

  /** Insert or replace this user's NMT score for a subject (one row per user+subject, per the schema's unique constraint). */
  async upsert(score: UserNmtScoreInsert): Promise<UserNmtScoreRow> {
    const { data, error } = await this.supabase
      .from("user_nmt_scores")
      .upsert(score, { onConflict: "user_id,subject_code" })
      .select("*")
      .single();

    if (error) throw error;
    return data;
  }

  /** Removes subject scores the user un-selected on a later submission. */
  async deleteNotIn(userId: string, keepSubjectCodes: string[]): Promise<void> {
    let query = this.supabase
      .from("user_nmt_scores")
      .delete()
      .eq("user_id", userId);

    query =
      keepSubjectCodes.length > 0
        ? query.not("subject_code", "in", `(${keepSubjectCodes.join(",")})`)
        : query;

    const { error } = await query;
    if (error) throw error;
  }
}