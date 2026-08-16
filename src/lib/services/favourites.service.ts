import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { SavedProgrammesRepository } from "@/lib/repositories/saved-programmes.repository";
import {
  ProgrammesRepository,
  type ProgrammeWithDetails,
} from "@/lib/repositories/programmes.repository";

export interface SavedProgramme {
  programme: ProgrammeWithDetails;
  savedAt: string;
  note: string | null;
}

/**
 * Orchestrates the shortlist ("save favourites" in the product spec):
 * loads a user's saved-programme rows and hydrates them with full
 * programme details from the catalog. Contains no scoring logic — pair
 * with `MatchingService` if a caller also needs each saved programme's
 * Match Score.
 */
export class FavouritesService {
  private readonly savedProgrammes: SavedProgrammesRepository;
  private readonly programmes: ProgrammesRepository;

  constructor(supabase: SupabaseClient<Database>) {
    this.savedProgrammes = new SavedProgrammesRepository(supabase);
    this.programmes = new ProgrammesRepository(supabase);
  }

  /** Most recently saved first. */
  async listSavedProgrammesForUser(userId: string): Promise<SavedProgramme[]> {
    const saved = await this.savedProgrammes.listByUserId(userId);
    if (saved.length === 0) return [];

    const programmes = await this.programmes.findByIds(
      saved.map((s) => s.programme_id),
    );
    const programmeById = new Map(programmes.map((p) => [p.id, p]));

    return saved
      .map((s) => {
        const programme = programmeById.get(s.programme_id);
        // Guards against a save row outliving its programme; shouldn't
        // happen in practice (programme_id has ON DELETE CASCADE, see
        // 0005_saved_and_comparisons.sql) but skipping rather than
        // throwing keeps a stale row from breaking the whole list.
        if (!programme) return null;
        return { programme, savedAt: s.created_at, note: s.note };
      })
      .filter((entry): entry is SavedProgramme => entry != null);
  }

  isSaved(userId: string, programmeId: string): Promise<boolean> {
    return this.savedProgrammes.isSaved(userId, programmeId);
  }

  save(userId: string, programmeId: string, note?: string) {
    return this.savedProgrammes.save(userId, programmeId, note);
  }

  unsave(userId: string, programmeId: string): Promise<void> {
    return this.savedProgrammes.unsave(userId, programmeId);
  }
}
