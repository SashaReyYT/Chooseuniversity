import { getTranslations, setRequestLocale } from "next-intl/server";
import { requireAdminForPage, requireAdminLocale } from "@/lib/admin/require-admin";
import { AdminCatalogRepository } from "@/lib/repositories/admin/admin-catalog.repository";
import { AdminCostsRepository } from "@/lib/repositories/admin/admin-costs.repository";
import { saveAccommodationAction } from "@/lib/admin/admin-actions";
import { formInputClassName } from "@/components/form-styles";
import { adminPrimaryButtonClassName, Field } from "../admin-field";

export default async function AdminAccommodationPage({
  params,
  searchParams,
}: PageProps<"/[locale]/admin/accommodation"> & {
  searchParams?: Promise<Record<string, string | undefined>>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  requireAdminLocale(locale);
  setRequestLocale(locale);

  const supabase = await requireAdminForPage(locale);
  const t = await getTranslations("Admin");

  const [universities, withData] = await Promise.all([
    new AdminCatalogRepository(supabase!).listUniversities(),
    new AdminCostsRepository(supabase!).listAccommodationWithUniversity(),
  ]);

  const editing = universities.find((u) => u.id === sp?.edit) ?? null;
  const acc = withData.find((a) => a.university_id === editing?.id) ?? null;

  return (
    <div className="space-y-6">
      <h2 className="font-headline-sm text-headline-sm text-primary">
        {t("accommodationHeading")}
      </h2>
      <p className="font-body-sm text-body-sm text-on-surface-variant">
        {t("accommodationDescription")}
      </p>

      <ul className="flex flex-wrap gap-2">
        {universities.map((u) => (
          <li key={u.id}>
            <a
              href={`?edit=${u.id}`}
              className={`font-label-caps text-label-caps px-4 py-2 rounded-full border transition-colors ${
                editing?.id === u.id
                  ? "bg-primary text-on-primary border-primary"
                  : "border-outline-variant text-on-surface-variant hover:bg-surface-container"
              }`}
            >
              {u.name}
            </a>
          </li>
        ))}
      </ul>

      {editing && (
        <form
          action={saveAccommodationAction}
          className="space-y-4 rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-6"
        >
          <input type="hidden" name="university_id" value={editing.id} />
          <p className="font-body-md text-body-md text-primary">{editing.name}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex items-center gap-2 font-body-sm text-body-sm text-on-surface">
              <input
                type="checkbox"
                name="dormitory_available"
                defaultChecked={acc?.dormitory_available ?? false}
              />
              {t("accommodationDormitoryAvailable")}
            </label>
            <Field label={t("accommodationDormitoryName")}>
              <input
                name="dormitory_name"
                defaultValue={acc?.dormitory_name ?? ""}
                className={formInputClassName}
              />
            </Field>
            <Field label={t("accommodationRoomType")}>
              <input
                name="room_type"
                defaultValue={acc?.room_type ?? ""}
                className={formInputClassName}
              />
            </Field>
            <Field label={t("accommodationCostMin")}>
              <input
                name="estimated_monthly_cost_min"
                type="number"
                step="any"
                defaultValue={acc?.estimated_monthly_cost_min ?? ""}
                className={formInputClassName}
              />
            </Field>
            <Field label={t("accommodationCostMax")}>
              <input
                name="estimated_monthly_cost_max"
                type="number"
                step="any"
                defaultValue={acc?.estimated_monthly_cost_max ?? ""}
                className={formInputClassName}
              />
            </Field>
            <Field label={t("accommodationCurrency")}>
              <input
                name="currency"
                defaultValue={acc?.currency ?? ""}
                className={formInputClassName}
              />
            </Field>
            <Field label={t("accommodationDeposit")}>
              <input
                name="estimated_deposit"
                type="number"
                step="any"
                defaultValue={acc?.estimated_deposit ?? ""}
                className={formInputClassName}
              />
            </Field>
            <Field label={t("accommodationCapacity")}>
              <input
                name="estimated_capacity"
                type="number"
                defaultValue={acc?.estimated_capacity ?? ""}
                className={formInputClassName}
              />
            </Field>
            <Field label={t("accommodationDistanceKm")}>
              <input
                name="distance_from_campus_km"
                type="number"
                step="any"
                defaultValue={acc?.distance_from_campus_km ?? ""}
                className={formInputClassName}
              />
            </Field>
            <Field label={t("accommodationOfficialLink")}>
              <input
                name="official_link"
                type="url"
                defaultValue={acc?.official_link ?? ""}
                className={formInputClassName}
              />
            </Field>
            <Field label={t("accommodationSourceUrl")}>
              <input
                name="source_url"
                type="url"
                defaultValue={acc?.source_url ?? ""}
                className={formInputClassName}
              />
            </Field>
            <Field label={t("accommodationSourceName")}>
              <input
                name="source_name"
                defaultValue={acc?.source_name ?? ""}
                className={formInputClassName}
              />
            </Field>
            <Field label={t("accommodationNotes")}>
              <input
                name="notes"
                defaultValue={acc?.notes ?? ""}
                className={formInputClassName}
              />
            </Field>
          </div>
          <button type="submit" className={adminPrimaryButtonClassName}>
            {t("commonSave")}
          </button>
        </form>
      )}

      <ul className="space-y-2">
        {withData.length > 0 ? (
          withData.map((a) => (
            <li
              key={a.id}
              className="rounded-lg border border-outline-variant/60 bg-surface-container-lowest p-4 flex items-center justify-between gap-4"
            >
              <div className="min-w-0">
                <p className="font-body-md text-body-md text-on-surface">
                  {a.university?.name ?? a.university_id}
                </p>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  {a.dormitory_name ?? "—"} ·{" "}
                  {a.estimated_monthly_cost_min != null
                    ? `${a.estimated_monthly_cost_min}–${a.estimated_monthly_cost_max} ${a.currency ?? ""}`
                    : "—"}
                </p>
              </div>
              <a
                href={`?edit=${a.university_id}`}
                className="font-label-caps text-label-caps text-primary underline shrink-0"
              >
                {t("commonEdit")}
              </a>
            </li>
          ))
        ) : (
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            {t("accommodationNone")}
          </p>
        )}
      </ul>
    </div>
  );
}