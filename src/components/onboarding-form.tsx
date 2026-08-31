"use client";

import { useActionState, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { useTranslations } from "next-intl";
import { submitOnboardingAction } from "@/lib/onboarding/actions";
import { initialOnboardingActionState } from "@/lib/onboarding/types";
import type { Database } from "@/types/database";
import {
  formInputClassName,
  formLabelClassName,
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
  UA: ["uk", "en"],
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
  CA: ["en", "fr"],
  SE: ["sv", "en"],
  DK: ["da", "en"],
  FI: ["fi", "sv", "en"],
  NO: ["no", "en"],
};
const DEFAULT_COUNTRY_LANGUAGES = ["en"];

/** Country code → flag emoji shown on the Q2 cards (mockup treatment). */
const FLAG_EMOJI: Record<string, string> = {
  UA: "🇺🇦",
  CZ: "🇨🇿",
  DE: "🇩🇪",
  AT: "🇦🇹",
  CH: "🇨🇭",
  PL: "🇵🇱",
  NL: "🇳🇱",
  FR: "🇫🇷",
  ES: "🇪🇸",
  IT: "🇮🇹",
  PT: "🇵🇹",
  GB: "🇬🇧",
  IE: "🇮🇪",
  US: "🇺🇸",
  CA: "🇨🇦",
  SE: "🇸🇪",
  DK: "🇩🇰",
  FI: "🇫🇮",
  NO: "🇳🇴",
};

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
        { id: "lifestyle", titleKey: "step11Title", subtitleKey: "step11Subtitle", visible: true },
        { id: "extra", titleKey: "step12Title", subtitleKey: "step12Subtitle", visible: true },
        { id: "support", titleKey: "step13Title", subtitleKey: "step13Subtitle", visible: true },
      ] as const,
    [ctx.proficiencyVisible, ctx.examVisible, ctx.subjectsVisible],
  );
}

/**
 * Re-derives which Q8 branch was previously chosen, purely to pre-select
 * the right radio option when a user revisits the wizard. Best-effort —
 * expected vs. real scores are enough signal to guess in the common cases.
 */
function deriveInitialNmtBranch(scores: UserNmtScoreRow[]): string {
  if (scores.length === 0) return "";
  const hasReal = scores.some((s) => !s.score_is_expected);
  const hasExpected = scores.some((s) => s.score_is_expected);
  if (hasReal) return "yes";
  if (hasExpected) return "planning";
  return "";
}

/** Re-derives which Q11 checkboxes an existing profile answers to. */
function _deriveInitialRequirements(profile: UserProfileRow | null): string[] {
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

/** Re-derives the city format single-select from existing profile. */
function deriveInitialCityFormat(profile: UserProfileRow | null): string {
  if (!profile) return "";
  if (profile.location_preference_type === "capital_or_large_city") return "large";
  if (profile.location_preference_type === "small_city") return "small";
  return "";
}

/** Re-derives the city features multi-select from existing profile. */
function deriveInitialCityFeatures(profile: UserProfileRow | null): string[] {
  if (!profile) return [];
  const prefs = profile.lifestyle_preferences ?? [];
  const selected: string[] = [];
  if (prefs.includes("affordable")) selected.push("cost");
  if (prefs.includes("vibrant_nightlife")) selected.push("nightlife");
  if (prefs.includes("cultural_scene")) selected.push("culture");
  if (prefs.includes("international_community")) selected.push("international");
  if (prefs.includes("safe_environment")) selected.push("safe");
  if (prefs.includes("good_transport")) selected.push("transport");
  if (prefs.includes("bike_friendly")) selected.push("bike");
  if (prefs.includes("green_spaces")) selected.push("green");
  // Legacy kebab-case values from before the engine-vocabulary fix.
  if (prefs.includes("affordable-living")) selected.push("cost");
  if (prefs.includes("vibrant-nightlife")) selected.push("nightlife");
  if (prefs.includes("cultural-scene")) selected.push("culture");
  if (prefs.includes("international-community")) selected.push("international");
  return selected;
}

/** Re-derives the new requirements (support + admission) from existing profile. */
function deriveInitialRequirementsNew(profile: UserProfileRow | null): string[] {
  if (!profile) return [];
  const selected: string[] = [];
  if (profile.wants_scholarship) selected.push("scholarship");
  if (profile.wants_dormitory) selected.push("dormitory");
  if (profile.wants_work_during_study) selected.push("work");
  if (profile.wants_stay_after_graduation) selected.push("stay");
  if (profile.open_to_additional_exams === false) selected.push("no_extra_exams");
  return selected;
}

// Lifestyle / Q11 options
export const CITY_FORMAT_OPTIONS = [
  { value: "large", labelKey: "cityFormatLarge" },
  { value: "student", labelKey: "cityFormatStudent" },
  { value: "small", labelKey: "cityFormatSmall" },
  { value: "dontcare", labelKey: "cityFormatDontCare" },
] as const;

export const CITY_FEATURE_OPTIONS = [
  { value: "cost", labelKey: "cityFeatureCost" },
  { value: "nightlife", labelKey: "cityFeatureNightlife" },
  { value: "culture", labelKey: "cityFeatureCulture" },
  { value: "international", labelKey: "cityFeatureInternational" },
  { value: "safe", labelKey: "cityFeatureSafe" },
  { value: "transport", labelKey: "cityFeatureTransport" },
  { value: "bike", labelKey: "cityFeatureBike" },
  { value: "green", labelKey: "cityFeatureGreen" },
] as const;

// Requirements / Q12 options
const REQUIREMENT_OPTIONS = [
  // Support & opportunities
  { value: "scholarship", labelKey: "reqScholarship", group: "support" },
  { value: "dormitory", labelKey: "reqDormitory", group: "support" },
  { value: "work", labelKey: "reqWork", group: "support" },
  { value: "stay", labelKey: "reqStay", group: "support" },
  // Admission
  { value: "no_extra_exams", labelKey: "reqNoExtraExams", group: "admission" },
] as const;

/** Q7 — CEFR levels (C2 → A0), stored verbatim in `user_language_proficiency.level`. */
const CEFR_OPTIONS = [
  { value: "c2", labelKey: "proficiencyC2", captionKey: "proficiencyC2Caption" },
  { value: "c1", labelKey: "proficiencyC1", captionKey: "proficiencyC1Caption" },
  { value: "b2", labelKey: "proficiencyB2", captionKey: "proficiencyB2Caption" },
  { value: "b1", labelKey: "proficiencyB1", captionKey: "proficiencyB1Caption" },
  { value: "a2", labelKey: "proficiencyA2", captionKey: "proficiencyA2Caption" },
  { value: "a1", labelKey: "proficiencyA1", captionKey: "proficiencyA1Caption" },
  { value: "a0", labelKey: "proficiencyA0", captionKey: "proficiencyA0Caption" },
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
  const [selectedCountry, setSelectedCountry] = useState<string>(
    existingProfile?.preferred_country_codes?.[0] ?? "",
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
    deriveInitialNmtBranch(existingNmtScores),
  );
  const [supportPref, setSupportPref] = useState<string>(
    existingProfile?.support_preference ?? "",
  );
  const [nmtScoreCount, setNmtScoreCount] = useState(
    existingNmtScores.filter((s) => s.score != null).length,
  );
  const [cityFormat, setCityFormat] = useState<string>(() =>
    deriveInitialCityFormat(existingProfile),
  );
  const [cityFeatures, setCityFeatures] = useState<string[]>(() =>
    deriveInitialCityFeatures(existingProfile),
  );
  const [requirementsNew, setRequirementsNew] = useState<string[]>(() =>
    deriveInitialRequirementsNew(existingProfile),
  );

  // Q8 (national exam) only makes sense for residents of a mapped country
  // who have finished school — grades 9–11 skip it entirely (no NMT
  // question at all), and subject strengths (Q9) take its place.
  const examVisible =
    residenceCountry in RESIDENCE_EXAM_MAP && isPastSchoolStage(educationStage);
  const subjectsVisible = !(examVisible && nmtScoreCount > 0);
  const proficiencyVisible = selectedLanguages.length > 0;

  // Calculate maximum possible steps for this user's path (for progress bar)
  const _maxSteps = useMemo(() => {
    let count = 11; // Always visible: residence, targetCountries, educationStage, startYear, fieldOfStudy, languageInstruction, budget, lifestyle, extra, support
    if (proficiencyVisible) count += 1; // languageProficiency
    if (examVisible) {
      count += 1; // exam
      if (!(nmtScoreCount > 0)) count += 1; // subjects (if no NMT scores)
    }
    return count;
  }, [proficiencyVisible, examVisible, nmtScoreCount]);

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

  // Resume where the user left off within this browser session — an F5
  // mid-questionnaire no longer throws them back to step one. Cleared on
  // successful submit (server redirect) and when steps shift visibility.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = Number(sessionStorage.getItem("unifind_wizard_step"));
    if (Number.isInteger(stored) && stored > 0 && stored < visibleSteps.length) {
      // Deferred to a macrotask per react-compiler guidance (same pattern
      // as use-match-changes) — avoids synchronous setState in effects.
      setTimeout(() => setStepIndex(stored), 0);
    }
  }, [visibleSteps.length]);
  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("unifind_wizard_step", String(stepIndex));
    }
  }, [stepIndex]);

  const currentStep = visibleSteps[Math.min(stepIndex, stepCount - 1)];
  const formRef = useRef<HTMLFormElement>(null);
  const stepPanelRef = useRef<HTMLDivElement>(null);
  const firstRender = useRef(true);

  // A11y: after every step change, move keyboard focus to the top of the
  // freshly revealed panel and scroll it into view (skipped on first mount).
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const el = stepPanelRef.current;
    if (!el) return;
    el.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentStep.id]);

  function goNext() {
    setStepIndex((current) => Math.min(stepCount - 1, current + 1));
  }
  function goBack() {
    setStepIndex((current) => Math.max(0, current - 1));
  }
  // The footer button is ALWAYS type="button": swapping its type to
  // "submit" while the click that advanced to the last step was still
  // being processed made the browser replay the activation against the
  // freshly rendered submit button and fire the action a step early
  // (the "kicked out before the last question" bug). On the last step we
  // therefore submit explicitly.
  function handleFooterAction() {
    if (showContinue) {
      goNext();
      return;
    }
    formRef.current?.requestSubmit();
  }

  // Q5 — languages offered by the countries picked in Q2. No countries
  // picked yet → the languages of every currently supported destination
  // (English always included), so the user isn't forced to answer the
  // country question first.
  const offeredLanguageCodes = useMemo(() => {
    const codes = new Set<string>();
    const source = selectedCountry
      ? [selectedCountry]
      : supportedCountries.map((c) => c.code);
    for (const code of source) {
      for (const languageCode of COUNTRY_LANGUAGES[code] ?? DEFAULT_COUNTRY_LANGUAGES) {
        codes.add(languageCode);
      }
    }
    codes.add("en");
    return codes;
  }, [selectedCountry, supportedCountries]);

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
    caption: FLAG_EMOJI[c.code] ?? c.code,
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
    setRequirementsNew((current) => {
      if (current.includes(value)) {
        return current.filter((v) => v !== value);
      }
      return [...current, value];
    });
  }

  function toggleCityFormat(value: string) {
    setCityFormat(value);
  }

  function toggleCityFeature(value: string) {
    setCityFeatures((current) => {
      if (current.includes(value)) {
        return current.filter((v) => v !== value);
      }
      return [...current, value];
    });
  }

  const startYearChoice = existingProfile?.start_year
    ? String(existingProfile.start_year)
    : "";

  const showContinue = stepIndex < stepCount - 1;

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex min-h-screen flex-col bg-background"
      onKeyDown={(event) => {
        // The whole wizard is one <form> with no type="submit" button, so
        // the only way to submit is the footer button's requestSubmit().
        // Swallow Enter everywhere so implicit submission can never fire
        // the action mid-quiz.
        if (event.key === "Enter") {
          event.preventDefault();
        }
      }}
    >
      {/* Top app bar: back + step label, segmented progress underneath */}
      <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur-md border-b border-outline-variant/30">
        <div className="mx-auto w-full max-w-container-max px-margin-mobile md:px-margin-desktop">
          <div className="flex h-16 items-center justify-between">
            <button
              type="button"
              onClick={goBack}
              disabled={stepIndex === 0}
              aria-label={t("back")}
              className="flex h-10 w-10 items-center justify-center rounded-full p-2 text-primary hover:bg-surface-container-low transition-colors duration-200 disabled:cursor-default disabled:opacity-40"
            >
              <span className="material-symbols-outlined" aria-hidden="true">
                arrow_back
              </span>
            </button>
            <p className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">
              {t("stepIndicator", { step: stepIndex + 1, total: stepCount })}
            </p>
            <span className="w-10" aria-hidden="true" />
          </div>
          {/* Segmented progress bar (mockup treatment: discrete blocks) */}
          <div className="flex gap-1 pb-2">
            {visibleSteps.map((step, index) => (
              <div
                key={step.id}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  index <= stepIndex ? "bg-primary" : "bg-surface-dim"
                }`}
              />
            ))}
          </div>
        </div>
      </header>

      {/* Question canvas — only the current step is visible, all stay mounted.
          pb-48 clears the fixed footer on the smallest phones (the last
          question's tiles must never scroll under it — see the footer
          comment). */}
      <main className="mx-auto w-full max-w-[800px] flex-grow space-y-8 px-margin-mobile md:px-margin-desktop py-8 pb-48 md:py-10">
      {/* SR-only step announcer for screen-reader users */}
      <p role="status" aria-live="polite" className="sr-only">
        {t("stepAria", { current: Math.min(stepIndex, stepCount - 1) + 1, total: stepCount })}
      </p>

      <div ref={stepPanelRef} tabIndex={-1} className="outline-none">
        <section className="space-y-2">
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-primary">
            {t(currentStep.titleKey)}
          </h1>
          <p className="font-body-md text-body-md md:font-body-lg md:text-body-lg text-on-surface-variant">
            {t(currentStep.subtitleKey)}
          </p>
        </section>

        {/* Q1 — residence */}
        <div className={currentStep.id === "residence" ? "space-y-4 step-transition" : "hidden"}>
          <div className="space-y-1">
            <label htmlFor="residence_country_code" className={formLabelClassName}>
              {t("residenceCountryLabel")}
            </label>
            <select
              id="residence_country_code"
              name="residence_country_code"
              value={residenceCountry}
              onChange={(e) => setResidenceCountry(e.target.value)}
              className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-3 font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
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

        {/* Q2 — target country (single select) */}
        <div className={currentStep.id === "targetCountries" ? "space-y-2 step-transition" : "hidden"}>
          <RadioCardGroup
            name="preferred_country_codes"
            options={supportedCountryOptions}
            value={selectedCountry}
            onChange={setSelectedCountry}
          />
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            {t("countriesComingSoonNote")}
          </p>
        </div>

        {/* Q3 — education stage */}
        <div className={currentStep.id === "educationStage" ? "step-transition" : "hidden"}>
          <RadioCardGroup
            name="education_stage"
            options={[
              { value: "grade_9", label: t("stageGrade9") },
              { value: "grade_10", label: t("stageGrade10") },
              { value: "grade_11", label: t("stageGrade11") },
              { value: "finished_school", label: t("stageFinishedSchool") },
              { value: "college", label: t("stageCollege") },
              { value: "other", label: t("stageOther") },
            ]}
            value={educationStage}
            onChange={setEducationStage}
          />
        </div>

        {/* Q4 — start year */}
        <div className={currentStep.id === "startYear" ? "step-transition" : "hidden"}>
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
        <div className={currentStep.id === "fieldOfStudy" ? "space-y-6 step-transition" : "hidden"}>
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
        <div className={currentStep.id === "languageInstruction" ? "step-transition" : "hidden"}>
          <ToggleCardGroup
            name="preferred_language_codes"
            options={fallbackLanguageOptions}
            defaultValues={selectedLanguages}
            onChange={setSelectedLanguages}
          />
        </div>

        {/* Q7 — per-language proficiency, CEFR levels */}
        <div className={currentStep.id === "languageProficiency" ? "space-y-6 step-transition" : "hidden"}>
          {selectedLanguages.map((code) => {
            const language = languages.find((l) => l.code === code);
            return (
              <RadioCardGroup
                key={code}
                name={`language_level__${code}`}
                label={language?.name ?? code}
                options={CEFR_OPTIONS.map((option) => ({
                  value: option.value,
                  label: t(option.labelKey),
                  caption: t(option.captionKey),
                }))}
                defaultValue={languageLevelByCode.get(code)?.level ?? ""}
              />
            );
          })}
        </div>

        {/* Q8 — national exam (only for residents of a mapped country who've finished school) */}
        <div className={currentStep.id === "exam" ? "space-y-5 step-transition" : "hidden"}>
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

          {(nmtBranch === "yes" || nmtBranch === "planning") && (
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
        <div className={currentStep.id === "subjects" ? "space-y-5 step-transition" : "hidden"}>
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
        <div className={currentStep.id === "budget" ? "space-y-6 step-transition" : "hidden"}>
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

        {/* Q11 — lifestyle preferences: city format + city features */}
        <div className={currentStep.id === "lifestyle" ? "space-y-4 step-transition" : "hidden"}>
          <div className="space-y-1">
            <span className={formLabelClassName}>{t("lifestyleLabel")}</span>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              {t("lifestyleSubLabel")}
            </p>
          </div>

          {/* City format — single select (radio cards) */}
          <div className="space-y-3">
            <span className={formLabelClassName}>{t("cityFormatLabel")}</span>
            <div className="grid grid-cols-2 gap-3">
              {CITY_FORMAT_OPTIONS.map((option) => {
                const checked = cityFormat === option.value;
                return (
                  <label
                    key={option.value}
                    className={`group relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 px-4 py-4 text-center cursor-pointer transition-colors ${
                      checked
                        ? "border-primary bg-primary-fixed/20"
                        : "border-outline-variant bg-surface-container-lowest"
                    }`}
                  >
                    <input
                      type="radio"
                      name="city_format"
                      value={option.value}
                      checked={checked}
                      onChange={() => toggleCityFormat(option.value)}
                      className="peer sr-only"
                    />
                    <span className="font-headline-sm text-headline-sm text-primary">
                      {t(option.labelKey)}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* City features — multi-select (checkboxes) */}
          <div className="space-y-3">
            <span className={formLabelClassName}>{t("cityFeaturesLabel")}</span>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              {t("lifestyleHelp")}
            </p>
            <div className="grid grid-cols-2 gap-3">
              {CITY_FEATURE_OPTIONS.map((option) => {
                const checked = cityFeatures.includes(option.value);
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
                      onChange={() => toggleCityFeature(option.value)}
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
        </div>

        {/* Q12 — extra requirements */}
        <div className={currentStep.id === "extra" ? "space-y-4 step-transition" : "hidden"}>
          <div className="space-y-1">
            <span className={formLabelClassName}>{t("requirementsLabel")}</span>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              {t("requirementsSubLabel")}
            </p>
          </div>

          {/* Support & opportunities group */}
          <div>
            <h4 className="font-label-caps text-label-caps text-on-surface-variant mb-3">
              {t("reqGroupSupport")}
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {REQUIREMENT_OPTIONS.filter((o) => o.group === "support").map((option) => {
                const checked = requirementsNew.includes(option.value);
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

          {/* Admission group */}
          <div className="pt-4 border-t border-outline-variant/20">
            <h4 className="font-label-caps text-label-caps text-on-surface-variant mb-3">
              {t("reqGroupAdmission")}
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {REQUIREMENT_OPTIONS.filter((o) => o.group === "admission").map((option) => {
                const checked = requirementsNew.includes(option.value);
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
        </div>

        {/* Q13 — international student support */}
        <div className={currentStep.id === "support" ? "space-y-4 step-transition" : "hidden"}>
          <RadioCardGroup
            name="support_preference"
            label={t("supportPrefLabel")}
            options={[
              { value: "yes", label: t("supportPrefYes") },
              { value: "no", label: t("supportPrefNo") },
            ]}
            value={supportPref}
            onChange={setSupportPref}
          />
        </div>

        {state.error && (
          <p role="alert" className="font-body-sm text-body-sm text-error">
            {state.error}
          </p>
        )}
      </div>
      </main>

      {/* Anchored footer CTA — single row on every screen (mockup
          treatment): tip left, action right. Two stacked rows on mobile
          made the footer tall enough to overlap the last question's
          tiles under the fixed bar — taps on bottom-row tiles landed on
          the action button and silently submitted the form. The button
          itself never changes type — see handleFooterAction. */}
      <footer className="fixed inset-x-0 bottom-0 z-40 border-t border-outline-variant/30 bg-surface/90 backdrop-blur-md py-3 px-margin-mobile md:px-margin-desktop">
        <div className="mx-auto flex w-full max-w-[800px] items-center justify-between gap-3">
          <p className="flex min-w-0 items-center gap-2 font-body-sm text-body-sm text-on-surface-variant">
            <span
              className="material-symbols-outlined text-primary-container text-sm"
              aria-hidden="true"
            >
              tips_and_updates
            </span>
            <span className="truncate">
              {stepIndex + 1 < Math.ceil(stepCount / 2)
                ? t("tipHalfway")
                : t("tipAlmostDone")}
            </span>
          </p>
          <button
            type="button"
            onClick={handleFooterAction}
            disabled={pending}
            aria-busy={pending}
            className="flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-primary px-6 py-3 font-headline-sm text-headline-sm text-on-primary shadow-md transition-all duration-200 hover:-translate-y-[1px] hover:shadow-lg active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending && (
              <span
                className="h-4 w-4 animate-spin rounded-full border-2 border-on-primary/40 border-t-on-primary"
                aria-hidden="true"
              />
            )}
            {showContinue ? (
              <>
                {t("continue")}
                <span className="material-symbols-outlined" aria-hidden="true">
                  arrow_forward
                </span>
              </>
            ) : pending ? (
              t("submitPending")
            ) : (
              t("submit")
            )}
          </button>
        </div>
      </footer>
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

/** The exam step (Q8) applies only once school is finished. */
function isPastSchoolStage(stage: string | null | undefined): boolean {
  return stage === "finished_school" || stage === "college" || stage === "other";
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