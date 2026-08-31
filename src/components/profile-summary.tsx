import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { DeleteAccountZone } from "@/components/delete-account-zone";
import { ThemeToggle } from "@/components/theme-toggle";
import type { Database } from "@/types/database";

type UserProfileRow = Database["public"]["Tables"]["user_profiles"]["Row"];
type UserNmtScoreRow = Database["public"]["Tables"]["user_nmt_scores"]["Row"];
type UserSubjectStrengthRow =
  Database["public"]["Tables"]["user_subject_strengths"]["Row"];
type UserLanguageProficiencyRow =
  Database["public"]["Tables"]["user_language_proficiency"]["Row"];

interface ProfileSummaryProps {
  profile: UserProfileRow;
  nmtScores: UserNmtScoreRow[];
  subjectStrengths: UserSubjectStrengthRow[];
  languageProficiency: UserLanguageProficiencyRow[];
  countryNames: Map<string, string>;
  languageNames: Map<string, string>;
  fieldOfStudyName: string | null;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  if (value == null || value === "") return null;
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 py-3 border-b border-outline-variant/20 last:border-b-0">
      <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wide sm:w-48 shrink-0">
        {label}
      </span>
      <span className="font-body-sm text-body-sm text-on-surface">{value}</span>
    </div>
  );
}

/**
 * Read-only overview of a completed profile. The questionnaire itself
 * stays at /onboarding — this page answers "what do you know about me?"
 * and hands off to editing via one button, instead of forcing users to
 * re-walk twelve steps every time they tap Profile.
 */
export async function ProfileSummary({
  profile,
  nmtScores,
  subjectStrengths,
  languageProficiency,
  countryNames,
  languageNames,
  fieldOfStudyName,
}: ProfileSummaryProps) {
  const t = await getTranslations("Onboarding");
  const tDiscover = await getTranslations("Discover");
  const tFooter = await getTranslations("Footer");

  const degreeLabels: Record<string, string> = {
    foundation: tDiscover("degreeFoundation"),
    bachelor: tDiscover("degreeBachelor"),
    master: tDiscover("degreeMaster"),
    phd: tDiscover("degreePhd"),
  };

  const budgetLabels: Record<string, string> = {
    low: `${t("tuitionLow")} (${t("tuitionLowHint")})`,
    medium: `${t("tuitionMedium")} (${t("tuitionMediumHint")})`,
    high: `${t("tuitionHigh")} (${t("tuitionHighHint")})`,
    unknown: t("budgetUnknown"),
  };

  const stageLabels: Record<string, string> = {
    grade_9: t("stageGrade9"),
    grade_10: t("stageGrade10"),
    grade_11: t("stageGrade11"),
    finished_school: t("stageFinishedSchool"),
    college: t("stageCollege"),
    other: t("stageOther"),
  };

  const cityFormatLabel: Record<string, string> = {
    large: t("cityFormatLarge"),
    small: t("cityFormatSmall"),
    student_city: t("cityFormatStudent"),
    dontcare: t("cityFormatDontCare"),
  };

  const requirements: string[] = [];
  if (profile.wants_scholarship) requirements.push(t("reqScholarship"));
  if (profile.wants_dormitory) requirements.push(t("reqDormitory"));
  if (profile.wants_work_during_study) requirements.push(t("reqWork"));
  if (profile.wants_stay_after_graduation) requirements.push(t("reqStay"));
  if (profile.open_to_additional_exams === false)
    requirements.push(t("reqNoExtraExams"));

  return (
    <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-16 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-primary">
            {profile.full_name || t("step1Title")}
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            {t("summaryDescription")}
          </p>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <div className="md:hidden">
            <ThemeToggle />
          </div>
          <Link
            href="/onboarding"
            className="shrink-0 font-label-caps text-label-caps text-primary border border-primary rounded-full px-6 py-3 hover:bg-surface-container transition-all active:scale-95 whitespace-nowrap"
          >
            {t("editProfile")}
          </Link>
        </div>
      </div>

      <section className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-6 md:p-8 ambient-shadow space-y-1" aria-labelledby="profile-study-heading">
        <h2 id="profile-study-heading" className="font-headline-sm text-headline-sm text-primary pb-2">
          {t("step5Title")}
        </h2>
        <Row
          label={t("profileFieldLabel")}
          value={fieldOfStudyName}
        />
        <Row
          label={t("profileDegreeLabel")}
          value={
            profile.preferred_degree_level
              ? degreeLabels[profile.preferred_degree_level] ?? profile.preferred_degree_level
              : null
          }
        />
        <Row
          label={t("residenceCountryLabel")}
          value={
            [
              profile.residence_country_code ? countryNames.get(profile.residence_country_code) : null,
              profile.residence_city,
            ]
              .filter(Boolean)
              .join(", ") || null
          }
        />
        <Row
          label={t("step2Title")}
          value={profile.preferred_country_codes.map((c) => countryNames.get(c)).filter(Boolean).join(", ") || null}
        />
        <Row
          label={t("step3Title")}
          value={profile.education_stage ? stageLabels[profile.education_stage] ?? profile.education_stage : null}
        />
        <Row label={t("profileStartYear")} value={profile.start_year} />
      </section>

      {(languageProficiency.length > 0 || nmtScores.length > 0 || subjectStrengths.length > 0) && (
        <section className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-6 md:p-8 ambient-shadow space-y-1" aria-labelledby="profile-scores-heading">
          <h2 id="profile-scores-heading" className="font-headline-sm text-headline-sm text-primary pb-2">
            {t("profileScoresHeading")}
          </h2>
          <Row
            label={t("step6Title")}
            value={profile.preferred_language_codes.map((l) => languageNames.get(l)).filter(Boolean).join(", ") || null}
          />
          <Row
            label={t("proficiencyB2")}
            value={
              languageProficiency.length > 0
                ? languageProficiency
                    .map((lp) => {
                      const lang = languageNames.get(lp.language_code) ?? lp.language_code;
                      return `${lang}: ${lp.level.toUpperCase()}`;
                    })
                    .join(" · ")
                : null
            }
          />
          <Row
            label={t("nmtScoresHelp")}
            value={
              nmtScores.length > 0
                ? nmtScores.map((s) => `${s.subject_code}: ${s.score}/${s.max_score}`).join(" · ")
                : null
            }
          />
          <Row
            label={t("subjectStrengthsLabel")}
            value={
              subjectStrengths.length > 0
                ? subjectStrengths.map((s) => `${s.subject_code}: ${s.level}`).join(" · ")
                : null
            }
          />
        </section>
      )}

      <section className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-6 md:p-8 ambient-shadow space-y-1" aria-labelledby="profile-budget-heading">
        <h2 id="profile-budget-heading" className="font-headline-sm text-headline-sm text-primary pb-2">
          {t("step10Title")}
        </h2>
        <Row
          label={t("tuitionLabel")}
          value={budgetLabels[profile.budget_mode] ?? profile.budget_mode}
        />
        <Row
          label={t("livingLabel")}
          value={budgetLabels[profile.living_cost_mode] ?? profile.living_cost_mode}
        />
      </section>

      <section className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-6 md:p-8 ambient-shadow space-y-1" aria-labelledby="profile-life-heading">
        <h2 id="profile-life-heading" className="font-headline-sm text-headline-sm text-primary pb-2">
          {t("step11Title")}
        </h2>
        <Row
          label={t("cityFormatLabel")}
          value={profile.location_preference_type ? cityFormatLabel[profile.location_preference_type] ?? profile.location_preference_type : null}
        />
        <Row
          label={t("cityFeaturesLabel")}
          value={
            dedupeLifestyle(profile.lifestyle_preferences ?? []).length > 0
              ? dedupeLifestyle(profile.lifestyle_preferences ?? []).join(", ")
              : null
          }
        />
        <Row
          label={t("requirementsLabel")}
          value={requirements.length > 0 ? requirements.join(", ") : null}
        />
      </section>

      {/* Danger zone — GDPR-style self-service deletion */}
      <section className="pt-4 border-t border-outline-variant/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          {t("deleteAccountHint")}
        </p>
        <DeleteAccountZone />
      </section>

      {/* Mobile-only footer links (since main footer is hidden on mobile) */}
      <section className="md:hidden pt-8 border-t border-outline-variant/20 flex flex-wrap justify-center gap-x-6 gap-y-3 pb-8">
        <Link href="/guides" className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors">
          {tFooter("guides")}
        </Link>
        <Link href="/score-methodology" className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors">
          {tFooter("methodology")}
        </Link>
        <Link href="/privacy" className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors">
          {tFooter("privacy")}
        </Link>
        <Link href="/terms" className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors">
          {tFooter("terms")}
        </Link>
      </section>
    </main>
  );
}

/** Canonical engine-vocabulary tags only, kebab legacy dropped, deduped. */
function dedupeLifestyle(prefs: string[]): string[] {
  const map: Record<string, string> = {
    "affordable": "affordable",
    "vibrant_nightlife": "vibrant_nightlife",
    "cultural_scene": "cultural_scene",
    "international_community": "international_community",
    "safe_environment": "safe_environment",
    "good_transport": "good_transport",
    "bike_friendly": "bike_friendly",
    "green_spaces": "green_spaces",
    // legacy → canonical
    "affordable-living": "affordable",
    "vibrant-nightlife": "vibrant_nightlife",
    "cultural-scene": "cultural_scene",
    "international-community": "international_community",
    "safe": "safe_environment",
    "transport": "good_transport",
    "bike": "bike_friendly",
    "green": "green_spaces",
  };
  const out = new Set<string>();
  for (const p of prefs) {
    const canon = map[p];
    if (canon) out.add(canon);
  }
  return [...out];
}