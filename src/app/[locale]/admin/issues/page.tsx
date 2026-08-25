import { getTranslations, setRequestLocale } from "next-intl/server";
import { requireAdminForPage, requireAdminLocale } from "@/lib/admin/require-admin";
import { resolveIssueAction } from "@/lib/admin/issue-actions";

interface IssueRow {
  id: string;
  programme_id: string;
  field: string;
  message: string;
  status: string;
  created_at: string;
  programmes?: { name: string } | null;
}

export default async function AdminIssuesPage({
  params,
}: PageProps<"/[locale]/admin/issues">) {
  const { locale } = await params;
  requireAdminLocale(locale);
  setRequestLocale(locale);

  const supabase = await requireAdminForPage(locale);
  const t = await getTranslations("Admin");
  const dateFmt = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });

  const { data: issues } = await supabase!
    .from("data_issue_reports")
    .select("id, programme_id, field, message, status, created_at, programmes(name)")
    .order("created_at", { ascending: false })
    .limit(100);

  const rows = (issues ?? []) as unknown as IssueRow[];
  const open = rows.filter((r) => r.status === "open");
  const resolved = rows.filter((r) => r.status === "resolved");

  return (
    <div className="space-y-8">
      <h2 className="font-headline-sm text-headline-sm text-primary">
        {t("issuesTitle")}
      </h2>

      {rows.length === 0 ? (
        <p className="font-body-md text-body-md text-on-surface-variant">
          {t("issuesEmpty")}
        </p>
      ) : (
        <>
          <section className="space-y-3" aria-label={t("issuesOpenSection")}>
            <h3 className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wide">
              {t("issuesOpenSection")} ({open.length})
            </h3>
            {open.length === 0 ? (
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                {t("issuesEmpty")}
              </p>
            ) : (
              <ul className="space-y-3">
                {open.map((issue) => (
                  <li
                    key={issue.id}
                    className="rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-5 space-y-2"
                  >
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="font-label-caps text-label-caps text-on-primary bg-primary rounded-full px-3 py-0.5">
                        {issue.field}
                      </span>
                      <span className="font-body-sm text-body-sm text-on-surface truncate">
                        {issue.programmes?.name ?? issue.programme_id}
                      </span>
                      <span className="font-body-xs text-body-xs text-on-surface-variant">
                        {dateFmt.format(new Date(issue.created_at))}
                      </span>
                    </div>
                    <p className="font-body-md text-body-md text-on-surface">
                      {issue.message}
                    </p>
                    <form action={resolveIssueAction}>
                      <input type="hidden" name="issueId" value={issue.id} />
                      <button
                        type="submit"
                        className="font-label-caps text-label-caps text-success border border-success/40 rounded-full px-4 py-2 hover:bg-success/5 transition-colors"
                      >
                        {t("markResolved")}
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {resolved.length > 0 && (
            <section className="space-y-3" aria-label={t("issuesResolvedSection")}>
              <h3 className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wide">
                {t("issuesResolvedSection")} ({resolved.length})
              </h3>
              <ul className="space-y-2">
                {resolved.slice(0, 20).map((issue) => (
                  <li
                    key={issue.id}
                    className="rounded-lg border border-outline-variant/40 p-4 opacity-70"
                  >
                    <p className="font-body-sm text-body-sm text-on-surface">
                      <span className="font-label-caps text-label-caps mr-2">{issue.field}</span>
                      {issue.programmes?.name ?? ""} — {issue.message}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}