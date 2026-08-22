import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { requireRealUser } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ReferenceDataRepository } from "@/lib/repositories/reference-data.repository";
import { ProfileService } from "@/lib/services/profile.service";
import { OnboardingForm } from "@/components/onboarding-form";

/**
 * Multi-step adaptive questionnaire (11 questions): residence → target
 * countries → education stage → start year → field of study → language →
 * proficiency → national exam → subject strengths → budget →
 * requirements. Every fieldset stays mounted (hidden via CSS), so the
 * single form POST collects every step's values regardless of which step
 * was last visible — see `OnboardingForm`.
 *
 * Auth-first: anonymous visitors are sent to sign-up (with `next`
 * pointing back here) before they can take the quiz, so the answers
 * always land on a real account.
 */
export default async function OnboardingPage({
  params,
}: PageProps<"/[locale]/onboarding">) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  const user = await requireRealUser("/onboarding");

  const supabase = await createServerSupabaseClient();

  const referenceData = new ReferenceDataRepository(supabase);
  const [
    countries,
    supportedCountries,
    languages,
    fieldsOfStudy,
    nmtSubjects,
    fullProfile,
  ] = await Promise.all([
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
          qualifications: [],
          testScores: [],
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