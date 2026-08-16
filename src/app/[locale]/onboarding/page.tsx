import { hasLocale } from "next-intl";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ReferenceDataRepository } from "@/lib/repositories/reference-data.repository";
import { ProfileService } from "@/lib/services/profile.service";
import { OnboardingForm } from "./onboarding-form";

/**
 * A single-page form, not the multi-step wizard from the
 * `unifind_personalized_matching_test` mockup ("Questionnaire Step 3") —
 * that's a later, dedicated UI stage. This exists to get real profile
 * data flowing end-to-end into the matching engine and the /matches page.
 */
export default async function OnboardingPage({
  params,
}: PageProps<"/[locale]/onboarding">) {
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
  const [countries, languages, fieldsOfStudy, existingProfile] =
    await Promise.all([
      referenceData.listCountries(),
      referenceData.listLanguages(),
      referenceData.listFieldsOfStudy(),
      user ? new ProfileService(supabase).getForUser(user.id) : null,
    ]);

  return (
    <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-10 md:py-16">
      <OnboardingForm
        locale={locale}
        countries={countries}
        languages={languages}
        fieldsOfStudy={fieldsOfStudy}
        existingProfile={existingProfile}
      />
    </main>
  );
}
