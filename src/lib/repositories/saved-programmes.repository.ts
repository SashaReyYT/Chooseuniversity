import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type TypedSupabaseClient = SupabaseClient<Database>;
type SavedProgrammeRow =
  Database["public"]["Tables"]["saved_programmes"]["Row"];

/**
 * Access to the current user's shortlist. RLS (see
 * `supabase/migrations/0006_row_level_security.sql`) already restricts
 * every query here to `auth.uid()`'s own rows — the explicit
 * `.eq("user_id", ...)` calls are for correct, predictable query shape,
 * not for security.
 */
export class SavedProgrammesRepository {
  constructor(private readonly supabase: TypedSupabaseClient) {}

  async listByUserId(userId: string): Promise<SavedProgrammeRow[]> {
    const { data, error } = await this.supabase
      .from("saved_programmes")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data ?? [];
  }

  async isSaved(userId: string, programmeId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from("saved_programmes")
      .select("id")
      .eq("user_id", userId)
      .eq("programme_id", programmeId)
      .maybeSingle();

    if (error) throw error;
    return data != null;
  }

  /** Idempotent — saving an already-saved programme just returns the existing row rather than erroring, per the schema's unique(user_id, programme_id) constraint. */
  async save(
    userId: string,
    programmeId: string,
    note?: string,
  ): Promise<SavedProgrammeRow> {
    const { data, error } = await this.supabase
      .from("saved_programmes")
      .upsert(
        { user_id: userId, programme_id: programmeId, note },
        { onConflict: "user_id,programme_id", ignoreDuplicates: false },
      )
      .select("*")
      .single();

    if (error) throw error;
    return data;
  }

  async unsave(userId: string, programmeId: string): Promise<void> {
    const { error } = await this.supabase
      .from("saved_programmes")
      .delete()
      .eq("user_id", userId)
      .eq("programme_id", programmeId);

    if (error) throw error;
  }
}
