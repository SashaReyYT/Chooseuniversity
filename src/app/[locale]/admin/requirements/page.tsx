import { getTranslations, setRequestLocale } from "next-intl/server";
import { requireAdminForPage, requireAdminLocale } from "@/lib/admin/require-admin";
import { ProgrammesRepository } from "@/lib/repositories/programmes.repository";
import { AdminCatalogRepository } from "@/lib/repositories/admin/admin-catalog.repository";
import { AdminCostsRepository } from "@/lib/repositories/admin/admin-costs.repository";
import { saveRequirementsAction } from "@/lib/admin/admin-actions";
import { formInputClassName } from "@/components/form-styles";
import { adminPrimaryButtonClassName, Field } from "../admin-field";

export default async function AdminRequirementsPage({
  params,
  searchParams,
}: PageProps<"/[locale]/admin/requirements"> & {
  searchParams?: Promise<Record<string, string | undefined>>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  requireAdminLocale(locale);
  setRequestLocale(locale);

  const supabase = await requireAdminForPage(locale);
  const t = await getTranslations("Admin");

  const programmes = await new ProgrammesRepository(supabase!).listWithDetails();
  const editing = programmes.find((p) => p.id === sp?.edit) ?? null;
  const req = editing?.academic_requirements;
  const testRequirements = editing
    ? await new AdminCostsRepository(supabase!).listTestRequirementsWithQualification(
        editing.id,
      )
    : [];
  const qualifications = await new AdminCatalogRepository(
    supabase!,
  ).listQualifications();

  return (
    <div className="space-y-6">
      <h2 className="font-headline-sm text-headline-sm text-primary">
        {t("requirementsHeading")}
      </h2>
      <p className="font-body-sm text-body-sm text-on-surface-variant">
        {t("requirementsDescription")}
      </p>

      {editing && (
        <form
          action={saveRequirementsAction}
          className="space-y-4 rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-6"
        >
          <input type="hidden" name="programme_id" value={editing.id} />
          <p className="font-body-md text-body-md text-primary">
            {editing.name} — {editing.university.name}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label={t("programmesMinGpa")}>
              <input
                name="min_gpa"
                type="number"
                step="any"
                defaultValue={req?.min_gpa ?? ""}
                className={formInputClassName}
              />
            </Field>
            <Field label={t("programmesGpaScale")}>
              <input
                name="gpa_scale"
                type="number"
                step="any"
                defaultValue={req?.gpa_scale ?? ""}
                className={formInputClassName}
              />
            </Field>
            <Field
              label={t("programmesRequiredSubjects")}
              hint={t("programmesRequiredSubjectsHint")}
            >
              <input
                name="required_subjects"
                defaultValue={(req?.required_subjects ?? []).join(", ")}
                className={formInputClassName}
              />
            </Field>
            <Field label={t("programmesRequiredDegreeLevel")}>
              <select
                name="required_degree_level"
                defaultValue={req?.required_degree_level ?? ""}
                className={formInputClassName}
              >
                <option value="">—</option>
                <option value="foundation">{t("programmesDegreeFoundation")}</option>
                <option value="bachelor">{t("programmesDegreeBachelor")}</option>
                <option value="master">{t("programmesDegreeMaster")}</option>
                <option value="phd">{t("programmesDegreePhd")}</option>
              </select>
            </Field>
            <Field label={t("programmesRequiredMathBackground")}>
              <select
                name="required_math_background"
                defaultValue={req?.required_math_background ?? ""}
                className={formInputClassName}
              >
                <option value="">—</option>
                <option value="excellent">{t("programmesMathExcellent")}</option>
                <option value="good">{t("programmesMathGood")}</option>
                <option value="average">{t("programmesMathAverage")}</option>
                <option value="weak">{t("programmesMathWeak")}</option>
                <option value="not_sure">{t("programmesMathNotSure")}</option>
              </select>
            </Field>
            <label className="flex items-center gap-2 font-body-sm text-body-sm text-on-surface">
              <input
                type="checkbox"
                name="entrance_exam_required"
                defaultChecked={req?.entrance_exam_required ?? false}
              />
              {t("programmesEntranceExamRequired")}
            </label>
            <Field label={t("programmesEntranceExamNotes")}>
              <input
                name="entrance_exam_notes"
                defaultValue={req?.entrance_exam_notes ?? ""}
                className={formInputClassName}
              />
            </Field>
            <Field
              label={t("programmesAcademicNotes")}
            >
              <input
                name="notes"
                defaultValue={req?.notes ?? ""}
                className={formInputClassName}
              />
            </Field>
            <label className="flex items-center gap-2 font-body-sm text-body-sm text-on-surface">
              <input
                type="checkbox"
                name="portfolio_required"
                defaultChecked={req?.portfolio_required ?? false}
              />
              {t("requirementsPortfolioRequired")}
            </label>
            <label className="flex items-center gap-2 font-body-sm text-body-sm text-on-surface">
              <input
                type="checkbox"
                name="interview_required"
                defaultChecked={req?.interview_required ?? false}
              />
              {t("requirementsInterviewRequired")}
            </label>
          </div>

          <h3 className="font-headline-sm text-headline-sm text-primary">
            {t("requirementsTestRequirements")}
          </h3>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            {t("requirementsTestRequirementsHint")}
          </p>
          <div className="space-y-3">
            {(testRequirements.length > 0 ? testRequirements : [null]).map(
              (row) => (
                <div
                  key={row?.id ?? "empty"}
                  className="grid grid-cols-1 md:grid-cols-8 gap-3 rounded-lg border border-outline-variant/60 p-3"
                >
                  <Field label={t("requirementsQualification")}>
                    <select
                      name="test_qualification_id"
                      defaultValue={row?.qualification_id ?? ""}
                      className={formInputClassName}
                    >
                      <option value="">—</option>
                      {qualifications.map((q) => (
                        <option key={q.id} value={q.id}>
                          {q.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label={t("requirementsSection")}>
                    <input
                      name="test_section"
                      defaultValue={row?.section ?? ""}
                      className={formInputClassName}
                    />
                  </Field>
                  <Field label={t("requirementsSubject")}>
                    <input
                      name="test_subject"
                      defaultValue={row?.subject ?? ""}
                      className={formInputClassName}
                    />
                  </Field>
                  <Field label={t("requirementsMinScore")}>
                    <input
                      name="test_minimum_score"
                      type="number"
                      step="any"
                      defaultValue={row?.minimum_score ?? ""}
                      className={formInputClassName}
                    />
                  </Field>
                  <Field label={t("requirementsMinScoreDisplay")}>
                    <input
                      name="test_minimum_score_display"
                      defaultValue={row?.minimum_score_display ?? ""}
                      className={formInputClassName}
                    />
                  </Field>
                  <Field label={t("requirementsComparison")}>
                    <select
                      name="test_comparison"
                      defaultValue={row?.comparison ?? "greater_or_equal"}
                      className={formInputClassName}
                    >
                      <option value="greater_or_equal">
                        {t("requirementsComparisonGte")}
                      </option>
                      <option value="greater">{t("requirementsComparisonGt")}</option>
                      <option value="equal">{t("requirementsComparisonEq")}</option>
                    </select>
                  </Field>
                  <Field label={t("requirementsNotes")}>
                    <input
                      name="test_notes"
                      defaultValue={row?.notes ?? ""}
                      className={formInputClassName}
                    />
                  </Field>
                  <label className="flex items-center gap-2 font-body-sm text-body-sm text-on-surface pt-6">
                    <input type="checkbox" name="test_remove" />
                    {t("programmesRemove")}
                  </label>
                </div>
              ),
            )}
          </div>
          <button type="submit" className={adminPrimaryButtonClassName}>
            {t("commonSave")}
          </button>
        </form>
      )}

      <ul className="space-y-2">
        {programmes.length > 0 ? (
          programmes.map((p) => {
            const missing = [
              !p.academic_requirements?.min_gpa,
              (p.academic_requirements?.required_subjects?.length ?? 0) === 0,
              p.test_requirements.length === 0,
              !p.academic_requirements?.required_degree_level,
            ].filter(Boolean).length;
            return (
              <li
                key={p.id}
                className="rounded-lg border border-outline-variant/60 bg-surface-container-lowest p-4 flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <p className="font-body-md text-body-md text-on-surface truncate">
                    {p.name}
                  </p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    {p.university.name}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={`font-label-caps text-label-caps ${
                      missing === 0 ? "text-success" : "text-warning"
                    }`}
                  >
                    {missing === 0 ? t("requirementsComplete") : t("requirementsMissing")}
                  </span>
                  <a
                    href={`?edit=${p.id}`}
                    className="font-label-caps text-label-caps text-primary underline"
                  >
                    {t("requirementsReview")}
                  </a>
                </div>
              </li>
            );
          })
        ) : (
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            {t("requirementsNone")}
          </p>
        )}
      </ul>
    </div>
  );
}