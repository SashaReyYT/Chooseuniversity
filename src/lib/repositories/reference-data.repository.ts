import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type TypedSupabaseClient = SupabaseClient<Database>;

/**
 * Read access to the small, slow-changing reference tables. Public data,
 * no writes — see `supabase/migrations/0006_row_level_security.sql`.
 */
export class ReferenceDataRepository {
  constructor(private readonly supabase: TypedSupabaseClient) {}

  async listCountries() {
    const { data, error } = await this.supabase
      .from("countries")
      .select("*")
      .order("name");

    if (error) throw error;
    return data ?? [];
  }

  async listLanguages() {
    const { data, error } = await this.supabase
      .from("languages")
      .select("*")
      .order("name");

    if (error) throw error;
    return data ?? [];
  }

  async listFieldsOfStudy() {
    const { data, error } = await this.supabase
      .from("fields_of_study")
      .select("*")
      .order("category")
      .order("name");

    if (error) throw error;
    return data ?? [];
  }
}
