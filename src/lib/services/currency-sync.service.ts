import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export interface EcbReferenceRate {
  /** ISO 4217 code as published by the ECB (e.g. "USD"). */
  currency: string;
  /** Units of EUR that one unit of `currency` is worth (ECB's inverse). */
  rateToEur: number;
}

/**
 * Fetches the ECB's daily euro reference rates
 * (https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml) — a
 * free, key-less, daily-published feed (typically updated ~16:00 CET) —
 * and converts them to the `currency_rates.rate_to_eur` shape (units of
 * EUR per one unit of currency, i.e. the inverse of ECB's "1 EUR = X").
 *
 * The ECB publishes no EUR row — callers keep the existing EUR = 1 row.
 * Currencies absent from the feed are simply not returned; nothing here
 * ever deletes or invents rows.
 *
 * Parsing is deliberately dependency-free: the feed is a flat, stable
 * XML shape (`<Cube currency='USD' rate='1.0845'/>`), so a small regex
 * beats adding an XML parser for one endpoint. A malformed/unexpected
 * response (or a network error) throws — the caller decides whether to
 * surface that or fall back to the existing rates.
 */
export async function fetchEcbReferenceRates(
  fetcher: typeof fetch = fetch,
): Promise<EcbReferenceRate[]> {
  const response = await fetcher(
    "https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml",
    {
      headers: { Accept: "application/xml" },
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    },
  );
  if (!response.ok) {
    throw new Error(`ECB rate feed responded with HTTP ${response.status}`);
  }

  const xml = await response.text();
  const rates: EcbReferenceRate[] = [];
  const rowPattern = /<Cube\s+currency='([A-Z]{3})'\s+rate='([0-9.]+)'\s*\/>/g;
  let match: RegExpExecArray | null;
  while ((match = rowPattern.exec(xml)) !== null) {
    const rate = Number(match[2]);
    if (Number.isFinite(rate) && rate > 0) {
      rates.push({ currency: match[1], rateToEur: 1 / rate });
    }
  }

  if (rates.length === 0) {
    throw new Error("ECB rate feed contained no rate rows");
  }
  return rates;
}

/**
 * Fetches current ECB rates and upserts them into `currency_rates`
 * (admin-only via RLS — call from an admin session). Returns the number
 * of currencies synced. EUR is deliberately not part of the feed and is
 * left untouched (1 EUR = 1).
 */
export async function syncEcbRates(
  supabase: SupabaseClient<Database>,
): Promise<number> {
  const rates = await fetchEcbReferenceRates();
  const { error } = await supabase.from("currency_rates").upsert(
    rates.map((r) => ({ currency: r.currency, rate_to_eur: r.rateToEur })),
    { onConflict: "currency" },
  );
  if (error) throw error;
  return rates.length;
}