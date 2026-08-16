import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type TypedSupabaseClient = SupabaseClient<Database>;
type UserProfileRow = Database["public"]["Tables"]["user_profiles"]["Row"];
type UserProfileInsert =
  Database["public"]["Tables"]["user_profiles"]["Insert"];
type UserProfileUpdate =
  Database["public"]["Tables"]["user_profiles"]["Update"];

/**
 * Access to the current user's own profile. RLS (see
 * `supabase/migrations/0006_row_level_security.sql`) already restricts
 * every query here to `auth.uid()`'s own row — the explicit `.eq("id", ...)`
 * calls below are for correct, predictable query shape, not for security.
 */
export class UserProfileRepository {
  constructor(private readonly supabase: TypedSupabaseClient) {}

  async findByUserId(userId: string): Promise<UserProfileRow | null> {
    const { data, error } = await this.supabase
      .from("user_profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async create(profile: UserProfileInsert): Promise<UserProfileRow> {
    const { data, error } = await this.supabase
      .from("user_profiles")
      .insert(profile)
      .select("*")
      .single();

    if (error) throw error;
    return data;
  }

  async update(
    userId: string,
    changes: UserProfileUpdate,
  ): Promise<UserProfileRow> {
    const { data, error } = await this.supabase
      .from("user_profiles")
      .update(changes)
      .eq("id", userId)
      .select("*")
      .single();

    if (error) throw error;
    return data;
  }
}
