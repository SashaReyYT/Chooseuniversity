import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type TypedSupabaseClient = SupabaseClient<Database>;
type ComparisonRow = Database["public"]["Tables"]["comparisons"]["Row"];
type ComparisonItemRow =
  Database["public"]["Tables"]["comparison_items"]["Row"];

export type ComparisonWithItems = ComparisonRow & {
  items: ComparisonItemRow[];
};

/**
 * Access to the current user's comparison sets. RLS restricts
 * `comparisons` directly to `auth.uid()`, and `comparison_items`
 * indirectly through its parent comparison (see
 * `supabase/migrations/0006_row_level_security.sql`) — the explicit
 * `.eq("user_id", ...)` / ownership checks here are for correct,
 * predictable query shape, not for security.
 */
export class ComparisonsRepository {
  constructor(private readonly supabase: TypedSupabaseClient) {}

  async listByUserId(userId: string): Promise<ComparisonWithItems[]> {
    const { data, error } = await this.supabase
      .from("comparisons")
      .select("*, items:comparison_items(*)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data ?? []).map((row) => ({
      ...row,
      items: (row.items ?? []).sort((a, b) => a.position - b.position),
    }));
  }

  async findById(
    comparisonId: string,
  ): Promise<ComparisonWithItems | null> {
    const { data, error } = await this.supabase
      .from("comparisons")
      .select("*, items:comparison_items(*)")
      .eq("id", comparisonId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return {
      ...data,
      items: (data.items ?? []).sort((a, b) => a.position - b.position),
    };
  }

  async create(userId: string, name = "Comparison"): Promise<ComparisonRow> {
    const { data, error } = await this.supabase
      .from("comparisons")
      .insert({ user_id: userId, name })
      .select("*")
      .single();

    if (error) throw error;
    return data;
  }

  async rename(comparisonId: string, name: string): Promise<ComparisonRow> {
    const { data, error } = await this.supabase
      .from("comparisons")
      .update({ name })
      .eq("id", comparisonId)
      .select("*")
      .single();

    if (error) throw error;
    return data;
  }

  async delete(comparisonId: string): Promise<void> {
    const { error } = await this.supabase
      .from("comparisons")
      .delete()
      .eq("id", comparisonId);

    if (error) throw error;
  }

  /** Appends a programme at the end of the comparison (position = current item count). Idempotent: re-adding an already-present programme returns its existing row rather than erroring. */
  async addItem(
    comparisonId: string,
    programmeId: string,
  ): Promise<ComparisonItemRow> {
    const { count, error: countError } = await this.supabase
      .from("comparison_items")
      .select("*", { count: "exact", head: true })
      .eq("comparison_id", comparisonId);

    if (countError) throw countError;

    const { data, error } = await this.supabase
      .from("comparison_items")
      .upsert(
        {
          comparison_id: comparisonId,
          programme_id: programmeId,
          position: count ?? 0,
        },
        { onConflict: "comparison_id,programme_id", ignoreDuplicates: true },
      )
      .select("*");

    if (error) throw error;

    // With `ignoreDuplicates: true`, PostgREST returns zero rows when the
    // conflict branch (DO NOTHING) fires — it does NOT return the
    // existing row. Calling `.single()` directly on that response would
    // throw ("no rows returned") for the everyday case of re-adding a
    // programme already in the comparison, so fall back to fetching the
    // existing row explicitly instead of treating it as an error.
    if (data && data.length > 0) {
      return data[0];
    }

    const { data: existing, error: existingError } = await this.supabase
      .from("comparison_items")
      .select("*")
      .eq("comparison_id", comparisonId)
      .eq("programme_id", programmeId)
      .single();

    if (existingError) throw existingError;
    return existing;
  }

  async removeItem(comparisonId: string, programmeId: string): Promise<void> {
    const { error } = await this.supabase
      .from("comparison_items")
      .delete()
      .eq("comparison_id", comparisonId)
      .eq("programme_id", programmeId);

    if (error) throw error;
  }

  async countItems(comparisonId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from("comparison_items")
      .select("*", { count: "exact", head: true })
      .eq("comparison_id", comparisonId);

    if (error) throw error;
    return count ?? 0;
  }

  async isPresent(comparisonId: string, programmeId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from("comparison_items")
      .select("id")
      .eq("comparison_id", comparisonId)
      .eq("programme_id", programmeId)
      .maybeSingle();

    if (error) throw error;
    return data != null;
  }
}
