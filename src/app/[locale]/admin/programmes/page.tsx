import { getTranslations, setRequestLocale } from "next-intl/server";
import { requireAdminForPage, requireAdminLocale } from "@/lib/admin/require-admin";
import { AdminCatalogRepository } from "@/lib/repositories/admin/admin-catalog.repository";
import { AdminCostsRepository } from "@/lib/repositories/admin/admin-costs.repository";
import {
  createProgrammeAction,
  deleteProgrammeAction,
  updateProgrammeAction,
  saveTuitionVariantsAction,
} from "@/lib/admin/admin-actions";
import { formInputClassName } from "@/components/form-styles";
import {
  adminDangerButtonClassName,
  adminPrimaryButtonClassName,
  Field,
} from "../admin-field";

const DEGREE_LABEL_KEYS = {
  foundation: "programmesDegreeFoundation",
  bachelor: "programmesDegreeBachelor",
  master: "programmesDegreeMaster",
  phd: "programmesDegreePhd",
} as const;

const STUDY_MODE_LABEL_KEYS = {
  full_time: "programmesStudyModeFullTime",
  part_time: "programmesStudyModePartTime",
  distance: "programmesStudyModeDistance",
  online: "programmesStudyModeOnline",
  hybrid: "programmesStudyModeHybrid",
} as const;

export default async function AdminProgrammesPage({
  params,
  searchParams,
}: PageProps<"/[locale]/admin/programmes"> & {
  searchParams?: Promise<Record<string, string | undefined>>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  requireAdminLocale(locale);
  setRequestLocale(locale);

  const supabase = await requireAdminForPage(locale);
  const t = await getTranslations("Admin");

  const repo = new AdminCatalogRepository(supabase!);
  const costsRepo = new AdminCostsRepository(supabase!);
  const [programmes, universities, fields, languages, faculties] = await Promise.all([
    repo.listProgrammes(),
    repo.listUniversities(),
    repo.listFieldsOfStudy(),
    repo.listLanguages(),
    repo.listFaculties(),
  ]);

  const editing = programmes.find((p) => p.id === sp?.edit) ?? null;
  const variants = editing
    ? await costsRepo.listTuitionVariants(editing.id)
    : [];

  return (
    <div className="space-y-8">
      <h2 className="font-headline-sm text-headline-sm text-primary">
        {t("programmesHeading")}
      </h2>

      {!editing && (
        <button
          form="programme-form"
          type="submit"
          className={adminPrimaryButtonClassName}
        >
          {t("programmesNew")}
        </button>
      )}

      <form
        id="programme-form"
        action={editing ? updateProgrammeAction : createProgrammeAction}
        className="space-y-4 rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-6"
      >
        {editing && <input type="hidden" name="id" value={editing.id} />}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label={t("commonName")} required>
            <input
              name="name"
              required
              defaultValue={editing?.name ?? ""}
              className={formInputClassName}
            />
          </Field>
          <Field label={t("programmesUniversity")} required>
            <select
              name="university_id"
              required
              defaultValue={editing?.university_id ?? ""}
              className={formInputClassName}
            >
              <option value="">—</option>
              {universities.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t("programmesFaculty")}>
            <select
              name="faculty_id"
              defaultValue={editing?.faculty_id ?? ""}
              className={formInputClassName}
            >
              <option value="">—</option>
              {faculties.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t("programmesDegreeLevel")} required>
            <select
              name="degree_level"
              required
              defaultValue={editing?.degree_level ?? "bachelor"}
              className={formInputClassName}
            >
              {Object.entries(DEGREE_LABEL_KEYS).map(([value, key]) => (
                <option key={value} value={value}>
                  {t(key)}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t("programmesDegreeTitle")}>
            <input
              name="degree_title"
              defaultValue={editing?.degree_title ?? ""}
              className={formInputClassName}
            />
          </Field>
          <Field label={t("programmesFieldOfStudy")} required>
            <select
              name="field_of_study_id"
              required
              defaultValue={editing?.field_of_study_id ?? ""}
              className={formInputClassName}
            >
              <option value="">—</option>
              {fields.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t("programmesLanguage")} required>
            <select
              name="language_code"
              required
              defaultValue={editing?.language_code ?? ""}
              className={formInputClassName}
            >
              <option value="">—</option>
              {languages.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.name} ({l.code})
                </option>
              ))}
            </select>
          </Field>
          <Field label={t("programmesDurationMonths")} required>
            <input
              name="duration_months"
              type="number"
              required
              min={1}
              defaultValue={editing?.duration_months ?? ""}
              className={formInputClassName}
            />
          </Field>
          <Field label={t("programmesStudyMode")}>
            <select
              name="study_mode"
              defaultValue={editing?.study_mode ?? "full_time"}
              className={formInputClassName}
            >
              {Object.entries(STUDY_MODE_LABEL_KEYS).map(([value, key]) => (
                <option key={value} value={value}>
                  {t(key)}
                </option>
              ))}
            </select>
          </Field>
          <Field
            label={t("programmesTuitionMin")}
            hint={t("programmesTuitionHint")}
          >
            <input
              name="tuition_min"
              type="number"
              step="any"
              min={0}
              defaultValue={editing?.tuition_min ?? ""}
              className={formInputClassName}
            />
          </Field>
          <Field label={t("programmesTuitionMax")}>
            <input
              name="tuition_max"
              type="number"
              step="any"
              min={0}
              defaultValue={editing?.tuition_max ?? ""}
              className={formInputClassName}
            />
          </Field>
          <Field label={t("programmesTuitionCurrency")}>
            <input
              name="tuition_currency"
              defaultValue={editing?.tuition_currency ?? ""}
              className={formInputClassName}
            />
          </Field>
          <Field label={t("programmesApplicationFeeAmount")}>
            <input
              name="application_fee_amount"
              type="number"
              step="any"
              defaultValue={editing?.application_fee_amount ?? ""}
              className={formInputClassName}
            />
          </Field>
          <Field label={t("programmesApplicationFeeCurrency")}>
            <input
              name="application_fee_currency"
              defaultValue={editing?.application_fee_currency ?? ""}
              className={formInputClassName}
            />
          </Field>
          <Field label={t("programmesLivingCostMonthly")}>
            <input
              name="estimated_living_cost_monthly"
              type="number"
              step="any"
              defaultValue={editing?.estimated_living_cost_monthly ?? ""}
              className={formInputClassName}
            />
          </Field>
          <Field label={t("programmesLivingCostCurrency")}>
            <input
              name="living_cost_currency"
              defaultValue={editing?.living_cost_currency ?? ""}
              className={formInputClassName}
            />
          </Field>
          <Field label={t("programmesDeadline")}>
            <input
              name="application_deadline"
              type="date"
              defaultValue={editing?.application_deadline ?? ""}
              className={formInputClassName}
            />
          </Field>
          <Field label={t("programmesIntakeStart")}>
            <input
              name="intake_start"
              type="date"
              defaultValue={editing?.intake_start ?? ""}
              className={formInputClassName}
            />
          </Field>
          <Field label={t("programmesProgrammeUrl")}>
            <input
              name="programme_url"
              type="url"
              defaultValue={editing?.programme_url ?? ""}
              className={formInputClassName}
            />
          </Field>
          <Field label={t("programmesApplicationUrl")}>
            <input
              name="application_url"
              type="url"
              defaultValue={editing?.application_url ?? ""}
              className={formInputClassName}
            />
          </Field>
          <label className="flex items-center gap-2 font-body-sm text-body-sm text-on-surface">
            <input
              type="checkbox"
              name="published"
              defaultChecked={editing?.published ?? false}
            />
            {t("programmesPublished")}
          </label>
          <Field
            label={t("programmesRequiredDocuments")}
            hint={t("programmesRequiredDocumentsHint")}
          >
            <textarea
              name="required_documents"
              rows={4}
              defaultValue={(editing?.required_documents ?? []).join("\n")}
              className={formInputClassName}
            />
          </Field>
          <Field label={t("programmesScholarshipNotes")}>
            <textarea
              name="scholarship_notes"
              rows={3}
              defaultValue={editing?.scholarship_notes ?? ""}
              className={formInputClassName}
            />
          </Field>
          <Field label={t("programmesCareerNotes")}>
            <textarea
              name="career_notes"
              rows={3}
              defaultValue={editing?.career_notes ?? ""}
              className={formInputClassName}
            />
          </Field>
          <Field label={t("programmesDescription")}>
            <textarea
              name="description"
              rows={5}
              defaultValue={editing?.description ?? ""}
              className={formInputClassName}
            />
          </Field>
        </div>
        <div className="flex gap-3">
          <button type="submit" className={adminPrimaryButtonClassName}>
            {t("commonSave")}
          </button>
        </div>
      </form>

      {editing && (
        <form
          action={saveTuitionVariantsAction}
          className="space-y-4 rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-6"
        >
          <input type="hidden" name="programme_id" value={editing.id} />
          <h3 className="font-headline-sm text-headline-sm text-primary">
            {t("programmesTuitionVariants")}
          </h3>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            {t("programmesTuitionVariantsHint")}
          </p>
          <div className="space-y-3">
            {(variants.length > 0 ? variants : [null]).map((variant) => (
              <div
                key={variant?.id ?? "empty"}
                className="grid grid-cols-1 md:grid-cols-7 gap-3 rounded-lg border border-outline-variant/60 p-3"
              >
                <Field label={t("programmesVariantName")}>
                  <input
                    name="variant_name"
                    defaultValue={variant?.name ?? ""}
                    className={formInputClassName}
                  />
                </Field>
                <Field label={t("programmesVariantMin")}>
                  <input
                    name="variant_min"
                    type="number"
                    step="any"
                    min={0}
                    defaultValue={variant?.tuition_min ?? ""}
                    className={formInputClassName}
                  />
                </Field>
                <Field label={t("programmesVariantMax")}>
                  <input
                    name="variant_max"
                    type="number"
                    step="any"
                    min={0}
                    defaultValue={variant?.tuition_max ?? ""}
                    className={formInputClassName}
                  />
                </Field>
                <Field label={t("programmesVariantCurrency")}>
                  <input
                    name="variant_currency"
                    defaultValue={variant?.currency ?? ""}
                    className={formInputClassName}
                  />
                </Field>
                <Field label={t("programmesVariantPeriod")}>
                  <select
                    name="variant_period"
                    defaultValue={variant?.period ?? "per_year"}
                    className={formInputClassName}
                  >
                    <option value="per_year">{t("programmesPerYear")}</option>
                    <option value="per_semester">{t("programmesPerSemester")}</option>
                    <option value="total">{t("programmesTotal")}</option>
                  </select>
                </Field>
                <Field label={t("programmesVariantNotes")}>
                  <input
                    name="variant_notes"
                    defaultValue={variant?.notes ?? ""}
                    className={formInputClassName}
                  />
                </Field>
                <label className="flex items-center gap-2 font-body-sm text-body-sm text-on-surface pt-6">
                  <input type="checkbox" name="variant_remove" />
                  {t("programmesRemove")}
                </label>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button type="submit" className={adminPrimaryButtonClassName}>
              {t("commonSave")}
            </button>
          </div>
        </form>
      )}

      {editing && (
        <form action={deleteProgrammeAction}>
          <input type="hidden" name="id" value={editing.id} />
          <button type="submit" className={adminDangerButtonClassName}>
            {t("commonDelete")}
          </button>
        </form>
      )}

      {programmes.length > 0 ? (
        <ul className="space-y-2">
          {programmes.map((p) => (
            <li
              key={p.id}
              className="rounded-lg border border-outline-variant/60 bg-surface-container-lowest p-4 flex items-center justify-between gap-4"
            >
              <div className="min-w-0">
                <p className="font-body-md text-body-md text-on-surface truncate">
                  {p.name}
                </p>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  {p.university?.name ?? "—"} · {t(DEGREE_LABEL_KEYS[p.degree_level as keyof typeof DEGREE_LABEL_KEYS] ?? "programmesDegreeBachelor")} ·{" "}
                  {p.field_of_study?.name ?? "—"} · {p.language?.code ?? "—"}
                </p>
              </div>
              <a
                href={`?edit=${p.id}`}
                className="font-label-caps text-label-caps text-primary underline shrink-0"
              >
                {t("commonEdit")}
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          {t("programmesNone")}
        </p>
      )}
    </div>
  );
}