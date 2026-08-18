import { getTranslations, setRequestLocale } from "next-intl/server";
import { requireAdminForPage, requireAdminLocale } from "@/lib/admin/require-admin";
import { AdminCatalogRepository } from "@/lib/repositories/admin/admin-catalog.repository";
import {
  createFacultyAction,
  deleteFacultyAction,
  updateFacultyAction,
} from "@/lib/admin/admin-actions";
import { formInputClassName } from "@/components/form-styles";
import {
  adminDangerButtonClassName,
  adminPrimaryButtonClassName,
  Field,
} from "../admin-field";

export default async function AdminFacultiesPage({
  params,
  searchParams,
}: PageProps<"/[locale]/admin/faculties"> & {
  searchParams?: Promise<Record<string, string | undefined>>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  requireAdminLocale(locale);
  setRequestLocale(locale);

  const supabase = await requireAdminForPage(locale);
  const t = await getTranslations("Admin");

  const repo = new AdminCatalogRepository(supabase!);
  const [faculties, universities] = await Promise.all([
    repo.listFaculties(),
    repo.listUniversities(),
  ]);

  const editing = faculties.find((f) => f.id === sp?.edit) ?? null;

  return (
    <div className="space-y-8">
      <h2 className="font-headline-sm text-headline-sm text-primary">
        {t("facultiesHeading")}
      </h2>

      <form
        action={editing ? updateFacultyAction : createFacultyAction}
        className="space-y-4 rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-6"
      >
        {editing && <input type="hidden" name="id" value={editing.id} />}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label={t("facultiesName")} required>
            <input
              name="name"
              required
              defaultValue={editing?.name ?? ""}
              className={formInputClassName}
            />
          </Field>
          <Field label={t("facultiesUniversity")} required>
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
          <Field label={t("universitiesWebsiteUrl")}>
            <input
              name="website_url"
              type="url"
              defaultValue={editing?.website_url ?? ""}
              className={formInputClassName}
            />
          </Field>
          <Field label={t("universitiesDescription")}>
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
        <form action={deleteFacultyAction}>
          <input type="hidden" name="id" value={editing.id} />
          <button type="submit" className={adminDangerButtonClassName}>
            {t("commonDelete")}
          </button>
        </form>
      )}

      {faculties.length > 0 ? (
        <ul className="space-y-2">
          {faculties.map((f) => (
            <li
              key={f.id}
              className="rounded-lg border border-outline-variant/60 bg-surface-container-lowest p-4 flex items-center justify-between gap-4"
            >
              <div className="min-w-0">
                <p className="font-body-md text-body-md text-on-surface truncate">
                  {f.name}
                </p>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  {f.university?.name ?? "—"}
                </p>
              </div>
              <a
                href={`?edit=${f.id}`}
                className="font-label-caps text-label-caps text-primary underline shrink-0"
              >
                {t("commonEdit")}
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          {t("facultiesNone")}
        </p>
      )}
    </div>
  );
}