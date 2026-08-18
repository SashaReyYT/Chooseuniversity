import { getTranslations, setRequestLocale } from "next-intl/server";
import { requireAdminForPage, requireAdminLocale } from "@/lib/admin/require-admin";
import { AdminImportsRepository } from "@/lib/repositories/admin/admin-imports.repository";
import { runImportAction } from "@/lib/admin/admin-actions";
import { formInputClassName } from "@/components/form-styles";
import { adminPrimaryButtonClassName, Field } from "../admin-field";
import { Link } from "@/i18n/navigation";

/** Compile-time checked Admin message keys. */
type AdminKey = Parameters<Awaited<ReturnType<typeof getTranslations<"Admin">>>>[0];

const STATUS_LABEL_KEYS: Record<string, AdminKey> = {
  parsed: "importsStatus",
  validated: "importsStatus",
  review: "importsErrors",
  imported: "importsStatusImported",
  failed: "importsStatusFailed",
};

export default async function AdminImportsPage({
  params,
}: PageProps<"/[locale]/admin/imports">) {
  const { locale } = await params;
  requireAdminLocale(locale);
  setRequestLocale(locale);

  const supabase = await requireAdminForPage(locale);
  const t = await getTranslations("Admin");

  const imports = await new AdminImportsRepository(supabase!).listImports();
  const dateFormatter = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" });

  return (
    <div className="space-y-6">
      <h2 className="font-headline-sm text-headline-sm text-primary">
        {t("importsHeading")}
      </h2>
      <p className="font-body-sm text-body-sm text-on-surface-variant">
        {t("importsDescription")}
      </p>

      <form
        action={runImportAction}
        className="space-y-4 rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-6"
      >
        <p className="font-headline-sm text-headline-sm text-primary">
          {t("importsUploadHeading")}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label={t("importsFile")} required>
            <input
              name="file"
              type="file"
              accept=".json,.csv"
              required
              className={formInputClassName}
            />
          </Field>
          <Field label={t("importsSourceName")}>
            <input name="source_name" className={formInputClassName} />
          </Field>
          <Field label={t("importsSourceUrl")}>
            <input
              name="source_url"
              type="url"
              className={formInputClassName}
            />
          </Field>
        </div>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          {t("importsJsonHint")}
          <br />
          {t("importsCsvHint")}
        </p>
        <button type="submit" className={adminPrimaryButtonClassName}>
          {t("importsRun")}
        </button>
      </form>

      {imports.length > 0 ? (
        <ul className="space-y-2">
          {imports.map((imp) => (
            <li
              key={imp.id}
              className="rounded-lg border border-outline-variant/60 bg-surface-container-lowest p-4 flex items-center justify-between gap-4"
            >
              <div className="min-w-0">
                <p className="font-body-md text-body-md text-on-surface truncate">
                  {imp.source_name}
                </p>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  {imp.format.toUpperCase()} · {imp.row_count} {t("importsRows")} ·{" "}
                  {dateFormatter.format(new Date(imp.created_at))}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span
                  className={`font-label-caps text-label-caps ${
                    imp.status === "review" ? "text-warning" : "text-success"
                  }`}
                >
                  {t(STATUS_LABEL_KEYS[imp.status] ?? "importsStatus")}
                </span>
                {imp.status === "review" && (
                  <Link
                    href={`/admin/imports/${imp.id}`}
                    className="font-label-caps text-label-caps text-primary underline"
                  >
                    {t("importsViewErrors")}
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          {t("importsNoImports")}
        </p>
      )}
    </div>
  );
}