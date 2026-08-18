import { getTranslations, setRequestLocale } from "next-intl/server";
import { requireAdminForPage, requireAdminLocale } from "@/lib/admin/require-admin";
import { AdminCatalogRepository } from "@/lib/repositories/admin/admin-catalog.repository";
import {
  createUniversityAction,
  deleteUniversityAction,
  updateUniversityAction,
} from "@/lib/admin/admin-actions";
import { formInputClassName } from "@/components/form-styles";
import {
  adminDangerButtonClassName,
  adminPrimaryButtonClassName,
  Field,
} from "../admin-field";

export default async function AdminUniversitiesPage({
  params,
  searchParams,
}: PageProps<"/[locale]/admin/universities"> & {
  searchParams?: Promise<Record<string, string | undefined>>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  requireAdminLocale(locale);
  setRequestLocale(locale);

  const supabase = await requireAdminForPage(locale);
  const t = await getTranslations("Admin");

  const repo = new AdminCatalogRepository(supabase!);
  const [universities, countries] = await Promise.all([
    repo.listUniversities(),
    repo.listCountries(),
  ]);

  const editing = universities.find((u) => u.id === sp?.edit) ?? null;

  return (
    <div className="space-y-8">
      <h2 className="font-headline-sm text-headline-sm text-primary">
        {t("universitiesHeading")}
      </h2>

      {!editing && (
        <button
          form="university-form"
          type="submit"
          className="font-label-caps text-label-caps bg-primary text-on-primary px-5 py-2.5 rounded-full hover:bg-on-primary-fixed-variant transition-colors"
        >
          {t("universitiesNew")}
        </button>
      )}

      <form
        id="university-form"
        action={editing ? updateUniversityAction : createUniversityAction}
        className="space-y-4 rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-6"
      >
        {editing && <input type="hidden" name="id" value={editing.id} />}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label={t("commonName")} required>
            <input
              name="name"
              required
              defaultValue={editing?.name}
              className={formInputClassName}
            />
          </Field>
          <Field label={t("universitiesSlug")} hint={t("universitiesSlugHint")}>
            <input
              name="slug"
              defaultValue={editing?.slug ?? ""}
              className={formInputClassName}
            />
          </Field>
          <Field label={t("universitiesCountry")} required>
            <select
              name="country_code"
              required
              defaultValue={editing?.country_code ?? ""}
              className={formInputClassName}
            >
              <option value="">—</option>
              {countries.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </Field>
          <Field label={t("universitiesCity")} required>
            <input
              name="city"
              required
              defaultValue={editing?.city ?? ""}
              className={formInputClassName}
            />
          </Field>
          <Field label={t("universitiesWebsiteUrl")}>
            <input
              name="website_url"
              type="url"
              defaultValue={editing?.website_url ?? ""}
              className={formInputClassName}
            />
          </Field>
          <Field label={t("universitiesApplicationUrl")}>
            <input
              name="official_application_url"
              type="url"
              defaultValue={editing?.official_application_url ?? ""}
              className={formInputClassName}
            />
          </Field>
          <Field label={t("universitiesLogoUrl")}>
            <input
              name="logo_url"
              type="url"
              defaultValue={editing?.logo_url ?? ""}
              className={formInputClassName}
            />
          </Field>
          <Field label={t("universitiesCoverUrl")}>
            <input
              name="cover_image_url"
              type="url"
              defaultValue={editing?.cover_image_url ?? ""}
              className={formInputClassName}
            />
          </Field>
          <Field label={t("universitiesFoundedYear")}>
            <input
              name="founded_year"
              type="number"
              defaultValue={editing?.founded_year ?? ""}
              className={formInputClassName}
            />
          </Field>
          <Field label={t("universitiesStudentCount")}>
            <input
              name="student_count"
              type="number"
              defaultValue={editing?.student_count ?? ""}
              className={formInputClassName}
            />
          </Field>
          <Field label={t("universitiesInternationalPercentage")}>
            <input
              name="international_student_percentage"
              type="number"
              step="0.1"
              defaultValue={editing?.international_student_percentage ?? ""}
              className={formInputClassName}
            />
          </Field>
          <Field label={t("universitiesLatitude")}>
            <input
              name="latitude"
              type="number"
              step="any"
              defaultValue={editing?.latitude ?? ""}
              className={formInputClassName}
            />
          </Field>
          <Field label={t("universitiesLongitude")}>
            <input
              name="longitude"
              type="number"
              step="any"
              defaultValue={editing?.longitude ?? ""}
              className={formInputClassName}
            />
          </Field>
          <Field label={t("universitiesShortDescription")}>
            <input
              name="short_description"
              defaultValue={editing?.short_description ?? ""}
              className={formInputClassName}
            />
          </Field>
          <Field
            label={t("universitiesRankingData")}
            hint={t("universitiesRankingHint")}
          >
            <input
              name="ranking_data"
              defaultValue={
                editing?.ranking_data
                  ? JSON.stringify(editing.ranking_data)
                  : ""
              }
              className={formInputClassName}
            />
          </Field>
        </div>
        <Field label={t("universitiesDescription")}>
          <textarea
            name="description"
            rows={4}
            defaultValue={editing?.description ?? ""}
            className={formInputClassName}
          />
        </Field>
        <label className="flex items-center gap-2 font-body-sm text-body-sm text-on-surface">
          <input
            type="checkbox"
            name="published"
            defaultChecked={editing ? editing.published : true}
          />
          {t("universitiesPublished")}
        </label>
        <div className="flex gap-3">
          <button
            type="submit"
            className={adminPrimaryButtonClassName}
          >
            {t("commonSave")}
          </button>
        </div>
      </form>

      {editing && (
        <form action={deleteUniversityAction}>
          <input type="hidden" name="id" value={editing.id} />
          <button type="submit" className={adminDangerButtonClassName}>
            {t("commonDelete")}
          </button>
        </form>
      )}

      {universities.length > 0 ? (
        <ul className="space-y-2">
          {universities.map((u) => (
            <li
              key={u.id}
              className="rounded-lg border border-outline-variant/60 bg-surface-container-lowest p-4 flex items-center justify-between gap-4"
            >
              <div className="min-w-0">
                <p className="font-body-md text-body-md text-on-surface truncate">
                  {u.name}
                  {!u.published && (
                    <span className="text-on-surface-variant"> · {t("commonUnpublished")}</span>
                  )}
                </p>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  {u.city}
                  {u.country ? `, ${u.country.name}` : ""} · {u.slug ?? "—"}
                </p>
              </div>
              <a
                href={`?edit=${u.id}`}
                className="font-label-caps text-label-caps text-primary underline shrink-0"
              >
                {t("commonEdit")}
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          {t("universitiesNone")}
        </p>
      )}
    </div>
  );
}