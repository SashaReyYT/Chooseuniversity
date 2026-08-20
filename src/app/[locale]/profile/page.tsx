import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ReferenceDataRepository } from "@/lib/repositories/reference-data.repository";
import { ProfileService } from "@/lib/services/profile.service";
import { OnboardingForm } from "@/components/onboarding-form";

/**
 * Profile (spec §10, §55–§56): the same 11-step adaptive questionnaire as
 * /onboarding, pre-filled from the saved profile so it doubles as
 * preference editing. One questionnaire, one form — the previous
 * separate full profile form was removed.
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

  const referenceData = new ReferenceDataRepository(supabase);
  const [countries, supportedCountries, languages, fieldsOfStudy, nmtSubjects, fullProfile] =
    await Promise.all([
      referenceData.listCountries(),
      referenceData.listSupportedCountries(),
      referenceData.listLanguages(),
      referenceData.listFieldsOfStudy(),
      referenceData.listNmtSubjects(),
      user
        ? new ProfileService(supabase).getFullProfileForUser(user.id)
        : {
            profile: null,
            nmtScores: [],
            subjectStrengths: [],
            languageProficiency: [],
          },
    ]);

  return (
    <OnboardingForm
      locale={locale}
      countries={countries}
      supportedCountries={supportedCountries}
      languages={languages}
      fieldsOfStudy={fieldsOfStudy}
      nmtSubjects={nmtSubjects}
      existingProfile={fullProfile.profile}
      existingNmtScores={fullProfile.nmtScores}
      existingSubjectStrengths={fullProfile.subjectStrengths}
      existingLanguageProficiency={fullProfile.languageProficiency}
    />
  );
}