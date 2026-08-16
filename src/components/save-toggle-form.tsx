import { toggleSaveAction } from "@/lib/favourites/actions";

/**
 * Plain form-action toggle for "save/unsave this programme to the
 * shortlist" — same shape as `CompareToggleForm`
 * (`src/components/compare-toggle-form.tsx`), which mirrors
 * `toggleSaveAction`'s existing inline usage in
 * `src/app/[locale]/matches/match-card.tsx`. Pulling it out here lets
 * `ProgrammeCard` (catalog/favourites grids) and the programme detail
 * page use the same save button without duplicating the form markup.
 */
export function SaveToggleForm({
  programmeId,
  isSaved,
  saveLabel,
  unsaveLabel,
  variant = "outline",
}: {
  programmeId: string;
  isSaved: boolean;
  saveLabel: string;
  unsaveLabel: string;
  variant?: "outline" | "compact";
}) {
  const baseClassName =
    "font-label-caps text-label-caps rounded-full border transition-all active:scale-95 disabled:opacity-60";
  const sizeClassName = variant === "compact" ? "px-4 py-2" : "px-6 py-3";
  const toneClassName = isSaved
    ? "bg-primary text-on-primary border-primary"
    : "bg-transparent text-primary border-primary hover:bg-surface-container";

  return (
    <form action={toggleSaveAction}>
      <input type="hidden" name="programmeId" value={programmeId} />
      <input type="hidden" name="isSaved" value={String(isSaved)} />
      <button
        type="submit"
        className={`${baseClassName} ${sizeClassName} ${toneClassName}`}
      >
        {isSaved ? unsaveLabel : saveLabel}
      </button>
    </form>
  );
}
