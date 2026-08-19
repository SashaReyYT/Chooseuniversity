import { getTranslations, setRequestLocale } from "next-intl/server";
import { requireAdminForPage, requireAdminLocale } from "@/lib/admin/require-admin";
import { syncCurrencyRatesAction } from "@/lib/admin/admin-actions";
import { syncEcbRates } from "@/lib/services/currency-sync.service";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { adminPrimaryButtonClassName } from "../admin-field";

const STALE_AFTER_MS = 24 * 60 * 60 * 1000;

type CurrencyRateRow = Database["public"]["Tables"]["currency_rates"]["Row"];

async function listRates(
  supabase: SupabaseClient<Database>,
): Promise<CurrencyRateRow[]> {
  const { data, error } = await supabase.from("currency_rates").select("*").order("currency");
  if (error) throw error;
  return data;
}

/**
 * Returns the rates, auto-syncing from the ECB's free daily feed when the
 * newest stored rate is older than 24h (or the table is empty). A failed
 * sync falls back to the stored rates — the manual button can retry.
 */
async function loadRatesWithAutoSync(
  supabase: SupabaseClient<Database>,
): Promise<CurrencyRateRow[]> {
  const rates = await listRates(supabase);
  const newest = rates.reduce(
    (max, r) => Math.max(max, new Date(r.updated_at).getTime()),
    0,
  );
  if (rates.length === 0 || Date.now() - newest > STALE_AFTER_MS) {
    try {
      await syncEcbRates(supabase);
      return await listRates(supabase);
    } catch {
      return rates;
    }
  }
  return rates;
}

export default async function AdminCurrencyPage({
  params,
}: PageProps<"/[locale]/admin/currency">) {
  const { locale } = await params;
  requireAdminLocale(locale);
  setRequestLocale(locale);

  const supabase = await requireAdminForPage(locale);
  const t = await getTranslations("Admin");

  const rates = await loadRatesWithAutoSync(supabase!);

  const newest = rates.reduce(
    (max, r) => Math.max(max, new Date(r.updated_at).getTime()),
    0,
  );
  const lastSynced = newest > 0 ? new Date(newest) : null;
  const dateFormatter = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className="space-y-6">
      <h2 className="font-headline-sm text-headline-sm text-primary">
        {t("currencyHeading")}
      </h2>
      <p className="font-body-sm text-body-sm text-on-surface-variant">
        {t("currencyDescription")}
      </p>

      <div className="flex items-center justify-between gap-4">
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          {lastSynced
            ? t("currencyLastSynced", { date: lastSynced })
            : t("currencyNeverSynced")}
        </p>
        <form action={syncCurrencyRatesAction}>
          <button type="submit" className={adminPrimaryButtonClassName}>
            {t("currencySync")}
          </button>
        </form>
      </div>

      <div className="overflow-x-auto rounded-xl border border-outline-variant/60 bg-surface-container-lowest">
        <table className="w-full text-left">
          <thead>
            <tr className="font-label-caps text-label-caps text-on-surface-variant border-b border-outline-variant/60">
              <th className="px-4 py-3">{t("currencyColumn")}</th>
              <th className="px-4 py-3">{t("currencyRate")}</th>
              <th className="px-4 py-3">{t("currencyUpdated")}</th>
            </tr>
          </thead>
          <tbody className="font-body-sm text-body-sm text-on-surface">
            {rates.map((rate) => (
              <tr key={rate.currency} className="border-b border-outline-variant/40 last:border-0">
                <td className="px-4 py-3 font-medium">{rate.currency}</td>
                <td className="px-4 py-3">
                  {new Intl.NumberFormat(locale, {
                    maximumSignificantDigits: 5,
                  }).format(rate.rate_to_eur)}{" "}
                  EUR
                </td>
                <td className="px-4 py-3 text-on-surface-variant">
                  {dateFormatter.format(new Date(rate.updated_at))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="font-body-sm text-body-sm text-on-surface-variant">
        {t("currencyNote")}
      </p>
    </div>
  );
}