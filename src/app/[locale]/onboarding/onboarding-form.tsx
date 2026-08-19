"use client";

import { useActionState, useState } from "react";
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
type EducationStage = Database["public"]["Enums"]["education_stage"];

type StepId =
  | "residence"
  | "countries"
  | "stage"
  | "startYear"
  | "field"
  | "language"
  | "proficiency"
  | "exam"
  | "subjects"
  | "budget"
  | "requirements";

interface OnboardingFormProps {
  locale: string;
  countries: CountryRow[];
  languages: LanguageRow[];
  fieldsOfStudy: FieldOfStudyRow[];
  existingProfile: {
    profile: Database["public"]["Tables"]["user_profiles"]["Row"] | null;
    nmtScores: Database["public"]["Tables"]["user_nmt_scores"]["Row"][];
    languageProficiency: Database["public"]["Tables"]["user_language_proficiency"]["Row"][];
    subjectStrengths: Database["public"]["Tables"]["user_subject_strengths"]["Row"][];
  } | null;
}

const STEP_TITLES: Record<StepId, string> = {
  residence: "step1Title",
  countries: "step2Title",
  stage: "step3Title",
  startYear: "step4Title",
  field: "step5Title",
  language: "step6Title",
  proficiency: "step7Title",
  exam: "step8Title",
  subjects: "step9Title",
  budget: "step10Title",
  requirements: "step11Title",
};

const STEP_SUBTITLES: Record<StepId, string> = {
  residence: "step1Subtitle",
  countries: "step2Subtitle",
  stage: "step3Subtitle",
  startYear: "step4Subtitle",
  field: "step5Subtitle",
  language: "step6Subtitle",
  proficiency: "step7Subtitle",
  exam: "step8Subtitle",
  subjects: "step9Subtitle",
  budget: "step10Subtitle",
  requirements: "step11Subtitle",
};

const STAGE_OPTIONS: { value: EducationStage; labelKey: string }[] = [
  { value: "grade_9", labelKey: "stageGrade9" },
  { value: "grade_10", labelKey: "stageGrade10" },
  { value: "grade_11", labelKey: "stageGrade11" },
  { value: "finished_school", labelKey: "stageFinishedSchool" },
  { value: "college", labelKey: "stageCollege" },
  { value: "other", labelKey: "stageOther" },
];

const START_YEAR_OPTIONS: { value: string; labelKey: string }[] = [
  { value: "2026", labelKey: "startYear2026" },
  { value: "2027", labelKey: "startYear2027" },
  { value: "2028", labelKey: "startYear2028" },
  { value: "later", labelKey: "startYearLater" },
  { value: "unknown", labelKey: "startYearUnknown" },
];

const BUDGET_OPTIONS: { value: string; labelKey: string; hintKey?: string }[] = [
  { value: "low", labelKey: "tuitionLow", hintKey: "tuitionLowHint" },
  { value: "medium", labelKey: "tuitionMedium", hintKey: "tuitionMediumHint" },
  { value: "high", labelKey: "tuitionHigh", hintKey: "tuitionHighHint" },
  { value: "unknown", labelKey: "budgetUnknown" },
];

const LIVING_COST_OPTIONS: { value: string; labelKey: string; hintKey?: string }[] = [
  { value: "low", labelKey: "tuitionLow", hintKey: "livingLowHint" },
  { value: "medium", labelKey: "tuitionMedium", hintKey: "livingMediumHint" },
  { value: "high", labelKey: "tuitionHigh", hintKey: "livingHighHint" },
  { value: "unknown", labelKey: "budgetUnknown" },
];

const REQUIREMENT_OPTIONS: { value: string; labelKey: string }[] = [
  { value: "scholarship", labelKey: "reqScholarship" },
  { value: "dormitory", labelKey: "reqDormitory" },
  { value: "work", labelKey: "reqWork" },
  { value: "stay", labelKey: "reqStay" },
  { value: "no_extra_exams", labelKey: "reqNoExtraExams" },
];

const PROFICIENCY_OPTIONS = ["good", "average", "poor", "not_sure"] as const;
const STRENGTH_OPTIONS = ["good", "average", "poor"] as const;

/**
 * Country of study → languages typically used for instruction there
 * (Q6 options are derived from the countries picked in Q2).
 */
const COUNTRY_LANGUAGES: Record<string, string[]> = {
  cz: ["cs", "en"],
  de: ["de", "en"],
  at: ["de", "en"],
  ch: ["de", "fr", "it", "en"],
  pl: ["pl", "en"],
  ua: ["uk", "en"],
  nl: ["nl", "en"],
  fr: ["fr", "en"],
  es: ["es", "en"],
  it: ["it", "en"],
  pt: ["pt", "en"],
  gb: ["en"],
  ie: ["en"],
  us: ["en"],
  ca: ["en"],
  se: ["en"],
  dk: ["en"],
  fi: ["en"],
  no: ["en"],
};
const DEFAULT_COUNTRY_LANGUAGES = ["en"];

/** Category of study → the subjects offered in Q9 for that category. */
const CATEGORY_SUBJECTS: Record<string, string[]> = {
  "Engineering & Technology": ["math", "physics", "computer_science"],
  "Natural Sciences": ["math", "physics", "chemistry", "biology"],
  "Health Sciences": ["chemistry", "biology"],
  "Business & Economics": ["math", "languages"],
  Law: ["languages"],
  "Social Sciences": ["languages"],
  Humanities: ["languages"],
  "Arts & Design": ["languages"],
};
const ALL_SUBJECTS = [
  "math",
  "physics",
  "chemistry",
  "biology",
  "computer_science",
  "languages",
] as const;

const SUBJECT_LABEL_KEYS: Record<string, string> = {
  math: "subjectMath",
  physics: "subjectPhysics",
  chemistry: "subjectChemistry",
  biology: "subjectBiology",
  computer_science: "subjectComputerScience",
  languages: "subjectLanguages",
};

/** Core NMT subjects (Q8) — matches the `nmt_subjects` seed codes. */
const NMT_SUBJECTS = [
  { code: "ukrainian_language", labelKey: "subjectUkrainianLanguage" },
  { code: "mathematics", labelKey: "subjectMathematics" },
  { code: "ukrainian_history", labelKey: "subjectUkrainianHistory" },
  { code: "english", labelKey: "subjectEnglish" },
] as const;

const NATIONAL_EXAM_OPTIONS: { value: string; labelKey: string }[] = [
  { value: "matura", labelKey: "nationalExamMatura" },
  { value: "abitur", labelKey: "nationalExamAbitur" },
  { value: "national_certificate", labelKey: "nationalExamNationalCertificate" },
  { value: "other", labelKey: "nationalExamOther" },
];

/**
 * Logical question chain (onboarding v2): 11 adaptive steps — residence →
 * destination countries → education stage → start year → field of study →
 * languages → proficiency → (exam, graduates only) → subject strengths →
 * budget → requirements. Every fieldset stays mounted (hidden via CSS), so
 * the single form POST collects every step's value regardless of which
 * step was last visible.
 */
export function OnboardingForm({
  locale,
  countries,
  languages,
  fieldsOfStudy,
  existingProfile,
}: OnboardingFormProps) {
  const t = useTranslations("Onboarding") as (
    key: string,
    values?: Record<string, unknown>,
  ) => string;
  const action = submitOnboardingAction.bind(null, locale);
  const [state, formAction, pending] = useActionState(
    action,
    initialOnboardingActionState,
  );
  const [stepId, setStepId] = useState<StepId>("residence");

  const profile = existingProfile?.profile ?? null;
  const [selectedCountryCodes, setSelectedCountryCodes] = useState<Set<string>>(
    () => new Set(profile?.preferred_country_codes ?? []),
  );
  const [selectedLanguageCodes, setSelectedLanguageCodes] = useState<Set<string>>(
    () => new Set(profile?.preferred_language_codes ?? []),
  );
  const [educationStage, setEducationStage] = useState<EducationStage | null>(
    profile?.education_stage ?? null,
  );
  const [category, setCategory] = useState<string | null>(null);
  const [selectedFieldIds, setSelectedFieldIds] = useState<Set<string>>(
    () => new Set(profile?.preferred_field_of_study_ids ?? []),
  );
  const [nmtTaken, setNmtTaken] = useState<boolean | null>(() => {
    const scores = existingProfile?.nmtScores ?? [];
    if (scores.length === 0) return null;
    return !scores.every((entry) => entry.score_is_expected);
  });
  const [residenceCountryCode, setResidenceCountryCode] = useState<string>(
    profile?.residence_country_code ?? "",
  );

  const languageOptions = languages.map((l) => ({
    value: l.code,
    label: l.name,
  }));
  const countryOptions = countries.map((c) => ({
    value: c.code,
    label: c.name,
    caption: c.code,
  }));

  const fieldsByCategory = new Map<string, FieldOfStudyRow[]>();
  for (const field of fieldsOfStudy) {
    const list = fieldsByCategory.get(field.category) ?? [];
    list.push(field);
    fieldsByCategory.set(field.category, list);
  }

  const isGraduate =
    educationStage === "finished_school" || educationStage === "college";

  const steps: StepId[] = [
    "residence",
    "countries",
    "stage",
    "startYear",
    "field",
    "language",
    ...(selectedLanguageCodes.size > 0 ? (["proficiency"] as StepId[]) : []),
    ...(isGraduate ? (["exam"] as StepId[]) : []),
    "subjects",
    "budget",
    "requirements",
  ];

  const currentIndex = steps.indexOf(stepId);
  // If the active step was removed by an adaptive change (e.g. all
  // languages deselected while on the proficiency step), fall back to the
  // last step — navigation below always moves onto a valid step, so the
  // stale id self-heals on the next click.
  const effectiveIndex = currentIndex >= 0 ? currentIndex : steps.length - 1;
  const effectiveStepId =
    currentIndex >= 0 ? stepId : steps[steps.length - 1] ?? "residence";

  function goNext() {
    if (effectiveIndex < steps.length - 1) {
      setStepId(steps[effectiveIndex + 1]);
    }
  }
  function goBack() {
    if (effectiveIndex > 0) {
      setStepId(steps[effectiveIndex - 1]);
    }
  }

  const offeredLanguages = selectedCountryCodes.size
    ? Array.from(
        new Set(
          Array.from(selectedCountryCodes).flatMap(
            (code) => COUNTRY_LANGUAGES[code] ?? DEFAULT_COUNTRY_LANGUAGES,
          ),
        ),
      )
    : [];

  const relevantSubjects =
    selectedFieldIds.size > 0
      ? Array.from(
          new Set(
            Array.from(selectedFieldIds).flatMap((fieldId) => {
              const field = fieldsOfStudy.find((f) => f.id === fieldId);
              return field
                ? (CATEGORY_SUBJECTS[field.category] ?? ALL_SUBJECTS)
                : [];
            }),
          ),
        )
      : ALL_SUBJECTS;

  const showNmt = residenceCountryCode === "UA";

  const prefillProficiency = (code: string) =>
    existingProfile?.languageProficiency.find((entry) => entry.language_code === code)
      ?.level ?? "";
  const prefillStrength = (code: string) =>
    existingProfile?.subjectStrengths.find((entry) => entry.subject_code === code)
      ?.level ?? "";
  const prefillNmtScore = (code: string) =>
    existingProfile?.nmtScores.find((entry) => entry.subject_code === code)?.score ??
    "";

  return (
    <form action={formAction} className="max-w-2xl mx-auto space-y-8">
      <div className="space-y-2">
        <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-primary">
          {t("heading")}
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          {t("description")}
        </p>
      </div>

      {/* Progress header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          {effectiveIndex > 0 ? (
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
            {t("stepIndicator", {
              step: effectiveIndex + 1,
              total: steps.length,
            })}
          </p>
          <span className="w-9 h-9" />
        </div>
        <div className="h-1.5 rounded-full bg-surface-container-high overflow-hidden">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${((effectiveIndex + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="font-headline-md text-headline-md text-primary">
          {t(STEP_TITLES[effectiveStepId])}
        </h2>
        <p className="font-body-md text-body-md text-on-surface-variant">
          {t(STEP_SUBTITLES[effectiveStepId])}
        </p>
      </div>

      {/* Step 1 — residence */}
      <div className={effectiveStepId === "residence" ? "space-y-4" : "hidden"}>
        <div className="space-y-1">
          <label htmlFor="residence_country_code" className={formLabelClassName}>
            {t("residenceCountryLabel")}
          </label>
          <select
            id="residence_country_code"
            name="residence_country_code"
            defaultValue={residenceCountryCode}
            onChange={(event) => setResidenceCountryCode(event.target.value)}
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
        <div className="space-y-1">
          <label htmlFor="residence_city" className={formLabelClassName}>
            {t("residenceCityLabel")}
          </label>
          <input
            id="residence_city"
            name="residence_city"
            type="text"
            placeholder={t("residenceCityPlaceholder")}
            defaultValue={profile?.residence_city ?? ""}
            className={formInputClassName}
          />
        </div>
      </div>

      {/* Step 2 — destination countries */}
      <div className={effectiveStepId === "countries" ? "" : "hidden"}>
        <CardCheckboxGroup
          name="preferred_country_codes"
          options={countryOptions}
          defaultValues={Array.from(selectedCountryCodes)}
          onChange={(values) => setSelectedCountryCodes(new Set(values))}
        />
      </div>

      {/* Step 3 — education stage */}
      <div className={effectiveStepId === "stage" ? "" : "hidden"}>
        <CardRadioGroup
          name="education_stage"
          options={STAGE_OPTIONS.map((option) => ({
            value: option.value,
            label: t(option.labelKey),
          }))}
          defaultValue={educationStage ?? ""}
          onChange={(value) =>
            setEducationStage(value ? (value as EducationStage) : null)
          }
        />
      </div>

      {/* Step 4 — start year */}
      <div className={effectiveStepId === "startYear" ? "" : "hidden"}>
        <CardRadioGroup
          name="start_year"
          options={START_YEAR_OPTIONS.map((option) => ({
            value: option.value,
            label: t(option.labelKey),
          }))}
          defaultValue={profile?.start_year ? String(profile.start_year) : ""}
        />
      </div>

      {/* Step 5 — field of study (category → specific fields) */}
      <div className={effectiveStepId === "field" ? "space-y-6" : "hidden"}>
        <div className="space-y-3">
          <span className={formLabelClassName}>{t("categoryLabel")}</span>
          <CardRadioGroup
            name="field_category"
            options={Array.from(fieldsByCategory.keys()).map((c) => ({
              value: c,
              label: c,
            }))}
            defaultValue={category ?? ""}
            onChange={(value) => setCategory(value)}
          />
        </div>
        {category && fieldsByCategory.has(category) && (
          <div className="space-y-3">
            <span className={formLabelClassName}>{t("primaryFieldLabel")}</span>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              {t("additionalFieldsLabel")}
            </p>
            <CardCheckboxGroup
              name="preferred_field_of_study_ids"
              options={fieldsByCategory.get(category)!.map((field) => ({
                value: field.id,
                label: field.name,
              }))}
              defaultValues={Array.from(selectedFieldIds).filter((id) =>
                fieldsByCategory.get(category)!.some((f) => f.id === id),
              )}
              onChange={(values) => setSelectedFieldIds(new Set(values))}
            />
          </div>
        )}
      </div>

      {/* Step 6 — study languages */}
      <div className={effectiveStepId === "language" ? "" : "hidden"}>
        {offeredLanguages.length > 0 ? (
          <CardCheckboxGroup
            name="preferred_language_codes"
            options={languageOptions.filter((option) =>
              offeredLanguages.includes(option.value),
            )}
            defaultValues={Array.from(selectedLanguageCodes)}
            onChange={(values) => setSelectedLanguageCodes(new Set(values))}
          />
        ) : (
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            {t("languagesLabel")}
          </p>
        )}
      </div>

      {/* Step 7 — language proficiency */}
      <div className={effectiveStepId === "proficiency" ? "space-y-6" : "hidden"}>
        {Array.from(selectedLanguageCodes).map((code) => (
          <div key={code} className="space-y-3">
            <span className={formLabelClassName}>
              {languageOptions.find((option) => option.value === code)?.label ??
                code}
            </span>
            <CardRadioGroup
              name={`lang_${code}`}
              options={PROFICIENCY_OPTIONS.map((level) => ({
                value: level,
                label: t(`proficiency${level.charAt(0).toUpperCase()}${level.slice(1)}`),
              }))}
              defaultValue={prefillProficiency(code)}
            />
          </div>
        ))}
      </div>

      {/* Step 8 — exams (graduates only) */}
      <div className={effectiveStepId === "exam" ? "space-y-6" : "hidden"}>
        {showNmt ? (
          <>
            <div className="space-y-3">
              <span className={formLabelClassName}>{t("examNmtStatusLabel")}</span>
              <CardRadioGroup
                name="nmt_taken"
                options={[
                  { value: "taken", label: t("examTaken") },
                  { value: "not_taken", label: t("examNotTaken") },
                ]}
                defaultValue={
                  nmtTaken == null ? "" : nmtTaken ? "taken" : "not_taken"
                }
                onChange={(value) =>
                  setNmtTaken(value === "taken" ? true : value === "not_taken" ? false : null)
                }
              />
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              {t("nmtSubjectsHelp")}
            </p>
            <div className="space-y-4">
              {NMT_SUBJECTS.map((subject) => (
                <div key={subject.code} className="space-y-1">
                  <label
                    htmlFor={`nmt_${subject.code}`}
                    className={formLabelClassName}
                  >
                    {t(subject.labelKey)}
                  </label>
                  <input
                    id={`nmt_${subject.code}`}
                    name={`nmt_${subject.code}`}
                    type="number"
                    min={0}
                    max={200}
                    defaultValue={prefillNmtScore(subject.code)}
                    placeholder={nmtTaken ? t("nmtScoreLabel") : t("nmtExpectedLabel")}
                    className={formInputClassName}
                  />
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="space-y-1">
              <label htmlFor="national_exam_type" className={formLabelClassName}>
                {t("nationalExamLabel")}
              </label>
              <select
                id="national_exam_type"
                name="national_exam_type"
                defaultValue={profile?.national_exam_type ?? ""}
                className={formSelectClassName}
              >
                <option value="">{t("selectPlaceholder")}</option>
                {NATIONAL_EXAM_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {t(option.labelKey)}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label htmlFor="national_exam_score" className={formLabelClassName}>
                {t("nationalExamScoreLabel")}
              </label>
              <input
                id="national_exam_score"
                name="national_exam_score"
                type="number"
                min={0}
                placeholder={t("nationalExamScoreOptional")}
                className={formInputClassName}
              />
            </div>
          </>
        )}
        <button
          type="button"
          onClick={goNext}
          className="font-label-sm text-label-sm text-primary underline underline-offset-2"
        >
          {t("skipForNow")}
        </button>
      </div>

      {/* Step 9 — subject strengths */}
      <div className={effectiveStepId === "subjects" ? "space-y-6" : "hidden"}>
        {relevantSubjects.map((subjectCode) => (
          <div key={subjectCode} className="space-y-3">
            <span className={formLabelClassName}>
              {t(SUBJECT_LABEL_KEYS[subjectCode] ?? "subjectMath")}
            </span>
            <CardRadioGroup
              name={`subject_${subjectCode}`}
              options={STRENGTH_OPTIONS.map((level) => ({
                value: level,
                label: t(`subject${level.charAt(0).toUpperCase()}${level.slice(1)}`),
              }))}
              defaultValue={prefillStrength(subjectCode)}
            />
          </div>
        ))}
      </div>

      {/* Step 10 — budget */}
      <div className={effectiveStepId === "budget" ? "space-y-6" : "hidden"}>
        <div className="space-y-3">
          <span className={formLabelClassName}>{t("tuitionLabel")}</span>
          <CardRadioGroup
            name="budget_mode"
            options={BUDGET_OPTIONS.map((option) => ({
              value: option.value,
              label: t(option.labelKey),
              caption: option.hintKey ? t(option.hintKey) : undefined,
            }))}
            defaultValue={profile?.budget_mode ?? "unknown"}
          />
        </div>
        <div className="space-y-3">
          <span className={formLabelClassName}>{t("livingLabel")}</span>
          <CardRadioGroup
            name="living_cost_mode"
            options={LIVING_COST_OPTIONS.map((option) => ({
              value: option.value,
              label: t(option.labelKey),
              caption: option.hintKey ? t(option.hintKey) : undefined,
            }))}
            defaultValue={profile?.living_cost_mode ?? "unknown"}
          />
        </div>
      </div>

      {/* Step 11 — additional requirements */}
      <div className={effectiveStepId === "requirements" ? "" : "hidden"}>
        <p className="font-body-sm text-body-sm text-on-surface-variant mb-4">
          {t("requirementsHelp")}
        </p>
        <ToggleCardGroup
          name="requirements"
          options={REQUIREMENT_OPTIONS.map((option) => ({
            value: option.value,
            label: t(option.labelKey),
          }))}
          defaultValues={[
            ...(profile?.wants_scholarship ? ["scholarship"] : []),
            ...(profile?.wants_dormitory ? ["dormitory"] : []),
            ...(profile?.wants_work_during_study ? ["work"] : []),
            ...(profile?.wants_stay_after_graduation ? ["stay"] : []),
            ...(profile?.open_to_additional_exams === false
              ? ["no_extra_exams"]
              : []),
          ]}
        />
      </div>

      {state.error && (
        <p role="alert" className="font-body-sm text-body-sm text-error">
          {state.error}
        </p>
      )}

      <div className="pt-2">
        {effectiveIndex < steps.length - 1 ? (
          <button
            type="button"
            onClick={goNext}
            className={`${formPrimaryButtonClassName} w-full flex items-center justify-center gap-2`}
          >
            {t("continue")}
            <span
              className="material-symbols-outlined"
              aria-hidden="true"
              style={{ fontSize: 18 }}
            >
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

/**
 * Card-styled checkbox group with an onChange callback — like
 * `ToggleCardGroup`, but controllable so later steps can adapt to the
 * current selection (e.g. languages offered by the chosen countries).
 */
function CardCheckboxGroup({
  name,
  options,
  defaultValues,
  onChange,
}: {
  name: string;
  options: { value: string; label: string; caption?: string }[];
  defaultValues: string[];
  onChange?: (values: string[]) => void;
}) {
  const selected = new Set(defaultValues);

  return (
    <div className="grid grid-cols-2 gap-3">
      {options.map((option) => (
        <label
          key={option.value}
          className="group relative flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-outline-variant bg-surface-container-lowest px-4 py-5 text-center cursor-pointer transition-colors has-checked:border-primary has-checked:bg-primary-fixed/20"
        >
          <input
            type="checkbox"
            name={name}
            value={option.value}
            defaultChecked={selected.has(option.value)}
            onChange={(event) => {
              const next = new Set(selected);
              if (event.target.checked) {
                next.add(option.value);
              } else {
                next.delete(option.value);
              }
              onChange?.(Array.from(next));
            }}
            className="peer sr-only"
          />
          <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary text-on-primary items-center justify-center text-xs hidden peer-checked:flex">
            ✓
          </span>
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
  );
}

/**
 * Card-styled radio group (single select) with an onChange callback —
 * the same look as `CardCheckboxGroup` but radio semantics.
 */
function CardRadioGroup({
  name,
  options,
  defaultValue,
  onChange,
}: {
  name: string;
  options: { value: string; label: string; caption?: string }[];
  defaultValue: string;
  onChange?: (value: string) => void;
}) {
  return (
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
            defaultChecked={defaultValue === option.value}
            onChange={() => onChange?.(option.value)}
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
  );
}