/**
 * Grid of card-styled checkboxes for a multi-select field — the
 * `unifind_personalized_matching_test` mockup's country-picker look
 * ("CZ / Czechia" cards with a checkmark badge when selected), reused
 * for any multi-select field. Plain checkbox inputs under the hood (not
 * client-side state) so it submits with the surrounding
 * `<form action={...}>` exactly like the native `<select multiple>` it
 * replaces — same `name`, same repeated-value semantics in FormData.
 */
export function ToggleCardGroup({
  name,
  options,
  defaultValues,
}: {
  name: string;
  options: { value: string; label: string; caption?: string }[];
  defaultValues: string[];
}) {
  const selected = new Set(defaultValues);

  return (
    <div className="grid grid-cols-2 gap-3">
      {options.map((option) => (
        <label
          key={option.value}
          className="group relative flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-outline-variant bg-surface-container-lowest px-4 py-5 text-center cursor-pointer transition-colors has-checked:border-primary has-checked:bg-primary-fixed/20"
        >
          <input
            type="checkbox"
            name={name}
            value={option.value}
            defaultChecked={selected.has(option.value)}
            className="peer sr-only"
          />
          <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary text-on-primary items-center justify-center text-xs hidden peer-checked:flex">
            ✓
          </span>
          {option.caption && (
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              {option.caption}
            </span>
          )}
          <span className="font-headline-sm text-headline-sm text-primary">
            {option.label}
          </span>
        </label>
      ))}
    </div>
  );
}
