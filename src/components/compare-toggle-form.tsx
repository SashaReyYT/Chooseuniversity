import { toggleComparisonAction } from "@/lib/comparison/actions";

/**
 * Plain form-action toggle for "add/remove this programme to/from
 * comparison" — mirrors the save button's `<form action={toggleSaveAction}>`
 * pattern in `src/app/[locale]/matches/match-card.tsx` rather than a
 * client component with its own state, so it works identically wherever
 * it's dropped (catalog grid, match card, compare page) without needing
 * a comparison id passed down.
 */
export function CompareToggleForm({
  programmeId,
  inComparison,
  addLabel,
  removeLabel,
  variant = "outline",
}: {
  programmeId: string;
  inComparison: boolean;
  addLabel: string;
  removeLabel: string;
  variant?: "outline" | "compact";
}) {
  const baseClassName =
    "font-label-caps text-label-caps rounded-full border transition-all active:scale-95 disabled:opacity-60";
  const sizeClassName = variant === "compact" ? "px-4 py-2" : "px-6 py-3";
  const toneClassName = inComparison
    ? "bg-primary text-on-primary border-primary"
    : "bg-transparent text-primary border-primary hover:bg-surface-container";

  return (
    <form action={toggleComparisonAction}>
      <input type="hidden" name="programmeId" value={programmeId} />
      <input type="hidden" name="inComparison" value={String(inComparison)} />
      <button
        type="submit"
        className={`${baseClassName} ${sizeClassName} ${toneClassName}`}
      >
        {inComparison ? removeLabel : addLabel}
      </button>
    </form>
  );
}
