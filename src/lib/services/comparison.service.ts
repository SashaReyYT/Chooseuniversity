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

/** Spec §38: a comparison holds at most this many programmes. Single source of truth — service enforces it, UI reads it for copy. */
export const MAX_COMPARISON_SIZE = 3;

/** Thrown when a comparison already holds the maximum number of programmes (spec §38: 3). */
export class ComparisonLimitError extends Error {
  constructor(readonly maxSize: number) {
    super(`Comparison is limited to ${maxSize} programmes`);
    this.name = "ComparisonLimitError";
  }
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

  /**
   * V1 doesn't offer UI to manage multiple named comparison sets — every
   * "add to compare" action operates on one implicit comparison per user,
   * created on first use. If named/multiple comparisons become a real
   * feature later, `createComparison`/`listForUser` below already support
   * it; this is purely a convenience on top for the single-comparison
   * case.
   */
  async getOrCreateDefaultComparison(
    userId: string,
    defaultName: string,
  ): Promise<ComparisonWithProgrammes> {
    const existing = await this.comparisons.listByUserId(userId);

    const withItems =
      existing[0] ??
      (await this.comparisons.create(userId, defaultName).then((c) => ({
        ...c,
        items: [],
      })));

    const [hydrated] = await this.hydrate([withItems]);
    return hydrated;
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

  renameComparison(comparisonId: string, name: string) {
    return this.comparisons.rename(comparisonId, name);
  }

  deleteComparison(comparisonId: string): Promise<void> {
    return this.comparisons.delete(comparisonId);
  }

  addProgramme(comparisonId: string, programmeId: string) {
    return this.comparisons.addItem(comparisonId, programmeId);
  }

  /**
   * Enforces the product spec's comparison size limit (max 3 programmes,
   * spec §38). Throws when the comparison is already full.
   */
  async addProgrammeWithinLimit(
    comparisonId: string,
    programmeId: string,
    maxSize = MAX_COMPARISON_SIZE,
  ): Promise<ReturnType<ComparisonsRepository["addItem"]>> {
    const alreadyPresent = await this.comparisons.isPresent(
      comparisonId,
      programmeId,
    );
    if (alreadyPresent) return this.comparisons.addItem(comparisonId, programmeId);

    const count = await this.comparisons.countItems(comparisonId);
    if (count >= maxSize) {
      throw new ComparisonLimitError(maxSize);
    }
    return this.comparisons.addItem(comparisonId, programmeId);
  }

  removeProgramme(comparisonId: string, programmeId: string): Promise<void> {
    return this.comparisons.removeItem(comparisonId, programmeId);
  }

  clearAllProgrammes(comparisonId: string): Promise<void> {
    return this.comparisons.clearAllItems(comparisonId);
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
