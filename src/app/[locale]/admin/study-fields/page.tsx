import { getTranslations, setRequestLocale } from "next-intl/server";
import { requireAdminForPage, requireAdminLocale } from "@/lib/admin/require-admin";
import { AdminCatalogRepository } from "@/lib/repositories/admin/admin-catalog.repository";
import { createStudyFieldAction } from "@/lib/admin/admin-actions";
import { formInputClassName } from "@/components/form-styles";
import { adminPrimaryButtonClassName, Field } from "../admin-field";

export default async function AdminStudyFieldsPage({
  params,
}: PageProps<"/[locale]/admin/study-fields">) {
  const { locale } = await params;
  requireAdminLocale(locale);
  setRequestLocale(locale);

  const supabase = await requireAdminForPage(locale);
  const t = await getTranslations("Admin");

  const fields = await new AdminCatalogRepository(supabase!).listFieldsOfStudy();

  return (
    <div className="space-y-6">
      <h2 className="font-headline-sm text-headline-sm text-primary">
        {t("studyFieldsHeading")}
      </h2>

      <form
        action={createStudyFieldAction}
        className="space-y-4 rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label={t("commonName")} required>
            <input name="name" required className={formInputClassName} />
          </Field>
          <Field label={t("studyFieldsCategory")}>
            <input name="category" className={formInputClassName} />
          </Field>
          <Field label={t("studyFieldsSubcategory")}>
            <input name="subcategory" className={formInputClassName} />
          </Field>
        </div>
        <button type="submit" className={adminPrimaryButtonClassName}>
          {t("studyFieldsNew")}
        </button>
      </form>

      <ul className="space-y-2">
        {fields.map((f) => (
          <li
            key={f.id}
            className="rounded-lg border border-outline-variant/60 bg-surface-container-lowest p-4"
          >
            <p className="font-body-md text-body-md text-on-surface">{f.name}</p>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              {f.category}
              {f.subcategory ? ` · ${f.subcategory}` : ""}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}