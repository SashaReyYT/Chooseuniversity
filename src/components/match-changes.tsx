"use client";

import { useMatchChanges, type MatchScoreChange } from "@/hooks/use-match-changes";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

interface MatchChangesBannerProps {
  /** Maximum number of changes to show before "Show more" */
  maxVisible?: number;
}

export function MatchChangesBanner({ maxVisible = 3 }: MatchChangesBannerProps) {
  const { changes, isLoading, dismissChange, dismissAll } = useMatchChanges();
  const t = useTranslations("MatchChanges");

  if (isLoading || changes.length === 0) {
    return null;
  }

  const visibleChanges = changes.slice(0, maxVisible);
  const hiddenCount = changes.length - maxVisible;

  return (
    <section className="mb-8" aria-live="polite" aria-label={t("bannerLabel")}>
      <div className="rounded-xl border border-primary/40 bg-primary-fixed/10 p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary" aria-hidden="true">
              trending_up
            </span>
            <div>
              <h3 className="font-headline-sm text-headline-sm text-primary">
                {t("title")}
              </h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                {t("subtitle", { count: changes.length })}
              </p>
            </div>
          </div>
          {changes.length > 1 && (
            <button
              onClick={dismissAll}
              className="font-label-caps text-label-caps text-on-surface-variant hover:text-primary transition-colors shrink-0"
            >
              {t("dismissAll")}
            </button>
          )}
        </div>

        <ul className="space-y-3" role="list">
          {visibleChanges.map((change) => (
            <li key={change.programmeId} className="flex items-center gap-4 p-3 rounded-lg bg-surface-container-lowest border border-outline-variant/40">
              <div className={`flex items-center gap-2 shrink-0 ${
                change.direction === "up" ? "text-success" : "text-error"
              }`}>
                <span className="material-symbols-outlined" aria-hidden="true">
                  {change.direction === "up" ? "arrow_upward" : "arrow_downward"}
                </span>
                <span className="font-data-lg text-data-lg font-semibold">
                  {change.direction === "up" ? "+" : ""}{change.change}%
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <Link
                  href={`/programmes/${change.programmeId}`}
                  className="font-headline-sm text-headline-sm text-primary hover:underline truncate block"
                >
                  {change.programmeName}
                </Link>
                <p className="font-body-sm text-body-sm text-on-surface-variant truncate">
                  {change.universityName}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0 text-sm">
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  {change.beforeScore}%
                </span>
                <span className="material-symbols-outlined text-on-surface-variant" aria-hidden="true">
                  arrow_forward
                </span>
                <span className={`font-data-lg text-data-lg ${
                  change.direction === "up" ? "text-success" : "text-error"
                }`}>
                  {change.afterScore}%
                </span>
              </div>
              <button
                onClick={() => dismissChange(change.programmeId)}
                className="shrink-0 p-1 text-on-surface-variant hover:text-primary transition-colors"
                aria-label={t("dismissChange", { name: change.programmeName })}
              >
                <span className="material-symbols-outlined" aria-hidden="true">close</span>
              </button>
            </li>
          ))}
        </ul>

        {hiddenCount > 0 && (
          <div className="pt-2 text-center">
            <Link
              href="/discover"
              className="font-label-caps text-label-caps text-primary underline"
            >
              {t("viewAllChanges", { count: hiddenCount })}
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

/**
 * Toast-style notification for a single significant change.
 * Shows briefly when a match score changes significantly.
 */
export function MatchChangeToast({ change, onDismiss }: { change: MatchScoreChange; onDismiss: () => void }) {
  const t = useTranslations("MatchChanges");
  
  return (
    <div className={`fixed bottom-4 right-4 z-50 rounded-xl border border-outline-variant/40 bg-surface-container-low p-4 shadow-xl animate-slide-up flex items-center gap-3 max-w-md ${change.direction === "up" ? "border-success/50" : "border-error/50"}`} role="status" aria-live="polite">
      <div className={`flex items-center gap-2 shrink-0 ${change.direction === "up" ? "text-success" : "text-error"}`}>
        <span className="material-symbols-outlined" aria-hidden="true">
          {change.direction === "up" ? "arrow_upward" : "arrow_downward"}
        </span>
        <span className="font-data-lg text-data-lg font-semibold">
          {change.direction === "up" ? "+" : ""}{change.change}%
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-headline-sm text-headline-sm text-primary truncate">
          {change.programmeName}
        </p>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          {t("toastSubtitle", { university: change.universityName })}
        </p>
      </div>
      <button onClick={onDismiss} className="shrink-0 p-1 text-on-surface-variant hover:text-primary transition-colors">
        <span className="material-symbols-outlined" aria-hidden="true">close</span>
      </button>
    </div>
  );
}