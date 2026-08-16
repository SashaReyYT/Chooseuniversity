import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ProfileService } from "@/lib/services/profile.service";

export default async function ProfilePage() {
  const user = await requireUser();
  const supabase = await createServerSupabaseClient();
  const profile = await new ProfileService(supabase).getProfile(user.id);

  return (
    <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-16 space-y-8">
      <div className="flex items-baseline justify-between max-w-2xl">
        <h1 className="font-headline-md text-headline-md text-primary">Your profile</h1>
        <Link
          href="/onboarding"
          className="font-label-caps text-label-caps px-5 py-2 rounded-full border border-primary text-primary hover:bg-surface-container transition-colors"
        >
          Edit
        </Link>
      </div>

      {!profile ? (
        <p className="font-body-md text-body-md text-on-surface-variant">
          You haven&rsquo;t completed your profile yet.{" "}
          <Link href="/onboarding" className="text-primary hover:underline">
            Start now
          </Link>
          .
        </p>
      ) : (
        <dl className="max-w-2xl grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <dt className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wide">Email</dt>
            <dd className="font-body-md text-body-md text-on-surface mt-1">{user.email}</dd>
          </div>
          <div>
            <dt className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wide">Name</dt>
            <dd className="font-body-md text-body-md text-on-surface mt-1">{profile.full_name ?? "—"}</dd>
          </div>
          <div>
            <dt className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wide">GPA</dt>
            <dd className="font-body-md text-body-md text-on-surface mt-1">
              {profile.current_gpa != null ? `${profile.current_gpa} / ${profile.current_gpa_scale}` : "—"}
            </dd>
          </div>
          <div>
            <dt className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wide">Budget</dt>
            <dd className="font-body-md text-body-md text-on-surface mt-1">
              {profile.budget_max != null
                ? `up to ${profile.budget_max.toLocaleString()} ${profile.budget_currency ?? ""}/year`
                : "—"}
            </dd>
          </div>
          <div>
            <dt className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wide">Preferred degree</dt>
            <dd className="font-body-md text-body-md text-on-surface mt-1">{profile.preferred_degree_level ?? "—"}</dd>
          </div>
          <div>
            <dt className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wide">Preferred countries</dt>
            <dd className="font-body-md text-body-md text-on-surface mt-1">
              {profile.preferred_country_codes.length > 0 ? profile.preferred_country_codes.join(", ") : "—"}
            </dd>
          </div>
        </dl>
      )}
    </main>
  );
}
