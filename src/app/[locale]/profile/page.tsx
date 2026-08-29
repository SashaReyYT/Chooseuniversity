import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ReferenceDataRepository } from "@/lib/repositories/reference-data.repository";
import { ProfileService } from "@/lib/services/profile.service";
import { OnboardingForm } from "@/components/onboarding-form";
import { ProfileSummary } from "@/components/profile-summary";
import { AppShell } from "@/components/app-shell";
import type { Database } from "@/types/database";

type UserProfileRow = Database["public"]["Tables"]["user_profiles"]["Row"];

interface WizardData {
  countries: Awaited<ReturnType<ReferenceDataRepository["listCountries"]>>;
  supportedCountries: Awaited<
    ReturnType<ReferenceDataRepository["listSupportedCountries"]>
  >;
  languages: Awaited<ReturnType<ReferenceDataRepository["listLanguages"]>>;
  fieldsOfStudy: Awaited<
    ReturnType<ReferenceDataRepository["listFieldsOfStudy"]>
  >;
  nmtSubjects: Awaited<ReturnType<ReferenceDataRepository["listNmtSubjects"]>>;
}

/**
 * Loads the reference data the questionnaire wizard needs.
 */
async function loadWizardData(): Promise<WizardData> {
  const supabase = await createServerSupabaseClient();
  const referenceData = new ReferenceDataRepository(supabase);
  const [countries, supportedCountries, languages, fieldsOfStudy, nmtSubjects] =
    await Promise.all([
      referenceData.listCountries(),
      referenceData.listSupportedCountries(),
      referenceData.listLanguages(),
      referenceData.listFieldsOfStudy(),
      referenceData.listNmtSubjects(),
    ]);
  return { countries, supportedCountries, languages, fieldsOfStudy, nmtSubjects };
}

/**
 * Profile: read-only summary once the questionnaire has been completed,
 * with a single "Edit profile" button that opens /onboarding pre-filled.
 * Users who haven't finished onboarding land straight in the wizard.
 */
export default async function ProfilePage({
  params,
}: PageProps<"/[locale]/profile">) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const fullProfile = user
    ? await new ProfileService(supabase).getFullProfileForUser(user.id)
    : null;

  if (!fullProfile?.profile) {
    const wizardData = await loadWizardData();
    return (
      <OnboardingForm
        locale={locale}
        {...wizardData}
        existingProfile={null}
        existingNmtScores={[]}
        existingSubjectStrengths={[]}
        existingLanguageProficiency={[]}
      />
    );
  }

  const profile: UserProfileRow = fullProfile.profile;
  const referenceData = new ReferenceDataRepository(supabase);
  const [countries, languages, fieldsOfStudy] = await Promise.all([
    referenceData.listCountries(),
    referenceData.listLanguages(),
    referenceData.listFieldsOfStudy(),
  ]);

  const countryNames = new Map(countries.map((c) => [c.code, c.name]));
  const languageNames = new Map(languages.map((l) => [l.code, l.name]));
  const fieldOfStudyName =
    fieldsOfStudy.find(
      (f) =>
        f.id === profile.primary_field_of_study_id ||
        (profile.preferred_field_of_study_ids ?? []).includes(f.id),
    )?.name ?? null;

  return (
    <AppShell>
      <ProfileSummary
        profile={profile}
        nmtScores={fullProfile.nmtScores}
        subjectStrengths={fullProfile.subjectStrengths}
        languageProficiency={fullProfile.languageProficiency}
        countryNames={countryNames}
        languageNames={languageNames}
        fieldOfStudyName={fieldOfStudyName}
      />
    </AppShell>
  );
}