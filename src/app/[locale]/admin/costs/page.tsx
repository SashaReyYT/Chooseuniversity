import { getTranslations, setRequestLocale } from "next-intl/server";
import { requireAdminForPage, requireAdminLocale } from "@/lib/admin/require-admin";
import { ProgrammesRepository } from "@/lib/repositories/programmes.repository";
import { saveLivingCostsAction } from "@/lib/admin/admin-actions";
import { formInputClassName } from "@/components/form-styles";
import { adminPrimaryButtonClassName, Field } from "../admin-field";

const COST_FIELDS = [
  "accommodation",
  "food",
  "transport",
  "utilities",
  "internet_phone",
  "study_materials",
  "other",
  "total",
] as const;

export default async function AdminCostsPage({
  params,
  searchParams,
}: PageProps<"/[locale]/admin/costs"> & {
  searchParams?: Promise<Record<string, string | undefined>>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  requireAdminLocale(locale);
  setRequestLocale(locale);

  const supabase = await requireAdminForPage(locale);
  const t = await getTranslations("Admin");

  const programmes = await new ProgrammesRepository(supabase!).listWithDetails();
  const editing = programmes.find((p) => p.id === sp?.edit) ?? null;
  const est = editing?.living_cost_estimates;

  return (
    <div className="space-y-6">
      <h2 className="font-headline-sm text-headline-sm text-primary">
        {t("costsHeading")}
      </h2>
      <p className="font-body-sm text-body-sm text-on-surface-variant">
        {t("costsDescription")}
      </p>

      {editing && (
        <form
          action={saveLivingCostsAction}
          className="space-y-4 rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-6"
        >
          <input type="hidden" name="programme_id" value={editing.id} />
          <p className="font-body-md text-body-md text-primary">
            {editing.name} — {editing.university.name}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label={t("accommodationCurrency")}>
              <input
                name="currency"
                defaultValue={est?.currency ?? ""}
                className={formInputClassName}
              />
            </Field>
            {COST_FIELDS.map((field) => {
              const label = field
                .split("_")
                .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                .join(" ");
              return (
                <div key={field} className="grid grid-cols-2 gap-2">
                  <Field label={`${label} min`}>
                    <input
                      name={`${field}_min`}
                      type="number"
                      step="any"
                      defaultValue={est?.[`${field}_min`] ?? ""}
                      className={formInputClassName}
                    />
                  </Field>
                  <Field label={`${label} max`}>
                    <input
                      name={`${field}_max`}
                      type="number"
                      step="any"
                      defaultValue={est?.[`${field}_max`] ?? ""}
                      className={formInputClassName}
                    />
                  </Field>
                </div>
              );
            })}
            <Field label={t("accommodationSourceUrl")}>
              <input
                name="source_url"
                type="url"
                defaultValue={est?.source_url ?? ""}
                className={formInputClassName}
              />
            </Field>
            <Field label={t("accommodationSourceName")}>
              <input
                name="source_name"
                defaultValue={est?.source_name ?? ""}
                className={formInputClassName}
              />
            </Field>
            <Field label={t("accommodationNotes")}>
              <input
                name="notes"
                defaultValue={est?.notes ?? ""}
                className={formInputClassName}
              />
            </Field>
          </div>
          <button type="submit" className={adminPrimaryButtonClassName}>
            {t("costsEdit")}
          </button>
        </form>
      )}

      <ul className="space-y-2">
        {programmes.filter((p) => p.living_cost_estimates).length > 0 ? (
          programmes
            .filter((p) => p.living_cost_estimates)
            .map((p) => (
              <li
                key={p.id}
                className="rounded-lg border border-outline-variant/60 bg-surface-container-lowest p-4 flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <p className="font-body-md text-body-md text-on-surface truncate">
                    {p.name}
                  </p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    {t("costsTotalMonthly")}:{" "}
                    {p.living_cost_estimates!.total_min}–{p.living_cost_estimates!.total_max}{" "}
                    {p.living_cost_estimates!.currency ?? ""}
                  </p>
                </div>
                <a
                  href={`?edit=${p.id}`}
                  className="font-label-caps text-label-caps text-primary underline shrink-0"
                >
                  {t("costsEdit")}
                </a>
              </li>
            ))
        ) : (
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            {t("costsNone")}
          </p>
        )}
      </ul>
    </div>
  );
}