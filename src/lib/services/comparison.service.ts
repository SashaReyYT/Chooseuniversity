import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import {
  ComparisonsRepository,
  type ComparisonWithItems,
} from "@/lib/repositories/comparisons.repository";
import {
  ProgrammesRepository,
  type ProgrammeWithDetails,
} from "@/lib/repositories/programmes.repository";

export interface ComparisonWithProgrammes {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  /** In display order (`comparison_items.position`), not insertion order. */
  programmes: ProgrammeWithDetails[];
}

/**
 * Orchestrates side-by-side comparisons: loads a user's comparison sets
 * and hydrates each one's items with full programme details from the
 * catalog. Contains no comparison-table rendering logic — that's a UI
 * concern for a later stage; this only produces the ordered data it'd
 * need.
 */
export class ComparisonService {
  private readonly comparisons: ComparisonsRepository;
  private readonly programmes: ProgrammesRepository;

  constructor(supabase: SupabaseClient<Database>) {
    this.comparisons = new ComparisonsRepository(supabase);
    this.programmes = new ProgrammesRepository(supabase);
  }

  async listForUser(userId: string): Promise<ComparisonWithProgrammes[]> {
    const comparisons = await this.comparisons.listByUserId(userId);
    return this.hydrate(comparisons);
  }

  async getById(comparisonId: string): Promise<ComparisonWithProgrammes | null> {
    const comparison = await this.comparisons.findById(comparisonId);
    if (!comparison) return null;

    const [hydrated] = await this.hydrate([comparison]);
    return hydrated;
  }

  createComparison(userId: string, name?: string) {
    return this.comparisons.create(userId, name);
  }

  /**
   * Returns the user's most recently created comparison, creating one if
   * none exists yet. V1 gives every user exactly one implicit "working"
   * comparison (no UI for naming/managing multiple sets) — this is the
   * single entry point catalog/compare screens use so they never have to
   * know a comparison's id ahead of time.
   */
  async getOrCreateDefaultComparison(
    userId: string,
  ): Promise<ComparisonWithProgrammes> {
    const existing = await this.listForUser(userId);
    if (existing.length > 0) return existing[0];

    const created = await this.comparisons.create(userId);
    return {
      id: created.id,
      name: created.name,
      createdAt: created.created_at,
      updatedAt: created.updated_at,
      programmes: [],
    };
  }

  renameComparison(comparisonId: string, name: string) {
    return this.comparisons.rename(comparisonId, name);
  }

  deleteComparison(comparisonId: string): Promise<void> {
    return this.comparisons.delete(comparisonId);
  }

  addProgramme(comparisonId: string, programmeId: string) {
    return this.comparisons.addItem(comparisonId, programmeId);
  }

  removeProgramme(comparisonId: string, programmeId: string): Promise<void> {
    return this.comparisons.removeItem(comparisonId, programmeId);
  }

  /** Bulk-fetches every programme referenced across all given comparisons in one query, rather than one query per comparison. */
  private async hydrate(
    comparisons: ComparisonWithItems[],
  ): Promise<ComparisonWithProgrammes[]> {
    const allProgrammeIds = Array.from(
      new Set(comparisons.flatMap((c) => c.items.map((i) => i.programme_id))),
    );

    const programmes =
      allProgrammeIds.length > 0
        ? await this.programmes.findByIds(allProgrammeIds)
        : [];
    const programmeById = new Map(programmes.map((p) => [p.id, p]));

    return comparisons.map((c) => ({
      id: c.id,
      name: c.name,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
      programmes: c.items
        .map((item) => programmeById.get(item.programme_id))
        // Same defensive skip as FavouritesService — shouldn't happen
        // given ON DELETE CASCADE, but a missing programme shouldn't
        // break rendering the rest of the comparison.
        .filter((p): p is ProgrammeWithDetails => p != null),
    }));
  }
}
