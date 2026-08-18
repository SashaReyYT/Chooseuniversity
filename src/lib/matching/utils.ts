import type { ProgrammeWithDetails } from "./match-types";

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