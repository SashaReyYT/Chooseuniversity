"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { MatchWeights } from "@/lib/matching/match-types";
import { UserMatchWeightsRepository } from "@/lib/repositories/user-match-weights.repository";
import { MatchingService } from "@/lib/services/matching.service";
import { ProfileService } from "@/lib/services/profile.service";

export async function updateMatchWeightsAction(
  locale: string,
  _prevState: { error?: string; success?: boolean },
  formData: FormData,
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No active session" };
  }

  const weights: MatchWeights = {};
  const dimensionKeys = [
    "academic",
    "admission",
    "budget",
    "language",
    "location",
    "career",
    "format",
    "lifestyle",
    "support",
  ] as const;

  for (const key of dimensionKeys) {
    const value = formData.get(`weight_${key}`);
    if (value !== null) {
      const num = Number(value);
      if (!Number.isNaN(num) && num > 0) {
        weights[key] = num;
      }
    }
  }

  try {
    const repo = new UserMatchWeightsRepository(supabase);
    await repo.upsert(user.id, weights);
    revalidatePath(`/${locale}/discover`);
    revalidatePath(`/${locale}/profile`);
    return { success: true };
  } catch (error) {
    console.error("Failed to update match weights:", error);
    return { error: "Failed to update priorities" };
  }
}

export async function updatePriorityAction(
  formData: FormData,
): Promise<void> {
  const locale = formData.get("locale") as string;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const weights: MatchWeights = {};
  const dimensionKeys = [
    "academic",
    "admission",
    "budget",
    "language",
    "location",
    "career",
    "format",
    "lifestyle",
    "support",
  ] as const;

  for (const key of dimensionKeys) {
    const value = formData.get(`weight_${key}`);
    if (value !== null) {
      const num = Number(value);
      if (!Number.isNaN(num) && num > 0) {
        weights[key] = num;
      }
    }
  }

  try {
    const repo = new UserMatchWeightsRepository(supabase);
    await repo.upsert(user.id, weights);
    revalidatePath(`/${locale}/discover`);
    revalidatePath(`/${locale}/profile`);
  } catch (error) {
    console.error("Failed to update match weights:", error);
  }
}

/**
 * Gets current match scores for all programmes for a user.
 * Used to compare before/after profile updates.
 */
export async function getUserMatchScores(
  userId: string,
): Promise<Map<string, number>> {
  const supabase = await createServerSupabaseClient();
  const matchingService = new MatchingService(supabase);
  const matches = await matchingService.listMatchesForUser(userId);
  
  const scores = new Map<string, number>();
  for (const match of matches) {
    if (match.match.overallScore != null) {
      scores.set(match.programme.id, match.match.overallScore);
    }
  }
  return scores;
}