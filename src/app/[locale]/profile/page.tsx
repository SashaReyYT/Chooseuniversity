import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ProfileService } from "@/lib/services/profile.service";
import { ReferenceDataRepository } from "@/lib/repositories/reference-data.repository";

const DEGREE_LEVEL_KEYS = {
  foundation: "degreeLevelFoundation",
  bachelor: "degreeLevelBachelor",
  master: "degreeLevelMaster",
  phd: "degreeLevelPhd",
} as const;

const EDUCATION_LEVEL_KEYS = {
  high_school: "educationLevelHighSchool",
  bachelor: "educationLevelBachelor",
  master: "educationLevelMaster",
} as const;

export default async function ProfilePage({
  params,
}: PageProps<"/[locale]/profile">) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  const t = await getTranslations("Profile");
  const tOnboarding = await getTranslations("Onboarding");
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const referenceData = new ReferenceDataRepository(supabase);
  const [countries, languages, fieldsOfStudy, profile] = await Promise.all([
    referenceData.listCountries(),
    referenceData.listLanguages(),
    referenceData.listFieldsOfStudy(),
    user ? new ProfileService(supabase).getForUser(user.id) : null,
  ]);

  const countryNameByCode = new Map(countries.map((c) => [c.code, c.name]));
  const languageNameByCode = new Map(languages.map((l) => [l.code, l.name]));
  const fieldNameById = new Map(fieldsOfStudy.map((f) => [f.id, f.name]));

  return (
    <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-16 space-y-8">
      <div className="flex items-baseline justify-between max-w-2xl">
        <h1 className="font-headline-md text-headline-md text-primary">
          {t("heading")}
        </h1>
        <Link
          href="/onboarding"
          className="font-label-caps text-label-caps px-5 py-2 rounded-full border border-primary text-primary hover:bg-surface-container transition-colors"
        >
          {t("edit")}
        </Link>
      </div>

      {!profile ? (
        <p className="font-body-md text-body-md text-on-surface-variant">
          {t("notCompleted")}{" "}
          <Link href="/onboarding" className="text-primary hover:underline">
            {t("notCompletedCta")}
          </Link>
        </p>
      ) : (
        <dl className="max-w-2xl grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <dt className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wide">
              {t("nameLabel")}
            </dt>
            <dd className="font-body-md text-body-md text-on-surface mt-1">
              {profile.full_name ?? t("notProvided")}
            </dd>
          </div>
          <div>
            <dt className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wide">
              {t("educationLevelLabel")}
            </dt>
            <dd className="font-body-md text-body-md text-on-surface mt-1">
              {profile.current_education_level
                ? tOnboarding(EDUCATION_LEVEL_KEYS[profile.current_education_level])
                : t("notProvided")}
            </dd>
          </div>
          <div>
            <dt className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wide">
              {t("gpaLabel")}
            </dt>
            <dd className="font-body-md text-body-md text-on-surface mt-1">
              {profile.current_gpa != null
                ? `${profile.current_gpa} / ${profile.current_gpa_scale}`
                : t("notProvided")}
            </dd>
          </div>
          <div>
            <dt className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wide">
              {t("budgetLabel")}
            </dt>
            <dd className="font-body-md text-body-md text-on-surface mt-1">
              {profile.budget_max != null
                ? `${profile.budget_max.toLocaleString()} ${profile.budget_currency ?? ""} ${t("perYear")}`
                : t("notProvided")}
            </dd>
          </div>
          <div>
            <dt className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wide">
              {t("preferredDegreeLabel")}
            </dt>
            <dd className="font-body-md text-body-md text-on-surface mt-1">
              {profile.preferred_degree_level
                ? tOnboarding(DEGREE_LEVEL_KEYS[profile.preferred_degree_level])
                : t("notProvided")}
            </dd>
          </div>
          <div>
            <dt className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wide">
              {t("preferredCountriesLabel")}
            </dt>
            <dd className="font-body-md text-body-md text-on-surface mt-1">
              {profile.preferred_country_codes.length > 0
                ? profile.preferred_country_codes
                    .map((code) => countryNameByCode.get(code) ?? code)
                    .join(", ")
                : t("notProvided")}
            </dd>
          </div>
          <div>
            <dt className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wide">
              {t("preferredCitiesLabel")}
            </dt>
            <dd className="font-body-md text-body-md text-on-surface mt-1">
              {profile.preferred_cities.length > 0
                ? profile.preferred_cities.join(", ")
                : t("notProvided")}
            </dd>
          </div>
          <div>
            <dt className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wide">
              {t("preferredLanguagesLabel")}
            </dt>
            <dd className="font-body-md text-body-md text-on-surface mt-1">
              {profile.preferred_language_codes.length > 0
                ? profile.preferred_language_codes
                    .map((code) => languageNameByCode.get(code) ?? code)
                    .join(", ")
                : t("notProvided")}
            </dd>
          </div>
          <div>
            <dt className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wide">
              {t("preferredFieldsLabel")}
            </dt>
            <dd className="font-body-md text-body-md text-on-surface mt-1">
              {profile.preferred_field_of_study_ids.length > 0
                ? profile.preferred_field_of_study_ids
                    .map((id) => fieldNameById.get(id) ?? id)
                    .join(", ")
                : t("notProvided")}
            </dd>
          </div>
        </dl>
      )}
    </main>
  );
}
