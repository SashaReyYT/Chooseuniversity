import { Link } from "@/i18n/navigation";
import type { ReactNode } from "react";

export interface TopMatchCardData {
  programmeId: string;
  programmeName: string;
  universityName: string;
  city: string;
  score: number | null;
  label: string | null;
  tuition: string;
}

interface TopMatchCardProps {
  data: TopMatchCardData;
  /** "best" gets the highlighted border; safe/ambitious colour the badge. */
  category: "best" | "safe" | "ambitious";
  categoryLabel: string;
  categoryDesc: string;
  viewDetailsLabel: string;
  localePrefix: string;
  /** Present only in the client wrapper (whole-card click navigation). */
  onCardClick?: () => void;
  actions?: ReactNode;
}

const BADGE_STYLES = {
  best: "bg-primary text-on-primary",
  safe: "bg-success text-on-success",
  ambitious: "bg-warning text-on-warning",
} as const;

/**
 * Shared presentational card for the "top matches" blocks on /results and
 * /discover. Single source of truth so the two pages never drift.
 */
export function TopMatchCard({
  data,
  category,
  categoryLabel,
  categoryDesc,
  viewDetailsLabel,
  localePrefix,
  onCardClick,
  actions,
}: TopMatchCardProps) {
  return (
    <article
      className={`relative rounded-xl border border-outline-variant/40 bg-surface-container-low p-6 space-y-4 hover:border-primary/50 transition-colors ${
        onCardClick ? "cursor-pointer" : ""
      } ${category === "best" ? "border-primary/50 shadow-lg" : ""}`}
      onClick={onCardClick}
    >
      <span
        className={`absolute -top-3 left-4 z-10 font-label-caps text-label-caps rounded-full px-3 py-1 ${BADGE_STYLES[category]}`}
      >
        {categoryLabel}
      </span>

      {/* Name row with the save action pinned to the right */}
      <div className="flex items-start justify-between gap-3 pt-2">
        <div className="min-w-0 space-y-2">
          <p className="font-body-sm text-body-sm text-on-surface-variant truncate">
            {data.universityName}
          </p>
          <h3 className="font-headline-sm text-headline-sm text-primary line-clamp-1">
            {data.programmeName}
          </h3>
          <p className="font-body-sm text-body-sm text-on-surface-variant">{data.city}</p>
        </div>
        {/* stopPropagation keeps whole-card navigation out of the button */}
        {actions && (
          <div
            className="shrink-0"
            onClick={onCardClick ? (e) => e.stopPropagation() : undefined}
          >
            {actions}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <p className="font-display-lg text-display-lg text-primary leading-none">
          {data.score ?? "—"}%
        </p>
        {data.label && (
          <p className="font-headline-sm text-headline-sm text-on-surface-variant">
            {data.label}
          </p>
        )}
      </div>

      <p className="font-body-sm text-body-sm text-on-surface-variant">{categoryDesc}</p>

      <div className="pt-2 flex items-center justify-between">
        <Link
          href={`${localePrefix}/programmes/${data.programmeId}`}
          className="font-label-caps text-label-caps text-primary underline"
          onClick={
            onCardClick
              ? (e) => {
                  e.preventDefault();
                  onCardClick();
                }
              : undefined
          }
        >
          {viewDetailsLabel}
        </Link>
        <span className="font-body-sm text-body-sm text-on-surface-variant">
          {data.tuition}
        </span>
      </div>
    </article>
  );
}