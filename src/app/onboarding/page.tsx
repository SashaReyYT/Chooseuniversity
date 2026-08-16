import { requireUser } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { CatalogService } from "@/lib/services/catalog.service";
import { ProfileService } from "@/lib/services/profile.service";
import { OnboardingForm } from "@/components/onboarding-form";

export default async function OnboardingPage() {
  const user = await requireUser();
  const supabase = await createServerSupabaseClient();

  const catalog = new CatalogService(supabase);
  const profileService = new ProfileService(supabase);

  const [countries, languages, fieldsOfStudy, profile] = await Promise.all([
    catalog.listCountries(),
    catalog.listLanguages(),
    catalog.listFieldsOfStudy(),
    profileService.getProfile(user.id),
  ]);

  return (
    <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-16 space-y-8">
      <div className="max-w-2xl space-y-2">
        <h1 className="font-headline-md text-headline-md text-primary">
          {profile ? "Update your profile" : "Tell us about you"}
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          This is what the matching engine scores every programme against —
          the more you fill in, the more of your Match Score becomes
          applicable. Nothing here is shared beyond your own account.
        </p>
      </div>

      <OnboardingForm
        countries={countries.map((c) => ({ value: c.code, label: c.name }))}
        languages={languages.map((l) => ({ value: l.code, label: l.name }))}
        fieldsOfStudy={fieldsOfStudy.map((f) => ({ value: f.id, label: `${f.name} (${f.category})` }))}
        defaults={
          profile
            ? {
                full_name: profile.full_name,
                nationality_country_code: profile.nationality_country_code,
                current_education_level: profile.current_education_level,
                current_gpa: profile.current_gpa,
                current_gpa_scale: profile.current_gpa_scale,
                budget_min: profile.budget_min,
                budget_max: profile.budget_max,
                budget_currency: profile.budget_currency,
                preferred_degree_level: profile.preferred_degree_level,
                preferred_country_codes: profile.preferred_country_codes,
                preferred_cities: profile.preferred_cities,
                preferred_field_of_study_ids: profile.preferred_field_of_study_ids,
                preferred_language_codes: profile.preferred_language_codes,
              }
            : undefined
        }
      />
    </main>
  );
}
