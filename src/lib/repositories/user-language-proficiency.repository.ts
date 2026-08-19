import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type TypedSupabaseClient = SupabaseClient<Database>;
type ProficiencyRow =
  Database["public"]["Tables"]["user_language_proficiency"]["Row"];

export interface LanguageProficiencyInput {
  languageCode: string;
  level: "good" | "average" | "poor" | "not_sure";
}

export class UserLanguageProficiencyRepository {
  constructor(private readonly supabase: TypedSupabaseClient) {}

  async listByUserId(userId: string): Promise<ProficiencyRow[]> {
    const { data, error } = await this.supabase
      .from("user_language_proficiency")
      .select("*")
      .eq("user_id", userId);

    if (error) throw error;
    return data ?? [];
  }

  /**
   * Replaces this user's per-language answers with exactly the set
   * submitted — a language un-selected on a later run of the questionnaire
   * has its proficiency row removed rather than left stale.
   */
  async replace(
    userId: string,
    entries: LanguageProficiencyInput[],
  ): Promise<void> {
    if (entries.length > 0) {
      const { error } = await this.supabase
        .from("user_language_proficiency")
        .upsert(
          entries.map((entry) => ({
            user_id: userId,
            language_code: entry.languageCode,
            level: entry.level,
          })),
          { onConflict: "user_id,language_code" },
        );
      if (error) throw error;
    }

    const keepCodes =
      entries.length > 0
        ? entries.map((entry) => entry.languageCode)
        : [""];
    const { error: deleteError } = await this.supabase
      .from("user_language_proficiency")
      .delete()
      .eq("user_id", userId)
      .not("language_code", "in", `(${keepCodes.join(",")})`);
    if (deleteError) throw deleteError;
  }
}