"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { submitDataIssue, type DataIssueState } from "@/lib/programmes/report-action";

const initialState: DataIssueState = { error: null };

/**
 * Collapsible "found an inaccuracy?" form on the programme detail page.
 * Reports land in data_issue_reports for admin triage (/admin/issues).
 */
export function ReportIssueForm({ programmeId }: { programmeId: string }) {
  const t = useTranslations("ProgrammeDetails");
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(
    submitDataIssue,
    initialState,
  );

  return (
    <section className="pt-4 border-t border-outline-variant/20">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors inline-flex items-center gap-1"
      >
        <span className="material-symbols-outlined text-base" aria-hidden="true">
          flag
        </span>
        {t("reportCta")}
      </button>

      {state.sent ? (
        <p role="status" className="mt-3 font-body-sm text-body-sm text-success">
          {t("reportThanks")}
        </p>
      ) : open ? (
        <form action={formAction} className="mt-3 space-y-3 max-w-md">
          <input type="hidden" name="programmeId" value={programmeId} />

          <div className="space-y-1">
            <label
              htmlFor="issue-field"
              className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wide"
            >
              {t("reportFieldLabel")}
            </label>
            <select
              id="issue-field"
              name="field"
              defaultValue="other"
              className="w-full font-body-sm text-body-sm bg-surface-container-lowest border border-outline-variant rounded-lg px-4 py-2.5"
            >
              <option value="tuition">{t("reportFieldTuition")}</option>
              <option value="requirements">{t("reportFieldRequirements")}</option>
              <option value="deadline">{t("reportFieldDeadline")}</option>
              <option value="documents">{t("reportFieldDocuments")}</option>
              <option value="other">{t("reportFieldOther")}</option>
            </select>
          </div>

          <div className="space-y-1">
            <label
              htmlFor="issue-message"
              className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wide"
            >
              {t("reportMessageLabel")}
            </label>
            <textarea
              id="issue-message"
              name="message"
              required
              minLength={4}
              maxLength={1000}
              rows={3}
              className="w-full font-body-sm text-body-sm bg-surface-container-lowest border border-outline-variant rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {state.error ? (
            <p className="font-body-sm text-body-sm text-error">
              {t("reportError")}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isPending}
            className="font-label-caps text-label-caps text-on-primary bg-primary rounded-full px-6 py-2.5 disabled:opacity-60 transition-all active:scale-95"
          >
            {isPending ? t("reportPending") : t("reportSubmit")}
          </button>
        </form>
      ) : null}
    </section>
  );
}