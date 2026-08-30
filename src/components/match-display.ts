import { getTranslations } from "next-intl/server";
import type {
  MatchDimensionKey,
  MatchLabel,
  MatchMessage,
} from "@/lib/matching/engine";
import type { BestForLabel } from "@/lib/matching/best-for";
import { annualLivingCost } from "@/lib/matching/utils";

export type DiscoverTranslator = Awaited<
  ReturnType<typeof getTranslations<"Discover">>
>;
export type DiscoverKey = Parameters<DiscoverTranslator>[0];

export type MatchingTranslator = Awaited<
  ReturnType<typeof getTranslations>
>;

export { annualLivingCost };

/** Approximate exchange rates to USD (updated 2025). Used as fallback when live rates are unavailable. */
const APPROX_RATES_TO_USD: Record<string, number> = {
  EUR: 1.08,
  USD: 1,
  GBP: 1.27,
  CZK: 0.043,
  PLN: 0.25,
  CHF: 1.13,
  SEK: 0.095,
  DKK: 0.145,
  NOK: 0.094,
  UAH: 0.024,
  CAD: 0.74,
  AUD: 0.65,
  JPY: 0.0067,
  CNY: 0.14,
  INR: 0.012,
  BRL: 0.17,
  TRY: 0.03,
  RON: 0.22,
  HUF: 0.0027,
  BGN: 0.55,
  RSD: 0.0092,
  HRK: 0.14,
  KRW: 0.00073,
  SGD: 0.74,
  MYR: 0.22,
  THB: 0.028,
  VND: 0.000039,
  PHP: 0.017,
  IDR: 0.000061,
  ZAR: 0.054,
  MXN: 0.058,
  COP: 0.00024,
  PEN: 0.27,
  CLP: 0.001,
  ARS: 0.00096,
  EGP: 0.02,
  NGN: 0.00064,
  KES: 0.0077,
  GHS: 0.064,
};

/**
 * Converts `amount` from `fromCurrency` to USD using approximate rates.
 * Returns the amount in USD, or the original amount if conversion is unavailable.
 */
export function toUsd(amount: number, fromCurrency: string): number {
  if (fromCurrency === "USD") return amount;
  const rate = APPROX_RATES_TO_USD[fromCurrency];
  if (rate == null) return amount; // fallback: show original amount
  return Math.round(amount * rate);
}

/**
 * Formats a monetary amount in USD.
 */
export function formatUsd(
  amount: number,
  locale: string,
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Shared between the discover/saved list cards and the programme detail
 * page — anywhere a `MatchResult` gets rendered should map through these
 * same two lookups so the label/dimension copy never drifts between
 * views.
 */
export const LABEL_KEYS: Record<MatchLabel, DiscoverKey> = {
  "Excellent Fit": "labelExcellentFit",
  "Strong Fit": "labelStrongFit",
  "Good Fit": "labelGoodFit",
  "Potential Fit": "labelPotentialFit",
  "Weak Fit": "labelWeakFit",
};

/**
 * "Best For" recommendation labels (§34) → Discover message keys. An
 * explicit map (like LABEL_KEYS above) so a typo in a label name is a
 * compile error instead of a runtime missing-message crash.
 */
export const BEST_FOR_KEYS: Record<BestForLabel, DiscoverKey> = {
  "Best Overall": "bestForBestOverall",
  "Best Value": "bestForBestValue",
  "Best Academic": "bestForBestAcademic",
  "Best Admission Fit": "bestForBestAdmissionFit",
  "Best Career Fit": "bestForBestCareerFit",
  "Best Location Fit": "bestForBestLocationFit",
};

export const DIMENSION_KEYS: Record<MatchDimensionKey, DiscoverKey> = {
  academic: "dimensionAcademic",
  admission: "dimensionAdmission",
  budget: "dimensionBudget",
  language: "dimensionLanguage",
  location: "dimensionLocation",
  career: "dimensionCareer",
  format: "dimensionFormat",
  lifestyle: "dimensionLifestyle",
  support: "dimensionSupport",
};

export function renderMatchMessage(
  message: MatchMessage,
  tMatching: MatchingTranslator,
): string {
  if (message.type === "raw") return message.text;
  return tMatching(
    message.key as Parameters<MatchingTranslator>[0],
    message.params as never,
  );
}

interface TuitionFields {
  tuition_min: number | null;
  tuition_max: number | null;
  tuition_currency: string | null;
}

/**
 * Shared by the programme card and the programme detail page so tuition
 * always reads the same way ("€8,000 / year" or "€8,000–€12,000 / year",
 * spec §49) everywhere it appears. Programme-level tuition is a range in
 * a canonical annual unit. Tuition is null only for the Czech pass-2
 * programmes whose official pages state no public figure — those render
 * as an honest "tuition not published" instead of a fabricated number.
 */
export function formatTuition(
  programme: TuitionFields,
  locale: string,
  t: DiscoverTranslator,
): string {
  if (programme.tuition_min == null || programme.tuition_currency == null) {
    return t("tuitionUnknown");
  }

  const minUsd = toUsd(programme.tuition_min, programme.tuition_currency);
  const maxUsd = toUsd(programme.tuition_max ?? programme.tuition_min, programme.tuition_currency);

  const money = (amount: number) => formatUsd(amount, locale);

  const amount =
    maxUsd > minUsd
      ? `${money(minUsd)}–${money(maxUsd)}`
      : money(minUsd);

  return `${amount} ${t("perYear")}`;
}
