import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { ProgrammesRepository } from "@/lib/repositories/programmes.repository";
import { annualLivingCost } from "@/lib/matching/utils";

export interface QuickMatchQuery {
  fieldOfStudyId?: string | null;
  countryCode?: string | null;
  budgetMaxYearly?: number | null;
}

/**
 * Backs the landing page's "Quick Match Profile" (spec §9): a coarse,
 * three-question preview — "X programmes may fit you" — shown before the
 * user commits to the full questionnaire. Deliberately *not* the real
 * matching engine (`src/lib/matching/`): this only counts programmes that
 * pass simple filters, with no score, no reasons/concerns, and no
 * explainability requirement, because it's a teaser, not a Match Score.
 * Reuses `ProgrammesRepository.listWithDetails()` rather than a new
 * query — the catalog is small enough that in-memory filtering here adds
 * no real cost, and keeps one source of truth for "what a programme is"
 * instead of a second SQL shape.
 */
export class QuickMatchService {
  private readonly programmes: ProgrammesRepository;

  constructor(supabase: SupabaseClient<Database>) {
    this.programmes = new ProgrammesRepository(supabase);
  }

  async countLikelyMatches(query: QuickMatchQuery): Promise<number> {
    const programmes = await this.programmes.listWithDetails();

    return programmes.filter((programme) => {
      if (
        query.fieldOfStudyId &&
        programme.field_of_study_id !== query.fieldOfStudyId
      ) {
        return false;
      }

      if (
        query.countryCode &&
        programme.university.country_code !== query.countryCode
      ) {
        return false;
      }

      if (query.budgetMaxYearly != null) {
        // Tuition unknown → the programme can't be budget-checked; it
        // still "may fit" until the figure is researched, matching the
        // engine's UNKNOWN treatment rather than counting it as free.
        if (programme.tuition_min == null) {
          return true;
        }

        const totalAnnualCost =
          programme.tuition_min + annualLivingCost(programme);

        // Generous headroom (1.5x) here on purpose — this is a teaser
        // count meant to feel encouraging, not the strict Budget Fit
        // scoring the real matching engine does later.
        if (totalAnnualCost > query.budgetMaxYearly * 1.5) {
          return false;
        }
      }

      return true;
    }).length;
  }
}