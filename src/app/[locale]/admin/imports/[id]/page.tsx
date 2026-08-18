import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { requireAdminForPage, requireAdminLocale } from "@/lib/admin/require-admin";
import { AdminImportsRepository } from "@/lib/repositories/admin/admin-imports.repository";
import { Link } from "@/i18n/navigation";

export default async function AdminImportDetailPage({
  params,
}: PageProps<"/[locale]/admin/imports/[id]">) {
  const { locale, id } = await params;
  requireAdminLocale(locale);
  setRequestLocale(locale);

  const supabase = await requireAdminForPage(locale);
  const t = await getTranslations("Admin");

  const repo = new AdminImportsRepository(supabase!);
  const [importRow, errors] = await Promise.all([
    repo.findImport(id),
    repo.listErrors(id),
  ]);
  if (!importRow) notFound();

  const dateFormatter = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className="space-y-6">
      <Link
        href="/admin/imports"
        className="font-label-caps text-label-caps text-primary underline"
      >
        ← {t("importsBackToList")}
      </Link>

      <h2 className="font-headline-sm text-headline-sm text-primary">
        {t("importsDetail")}
      </h2>

      <div className="rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-5 space-y-1">
        <p className="font-body-md text-body-md text-on-surface">
          {importRow.source_name}
        </p>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          {importRow.format.toUpperCase()} · {importRow.row_count} {t("importsRows")} ·{" "}
          {dateFormatter.format(new Date(importRow.created_at))}
        </p>
        {importRow.source_url && (
          <a
            href={importRow.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-body-sm text-body-sm text-primary underline"
          >
            {importRow.source_url}
          </a>
        )}
      </div>

      {errors.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wide">
                <th className="py-2 pr-4 font-normal">{t("importsErrorRow")}</th>
                <th className="py-2 pr-4 font-normal">{t("importsErrorField")}</th>
                <th className="py-2 font-normal">{t("importsErrorMessage")}</th>
              </tr>
            </thead>
            <tbody>
              {errors.map((err) => (
                <tr
                  key={`${err.row_number}-${err.field}`}
                  className="border-t border-outline-variant/40 align-top"
                >
                  <td className="py-2 pr-4 font-body-sm text-body-sm text-on-surface">
                    {err.row_number}
                  </td>
                  <td className="py-2 pr-4 font-body-sm text-body-sm text-on-surface">
                    {err.field}
                  </td>
                  <td className="py-2 font-body-sm text-body-sm text-on-surface">
                    {err.message}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          {t("importsNoErrors")}
        </p>
      )}
    </div>
  );
}