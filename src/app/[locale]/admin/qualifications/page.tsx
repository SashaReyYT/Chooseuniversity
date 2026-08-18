import { getTranslations, setRequestLocale } from "next-intl/server";
import { requireAdminForPage, requireAdminLocale } from "@/lib/admin/require-admin";
import { AdminCatalogRepository } from "@/lib/repositories/admin/admin-catalog.repository";
import {
  createQualificationAction,
  deleteQualificationAction,
  updateQualificationAction,
} from "@/lib/admin/admin-actions";
import { formInputClassName } from "@/components/form-styles";
import {
  adminDangerButtonClassName,
  adminPrimaryButtonClassName,
  Field,
} from "../admin-field";

const QUALIFICATION_CATEGORY_KEYS = {
  national: "qualificationsCategoryNational",
  academic: "qualificationsCategoryAcademic",
  language: "qualificationsCategoryLanguage",
  other: "qualificationsCategoryOther",
} as const;

export default async function AdminQualificationsPage({
  params,
  searchParams,
}: PageProps<"/[locale]/admin/qualifications"> & {
  searchParams?: Promise<Record<string, string | undefined>>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  requireAdminLocale(locale);
  setRequestLocale(locale);

  const supabase = await requireAdminForPage(locale);
  const t = await getTranslations("Admin");

  const qualifications = await new AdminCatalogRepository(
    supabase!,
  ).listQualifications();
  const editing =
    qualifications.find((q) => q.id === sp?.edit) ?? null;

  return (
    <div className="space-y-8">
      <h2 className="font-headline-sm text-headline-sm text-primary">
        {t("qualificationsHeading")}
      </h2>

      <form
        action={editing ? updateQualificationAction : createQualificationAction}
        className="space-y-4 rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-6"
      >
        {editing && <input type="hidden" name="id" value={editing.id} />}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label={t("qualificationsCode")} required>
            <input
              name="code"
              required
              defaultValue={editing?.code ?? ""}
              className={formInputClassName}
            />
          </Field>
          <Field label={t("qualificationsName")} required>
            <input
              name="name"
              required
              defaultValue={editing?.name ?? ""}
              className={formInputClassName}
            />
          </Field>
          <Field label={t("qualificationsCategory")}>
            <select
              name="category"
              defaultValue={editing?.category ?? "other"}
              className={formInputClassName}
            >
              {Object.entries(QUALIFICATION_CATEGORY_KEYS).map(
                ([value, key]) => (
                  <option key={value} value={value}>
                    {t(key)}
                  </option>
                ),
              )}
            </select>
          </Field>
          <Field label={t("qualificationsMaxScore")}>
            <input
              name="max_score"
              type="number"
              step="any"
              min={0}
              defaultValue={editing?.max_score ?? ""}
              className={formInputClassName}
            />
          </Field>
          <Field label={t("qualificationsSortOrder")}>
            <input
              name="sort_order"
              type="number"
              defaultValue={editing?.sort_order ?? 0}
              className={formInputClassName}
            />
          </Field>
          <label className="flex items-center gap-2 font-body-sm text-body-sm text-on-surface pt-6">
            <input
              type="checkbox"
              name="active"
              defaultChecked={editing?.active ?? true}
            />
            {t("qualificationsActive")}
          </label>
          <Field label={t("qualificationsDescription")}>
            <input
              name="description"
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
        <form action={deleteQualificationAction}>
          <input type="hidden" name="id" value={editing.id} />
          <button type="submit" className={adminDangerButtonClassName}>
            {t("commonDelete")}
          </button>
        </form>
      )}

      {qualifications.length > 0 ? (
        <ul className="space-y-2">
          {qualifications.map((q) => (
            <li
              key={q.id}
              className="rounded-lg border border-outline-variant/60 bg-surface-container-lowest p-4 flex items-center justify-between gap-4"
            >
              <div className="min-w-0">
                <p className="font-body-md text-body-md text-on-surface truncate">
                  {q.name}
                  {q.max_score != null ? ` (max ${q.max_score})` : ""}
                </p>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  {q.code} ·{" "}
                  {t(
                    QUALIFICATION_CATEGORY_KEYS[
                      q.category as keyof typeof QUALIFICATION_CATEGORY_KEYS
                    ] ?? "qualificationsCategoryOther",
                  )}{" "}
                  · {q.active ? t("qualificationsActive") : t("commonUnpublished")}
                </p>
              </div>
              <a
                href={`?edit=${q.id}`}
                className="font-label-caps text-label-caps text-primary underline shrink-0"
              >
                {t("commonEdit")}
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          {t("qualificationsNone")}
        </p>
      )}
    </div>
  );
}