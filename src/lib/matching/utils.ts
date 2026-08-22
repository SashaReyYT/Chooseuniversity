import type { ProgrammeWithDetails } from "@/lib/repositories/programmes.repository";
import type { MatchScoreChange } from "@/hooks/use-match-changes";

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function roundScore(value: number): number {
  return Math.round(clamp(value, 0, 100));
}

/** Estimated living cost for a full year, per spec §16 ("annual total = tuition + living costs"). */
export function annualLivingCost(programme: ProgrammeWithDetails): number {
  return (programme.estimated_living_cost_monthly ?? 0) * 12;
}

/**
 * Compares two sets of match scores and returns the changes.
 * Used to show users what changed after a profile update.
 */
export function compareMatchScores(
  before: Map<string, number>,
  after: Map<string, number>,
): Array<MatchScoreChange & { programmeName: string; universityName: string }> {
  const allIds = new Set([...before.keys(), ...after.keys()]);
  const changes: Array<MatchScoreChange & { programmeName: string; universityName: string }> = [];

  for (const id of allIds) {
    const beforeScore = before.get(id) ?? 0;
    const afterScore = after.get(id) ?? 0;
    const change = afterScore - beforeScore;
    
    if (Math.abs(change) > 0) {
      changes.push({
        programmeId: id,
        programmeName: "",
        universityName: "",
        beforeScore,
        afterScore,
        change,
        direction: change > 0 ? "up" : change < 0 ? "down" : "same",
      });
    }
  }

  return changes.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
}