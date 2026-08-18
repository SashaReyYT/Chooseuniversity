import { getTranslations } from "next-intl/server";
import type {
  MatchDimensionKey,
  MatchLabel,
  MatchMessage,
} from "@/lib/matching/engine";
import type { BestForLabel } from "@/lib/matching/best-for";

export type DiscoverTranslator = Awaited<
  ReturnType<typeof getTranslations<"Discover">>
>;
export type DiscoverKey = Parameters<DiscoverTranslator>[0];

export type MatchingTranslator = Awaited<
  ReturnType<typeof getTranslations>
>;

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
  tuition_min: number;
  tuition_max: number;
  tuition_currency: string;
}

/**
 * Shared by the programme card and the programme detail page so tuition
 * always reads the same way ("€8,000 / year" or "€8,000–€12,000 / year",
 * spec §49) everywhere it appears. Programme-level tuition is a range in
 * a canonical annual unit.
 */
export function formatTuition(
  programme: TuitionFields,
  locale: string,
  t: DiscoverTranslator,
): string {
  const money = (amount: number) =>
    new Intl.NumberFormat(locale, {
      style: "currency",
      currency: programme.tuition_currency,
      maximumFractionDigits: 0,
    }).format(amount);

  const amount =
    programme.tuition_max > programme.tuition_min
      ? `${money(programme.tuition_min)}–${money(programme.tuition_max)}`
      : money(programme.tuition_min);

  return `${amount} ${t("perYear")}`;
}
