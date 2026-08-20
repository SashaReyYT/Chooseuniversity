"use client";

import { useActionState, useMemo, useRef, useState, type ChangeEvent } from "react";
import { useTranslations } from "next-intl";
import { submitOnboardingAction } from "@/lib/onboarding/actions";
import { initialOnboardingActionState } from "@/lib/onboarding/types";
import type { Database } from "@/types/database";
import {
  formInputClassName,
  formLabelClassName,
  formPrimaryButtonClassName,
  formSelectClassName,
} from "@/components/form-styles";
import { ToggleCardGroup } from "@/components/toggle-card-group";

type CountryRow = Database["public"]["Tables"]["countries"]["Row"];
type LanguageRow = Database["public"]["Tables"]["languages"]["Row"];
type FieldOfStudyRow = Database["public"]["Tables"]["fields_of_study"]["Row"];
type NmtSubjectRow = Database["public"]["Tables"]["nmt_subjects"]["Row"];
type UserProfileRow = Database["public"]["Tables"]["user_profiles"]["Row"];
type UserNmtScoreRow = Database["public"]["Tables"]["user_nmt_scores"]["Row"];
type UserSubjectStrengthRow =
  Database["public"]["Tables"]["user_subject_strengths"]["Row"];
type UserLanguageProficiencyRow =
  Database["public"]["Tables"]["user_language_proficiency"]["Row"];

interface OnboardingFormProps {
  locale: string;
  countries: CountryRow[];
  supportedCountries: CountryRow[];
  languages: LanguageRow[];
  fieldsOfStudy: FieldOfStudyRow[];
  nmtSubjects: NmtSubjectRow[];
  existingProfile: UserProfileRow | null;
  existingNmtScores: UserNmtScoreRow[];
  existingSubjectStrengths: UserSubjectStrengthRow[];
  existingLanguageProficiency: UserLanguageProficiencyRow[];
}

/**
 * Countries whose residents currently have a national-exam question wired
 * up (onboarding Q8). Extend this — and the corresponding branch in
 * `submitOnboardingAction` — before adding a new country's exam rather
 * than assuming every country has one directly transferable to matching.
 */
const RESIDENCE_EXAM_MAP: Record<string, "nmt"> = { UA: "nmt" };

/**
 * Destination country (uppercase ISO code, as in `countries.code`) → the
 * languages typically used for instruction there (Q6 options are derived
 * from the countries picked in Q2, so the user never gets a long list of
 * languages for countries they didn't choose).
 */
const COUNTRY_LANGUAGES: Record<string, string[]> = {
  CZ: ["cs", "en"],
  DE: ["de", "en"],
  AT: ["de", "en"],
  CH: ["de", "fr", "it", "en"],
  PL: ["pl", "en"],
  NL: ["nl", "en"],
  FR: ["fr", "en"],
  ES: ["es", "en"],
  IT: ["it", "en"],
  PT: ["pt", "en"],
  GB: ["en"],
  IE: ["en"],
  US: ["en"],
  CA: ["en"],
  SE: ["en"],
  DK: ["en"],
  FI: ["en"],
  NO: ["en"],
};
const DEFAULT_COUNTRY_LANGUAGES = ["en"];

/**
 * Field-of-study category → the subjects offered in Q9 for that category
 * (codes from the `nmt_subjects` catalog, which `user_subject_strengths`
 * is keyed off). Anything not listed falls back to the full catalog.
 */
const CATEGORY_SUBJECTS: Record<string, string[]> = {
  "Engineering & Technology": ["mathematics", "physics", "computer_science"],
  "Natural Sciences": ["mathematics", "physics", "chemistry", "biology"],
  "Health Sciences": ["chemistry", "biology", "mathematics"],
  "Business & Economics": ["mathematics", "english"],
  Law: ["english", "ukrainian_history"],
  "Social Sciences": ["english", "ukrainian_history"],
  Humanities: ["english", "ukrainian_language"],
  "Arts & Design": ["english"],
};

/** nmt_subjects code → localized label key (fallback: the DB row's name). */
const SUBJECT_LABEL_KEYS: Record<string, string> = {
  ukrainian_language: "subjectUkrainianLanguage",
  mathematics: "subjectMathematics",
  ukrainian_history: "subjectUkrainianHistory",
  english: "subjectEnglish",
  biology: "subjectBiology",
  physics: "subjectPhysics",
  chemistry: "subjectChemistry",
  geography: "subjectGeography",
  computer_science: "subjectComputerScience",
};

/**
 * Every step in a fixed order, each with a visibility predicate. Whether
 * a given render includes a step depends only on *earlier* answers
 * (residence, education stage, selected languages, whether an exam score
 * has been entered), so filtering this list fresh on every render is safe
 * to navigate by index — steps already passed never disappear
 * retroactively.
 */
function useStepDefinitions(ctx: {
  proficiencyVisible: boolean;
  examVisible: boolean;
  subjectsVisible: boolean;
}) {
  return useMemo(
    () =>
      [
        { id: "residence", titleKey: "step1Title", subtitleKey: "step1Subtitle", visible: true },
        { id: "targetCountries", titleKey: "step2Title", subtitleKey: "step2Subtitle", visible: true },
        { id: "educationStage", titleKey: "step3Title", subtitleKey: "step3Subtitle", visible: true },
        { id: "startYear", titleKey: "step4Title", subtitleKey: "step4Subtitle", visible: true },
        { id: "fieldOfStudy", titleKey: "step5Title", subtitleKey: "step5Subtitle", visible: true },
        { id: "languageInstruction", titleKey: "step6Title", subtitleKey: "step6Subtitle", visible: true },
        { id: "languageProficiency", titleKey: "step7Title", subtitleKey: "step7Subtitle", visible: ctx.proficiencyVisible },
        { id: "exam", titleKey: "step8Title", subtitleKey: "step8Subtitle", visible: ctx.examVisible },
        { id: "subjects", titleKey: "step9Title", subtitleKey: "step9Subtitle", visible: ctx.subjectsVisible },
        { id: "budget", titleKey: "step10Title", subtitleKey: "step10Subtitle", visible: true },
        { id: "extra", titleKey: "step11Title", subtitleKey: "step11Subtitle", visible: true },
      ] as const,
    [ctx.proficiencyVisible, ctx.examVisible, ctx.subjectsVisible],
  );
}

/**
 * Re-derives which Q8 branch was previously chosen, purely to pre-select
 * the right radio option when a user revisits the wizard. Best-effort —
 * expected vs. real scores plus the education stage at save time are
 * enough signal to guess correctly in the common cases.
 */
function deriveInitialNmtBranch(
  scores: UserNmtScoreRow[],
  educationStageAtLoad: string | null | undefined,
): string {
  if (scores.length === 0) return "";
  const hasExpected = scores.some((s) => s.score_is_expected);
  const hasReal = scores.some((s) => !s.score_is_expected);
  if (educationStageAtLoad === "grade_11") {
    return hasExpected || hasReal ? "grade11_taking" : "";
  }
  if (hasReal) return "yes";
  if (hasExpected) return "planning";
  return "";
}

/** Re-derives which Q11 checkboxes an existing profile answers to. */
function deriveInitialRequirements(profile: UserProfileRow | null): string[] {
  if (!profile) return [];
  const selected: string[] = [];
  if (profile.wants_scholarship) selected.push("scholarship");
  if (profile.wants_dormitory) selected.push("dormitory");
  if (profile.wants_work_during_study) selected.push("work");
  if (profile.wants_stay_after_graduation) selected.push("stay");
  if (profile.open_to_additional_exams === false) selected.push("no_extra_exams");
  if (profile.location_preference_type === "capital_or_large_city") selected.push("big_city");
  if (profile.location_preference_type === "small_city") selected.push("small_city");
  return selected;
}

const REQUIREMENT_OPTIONS = [
  { value: "scholarship", labelKey: "reqScholarship" },
  { value: "dormitory", labelKey: "reqDormitory" },
  { value: "work", labelKey: "reqWork" },
  { value: "stay", labelKey: "reqStay" },
  { value: "no_extra_exams", labelKey: "reqNoExtraExams" },
  { value: "big_city", labelKey: "reqBigCity" },
  { value: "small_city", labelKey: "reqSmallCity" },
  { value: "nothing", labelKey: "reqNothing" },
] as const;

export function OnboardingForm({
  locale,
  countries,
  supportedCountries,
  languages,
  fieldsOfStudy,
  nmtSubjects,
  existingProfile,
  existingNmtScores,
  existingSubjectStrengths,
  existingLanguageProficiency,
}: OnboardingFormProps) {
  const t = useTranslations("Onboarding");
  const action = submitOnboardingAction.bind(null, locale);
  const [state, formAction, pending] = useActionState(
    action,
    initialOnboardingActionState,
  );

  // Controlled state — only for the handful of answers that decide which
  // later steps/fields are shown. Everything else stays uncontrolled
  // (plain DOM inputs collected via FormData on submit).
  const [residenceCountry, setResidenceCountry] = useState<string>(
    existingProfile?.residence_country_code ?? "",
  );
  const [educationStage, setEducationStage] = useState<string>(
    existingProfile?.education_stage ?? "",
  );
  const [selectedCountries, setSelectedCountries] = useState<string[]>(
    existingProfile?.preferred_country_codes ?? [],
  );
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(
    existingProfile?.preferred_language_codes ?? [],
  );
  const [category, setCategory] = useState<string>(() =>
    existingProfile?.primary_field_of_study_id
      ? fieldsOfStudy.find((f) => f.id === existingProfile.primary_field_of_study_id)
          ?.category ?? ""
      : "",
  );
  const [selectedFieldId, setSelectedFieldId] = useState<string>(
    existingProfile?.primary_field_of_study_id ?? "",
  );
  const [nmtBranch, setNmtBranch] = useState<string>(() =>
    deriveInitialNmtBranch(existingNmtScores, existingProfile?.education_stage),
  );
  const [nmtScoreCount, setNmtScoreCount] = useState(
    existingNmtScores.filter((s) => s.score != null).length,
  );
  const [requirements, setRequirements] = useState<string[]>(() =>
    deriveInitialRequirements(existingProfile),
  );

  const examVisible =
    residenceCountry in RESIDENCE_EXAM_MAP &&
    educationStage !== "grade_9" &&
    educationStage !== "grade_10" &&
    educationStage !== "";
  const isGrade11 = educationStage === "grade_11";
  const subjectsVisible = !(examVisible && nmtScoreCount > 0);
  const proficiencyVisible = selectedLanguages.length > 0;

  const steps = useStepDefinitions({
    proficiencyVisible,
    examVisible,
    subjectsVisible,
  });
  const visibleSteps = useMemo(
    () => steps.filter((s) => s.visible),
    [steps],
  );
  const stepCount = visibleSteps.length;
  const [stepIndex, setStepIndex] = useState(0);
  const currentStep = visibleSteps[Math.min(stepIndex, stepCount - 1)];

  function goNext() {
    setStepIndex((current) => Math.min(stepCount - 1, current + 1));
  }
  function goBack() {
    setStepIndex((current) => Math.max(0, current - 1));
  }

  // Q5 — languages offered by the countries picked in Q2. No countries
  // picked yet → the languages of every currently supported destination
  // (English always included), so the user isn't forced to answer the
  // country question first.
  const offeredLanguageCodes = useMemo(() => {
    const codes = new Set<string>();
    const source =
      selectedCountries.length > 0
        ? selectedCountries
        : supportedCountries.map((c) => c.code);
    for (const code of source) {
      for (const languageCode of COUNTRY_LANGUAGES[code] ?? DEFAULT_COUNTRY_LANGUAGES) {
        codes.add(languageCode);
      }
    }
    codes.add("en");
    return codes;
  }, [selectedCountries, supportedCountries]);

  const languageOptions = languages
    .filter((l) => offeredLanguageCodes.has(l.code))
    .map((l) => ({ value: l.code, label: l.name }));
  const fallbackLanguageOptions =
    languageOptions.length > 0
      ? languageOptions
      : languages.map((l) => ({ value: l.code, label: l.name }));

  // Q9 — subjects relevant to the field-of-study category picked in Q5.
  const relevantSubjects = useMemo(() => {
    if (!category || category === "not_sure") return nmtSubjects;
    const codes = CATEGORY_SUBJECTS[category];
    if (!codes) return nmtSubjects;
    return nmtSubjects.filter((subject) => codes.includes(subject.code));
  }, [category, nmtSubjects]);

  const fieldsByCategory = useMemo(
    () => groupBy(fieldsOfStudy, (f) => f.category),
    [fieldsOfStudy],
  );
  const fieldsInCategory = category && category !== "not_sure"
    ? fieldsByCategory.get(category) ?? []
    : [];

  const countryOptions = countries.map((c) => ({ value: c.code, label: c.name }));
  const supportedCountryOptions = supportedCountries.map((c) => ({
    value: c.code,
    label: c.name,
    caption: c.code,
  }));

  const nmtScoreContainerRef = useRef<HTMLDivElement>(null);
  function handleNmtScoreChange() {
    const container = nmtScoreContainerRef.current;
    if (!container) return;
    const filled = Array.from(
      container.querySelectorAll<HTMLInputElement>('input[type="number"]'),
    ).filter((input) => input.value.trim() !== "");
    setNmtScoreCount(filled.length);
  }

  const nmtScoreByCode = new Map(existingNmtScores.map((s) => [s.subject_code, s]));
  const subjectStrengthByCode = new Map(
    existingSubjectStrengths.map((s) => [s.subject_code, s]),
  );
  const languageLevelByCode = new Map(
    existingLanguageProficiency.map((l) => [l.language_code, l]),
  );

  function handleCategoryChange(value: string) {
    setCategory(value);
    if (!value || value === "not_sure") {
      setSelectedFieldId("");
      return;
    }
    const fields = fieldsByCategory.get(value) ?? [];
    if (selectedFieldId && !fields.some((f) => f.id === selectedFieldId)) {
      setSelectedFieldId("");
    }
  }

  function toggleRequirement(value: string) {
    setRequirements((current) => {
      if (current.includes(value)) {
        return value === "nothing" ? [] : current.filter((v) => v !== value);
      }
      if (value === "nothing") return ["nothing"];
      let next = current.filter((v) => v !== "nothing");
      if (value === "big_city") next = next.filter((v) => v !== "small_city");
      if (value === "small_city") next = next.filter((v) => v !== "big_city");
      return [...next, value];
    });
  }

  const startYearChoice = existingProfile?.start_year
    ? String(existingProfile.start_year)
    : "";

  return (
    <form action={formAction} className="max-w-2xl mx-auto space-y-8">
      {/* Progress header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          {stepIndex > 0 ? (
            <button
              type="button"
              onClick={goBack}
              aria-label={t("back")}
              className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-surface-container transition-colors"
            >
              <span className="material-symbols-outlined" aria-hidden="true">
                arrow_back
              </span>
            </button>
          ) : (
            <span className="w-9 h-9" />
          )}
          <p className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wide">
            {t("stepIndicator", { step: stepIndex + 1, total: stepCount })}
          </p>
          <span className="w-9 h-9" />
        </div>
        <div className="h-1.5 rounded-full bg-surface-container-high overflow-hidden">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${((stepIndex + 1) / stepCount) * 100}%` }}
          />
        </div>
      </div>

      <div className="space-y-2">
        <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-primary">
          {t(currentStep.titleKey)}
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          {t(currentStep.subtitleKey)}
        </p>
      </div>

      {/* Q1 — residence */}
      <div className={currentStep.id === "residence" ? "space-y-4" : "hidden"}>
        <div className="space-y-1">
          <label htmlFor="residence_country_code" className={formLabelClassName}>
            {t("residenceCountryLabel")}
          </label>
          <select
            id="residence_country_code"
            name="residence_country_code"
            value={residenceCountry}
            onChange={(e) => setResidenceCountry(e.target.value)}
            className={formSelectClassName}
          >
            <option value="">{t("selectPlaceholder")}</option>
            {countryOptions.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="residence_city" className={formLabelClassName}>
            {t("residenceCityLabel")}
          </label>
          <input
            id="residence_city"
            name="residence_city"
            type="text"
            placeholder={t("residenceCityPlaceholder")}
            defaultValue={existingProfile?.residence_city ?? ""}
            className={formInputClassName}
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="full_name" className={formLabelClassName}>
            {t("nameLabel")}
          </label>
          <input
            id="full_name"
            name="full_name"
            type="text"
            defaultValue={existingProfile?.full_name ?? ""}
            className={formInputClassName}
          />
        </div>
      </div>

      {/* Q2 — target countries */}
      <div className={currentStep.id === "targetCountries" ? "space-y-2" : "hidden"}>
        <ToggleCardGroup
          name="preferred_country_codes"
          options={supportedCountryOptions}
          defaultValues={selectedCountries}
          onChange={setSelectedCountries}
        />
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          {t("countriesComingSoonNote")}
        </p>
      </div>

      {/* Q3 — education stage */}
      <div className={currentStep.id === "educationStage" ? "" : "hidden"}>
        <RadioCardGroup
          name="education_stage"
          options={[
            { value: "grade_9", label: t("stageGrade9") },
            { value: "grade_10", label: t("stageGrade10") },
            { value: "grade_11", label: t("stageGrade11") },
            { value: "graduated", label: t("stageGraduated") },
            { value: "college", label: t("stageCollege") },
            { value: "other", label: t("stageOther") },
          ]}
          value={educationStage}
          onChange={setEducationStage}
        />
      </div>

      {/* Q4 — start year */}
      <div className={currentStep.id === "startYear" ? "" : "hidden"}>
        <RadioCardGroup
          name="start_year_choice"
          options={[
            { value: "2026", label: t("startYear2026") },
            { value: "2027", label: t("startYear2027") },
            { value: "2028", label: t("startYear2028") },
            { value: "later", label: t("startYearLater") },
            { value: "not_sure", label: t("startYearNotSure") },
          ]}
          defaultValue={startYearChoice}
        />
      </div>

      {/* Q5 — field of study: broad direction first, then the specific programme */}
      <div className={currentStep.id === "fieldOfStudy" ? "space-y-6" : "hidden"}>
        <div className="space-y-3">
          <span className={formLabelClassName}>{t("categoryLabel")}</span>
          <RadioCardGroup
            name="field_category"
            options={[
              ...Array.from(fieldsByCategory.keys()).map((c) => ({
                value: c,
                label: c,
              })),
              { value: "not_sure", label: t("notSure") },
            ]}
            value={category}
            onChange={handleCategoryChange}
          />
        </div>
        {fieldsInCategory.length > 0 && (
          <div className="space-y-3">
            <span className={formLabelClassName}>{t("primaryFieldLabel")}</span>
            <RadioCardGroup
              name="primary_field_of_study_id"
              options={[
                ...fieldsInCategory.map((f) => ({ value: f.id, label: f.name })),
                { value: "not_sure", label: t("notSure") },
              ]}
              value={selectedFieldId}
              onChange={setSelectedFieldId}
            />
          </div>
        )}
        {selectedFieldId && selectedFieldId !== "not_sure" && (
          <input type="hidden" name="preferred_field_of_study_ids" value={selectedFieldId} />
        )}
      </div>

      {/* Q6 — language of instruction (only the languages of the countries picked) */}
      <div className={currentStep.id === "languageInstruction" ? "" : "hidden"}>
        <ToggleCardGroup
          name="preferred_language_codes"
          options={fallbackLanguageOptions}
          defaultValues={selectedLanguages}
          onChange={setSelectedLanguages}
        />
      </div>

      {/* Q7 — per-language proficiency */}
      <div className={currentStep.id === "languageProficiency" ? "space-y-6" : "hidden"}>
        {selectedLanguages.map((code) => {
          const language = languages.find((l) => l.code === code);
          return (
            <RadioCardGroup
              key={code}
              name={`language_level__${code}`}
              label={language?.name ?? code}
              options={[
                { value: "good", label: t("proficiencyGood") },
                { value: "average", label: t("proficiencyMedium") },
                { value: "poor", label: t("proficiencyPoor") },
                { value: "not_sure", label: t("proficiencyNotSure") },
              ]}
              defaultValue={languageLevelByCode.get(code)?.level ?? ""}
            />
          );
        })}
      </div>

      {/* Q8 — national exam (only for residents of a mapped country, past grade 10) */}
      <div className={currentStep.id === "exam" ? "space-y-5" : "hidden"}>
        {isGrade11 ? (
          <RadioCardGroup
            name="nmt_branch"
            label={t("nmtGrade11Label")}
            options={[
              { value: "grade11_taking", label: t("nmtGrade11Yes") },
              { value: "grade11_skip", label: t("nmtGrade11No") },
            ]}
            value={nmtBranch}
            onChange={setNmtBranch}
          />
        ) : (
          <RadioCardGroup
            name="nmt_branch"
            label={t("nmtTakenLabel")}
            options={[
              { value: "yes", label: t("nmtTakenYes") },
              { value: "planning", label: t("nmtTakenPlanning") },
              { value: "no", label: t("nmtTakenNo") },
              { value: "other", label: t("nmtTakenOther") },
            ]}
            value={nmtBranch}
            onChange={setNmtBranch}
          />
        )}

        {(nmtBranch === "yes" ||
          nmtBranch === "planning" ||
          nmtBranch === "grade11_taking") && (
          <div className="space-y-3">
            <div className="space-y-1">
              <span className={formLabelClassName}>{t("nmtSubjectsLabel")}</span>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                {nmtBranch === "yes"
                  ? t("nmtScoresHelp")
                  : t("nmtExpectedNote")}
              </p>
            </div>
            <div ref={nmtScoreContainerRef} className="grid grid-cols-2 gap-3">
              {nmtSubjects.map((subject) => (
                <div key={subject.code} className="space-y-1">
                  <label htmlFor={`nmt_score_${subject.code}`} className={formLabelClassName}>
                    {subject.name}
                  </label>
                  <input
                    id={`nmt_score_${subject.code}`}
                    name={`nmt_score_${subject.code}`}
                    type="number"
                    min="0"
                    max="200"
                    placeholder={t("nmtScoreLabel")}
                    defaultValue={nmtScoreByCode.get(subject.code)?.score ?? ""}
                    onChange={handleNmtScoreChange}
                    className={formInputClassName}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Q9 — subject strengths (shown whenever no NMT score has been entered) */}
      <div className={currentStep.id === "subjects" ? "space-y-5" : "hidden"}>
        <div className="space-y-1">
          <span className={formLabelClassName}>{t("subjectStrengthsLabel")}</span>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            {t("subjectStrengthsHelp")}
          </p>
        </div>
        {relevantSubjects.map((subject) => (
          <RadioCardGroup
            key={subject.code}
            name={`subject_strength_${subject.code}`}
            label={
              SUBJECT_LABEL_KEYS[subject.code]
                ? t(SUBJECT_LABEL_KEYS[subject.code] as Parameters<typeof t>[0])
                : subject.name
            }
            options={[
              { value: "good", label: t("subjectGood") },
              { value: "average", label: t("subjectAverage") },
              { value: "poor", label: t("subjectWeak") },
            ]}
            defaultValue={subjectStrengthByCode.get(subject.code)?.level ?? ""}
          />
        ))}
      </div>

      {/* Q10 — budget */}
      <div className={currentStep.id === "budget" ? "space-y-6" : "hidden"}>
        <RadioCardGroup
          name="budget_mode"
          label={t("tuitionLabel")}
          options={[
            { value: "low", label: t("tuitionLow"), caption: t("tuitionLowHint") },
            { value: "medium", label: t("tuitionMedium"), caption: t("tuitionMediumHint") },
            { value: "high", label: t("tuitionHigh"), caption: t("tuitionHighHint") },
            { value: "unknown", label: t("budgetUnknown") },
          ]}
          defaultValue={existingProfile?.budget_mode ?? "unknown"}
        />

        <RadioCardGroup
          name="living_cost_mode"
          label={t("livingLabel")}
          options={[
            { value: "low", label: t("tuitionLow"), caption: t("livingLowHint") },
            { value: "medium", label: t("tuitionMedium"), caption: t("livingMediumHint") },
            { value: "high", label: t("tuitionHigh"), caption: t("livingHighHint") },
            { value: "unknown", label: t("budgetUnknown") },
          ]}
          defaultValue={existingProfile?.living_cost_mode ?? "unknown"}
        />
      </div>

      {/* Q11 — extra requirements */}
      <div className={currentStep.id === "extra" ? "space-y-4" : "hidden"}>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          {t("requirementsHelp")}
        </p>
        <div className="grid grid-cols-2 gap-3">
          {REQUIREMENT_OPTIONS.map((option) => {
            const checked = requirements.includes(option.value);
            return (
              <label
                key={option.value}
                className={`group relative flex items-center justify-center gap-2 rounded-lg border-2 px-4 py-3 text-center cursor-pointer transition-colors ${
                  checked
                    ? "border-primary bg-primary-fixed/20"
                    : "border-outline-variant bg-surface-container-lowest"
                }`}
              >
                <input
                  type="checkbox"
                  name={option.value}
                  value="true"
                  checked={checked}
                  onChange={() => toggleRequirement(option.value)}
                  className="peer sr-only"
                />
                <span className="w-4 h-4 rounded border-2 border-outline-variant peer-checked:border-primary peer-checked:bg-primary flex items-center justify-center text-on-primary">
                  {checked && (
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                      check
                    </span>
                  )}
                </span>
                <span className="font-headline-sm text-headline-sm text-primary">
                  {t(option.labelKey)}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {state.error && (
        <p role="alert" className="font-body-sm text-body-sm text-error">
          {state.error}
        </p>
      )}

      <div className="pt-2">
        {stepIndex < stepCount - 1 ? (
          <button
            type="button"
            onClick={goNext}
            className={`${formPrimaryButtonClassName} w-full flex items-center justify-center gap-2`}
          >
            {t("continue")}
            <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 18 }}>
              arrow_forward
            </span>
          </button>
        ) : (
          <button
            type="submit"
            disabled={pending}
            className={`${formPrimaryButtonClassName} w-full`}
          >
            {pending ? t("submitPending") : t("submit")}
          </button>
        )}
      </div>
    </form>
  );
}

function groupBy<T>(items: T[], keyFn: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const key = keyFn(item);
    const list = map.get(key);
    if (list) {
      list.push(item);
    } else {
      map.set(key, [item]);
    }
  }
  return map;
}

/**
 * Card-styled radio group (single select) — the same look as
 * `ToggleCardGroup` but with radio semantics: exactly one value under
 * `name`, submitted with the surrounding form like any native input.
 * Supports either uncontrolled use (`defaultValue`) or controlled use
 * (`value` + `onChange`) for the handful of steps whose branching logic
 * needs to react to the answer immediately.
 */
function RadioCardGroup({
  name,
  label,
  options,
  defaultValue,
  value,
  onChange,
}: {
  name: string;
  label?: string;
  options: { value: string; label: string; caption?: string }[];
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
}) {
  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    onChange?.(event.target.value);
  }

  return (
    <div className="space-y-1">
      {label && <span className={formLabelClassName}>{label}</span>}
      <div className="grid grid-cols-2 gap-3">
        {options.map((option) => (
          <label
            key={option.value}
            className="group relative flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-outline-variant bg-surface-container-lowest px-4 py-3 text-center cursor-pointer transition-colors has-checked:border-primary has-checked:bg-primary-fixed/20"
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              {...(onChange
                ? { checked: value === option.value, onChange: handleChange }
                : { defaultChecked: defaultValue === option.value })}
              className="peer sr-only"
            />
            {option.caption && (
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                {option.caption}
              </span>
            )}
            <span className="font-headline-sm text-headline-sm text-primary">
              {option.label}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}