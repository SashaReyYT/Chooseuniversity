"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { submitProfileFormAction } from "@/lib/profile-form/profile-form-actions";
import { initialProfileFormActionState } from "@/lib/profile-form/profile-form-action-state";
import type {
  AdmissionPreference,
  BudgetMode,
  CefrLevel,
  Database,
  DegreeLevel,
  EducationLevel,
  LocationPreferenceType,
  MathBackground,
  StudyFormat,
} from "@/types/database";
import {
  formCheckboxOptionClassName,
  formHelperTextClassName,
  formInputClassName,
  formLabelClassName,
  formMultiSelectClassName,
  formPrimaryButtonClassName,
  formRadioOptionClassName,
  formSelectClassName,
  formTileOptionClassName,
  formTileOptionSelectedClassName,
} from "@/components/form-styles";

type CountryRow = Database["public"]["Tables"]["countries"]["Row"];
type LanguageRow = Database["public"]["Tables"]["languages"]["Row"];
type FieldOfStudyRow = Database["public"]["Tables"]["fields_of_study"]["Row"];
type UserProfileRow = Database["public"]["Tables"]["user_profiles"]["Row"];
type NmtSubjectRow = Database["public"]["Tables"]["nmt_subjects"]["Row"];
type QualificationRow = Database["public"]["Tables"]["qualifications"]["Row"];
type UserNmtScoreRow = Database["public"]["Tables"]["user_nmt_scores"]["Row"];
type UserQualificationRow =
  Database["public"]["Tables"]["user_qualifications"]["Row"];
type UserTestScoreRow = Database["public"]["Tables"]["user_test_scores"]["Row"];

interface ProfileFormProps {
  locale: string;
  countries: CountryRow[];
  supportedCountries: CountryRow[];
  languages: LanguageRow[];
  fieldsOfStudy: FieldOfStudyRow[];
  nmtSubjects: NmtSubjectRow[];
  qualifications: QualificationRow[];
  existingProfile: UserProfileRow | null;
  existingNmtScores: UserNmtScoreRow[];
  existingQualifications: UserQualificationRow[];
  existingTestScores: UserTestScoreRow[];
}

// ---------------------------------------------------------------------------
// Option lists (spec §10–§26). Kept as plain arrays/maps, not hardcoded JSX
// strings — every label routes through next-intl (spec §4).
// ---------------------------------------------------------------------------

const LOCATION_PREFERENCE_TYPES: LocationPreferenceType[] = [
  "specific_city",
  "any_city",
  "capital_or_large_city",
  "medium_city",
  "small_city",
  "student_city",
  "flexible",
];
const LOCATION_PREFERENCE_LABEL_KEYS = {
  specific_city: "locationSpecificCity",
  any_city: "locationAnyCity",
  capital_or_large_city: "locationCapitalOrLargeCity",
  medium_city: "locationMediumCity",
  small_city: "locationSmallCity",
  student_city: "locationStudentCity",
  flexible: "locationFlexible",
} as const satisfies Record<LocationPreferenceType, string>;

const BUDGET_MODES: BudgetMode[] = ["exact", "low", "medium", "high", "unknown"];
const BUDGET_MODE_LABEL_KEYS = {
  exact: "budgetModeExact",
  low: "budgetModeLow",
  medium: "budgetModeMedium",
  high: "budgetModeHigh",
  unknown: "budgetModeUnknown",
} as const satisfies Record<BudgetMode, string>;

const EDUCATION_LEVELS: EducationLevel[] = ["high_school", "bachelor", "master"];
const EDUCATION_LEVEL_LABEL_KEYS = {
  high_school: "educationLevelHighSchool",
  bachelor: "educationLevelBachelor",
  master: "educationLevelMaster",
} as const satisfies Record<EducationLevel, string>;

const ENGLISH_LEVELS: CefrLevel[] = [
  "a1", "a2", "b1", "b2", "c1", "c2", "native", "not_sure",
];
const ENGLISH_LEVEL_LABEL_KEYS = {
  a1: "englishLevelA1",
  a2: "englishLevelA2",
  b1: "englishLevelB1",
  b2: "englishLevelB2",
  c1: "englishLevelC1",
  c2: "englishLevelC2",
  native: "englishLevelNative",
  not_sure: "englishLevelNotSure",
} as const satisfies Record<CefrLevel, string>;

const MATH_BACKGROUNDS: MathBackground[] = [
  "excellent", "good", "average", "weak", "not_sure",
];
const MATH_BACKGROUND_LABEL_KEYS = {
  excellent: "mathBackgroundExcellent",
  good: "mathBackgroundGood",
  average: "mathBackgroundAverage",
  weak: "mathBackgroundWeak",
  not_sure: "mathBackgroundNotSure",
} as const satisfies Record<MathBackground, string>;

const ADMISSION_PREFERENCES: AdmissionPreference[] = [
  "safest", "balanced", "competitive", "no_preference",
];
const ADMISSION_PREFERENCE_LABEL_KEYS = {
  safest: "admissionPreferenceSafest",
  balanced: "admissionPreferenceBalanced",
  competitive: "admissionPreferenceCompetitive",
  no_preference: "admissionPreferenceNoPreference",
} as const satisfies Record<AdmissionPreference, string>;

const CAREER_PRIORITY_CODES = [
  "career_opportunities",
  "academic_reputation",
  "research",
  "internships",
  "employment_after_graduation",
  "international_environment",
  "affordable_education",
  "affordable_living",
  "big_city",
  "student_life",
  "small_class_sizes",
  "practical_education",
  "tech_ecosystem",
  "stay_after_graduation",
] as const;
const CAREER_PRIORITY_LABEL_KEYS = {
  career_opportunities: "careerPriorityCareerOpportunities",
  academic_reputation: "careerPriorityAcademicReputation",
  research: "careerPriorityResearch",
  internships: "careerPriorityInternships",
  employment_after_graduation: "careerPriorityEmployment",
  international_environment: "careerPriorityInternational",
  affordable_education: "careerPriorityAffordableEducation",
  affordable_living: "careerPriorityAffordableLiving",
  big_city: "careerPriorityBigCity",
  student_life: "careerPriorityStudentLife",
  small_class_sizes: "careerPrioritySmallClasses",
  practical_education: "careerPriorityPractical",
  tech_ecosystem: "careerPriorityTechEcosystem",
  stay_after_graduation: "careerPriorityStayAfterGraduation",
} as const satisfies Record<(typeof CAREER_PRIORITY_CODES)[number], string>;

type NmtTaken = "yes" | "no" | "planning" | "other" | "";
const NMT_TAKEN_OPTIONS: Exclude<NmtTaken, "">[] = ["yes", "no", "planning", "other"];
const NMT_TAKEN_LABEL_KEYS = {
  yes: "nmtTakenYes",
  no: "nmtTakenNo",
  planning: "nmtTakenPlanning",
  other: "nmtTakenOther",
} as const satisfies Record<Exclude<NmtTaken, "">, string>;

// ---------------------------------------------------------------------------
// Wizard steps (spec §55 — "Do not create one enormous form. Use steps.")
// ---------------------------------------------------------------------------

const STEP_TITLE_KEYS = [
  "sectionStudyLevel",
  "sectionFieldOfStudy",
  "sectionStudyFormat",
  "sectionCountryLocation",
  "sectionBudget",
  "sectionAcademic",
  "sectionTestsQualifications",
  "sectionEnglish",
  "sectionMath",
  "sectionAdmissionPreference",
  "sectionCareerPriorities",
  "sectionReview",
] as const;
const STEP_COUNT = STEP_TITLE_KEYS.length;
const REVIEW_STEP = STEP_COUNT - 1;

const DRAFT_STORAGE_KEY = "unifind:profile-wizard-draft:v1";

interface FormValues {
  preferred_degree_level: DegreeLevel | "";
  primary_field_of_study_id: string;
  additional_field_of_study_ids: string[];
  preferred_study_format: StudyFormat | "";
  preferred_country_codes: string[];
  location_preference_type: LocationPreferenceType | "";
  preferred_cities: string;
  open_to_other_cities: "yes" | "no" | "";
  budget_mode: BudgetMode;
  budget_min: string;
  budget_max: string;
  budget_currency: string;
  current_education_level: EducationLevel | "";
  current_gpa: string;
  current_gpa_scale: string;
  preferred_language_codes: string[];
  nationality_country_code: string;
  graduation_year: string;
  has_graduated: "yes" | "no" | "";
  nmt_taken: NmtTaken;
  nmt_subject_codes: string[];
  nmt_scores: Record<string, string>;
  qualification_ids: string[];
  qualification_scores: Record<string, string>;
  qualification_years: Record<string, string>;
  english_level: CefrLevel | "";
  english_test_qualification_id: string;
  english_test_score: string;
  math_background: MathBackground | "";
  admission_preference: AdmissionPreference | "";
  career_priorities: string[];
  full_name: string;
}

function buildInitialValues(props: ProfileFormProps): FormValues {
  const p = props.existingProfile;

  const nmtScores: Record<string, string> = {};
  for (const row of props.existingNmtScores) {
    nmtScores[row.subject_code] = String(row.score);
  }

  const qualificationScores: Record<string, string> = {};
  const qualificationYears: Record<string, string> = {};
  for (const row of props.existingQualifications) {
    const details = row.details as { score?: number } | null;
    if (details && typeof details.score === "number") {
      qualificationScores[row.qualification_id] = String(details.score);
    }
    if (row.year != null) {
      qualificationYears[row.qualification_id] = String(row.year);
    }
  }

  // V1 only ever writes one test score through this form (English), so the
  // first row — if any — is that one.
  const englishTest = props.existingTestScores[0] ?? null;

  return {
    preferred_degree_level: p?.preferred_degree_level ?? "",
    primary_field_of_study_id: p?.primary_field_of_study_id ?? "",
    additional_field_of_study_ids: (p?.preferred_field_of_study_ids ?? []).filter(
      (id) => id !== p?.primary_field_of_study_id,
    ),
    preferred_study_format: p?.preferred_study_format ?? "",
    preferred_country_codes: p?.preferred_country_codes ?? [],
    location_preference_type: p?.location_preference_type ?? "",
    preferred_cities: (p?.preferred_cities ?? []).join(", "),
    open_to_other_cities:
      p?.open_to_other_cities === true ? "yes" : p?.open_to_other_cities === false ? "no" : "",
    budget_mode: p?.budget_mode ?? (p?.budget_max != null ? "exact" : "unknown"),
    budget_min: p?.budget_min != null ? String(p.budget_min) : "",
    budget_max: p?.budget_max != null ? String(p.budget_max) : "",
    budget_currency: p?.budget_currency ?? "",
    current_education_level: p?.current_education_level ?? "",
    current_gpa: p?.current_gpa != null ? String(p.current_gpa) : "",
    current_gpa_scale: p?.current_gpa_scale != null ? String(p.current_gpa_scale) : "",
    preferred_language_codes: p?.preferred_language_codes ?? [],
    nationality_country_code: p?.nationality_country_code ?? "",
    graduation_year: p?.graduation_year != null ? String(p.graduation_year) : "",
    has_graduated:
      p?.has_graduated === true ? "yes" : p?.has_graduated === false ? "no" : "",
    nmt_taken: props.existingNmtScores.length > 0 ? "yes" : "",
    nmt_subject_codes: props.existingNmtScores.map((row) => row.subject_code),
    nmt_scores: nmtScores,
    qualification_ids: props.existingQualifications.map((row) => row.qualification_id),
    qualification_scores: qualificationScores,
    qualification_years: qualificationYears,
    english_level: p?.english_level ?? "",
    english_test_qualification_id: englishTest?.qualification_id ?? "",
    english_test_score: englishTest ? englishTest.score_display : "",
    math_background: p?.math_background ?? "",
    admission_preference: p?.admission_preference ?? "",
    career_priorities: p?.career_priorities ?? [],
    full_name: p?.full_name ?? "",
  };
}

function scrollToTop() {
  if (typeof window !== "undefined") {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

export function ProfileForm(props: ProfileFormProps) {
  const {
    locale,
    countries,
    supportedCountries,
    languages,
    fieldsOfStudy,
    nmtSubjects,
    qualifications,
    existingProfile,
  } = props;

  const t = useTranslations("Onboarding");
  const action = submitProfileFormAction.bind(null, locale);
  const [state, formAction, pending] = useActionState(action, initialProfileFormActionState);
  const formRef = useRef<HTMLFormElement>(null);

  const hasExistingProfile = existingProfile != null;
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<FormValues>(() => buildInitialValues(props));
  const [fieldSearch, setFieldSearch] = useState("");

  // Resume an in-progress draft (spec §55: "Persist progress locally").
  // Server-side data always wins over a stale local draft — an existing
  // profile means the user already finished the questionnaire once, so
  // there's nothing to "resume". This is a one-time sync from an external
  // system (localStorage) on mount, which is exactly the case an effect is
  // for — the setState calls below are intentional, not derived state that
  // belongs in render.
  useEffect(() => {
    if (hasExistingProfile) {
      try {
        window.localStorage.removeItem(DRAFT_STORAGE_KEY);
      } catch {
        // Storage may be unavailable (private browsing, quota) — non-fatal.
      }
      return;
    }
    try {
      const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { step?: number; values?: Partial<FormValues> };
        if (parsed.values) {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setValues((current) => ({ ...current, ...parsed.values }));
        }
        if (typeof parsed.step === "number") {
          setStep(Math.min(Math.max(parsed.step, 0), REVIEW_STEP));
        }
      }
    } catch {
      // Corrupt draft — ignore and start fresh.
    }
    // Only ever run once, on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist on every change, skipping the very first run — at that point
  // `values`/`step` are still last render's data (the draft-loading effect
  // above, if it has anything to restore, applies asynchronously and
  // re-triggers this effect on the next render with the restored data), so
  // writing here would just overwrite a freshly-restored draft with stale
  // defaults.
  const skippedFirstPersistRef = useRef(false);
  useEffect(() => {
    if (!skippedFirstPersistRef.current) {
      skippedFirstPersistRef.current = true;
      return;
    }
    if (hasExistingProfile) return;
    try {
      window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({ step, values }));
    } catch {
      // Non-fatal — the wizard still works without persistence.
    }
  }, [step, values, hasExistingProfile]);

  function setField<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function toggleArrayValue(key: keyof FormValues, value: string, checked: boolean) {
    setValues((current) => {
      const list = current[key] as string[];
      const next = checked ? [...list, value] : list.filter((item) => item !== value);
      return { ...current, [key]: next };
    });
  }

  function goNext() {
    setStep((current) => Math.min(current + 1, REVIEW_STEP));
    scrollToTop();
  }
  function goBack() {
    setStep((current) => Math.max(current - 1, 0));
    scrollToTop();
  }
  function goToStep(target: number) {
    setStep(target);
    scrollToTop();
  }

  const additionalFieldOptions = useMemo(
    () => fieldsOfStudy.filter((field) => field.id !== values.primary_field_of_study_id),
    [fieldsOfStudy, values.primary_field_of_study_id],
  );
  const filteredAdditionalFieldOptions = useMemo(() => {
    const query = fieldSearch.trim().toLowerCase();
    if (!query) return additionalFieldOptions;
    return additionalFieldOptions.filter(
      (field) =>
        field.name.toLowerCase().includes(query) ||
        field.category.toLowerCase().includes(query) ||
        field.subcategory?.toLowerCase().includes(query),
    );
  }, [additionalFieldOptions, fieldSearch]);

  const primaryFieldName = useMemo(
    () => fieldsOfStudy.find((field) => field.id === values.primary_field_of_study_id)?.name,
    [fieldsOfStudy, values.primary_field_of_study_id],
  );

  // §21 — "other qualifications" excludes NMT (its own dedicated question)
  // and language tests (asked as part of the English step, §22).
  const otherQualifications = useMemo(
    () => qualifications.filter((q) => q.code !== "nmt" && q.category !== "language"),
    [qualifications],
  );
  // §22 — English proficiency test types.
  const englishTestQualifications = useMemo(
    () => qualifications.filter((q) => q.category === "language" && q.code !== "cefr"),
    [qualifications],
  );
  const selectedEnglishTestQualification = englishTestQualifications.find(
    (q) => q.id === values.english_test_qualification_id,
  );

  const progressPercent = Math.round(((step + 1) / STEP_COUNT) * 100);

  return (
    <form ref={formRef} action={formAction} className="max-w-2xl space-y-8">
      {/* Step header (spec §9 visual reference: back arrow + centered
          "STEP X OF Y" label above a thin progress bar) + progress
          (spec §55: "Show progress" / "Allow Back"). Back moved up here
          from the old bottom Back/Continue pair so the footer below can
          be a single full-width CTA, matching the mockup's structure —
          the underlying `goBack`/`goNext` logic is unchanged. */}
      <div className="space-y-2" aria-live="polite">
        <div className="flex items-center justify-between">
          {step > 0 ? (
            <button
              type="button"
              onClick={goBack}
              aria-label={t("wizardBack")}
              className="text-primary hover:bg-surface-container-low transition-colors p-2 -ml-2 rounded-full active:scale-95"
            >
              <span className="material-symbols-outlined" aria-hidden="true">
                arrow_back
              </span>
            </button>
          ) : (
            <span className="w-9" aria-hidden="true" />
          )}
          <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wide">
            {t("wizardStepLabel", { current: step + 1, total: STEP_COUNT })}
          </span>
          <span className="w-9" aria-hidden="true" />
        </div>
        <div className="h-1.5 w-full rounded-full bg-surface-container overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Step 0 — §10 Study level */}
      <fieldset className={step === 0 ? "space-y-4" : "hidden"}>
        <legend className="font-headline-sm text-headline-sm text-primary mb-2">
          {t("sectionStudyLevel")}
        </legend>
        <div className="space-y-1">
          <label htmlFor="preferred_degree_level" className={formLabelClassName}>
            {t("studyLevelLabel")}
          </label>
          <select
            id="preferred_degree_level"
            name="preferred_degree_level"
            value={values.preferred_degree_level}
            onChange={(event) =>
              setField("preferred_degree_level", event.target.value as DegreeLevel | "")
            }
            className={formSelectClassName}
          >
            <option value="">{t("selectPlaceholder")}</option>
            <option value="bachelor">{t("studyLevelBachelor")}</option>
            <option value="master">{t("studyLevelMaster")}</option>
          </select>
        </div>
      </fieldset>

      {/* Step 1 — §11 Field of study */}
      <fieldset className={step === 1 ? "space-y-4" : "hidden"}>
        <legend className="font-headline-sm text-headline-sm text-primary mb-2">
          {t("sectionFieldOfStudy")}
        </legend>

        <div className="space-y-1">
          <label htmlFor="primary_field_of_study_id" className={formLabelClassName}>
            {t("primaryFieldLabel")}
          </label>
          <select
            id="primary_field_of_study_id"
            name="primary_field_of_study_id"
            value={values.primary_field_of_study_id}
            onChange={(event) => setField("primary_field_of_study_id", event.target.value)}
            className={formSelectClassName}
          >
            <option value="">{t("selectPlaceholder")}</option>
            {fieldsOfStudy.map((field) => (
              <option key={field.id} value={field.id}>
                {field.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label htmlFor="field_search" className={formLabelClassName}>
            {t("additionalFieldsLabel")}
          </label>
          <input
            id="field_search"
            type="text"
            value={fieldSearch}
            onChange={(event) => setFieldSearch(event.target.value)}
            placeholder={t("fieldSearchPlaceholder")}
            className={formInputClassName}
          />
          <select
            id="additional_field_of_study_ids"
            name="additional_field_of_study_ids"
            multiple
            value={values.additional_field_of_study_ids}
            onChange={(event) =>
              setField(
                "additional_field_of_study_ids",
                Array.from(event.target.selectedOptions).map((option) => option.value),
              )
            }
            className={formMultiSelectClassName}
          >
            {filteredAdditionalFieldOptions.map((field) => (
              <option key={field.id} value={field.id}>
                {field.name}
              </option>
            ))}
          </select>
          {filteredAdditionalFieldOptions.length === 0 && (
            <p className={formHelperTextClassName}>{t("fieldSearchNoResults")}</p>
          )}
        </div>
      </fieldset>

      {/* Step 2 — §12 Study format */}
      <fieldset className={step === 2 ? "space-y-4" : "hidden"}>
        <legend className="font-headline-sm text-headline-sm text-primary mb-2">
          {t("sectionStudyFormat")}
        </legend>
        <div className="space-y-1">
          <span className={formLabelClassName}>{t("studyFormatLabel")}</span>
          <div className="flex flex-wrap gap-4 pt-2">
            {(["full_time", "part_time", "either"] as const).map((format) => (
              <label key={format} className={formRadioOptionClassName}>
                <input
                  type="radio"
                  name="preferred_study_format"
                  value={format}
                  checked={values.preferred_study_format === format}
                  onChange={() => setField("preferred_study_format", format)}
                />
                {t(
                  format === "full_time"
                    ? "studyFormatFullTime"
                    : format === "part_time"
                      ? "studyFormatPartTime"
                      : "studyFormatEither",
                )}
              </label>
            ))}
          </div>
        </div>
      </fieldset>

      {/* Step 3 — §13–14 Country & location preferences */}
      <fieldset className={step === 3 ? "space-y-4" : "hidden"}>
        <legend className="font-headline-sm text-headline-sm text-primary mb-2">
          {t("sectionCountryLocation")}
        </legend>

        <div className="space-y-1">
          <label className={formLabelClassName}>{t("countriesLabel")}</label>
          {/*
            Card-grid multi-select (spec §9 visual reference:
            `unifind_personalized_matching_test`, "Where would you like to
            study?"). Real data note: only Czechia is `supported = true`
            today (0008's seed), so this often renders as a one-tile grid
            rather than the mockup's five — the layout is built to degrade
            to that honestly rather than assuming five countries exist.
            Submits the same way the old `<select multiple>` did: repeated
            `preferred_country_codes` checkboxes, read via
            `formData.getAll` server-side.
          */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3" role="group" aria-label={t("countriesLabel")}>
            {supportedCountries.map((country) => {
              const checked = values.preferred_country_codes.includes(country.code);
              return (
                <label
                  key={country.code}
                  className={checked ? formTileOptionSelectedClassName : formTileOptionClassName}
                >
                  <input
                    type="checkbox"
                    name="preferred_country_codes"
                    value={country.code}
                    checked={checked}
                    onChange={(event) =>
                      toggleArrayValue(
                        "preferred_country_codes",
                        country.code,
                        event.target.checked,
                      )
                    }
                    className="sr-only"
                  />
                  {checked && (
                    <span
                      className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-on-primary"
                      aria-hidden="true"
                    >
                      <span className="material-symbols-outlined text-[14px]">check</span>
                    </span>
                  )}
                  <span className="font-label-caps text-label-caps text-on-surface-variant">
                    {country.code}
                  </span>
                  <span className="font-headline-sm text-headline-sm text-primary">
                    {country.name}
                  </span>
                </label>
              );
            })}
          </div>
          <p className={formHelperTextClassName}>{t("countriesComingSoonNote")}</p>
        </div>

        <div className="space-y-1">
          <label htmlFor="location_preference_type" className={formLabelClassName}>
            {t("locationPreferenceLabel")}
          </label>
          <select
            id="location_preference_type"
            name="location_preference_type"
            value={values.location_preference_type}
            onChange={(event) =>
              setField(
                "location_preference_type",
                event.target.value as LocationPreferenceType | "",
              )
            }
            className={formSelectClassName}
          >
            <option value="">{t("selectPlaceholder")}</option>
            {LOCATION_PREFERENCE_TYPES.map((type) => (
              <option key={type} value={type}>
                {t(LOCATION_PREFERENCE_LABEL_KEYS[type])}
              </option>
            ))}
          </select>
        </div>

        {values.location_preference_type === "specific_city" && (
          <div className="space-y-1">
            <label htmlFor="preferred_cities" className={formLabelClassName}>
              {t("citiesLabel")}
            </label>
            <input
              id="preferred_cities"
              name="preferred_cities"
              type="text"
              placeholder={t("citiesPlaceholder")}
              value={values.preferred_cities}
              onChange={(event) => setField("preferred_cities", event.target.value)}
              className={formInputClassName}
            />
          </div>
        )}

        <div className="space-y-1">
          <span className={formLabelClassName}>{t("openToOtherCitiesLabel")}</span>
          <div className="flex flex-wrap gap-4 pt-2">
            {(["yes", "no"] as const).map((answer) => (
              <label key={answer} className={formRadioOptionClassName}>
                <input
                  type="radio"
                  name="open_to_other_cities"
                  value={answer}
                  checked={values.open_to_other_cities === answer}
                  onChange={() => setField("open_to_other_cities", answer)}
                />
                {t(answer === "yes" ? "openToOtherCitiesYes" : "openToOtherCitiesNo")}
              </label>
            ))}
          </div>
        </div>
      </fieldset>

      {/* Step 4 — §15–16 Budget */}
      <fieldset className={step === 4 ? "space-y-4" : "hidden"}>
        <legend className="font-headline-sm text-headline-sm text-primary mb-2">
          {t("sectionBudget")}
        </legend>

        <div className="space-y-1">
          <label htmlFor="budget_mode" className={formLabelClassName}>
            {t("budgetModeLabel")}
          </label>
          <select
            id="budget_mode"
            name="budget_mode"
            value={values.budget_mode}
            onChange={(event) => setField("budget_mode", event.target.value as BudgetMode)}
            className={formSelectClassName}
          >
            {BUDGET_MODES.map((mode) => (
              <option key={mode} value={mode}>
                {t(BUDGET_MODE_LABEL_KEYS[mode])}
              </option>
            ))}
          </select>
        </div>

        {values.budget_mode === "exact" && (
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <label htmlFor="budget_min" className={formLabelClassName}>
                {t("budgetMinLabel")}
              </label>
              <input
                id="budget_min"
                name="budget_min"
                type="number"
                min="0"
                value={values.budget_min}
                onChange={(event) => setField("budget_min", event.target.value)}
                className={formInputClassName}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="budget_max" className={formLabelClassName}>
                {t("budgetMaxLabel")}
              </label>
              <input
                id="budget_max"
                name="budget_max"
                type="number"
                min="0"
                value={values.budget_max}
                onChange={(event) => setField("budget_max", event.target.value)}
                className={formInputClassName}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="budget_currency" className={formLabelClassName}>
                {t("budgetCurrencyLabel")}
              </label>
              <input
                id="budget_currency"
                name="budget_currency"
                type="text"
                maxLength={3}
                placeholder="EUR"
                value={values.budget_currency}
                onChange={(event) => setField("budget_currency", event.target.value)}
                className={`${formInputClassName} uppercase`}
              />
            </div>
          </div>
        )}

        <p className={formHelperTextClassName}>{t("budgetTotalCostNote")}</p>
      </fieldset>

      {/* Step 5 — §19 Academic background */}
      <fieldset className={step === 5 ? "space-y-4" : "hidden"}>
        <legend className="font-headline-sm text-headline-sm text-primary mb-2">
          {t("sectionAcademic")}
        </legend>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label htmlFor="current_gpa" className={formLabelClassName}>
              {t("gpaLabel")}
            </label>
            <input
              id="current_gpa"
              name="current_gpa"
              type="number"
              step="0.01"
              min="0"
              value={values.current_gpa}
              onChange={(event) => setField("current_gpa", event.target.value)}
              className={formInputClassName}
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="current_gpa_scale" className={formLabelClassName}>
              {t("gpaScaleLabel")}
            </label>
            <input
              id="current_gpa_scale"
              name="current_gpa_scale"
              type="number"
              step="0.01"
              min="0"
              placeholder="4.0"
              value={values.current_gpa_scale}
              onChange={(event) => setField("current_gpa_scale", event.target.value)}
              className={formInputClassName}
            />
          </div>
        </div>

        <div className="space-y-1">
          <label htmlFor="current_education_level" className={formLabelClassName}>
            {t("educationLevelLabel")}
          </label>
          <select
            id="current_education_level"
            name="current_education_level"
            value={values.current_education_level}
            onChange={(event) =>
              setField("current_education_level", event.target.value as EducationLevel | "")
            }
            className={formSelectClassName}
          >
            <option value="">{t("selectPlaceholder")}</option>
            {EDUCATION_LEVELS.map((level) => (
              <option key={level} value={level}>
                {t(EDUCATION_LEVEL_LABEL_KEYS[level])}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label htmlFor="preferred_language_codes" className={formLabelClassName}>
            {t("languagesLabel")}
          </label>
          <select
            id="preferred_language_codes"
            name="preferred_language_codes"
            multiple
            value={values.preferred_language_codes}
            onChange={(event) =>
              setField(
                "preferred_language_codes",
                Array.from(event.target.selectedOptions).map((option) => option.value),
              )
            }
            className={formMultiSelectClassName}
          >
            {languages.map((language) => (
              <option key={language.code} value={language.code}>
                {language.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label htmlFor="nationality_country_code" className={formLabelClassName}>
            {t("nationalityLabel")}
          </label>
          <select
            id="nationality_country_code"
            name="nationality_country_code"
            value={values.nationality_country_code}
            onChange={(event) => setField("nationality_country_code", event.target.value)}
            className={formSelectClassName}
          >
            <option value="">{t("selectPlaceholder")}</option>
            {countries.map((country) => (
              <option key={country.code} value={country.code}>
                {country.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label htmlFor="graduation_year" className={formLabelClassName}>
              {t("graduationYearLabel")}
            </label>
            <input
              id="graduation_year"
              name="graduation_year"
              type="number"
              min="1950"
              max="2100"
              placeholder="e.g. 2026"
              value={values.graduation_year}
              onChange={(event) => setField("graduation_year", event.target.value)}
              className={formInputClassName}
            />
          </div>
          <div className="space-y-1">
            <span className={formLabelClassName}>{t("hasGraduatedLabel")}</span>
            <div className="flex flex-wrap gap-4 pt-2">
              {(["yes", "no"] as const).map((answer) => (
                <label key={answer} className={formRadioOptionClassName}>
                  <input
                    type="radio"
                    name="has_graduated"
                    value={answer}
                    checked={values.has_graduated === answer}
                    onChange={() => setField("has_graduated", answer)}
                  />
                  {t(answer === "yes" ? "hasGraduatedYes" : "hasGraduatedNo")}
                </label>
              ))}
            </div>
          </div>
        </div>
      </fieldset>

      {/* Step 6 — §20–21 Tests & qualifications */}
      <fieldset className={step === 6 ? "space-y-6" : "hidden"}>
        <legend className="font-headline-sm text-headline-sm text-primary mb-2">
          {t("sectionTestsQualifications")}
        </legend>

        {/* §20 NMT — conditional flow */}
        <div className="space-y-3">
          <label htmlFor="nmt_taken" className={formLabelClassName}>
            {t("nmtTakenLabel")}
          </label>
          <select
            id="nmt_taken"
            name="nmt_taken"
            value={values.nmt_taken}
            onChange={(event) => setField("nmt_taken", event.target.value as NmtTaken)}
            className={formSelectClassName}
          >
            <option value="">{t("selectPlaceholder")}</option>
            {NMT_TAKEN_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {t(NMT_TAKEN_LABEL_KEYS[option])}
              </option>
            ))}
          </select>

          {values.nmt_taken === "yes" && (
            <div className="space-y-3 rounded-lg border border-outline-variant/40 p-4">
              <span className={formLabelClassName}>{t("nmtSubjectsLabel")}</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {nmtSubjects.map((subject) => {
                  const checked = values.nmt_subject_codes.includes(subject.code);
                  return (
                    <div key={subject.code} className="space-y-1">
                      <label className={formCheckboxOptionClassName}>
                        <input
                          type="checkbox"
                          name="nmt_subject_codes"
                          value={subject.code}
                          checked={checked}
                          onChange={(event) =>
                            toggleArrayValue(
                              "nmt_subject_codes",
                              subject.code,
                              event.target.checked,
                            )
                          }
                        />
                        {subject.name}
                      </label>
                      {checked && (
                        <input
                          type="number"
                          min="0"
                          max="200"
                          name={`nmt_score__${subject.code}`}
                          placeholder={t("nmtScoreLabel")}
                          value={values.nmt_scores[subject.code] ?? ""}
                          onChange={(event) =>
                            setValues((current) => ({
                              ...current,
                              nmt_scores: {
                                ...current.nmt_scores,
                                [subject.code]: event.target.value,
                              },
                            }))
                          }
                          className={formInputClassName}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* §21 Other qualifications */}
        <div className="space-y-3">
          <span className={formLabelClassName}>{t("otherQualificationsLabel")}</span>
          <p className={formHelperTextClassName}>{t("otherQualificationsHelp")}</p>
          <div className="space-y-3">
            {otherQualifications.map((qualification) => {
              const checked = values.qualification_ids.includes(qualification.id);
              return (
                <div
                  key={qualification.id}
                  className="rounded-lg border border-outline-variant/40 p-4 space-y-2"
                >
                  <label className={formCheckboxOptionClassName}>
                    <input
                      type="checkbox"
                      name="qualification_ids"
                      value={qualification.id}
                      checked={checked}
                      onChange={(event) =>
                        toggleArrayValue("qualification_ids", qualification.id, event.target.checked)
                      }
                    />
                    {qualification.name}
                  </label>
                  {checked && (
                    <div className="grid grid-cols-2 gap-3 pl-6">
                      <div className="space-y-1">
                        <label className={formLabelClassName}>
                          {t("qualificationScoreLabel")}
                          {qualification.max_score != null ? ` (0–${qualification.max_score})` : ""}
                        </label>
                        <input
                          type="number"
                          min="0"
                          max={qualification.max_score ?? undefined}
                          name={`qualification_score__${qualification.id}`}
                          value={values.qualification_scores[qualification.id] ?? ""}
                          onChange={(event) =>
                            setValues((current) => ({
                              ...current,
                              qualification_scores: {
                                ...current.qualification_scores,
                                [qualification.id]: event.target.value,
                              },
                            }))
                          }
                          className={formInputClassName}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className={formLabelClassName}>{t("qualificationYearLabel")}</label>
                        <input
                          type="number"
                          min="1950"
                          max="2100"
                          name={`qualification_year__${qualification.id}`}
                          value={values.qualification_years[qualification.id] ?? ""}
                          onChange={(event) =>
                            setValues((current) => ({
                              ...current,
                              qualification_years: {
                                ...current.qualification_years,
                                [qualification.id]: event.target.value,
                              },
                            }))
                          }
                          className={formInputClassName}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </fieldset>

      {/* Step 7 — §22 English proficiency */}
      <fieldset className={step === 7 ? "space-y-4" : "hidden"}>
        <legend className="font-headline-sm text-headline-sm text-primary mb-2">
          {t("sectionEnglish")}
        </legend>
        <div className="space-y-1">
          <label htmlFor="english_level" className={formLabelClassName}>
            {t("englishLevelLabel")}
          </label>
          <select
            id="english_level"
            name="english_level"
            value={values.english_level}
            onChange={(event) => setField("english_level", event.target.value as CefrLevel | "")}
            className={formSelectClassName}
          >
            <option value="">{t("selectPlaceholder")}</option>
            {ENGLISH_LEVELS.map((level) => (
              <option key={level} value={level}>
                {t(ENGLISH_LEVEL_LABEL_KEYS[level])}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label htmlFor="english_test_qualification_id" className={formLabelClassName}>
            {t("englishTestTakenLabel")}
          </label>
          <select
            id="english_test_qualification_id"
            name="english_test_qualification_id"
            value={values.english_test_qualification_id}
            onChange={(event) =>
              setField("english_test_qualification_id", event.target.value)
            }
            className={formSelectClassName}
          >
            <option value="">{t("englishTestNoneOption")}</option>
            {englishTestQualifications.map((qualification) => (
              <option key={qualification.id} value={qualification.id}>
                {qualification.name}
              </option>
            ))}
          </select>
        </div>

        {values.english_test_qualification_id && (
          <div className="space-y-1">
            <label htmlFor="english_test_score" className={formLabelClassName}>
              {t("englishTestScoreLabel")}
              {selectedEnglishTestQualification?.max_score != null
                ? ` (0–${selectedEnglishTestQualification.max_score})`
                : ""}
            </label>
            <input
              id="english_test_score"
              name="english_test_score"
              type="number"
              step="0.5"
              min="0"
              max={selectedEnglishTestQualification?.max_score ?? undefined}
              value={values.english_test_score}
              onChange={(event) => setField("english_test_score", event.target.value)}
              className={formInputClassName}
            />
          </div>
        )}
      </fieldset>

      {/* Step 8 — §23 Mathematics background */}
      <fieldset className={step === 8 ? "space-y-4" : "hidden"}>
        <legend className="font-headline-sm text-headline-sm text-primary mb-2">
          {t("sectionMath")}
        </legend>
        <div className="space-y-1">
          <label htmlFor="math_background" className={formLabelClassName}>
            {t("mathBackgroundLabel")}
          </label>
          <select
            id="math_background"
            name="math_background"
            value={values.math_background}
            onChange={(event) =>
              setField("math_background", event.target.value as MathBackground | "")
            }
            className={formSelectClassName}
          >
            <option value="">{t("selectPlaceholder")}</option>
            {MATH_BACKGROUNDS.map((level) => (
              <option key={level} value={level}>
                {t(MATH_BACKGROUND_LABEL_KEYS[level])}
              </option>
            ))}
          </select>
        </div>
      </fieldset>

      {/* Step 9 — §24 Admission preferences */}
      <fieldset className={step === 9 ? "space-y-4" : "hidden"}>
        <legend className="font-headline-sm text-headline-sm text-primary mb-2">
          {t("sectionAdmissionPreference")}
        </legend>
        <div className="space-y-1">
          <label htmlFor="admission_preference" className={formLabelClassName}>
            {t("admissionPreferenceLabel")}
          </label>
          <select
            id="admission_preference"
            name="admission_preference"
            value={values.admission_preference}
            onChange={(event) =>
              setField("admission_preference", event.target.value as AdmissionPreference | "")
            }
            className={formSelectClassName}
          >
            <option value="">{t("selectPlaceholder")}</option>
            {ADMISSION_PREFERENCES.map((pref) => (
              <option key={pref} value={pref}>
                {t(ADMISSION_PREFERENCE_LABEL_KEYS[pref])}
              </option>
            ))}
          </select>
        </div>
      </fieldset>

      {/* Step 10 — §25 Career priorities */}
      <fieldset className={step === 10 ? "space-y-4" : "hidden"}>
        <legend className="font-headline-sm text-headline-sm text-primary mb-2">
          {t("sectionCareerPriorities")}
        </legend>
        <div className="space-y-1">
          <span className={formLabelClassName}>{t("careerPrioritiesLabel")}</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
            {CAREER_PRIORITY_CODES.map((code) => (
              <label key={code} className={formCheckboxOptionClassName}>
                <input
                  type="checkbox"
                  name="career_priorities"
                  value={code}
                  checked={values.career_priorities.includes(code)}
                  onChange={(event) =>
                    toggleArrayValue("career_priorities", code, event.target.checked)
                  }
                />
                {t(CAREER_PRIORITY_LABEL_KEYS[code])}
              </label>
            ))}
          </div>
        </div>
      </fieldset>

      {/* Step 11 — §57 Review */}
      <div className={step === REVIEW_STEP ? "space-y-6" : "hidden"}>
        <div className="space-y-1">
          <h2 className="font-headline-sm text-headline-sm text-primary">
            {t("sectionReview")}
          </h2>
          <p className={formHelperTextClassName}>{t("reviewIntro")}</p>
        </div>

        <div className="space-y-1">
          <label htmlFor="full_name" className={formLabelClassName}>
            {t("nameLabel")}
          </label>
          <input
            id="full_name"
            name="full_name"
            type="text"
            value={values.full_name}
            onChange={(event) => setField("full_name", event.target.value)}
            className={formInputClassName}
          />
        </div>

        <dl className="divide-y divide-outline-variant/40 rounded-lg border border-outline-variant/40 overflow-hidden">
          <ReviewRow
            label={t("sectionStudyLevel")}
            value={
              values.preferred_degree_level
                ? t(
                    values.preferred_degree_level === "bachelor"
                      ? "studyLevelBachelor"
                      : "studyLevelMaster",
                  )
                : null
            }
            onEdit={() => goToStep(0)}
            editLabel={t("reviewEdit")}
            emptyLabel={t("reviewNotProvided")}
          />
          <ReviewRow
            label={t("sectionFieldOfStudy")}
            value={primaryFieldName ?? null}
            onEdit={() => goToStep(1)}
            editLabel={t("reviewEdit")}
            emptyLabel={t("reviewNotProvided")}
          />
          <ReviewRow
            label={t("sectionStudyFormat")}
            value={
              values.preferred_study_format
                ? t(
                    values.preferred_study_format === "full_time"
                      ? "studyFormatFullTime"
                      : values.preferred_study_format === "part_time"
                        ? "studyFormatPartTime"
                        : "studyFormatEither",
                  )
                : null
            }
            onEdit={() => goToStep(2)}
            editLabel={t("reviewEdit")}
            emptyLabel={t("reviewNotProvided")}
          />
          <ReviewRow
            label={t("sectionCountryLocation")}
            value={
              [
                supportedCountries
                  .filter((country) => values.preferred_country_codes.includes(country.code))
                  .map((country) => country.name)
                  .join(", "),
                values.location_preference_type
                  ? t(LOCATION_PREFERENCE_LABEL_KEYS[values.location_preference_type])
                  : "",
              ]
                .filter(Boolean)
                .join(" — ") || null
            }
            onEdit={() => goToStep(3)}
            editLabel={t("reviewEdit")}
            emptyLabel={t("reviewNotProvided")}
          />
          <ReviewRow
            label={t("sectionBudget")}
            value={
              values.budget_mode === "exact" && values.budget_max
                ? `${values.budget_min ? `${values.budget_min}–` : ""}${values.budget_max} ${values.budget_currency || ""}`.trim()
                : t(BUDGET_MODE_LABEL_KEYS[values.budget_mode])
            }
            onEdit={() => goToStep(4)}
            editLabel={t("reviewEdit")}
            emptyLabel={t("reviewNotProvided")}
          />
          <ReviewRow
            label={t("sectionAcademic")}
            value={
              [
                values.current_gpa && values.current_gpa_scale
                  ? `${t("gpaLabel")}: ${values.current_gpa}/${values.current_gpa_scale}`
                  : "",
                values.current_education_level
                  ? t(EDUCATION_LEVEL_LABEL_KEYS[values.current_education_level])
                  : "",
              ]
                .filter(Boolean)
                .join(" · ") || null
            }
            onEdit={() => goToStep(5)}
            editLabel={t("reviewEdit")}
            emptyLabel={t("reviewNotProvided")}
          />
          <ReviewRow
            label={t("sectionTestsQualifications")}
            value={
              [
                values.nmt_subject_codes.length > 0
                  ? `NMT: ${values.nmt_subject_codes.length}`
                  : "",
                values.qualification_ids.length > 0
                  ? `${otherQualifications
                      .filter((q) => values.qualification_ids.includes(q.id))
                      .map((q) => q.name)
                      .join(", ")}`
                  : "",
              ]
                .filter(Boolean)
                .join(" · ") || null
            }
            onEdit={() => goToStep(6)}
            editLabel={t("reviewEdit")}
            emptyLabel={t("reviewNotProvided")}
          />
          <ReviewRow
            label={t("sectionEnglish")}
            value={
              [
                values.english_level ? t(ENGLISH_LEVEL_LABEL_KEYS[values.english_level]) : "",
                selectedEnglishTestQualification && values.english_test_score
                  ? `${selectedEnglishTestQualification.name} ${values.english_test_score}`
                  : "",
              ]
                .filter(Boolean)
                .join(" · ") || null
            }
            onEdit={() => goToStep(7)}
            editLabel={t("reviewEdit")}
            emptyLabel={t("reviewNotProvided")}
          />
          <ReviewRow
            label={t("sectionMath")}
            value={
              values.math_background ? t(MATH_BACKGROUND_LABEL_KEYS[values.math_background]) : null
            }
            onEdit={() => goToStep(8)}
            editLabel={t("reviewEdit")}
            emptyLabel={t("reviewNotProvided")}
          />
          <ReviewRow
            label={t("sectionAdmissionPreference")}
            value={
              values.admission_preference
                ? t(ADMISSION_PREFERENCE_LABEL_KEYS[values.admission_preference])
                : null
            }
            onEdit={() => goToStep(9)}
            editLabel={t("reviewEdit")}
            emptyLabel={t("reviewNotProvided")}
          />
          <ReviewRow
            label={t("sectionCareerPriorities")}
            value={
              values.career_priorities.length > 0
                ? values.career_priorities
                    .map((code) =>
                      t(CAREER_PRIORITY_LABEL_KEYS[code as (typeof CAREER_PRIORITY_CODES)[number]]),
                    )
                    .join(", ")
                : null
            }
            onEdit={() => goToStep(10)}
            editLabel={t("reviewEdit")}
            emptyLabel={t("reviewNotProvided")}
          />
        </dl>
      </div>

      {state.error && (
        <p role="alert" className="font-body-sm text-body-sm text-error">
          {state.error}
        </p>
      )}

      {/* Primary action (spec §55: back is now the header's arrow button
          above; this is a single full-width CTA, matching the mockup's
          "Continue →" footer treatment). */}
      <div className="pt-2">
        {step < REVIEW_STEP ? (
          <button
            type="button"
            onClick={goNext}
            className={`${formPrimaryButtonClassName} w-full flex items-center justify-center gap-2`}
          >
            {t("wizardNext")}
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
              arrow_forward
            </span>
          </button>
        ) : (
          <button
            type="submit"
            disabled={pending}
            className={`${formPrimaryButtonClassName} w-full flex items-center justify-center gap-2`}
          >
            {pending ? t("submitPending") : t("submit")}
          </button>
        )}
      </div>
    </form>
  );
}

function ReviewRow({
  label,
  value,
  onEdit,
  editLabel,
  emptyLabel,
}: {
  label: string;
  value: string | null;
  onEdit: () => void;
  editLabel: string;
  emptyLabel: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 p-4">
      <div className="space-y-0.5">
        <dt className={formLabelClassName}>{label}</dt>
        <dd className="font-body-sm text-body-sm text-on-surface">{value || emptyLabel}</dd>
      </div>
      <button
        type="button"
        onClick={onEdit}
        className="font-label-caps text-label-caps text-primary uppercase tracking-wide shrink-0 hover:underline"
      >
        {editLabel}
      </button>
    </div>
  );
}
