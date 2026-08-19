import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type TypedSupabaseClient = SupabaseClient<Database>;
type SubjectStrengthRow =
  Database["public"]["Tables"]["user_subject_strengths"]["Row"];

export interface SubjectStrengthInput {
  subjectCode: string;
  level: "good" | "average" | "poor";
}

export class UserSubjectStrengthsRepository {
  constructor(private readonly supabase: TypedSupabaseClient) {}

  async listByUserId(userId: string): Promise<SubjectStrengthRow[]> {
    const { data, error } = await this.supabase
      .from("user_subject_strengths")
      .select("*")
      .eq("user_id", userId);

    if (error) throw error;
    return data ?? [];
  }

  /**
   * Replaces this user's subject-strength answers with exactly the set
   * submitted — a subject un-selected on a later run of the questionnaire
   * has its strength row removed rather than left stale.
   */
  async replace(
    userId: string,
    entries: SubjectStrengthInput[],
  ): Promise<void> {
    if (entries.length > 0) {
      const { error } = await this.supabase
        .from("user_subject_strengths")
        .upsert(
          entries.map((entry) => ({
            user_id: userId,
            subject_code: entry.subjectCode,
            level: entry.level,
          })),
          { onConflict: "user_id,subject_code" },
        );
      if (error) throw error;
    }

    const keepCodes =
      entries.length > 0 ? entries.map((entry) => entry.subjectCode) : [""];
    const { error: deleteError } = await this.supabase
      .from("user_subject_strengths")
      .delete()
      .eq("user_id", userId)
      .not("subject_code", "in", `(${keepCodes.join(",")})`);
    if (deleteError) throw deleteError;
  }
}