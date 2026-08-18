/**
 * Exchange rate table used by Budget Fit for cross-currency comparisons
 * (spec §15, §26–§27). Keyed by ISO 4217 currency code; each value is
 * the number of EUR one unit of that currency is worth — see
 * `supabase/migrations/0012_currency_rates.sql`.
 *
 * A plain object (not a DB row shape) so the matching engine — which is
 * pure, deterministic TypeScript with no database access — can stay
 * that way. The service layer loads the real rates and passes them in.
 */
export type CurrencyRateTable = Record<string, number>;

/**
 * Converts `amount` from `fromCurrency` to `toCurrency` via the shared
 * EUR base in `rates`.
 *
 * Returns `null` — never throws, never guesses — when either currency's
 * rate isn't in the table. Callers must treat `null` as "conversion
 * genuinely unavailable" (spec §29: UNKNOWN, not a false pass/fail),
 * not fall back to comparing the raw numbers as if the currencies were
 * equal.
 */
export function convertAmount(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: CurrencyRateTable,
): number | null {
  if (fromCurrency === toCurrency) return amount;

  const fromRate = rates[fromCurrency];
  const toRate = rates[toCurrency];
  if (fromRate == null || toRate == null) return null;

  const amountInEur = amount * fromRate;
  return amountInEur / toRate;
}
