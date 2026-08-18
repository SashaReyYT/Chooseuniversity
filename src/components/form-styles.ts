export const formInputClassName =
  "w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-3 font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary";

export const formSelectClassName = formInputClassName;

export const formMultiSelectClassName =
  "w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-3 font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary min-h-32";

export const formLabelClassName =
  "font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wide";

export const formHelperTextClassName =
  "font-body-sm text-body-sm text-on-surface-variant";

export const formRadioOptionClassName =
  "flex items-center gap-2 font-body-sm text-body-sm text-on-surface";

export const formPrimaryButtonClassName =
  "bg-primary text-on-primary font-label-caps text-label-caps px-8 py-4 rounded-full hover:bg-on-primary-fixed-variant transition-all active:scale-95 shadow-md disabled:opacity-60 disabled:pointer-events-none";

export const formSecondaryButtonClassName =
  "bg-transparent border border-outline-variant text-on-surface font-label-caps text-label-caps px-8 py-4 rounded-full hover:border-primary transition-colors active:scale-95 disabled:opacity-60 disabled:pointer-events-none";

export const formDangerButtonClassName =
  "font-label-caps text-label-caps bg-error text-on-error px-6 py-3 rounded-full hover:opacity-90 transition-colors";

export const formCheckboxOptionClassName =
  "flex items-center gap-2 font-body-sm text-body-sm text-on-surface";

/**
 * Selectable "tile" cards (spec §9 reference: the questionnaire wizard's
 * card-grid multi-select, e.g. country selection) — a bordered rounded
 * card that switches to a primary-tinted border + fill when selected,
 * with room for a small checkmark badge absolutely positioned in the
 * corner. Callers toggle between the base and `*Selected` variant based
 * on selection state.
 */
export const formTileOptionClassName =
  "relative flex flex-col items-center justify-center gap-1 rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-5 text-center transition-colors hover:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

export const formTileOptionSelectedClassName =
  "relative flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-primary bg-primary/5 px-4 py-5 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";