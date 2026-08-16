import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { ReferenceDataRepository } from "@/lib/repositories/reference-data.repository";
import { ProgrammesRepository, type ProgrammeWithDetails } from "@/lib/repositories/programmes.repository";
import { UniversityResourcesRepository } from "@/lib/repositories/university-resources.repository";

/**
 * Read-only catalog access for screens that aren't about matching a
 * specific user (the onboarding form's option lists, a programme detail
 * page's base data). Pages/Server Components call this rather than
 * `ReferenceDataRepository`/`ProgrammesRepository` directly, per the
 * "components don't import repositories" rule in
 * `src/lib/repositories/README.md`.
 */
export class CatalogService {
  private readonly referenceData: ReferenceDataRepository;
  private readonly programmes: ProgrammesRepository;
  private readonly universityResources: UniversityResourcesRepository;

  constructor(supabase: SupabaseClient<Database>) {
    this.referenceData = new ReferenceDataRepository(supabase);
    this.programmes = new ProgrammesRepository(supabase);
    this.universityResources = new UniversityResourcesRepository(supabase);
  }

  listCountries() {
    return this.referenceData.listCountries();
  }

  listLanguages() {
    return this.referenceData.listLanguages();
  }

  listFieldsOfStudy() {
    return this.referenceData.listFieldsOfStudy();
  }

  getProgramme(id: string): Promise<ProgrammeWithDetails | null> {
    return this.programmes.findById(id);
  }

  /** Every programme in the catalog, for the /catalog browsing screen. Filtering/sorting is done in the page itself — this is deliberately unfiltered so the same fetch can back different filter combinations without extra round-trips. */
  listProgrammes(): Promise<ProgrammeWithDetails[]> {
    return this.programmes.listWithDetails();
  }

  listUniversityResources(universityId: string) {
    return this.universityResources.listByUniversityId(universityId);
  }
}
