import type { MatchResult, MatchDimensionResult } from "./engine";
import type { MatchDimensionKey } from "./match-types";
import type { MatchMessage } from "./messages";
import { translated } from "./messages";

/**
 * Human-readable explanations for match dimensions.
 * Converts raw scores + reasons/concerns into natural language.
 */

interface DimensionExplanation {
  label: string;
  summary: string;        // One-line summary for card view
  details: string[];      // Detailed explanations for expanded view
  icon: "success" | "warning" | "info";
}

/**
 * Get human-readable explanation for a dimension.
 * Uses the dimension's score, reasons, and concerns to generate natural language.
 */
export function getDimensionExplanation(
  dimension: MatchDimensionResult,
  tMatching: Awaited<ReturnType<typeof import("next-intl/server").getTranslations>> | null,
): DimensionExplanation {
  if (!dimension.applicable || dimension.score == null) {
    return {
      label: dimension.label,
      summary: "Not enough data to assess",
      details: ["This dimension could not be evaluated due to insufficient data."],
      icon: "info",
    };
  }

  const score = dimension.score;
  const reasons = dimension.reasons;
  const concerns = dimension.concerns;

  // Determine icon based on score
  const icon = score >= 80 ? "success" : score >= 60 ? "warning" : "info";

  // Generate summary based on score bands
  let summary = "";
  switch (dimension.key) {
    case "academic":
      if (score >= 90) summary = "Excellent academic fit";
      else if (score >= 80) summary = "Strong academic match";
      else if (score >= 70) summary = "Good academic alignment";
      else if (score >= 60) summary = "Moderate academic fit";
      else summary = "Academic gaps to address";
      break;
    case "budget":
      if (score >= 90) summary = "Fits your budget well";
      else if (score >= 80) summary = "Within your budget range";
      else if (score >= 70) summary = "Partially fits budget";
      else if (score >= 60) summary = "Stretches your budget";
      else summary = "Exceeds your budget";
      break;
    case "admission":
      if (score >= 90) summary = "High admission confidence";
      else if (score >= 80) summary = "Good admission chances";
      else if (score >= 70) summary = "Moderate admission chances";
      else if (score >= 60) summary = "Competitive admission";
      else summary = "Challenging admission";
      break;
    case "language":
      if (score >= 90) summary = "Language requirements fully met";
      else if (score >= 80) summary = "Language requirements met";
      else if (score >= 70) summary = "Language mostly compatible";
      else if (score >= 60) summary = "Language gap exists";
      else summary = "Language requirements not met";
      break;
    case "location":
      if (score >= 90) summary = "Perfect location match";
      else if (score >= 80) summary = "Preferred location";
      else if (score >= 70) summary = "Acceptable location";
      else if (score >= 60) summary = "Less preferred location";
      else summary = "Location mismatch";
      break;
    case "career":
      if (score >= 90) summary = "Excellent career alignment";
      else if (score >= 80) summary = "Strong career match";
      else if (score >= 70) summary = "Good career fit";
      else if (score >= 60) summary = "Partial career alignment";
      else summary = "Limited career alignment";
      break;
    case "format":
      if (score >= 90) summary = "Format matches preference";
      else if (score >= 80) summary = "Compatible format";
      else if (score >= 70) summary = "Partially compatible";
      else if (score >= 60) summary = "Format differs from preference";
      else summary = "Format mismatch";
      break;
    case "lifestyle":
      if (score >= 90) summary = "Excellent lifestyle match";
      else if (score >= 80) summary = "Good lifestyle fit";
      else if (score >= 70) summary = "Acceptable lifestyle";
      else if (score >= 60) summary = "Some lifestyle differences";
      else summary = "Lifestyle mismatch";
      break;
    case "support":
      if (score >= 90) summary = "Excellent international support";
      else if (score >= 80) summary = "Good support services";
      else if (score >= 70) summary = "Basic support available";
      else if (score >= 60) summary = "Limited support";
      else summary = "Minimal support";
      break;
    default:
      summary = `${dimension.label}: ${score}%`;
  }

  // Build details from reasons and concerns
  const details: string[] = [];
  
  // Translate reasons if we have translation
  if (reasons.length > 0 && tMatching) {
    for (const reason of reasons) {
      const translated = renderMatchMessage(reason, tMatching);
      details.push(`✓ ${translated}`);
    }
  }
  
  // Translate concerns if we have translation
  if (concerns.length > 0 && tMatching) {
    for (const concern of concerns) {
      const translated = renderMatchMessage(concern, tMatching);
      details.push(`⚠ ${translated}`);
    }
  }
  
  // If no translated reasons/concerns, use score-based fallback
  if (details.length === 0) {
    if (score >= 80) {
      details.push("Strong alignment with your preferences");
    } else if (score >= 60) {
      details.push("Moderate alignment - review details");
    } else {
      details.push("Significant gaps - check requirements carefully");
    }
  }

  return {
    label: dimension.label,
    summary,
    details,
    icon,
  };
}

/**
 * Render a match message to human-readable text.
 * This is a server-compatible version that works with tMatching translations.
 */
export function renderMatchMessage(
  message: MatchMessage,
  tMatching: Awaited<ReturnType<typeof import("next-intl/server").getTranslations>> | null,
): string {
  if (!tMatching) return message.type === "raw" ? message.text : message.key;
  
  if (message.type === "raw") return message.text;
  
  try {
    return tMatching(message.key as Parameters<typeof tMatching>[0], message.params as never);
  } catch {
    return message.key;
  }
}

/**
 * Get overall match summary for the top of the card.
 */
export function getOverallMatchSummary(
  match: MatchResult,
  tDiscover: Awaited<ReturnType<typeof import("next-intl/server").getTranslations>>,
): { label: string; description: string } {
  if (!match.overallScore) {
    return { label: "No score", description: "Complete your profile to see your match score." };
  }

  const score = match.overallScore;
  const label = match.overallLabel || "Weak Fit";

  let description = "";
  switch (label) {
    case "Excellent Fit":
      description = "Outstanding match across most dimensions.";
      break;
    case "Strong Fit":
      description = "Very good alignment with your preferences.";
      break;
    case "Good Fit":
      description = "Solid match worth considering.";
      break;
    case "Potential Fit":
      description = "Meets some criteria — review details.";
      break;
    case "Weak Fit":
      description = "Limited alignment — check for gaps.";
      break;
    default:
      description = `${score}% match`;
  }

  return { label: `${score}% ${label}`, description };
}