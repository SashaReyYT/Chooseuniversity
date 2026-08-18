import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type TypedSupabaseClient = SupabaseClient<Database>;
type UserTestScoreRow = Database["public"]["Tables"]["user_test_scores"]["Row"];
type UserTestScoreInsert =
  Database["public"]["Tables"]["user_test_scores"]["Insert"];

export class UserTestScoresRepository {
  constructor(private readonly supabase: TypedSupabaseClient) {}

  async listByUserId(userId: string): Promise<UserTestScoreRow[]> {
    const { data, error } = await this.supabase
      .from("user_test_scores")
      .select("*")
      .eq("user_id", userId);

    if (error) throw error;
    return data ?? [];
  }

  /** Insert or replace this user's score for a given test type (one row per user+test_type, per the schema's unique constraint). */
  async upsert(score: UserTestScoreInsert): Promise<UserTestScoreRow> {
    const { data, error } = await this.supabase
      .from("user_test_scores")
      .upsert(score, { onConflict: "user_id,test_type" })
      .select("*")
      .single();

    if (error) throw error;
    return data;
  }

  /** Removes test-type scores the user un-selected on a later submission. */
  async deleteByTestTypes(userId: string, keepTestTypes: string[]): Promise<void> {
    let query = this.supabase
      .from("user_test_scores")
      .delete()
      .eq("user_id", userId);

    query =
      keepTestTypes.length > 0
        ? query.not("test_type", "in", `(${keepTestTypes.join(",")})`)
        : query;

    const { error } = await query;
    if (error) throw error;
  }
}
