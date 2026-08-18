import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type TypedSupabaseClient = SupabaseClient<Database>;

type ImportRow = Database["public"]["Tables"]["imports"]["Row"];
type ImportErrorRow = Database["public"]["Tables"]["import_errors"]["Row"];
type ImportErrorInsert = Database["public"]["Tables"]["import_errors"]["Insert"];

/**
 * The import pipeline ledger (§43/§45): every file import gets an
 * `imports` row tracking its format and status, and per-row problems
 * land in `import_errors` so an admin can review and fix bad rows
 * without losing sight of what came from where.
 */
export class AdminImportsRepository {
  constructor(private readonly supabase: TypedSupabaseClient) {}

  async createImport(
    input: Database["public"]["Tables"]["imports"]["Insert"],
  ): Promise<ImportRow> {
    const { data, error } = await this.supabase
      .from("imports")
      .insert(input)
      .select("*")
      .single();
    if (error) throw error;
    return data;
  }

  async listImports(): Promise<ImportRow[]> {
    const { data, error } = await this.supabase
      .from("imports")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    return data ?? [];
  }

  async findImport(id: string): Promise<ImportRow | null> {
    const { data, error } = await this.supabase
      .from("imports")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  async updateStatus(
    importId: string,
    status: ImportRow["status"],
  ): Promise<void> {
    const { error } = await this.supabase
      .from("imports")
      .update({ status })
      .eq("id", importId);
    if (error) throw error;
  }

  async listErrors(importId: string): Promise<ImportErrorRow[]> {
    const { data, error } = await this.supabase
      .from("import_errors")
      .select("*")
      .eq("import_id", importId)
      .order("row_number");
    if (error) throw error;
    return data ?? [];
  }

  async recordErrors(
    importId: string,
    errors: Omit<ImportErrorInsert, "import_id" | "id" | "created_at">[],
  ): Promise<void> {
    if (errors.length === 0) return;
    const { error } = await this.supabase
      .from("import_errors")
      .insert(errors.map((e) => ({ ...e, import_id: importId })));
    if (error) throw error;
  }
}