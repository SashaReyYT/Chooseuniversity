import { getTranslations, setRequestLocale } from "next-intl/server";
import { requireAdminForPage, requireAdminLocale } from "@/lib/admin/require-admin";
import { AdminSourcesRepository } from "@/lib/repositories/admin/admin-sources.repository";
import { AdminCatalogRepository } from "@/lib/repositories/admin/admin-catalog.repository";
import { createSourceAction, deleteSourceAction } from "@/lib/admin/admin-actions";
import { formInputClassName } from "@/components/form-styles";
import {
  adminDangerButtonClassName,
  adminPrimaryButtonClassName,
  Field,
} from "../admin-field";

const SOURCE_TYPE_KEYS = {
  official_university: "sourcesTypeOfficialUniversity",
  official_faculty: "sourcesTypeOfficialFaculty",
  official_dormitory: "sourcesTypeOfficialDormitory",
  public_reference: "sourcesTypePublicReference",
} as const;

export default async function AdminSourcesPage({
  params,
}: PageProps<"/[locale]/admin/sources">) {
  const { locale } = await params;
  requireAdminLocale(locale);
  setRequestLocale(locale);

  const supabase = await requireAdminForPage(locale);
  const t = await getTranslations("Admin");

  const [sources, programmes, universities] = await Promise.all([
    new AdminSourcesRepository(supabase!).listSources(),
    new AdminCatalogRepository(supabase!).listProgrammes(),
    new AdminCatalogRepository(supabase!).listUniversities(),
  ]);

  return (
    <div className="space-y-6">
      <h2 className="font-headline-sm text-headline-sm text-primary">
        {t("sourcesHeading")}
      </h2>
      <p className="font-body-sm text-body-sm text-on-surface-variant">
        {t("sourcesDescription")}
      </p>

      <form
        action={createSourceAction}
        className="space-y-4 rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label={t("sourcesUrl")} required>
            <input name="url" type="url" required className={formInputClassName} />
          </Field>
          <Field label={t("sourcesName")} required>
            <input name="name" required className={formInputClassName} />
          </Field>
          <Field label={t("sourcesType")}>
            <select
              name="type"
              defaultValue="public_reference"
              className={formInputClassName}
            >
              {Object.entries(SOURCE_TYPE_KEYS).map(([value, key]) => (
                <option key={value} value={value}>
                  {t(key)}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t("sourcesLinkedProgrammes")}>
            <select name="link_programme_id" className={formInputClassName}>
              <option value="">—</option>
              {programmes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t("sourcesLinkedUniversities")}>
            <select name="link_university_id" className={formInputClassName}>
              <option value="">—</option>
              {universities.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Fact key">
            <input
              name="fact_key"
              defaultValue="general"
              className={formInputClassName}
            />
          </Field>
          <Field label="Notes">
            <input name="notes" className={formInputClassName} />
          </Field>
        </div>
        <button type="submit" className={adminPrimaryButtonClassName}>
          {t("commonAdd")}
        </button>
      </form>

      {sources.length > 0 ? (
        <ul className="space-y-2">
          {sources.map((s) => (
            <li
              key={s.id}
              className="rounded-lg border border-outline-variant/60 bg-surface-container-lowest p-4 flex items-center justify-between gap-4"
            >
              <div className="min-w-0">
                <p className="font-body-md text-body-md text-on-surface truncate">
                  {s.name}
                </p>
                <p className="font-body-sm text-body-sm text-on-surface-variant truncate">
                  {t(SOURCE_TYPE_KEYS[s.type])} · {s.url}
                </p>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  {s.programme_count} {t("sourcesLinkedProgrammes").toLowerCase()} ·{" "}
                  {s.university_count} {t("sourcesLinkedUniversities").toLowerCase()}
                </p>
              </div>
              <form action={deleteSourceAction}>
                <input type="hidden" name="id" value={s.id} />
                <button type="submit" className={adminDangerButtonClassName}>
                  {t("commonDelete")}
                </button>
              </form>
            </li>
          ))}
        </ul>
      ) : (
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          {t("sourcesNone")}
        </p>
      )}
    </div>
  );
}