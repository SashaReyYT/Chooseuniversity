import { getTranslations, setRequestLocale } from "next-intl/server";
import { requireAdminForPage, requireAdminLocale } from "@/lib/admin/require-admin";
import { grantAdminAction, revokeAdminAction } from "@/lib/admin/admin-actions";
import { formInputClassName } from "@/components/form-styles";
import { adminPrimaryButtonClassName, Field } from "../admin-field";

export default async function AdminSettingsPage({
  params,
}: PageProps<"/[locale]/admin/settings">) {
  const { locale } = await params;
  requireAdminLocale(locale);
  setRequestLocale(locale);

  const supabase = await requireAdminForPage(locale);
  const t = await getTranslations("Admin");

  const { data: admins, error } = await supabase!.from("admin_users").select("*");
  if (error) throw error;

  const dateFormatter = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });

  return (
    <div className="space-y-6">
      <h2 className="font-headline-sm text-headline-sm text-primary">
        {t("settingsHeading")}
      </h2>
      <p className="font-body-sm text-body-sm text-on-surface-variant">
        {t("settingsDescription")}
      </p>

      <section className="space-y-3">
        <h3 className="font-headline-sm text-headline-sm text-primary">
          {t("settingsAdminUsers")}
        </h3>
        <form
          action={grantAdminAction}
          className="rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-6 space-y-4"
        >
          <Field label={t("settingsUserIdPlaceholder")} hint={t("settingsGrantHint")}>
            <input name="user_id" required className={formInputClassName} />
          </Field>
          <button type="submit" className={adminPrimaryButtonClassName}>
            {t("settingsGrant")}
          </button>
        </form>

        {admins && admins.length > 0 ? (
          <ul className="space-y-2">
            {admins.map((admin) => (
              <li
                key={admin.user_id}
                className="rounded-lg border border-outline-variant/60 bg-surface-container-lowest p-4 flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <p className="font-body-md text-body-md text-on-surface truncate">
                    {admin.user_id}
                  </p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    {t("settingsGrantedAt")}:{" "}
                    {dateFormatter.format(new Date(admin.created_at))}
                  </p>
                </div>
                <form action={revokeAdminAction}>
                  <input type="hidden" name="user_id" value={admin.user_id} />
                  <button
                    type="submit"
                    className="font-label-caps text-label-caps bg-error text-on-error px-5 py-2.5 rounded-full transition-colors shrink-0"
                  >
                    {t("settingsRevoke")}
                  </button>
                </form>
              </li>
            ))}
          </ul>
        ) : (
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            {t("settingsNoAdmins")}
          </p>
        )}
      </section>
    </div>
  );
}