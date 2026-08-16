import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type TypedSupabaseClient = SupabaseClient<Database>;

export type UniversityResource =
  Database["public"]["Tables"]["university_resources"]["Row"];

/**
 * Read access to `university_resources` (0012/0013) — external links per
 * university (international office, housing, visa support, buddy
 * programme, student services, Erasmus, arrival info). Informational
 * only, same status as `dormitories`/`scholarships`; not read by the
 * matching engine.
 */
export class UniversityResourcesRepository {
  constructor(private readonly supabase: TypedSupabaseClient) {}

  async listByUniversityId(universityId: string): Promise<UniversityResource[]> {
    const { data, error } = await this.supabase
      .from("university_resources")
      .select("*")
      .eq("university_id", universityId)
      .order("category", { ascending: true });
    if (error) throw error;
    return data ?? [];
  }
}
