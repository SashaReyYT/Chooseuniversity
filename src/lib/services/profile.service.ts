import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { UserProfileRepository } from "@/lib/repositories/user-profile.repository";

type UserProfileInsert =
  Database["public"]["Tables"]["user_profiles"]["Insert"];
type UserProfileUpdate =
  Database["public"]["Tables"]["user_profiles"]["Update"];

/**
 * Wraps the profile repository with the one business rule onboarding
 * needs: create the profile on first submission, update it on any
 * resubmission (re-doing onboarding, or a future "edit preferences"
 * screen), rather than callers needing to know which case they're in.
 */
export class ProfileService {
  private readonly userProfile: UserProfileRepository;

  constructor(supabase: SupabaseClient<Database>) {
    this.userProfile = new UserProfileRepository(supabase);
  }

  getForUser(userId: string) {
    return this.userProfile.findByUserId(userId);
  }

  async upsert(
    userId: string,
    changes: Omit<UserProfileUpdate, "id">,
  ) {
    const existing = await this.userProfile.findByUserId(userId);

    if (existing) {
      return this.userProfile.update(userId, changes);
    }

    return this.userProfile.create({
      id: userId,
      ...changes,
    } as UserProfileInsert);
  }
}
