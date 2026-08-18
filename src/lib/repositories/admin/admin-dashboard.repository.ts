import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type TypedSupabaseClient = SupabaseClient<Database>;

export interface DashboardMetrics {
  universities: number;
  publishedUniversities: number;
  programmes: number;
  countries: number;
  recentImports: Database["public"]["Tables"]["imports"]["Row"][];
  importErrorCount: number;
}

/** Read-only aggregates for the admin dashboard (§44). */
export class AdminDashboardRepository {
  constructor(private readonly supabase: TypedSupabaseClient) {}

  async getMetrics(): Promise<DashboardMetrics> {
    const [universities, publishedUniversities, programmes, countries, recentImports, importErrors] =
      await Promise.all([
        this.supabase.from("universities").select("id", { count: "exact", head: true }),
        this.supabase
          .from("universities")
          .select("id", { count: "exact", head: true })
          .eq("published", true),
        this.supabase.from("programmes").select("id", { count: "exact", head: true }),
        this.supabase.from("countries").select("id", { count: "exact", head: true }),
        this.supabase
          .from("imports")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(5),
        this.supabase.from("import_errors").select("id", { count: "exact", head: true }),
      ]);

    if (universities.error) throw universities.error;
    if (publishedUniversities.error) throw publishedUniversities.error;
    if (programmes.error) throw programmes.error;
    if (countries.error) throw countries.error;
    if (recentImports.error) throw recentImports.error;
    if (importErrors.error) throw importErrors.error;

    return {
      universities: universities.count ?? 0,
      publishedUniversities: publishedUniversities.count ?? 0,
      programmes: programmes.count ?? 0,
      countries: countries.count ?? 0,
      recentImports: recentImports.data ?? [],
      importErrorCount: importErrors.count ?? 0,
    };
  }
}