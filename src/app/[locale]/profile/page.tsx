import { hasLocale } from "next-intl";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ReferenceDataRepository } from "@/lib/repositories/reference-data.repository";
import { ProfileService } from "@/lib/services/profile.service";
import { ProfileForm } from "./profile-form";

/**
 * The full matching questionnaire (spec §10, §55–§56): a multi-step
 * wizard, not one long form. Serves both roles the product spec's
 * "Profile" nav concept needs: first-time onboarding (empty form) and
 * ongoing preference editing (pre-filled), via the same create-or-update
 * upsert in `ProfileService`.
 */
export default async function ProfilePage({
  params,
}: PageProps<"/[locale]/profile">) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  const t = await getTranslations("Onboarding");
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const referenceData = new ReferenceDataRepository(supabase);
  const [
    countries,
    supportedCountries,
    languages,
    fieldsOfStudy,
    nmtSubjects,
    qualifications,
    fullProfile,
  ] = await Promise.all([
    referenceData.listCountries(),
    referenceData.listSupportedCountries(),
    referenceData.listLanguages(),
    referenceData.listFieldsOfStudy(),
    referenceData.listNmtSubjects(),
    referenceData.listQualifications(),
    user
      ? new ProfileService(supabase).getFullProfileForUser(user.id)
      : { profile: null, nmtScores: [], qualifications: [], testScores: [] },
  ]);

  return (
    <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-16 space-y-8">
      <div className="space-y-2 max-w-2xl">
        <h1 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-primary">
          {t("heading")}
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          {t("description")}
        </p>
      </div>

      <ProfileForm
        locale={locale}
        countries={countries}
        supportedCountries={supportedCountries}
        languages={languages}
        fieldsOfStudy={fieldsOfStudy}
        nmtSubjects={nmtSubjects}
        qualifications={qualifications}
        existingProfile={fullProfile.profile}
        existingNmtScores={fullProfile.nmtScores}
        existingQualifications={fullProfile.qualifications}
        existingTestScores={fullProfile.testScores}
      />
    </main>
  );
}
