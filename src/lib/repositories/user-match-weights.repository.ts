import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { MatchWeights as EngineMatchWeights } from "@/lib/matching/match-types";

type TypedSupabaseClient = SupabaseClient<Database>;

/**
 * Access to the current user's own match weights (spec §26). Returns `null`
 * when the user hasn't set custom weights — callers treat that as equal
 * weighting (all dimensions weight 1), which is the current engine default.
 */
export class UserMatchWeightsRepository {
  constructor(private readonly supabase: TypedSupabaseClient) {}

  async findByUserId(userId: string): Promise<EngineMatchWeights | null> {
    const { data, error } = await this.supabase
      .from("user_match_weights")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return {
      academic: data.academic,
      admission: data.admission,
      budget: data.budget,
      language: data.language,
      location: data.location,
      career: data.career,
      format: data.format,
      lifestyle: data.lifestyle,
      support: data.support,
    };
  }

  async upsert(
    userId: string,
    weights: EngineMatchWeights,
  ): Promise<EngineMatchWeights> {
    const { data, error } = await this.supabase
      .from("user_match_weights")
      .upsert({
        user_id: userId,
        academic: weights.academic ?? 1,
        admission: weights.admission ?? 1,
        budget: weights.budget ?? 1,
        language: weights.language ?? 1,
        location: weights.location ?? 1,
        career: weights.career ?? 1,
        format: weights.format ?? 1,
        lifestyle: weights.lifestyle ?? 1,
        support: weights.support ?? 1,
      })
      .select("*")
      .single();

    if (error) throw error;
    return data;
  }
}