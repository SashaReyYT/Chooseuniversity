import { formLabelClassName } from "@/components/form-styles";

/** Label + control + optional hint block shared by all admin forms. */
export function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className={formLabelClassName}>
        {label}
        {required && " *"}
      </label>
      {children}
      {hint && (
        <p className="font-body-sm text-body-sm text-on-surface-variant">{hint}</p>
      )}
    </div>
  );
}

export const adminPrimaryButtonClassName =
  "font-label-caps text-label-caps bg-primary text-on-primary px-6 py-3 rounded-full hover:bg-on-primary-fixed-variant transition-colors";

export const adminDangerButtonClassName =
  "font-label-caps text-label-caps bg-error text-on-error px-6 py-3 rounded-full transition-colors";