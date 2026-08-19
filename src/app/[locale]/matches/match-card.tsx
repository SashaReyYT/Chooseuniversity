import { getTranslations } from "next-intl/server";
import { toggleSaveAction } from "@/lib/favourites/actions";
import type {
  MatchDimensionKey,
  MatchLabel,
  MatchMessage,
  MatchResult,
} from "@/lib/matching/engine";
import type { ProgrammeWithDetails } from "@/lib/repositories/programmes.repository";

type MatchesTranslator = Awaited<ReturnType<typeof getTranslations<"Matches">>>;
type MatchesKey = Parameters<MatchesTranslator>[0];
type MatchingTranslator = Awaited<ReturnType<typeof getTranslations<"Matching">>>;

const LABEL_KEYS: Record<MatchLabel, MatchesKey> = {
  "Excellent Fit": "labelExcellentFit",
  "Strong Fit": "labelStrongFit",
  "Good Fit": "labelGoodFit",
  "Potential Fit": "labelPotentialFit",
  "Weak Fit": "labelWeakFit",
};

const DIMENSION_KEYS: Record<MatchDimensionKey, MatchesKey> = {
  academic: "dimensionAcademic",
  admission: "dimensionAdmission",
  budget: "dimensionBudget",
  language: "dimensionLanguage",
  location: "dimensionLocation",
  career: "dimensionCareer",
  format: "dimensionFormat",
  lifestyle: "dimensionLifestyle",
};

/**
 * Renders a single `MatchMessage` to display text: a `raw` message
 * (DB-sourced, e.g. a programme's own entrance-exam notes) is shown
 * verbatim; a `translated` message is resolved against the `Matching`
 * namespace with its params, so numbers/dates get locale-correct ICU
 * formatting (see `messages.ts` and the `Matching` key in
 * `messages/{locale}.json`).
 */
function renderMatchMessage(
  message: MatchMessage,
  tMatching: MatchingTranslator,
): string {
  if (message.type === "raw") return message.text;
  return tMatching(
    message.key as Parameters<MatchingTranslator>[0],
    message.params as never,
  );
}

interface MatchCardProps {
  programme: ProgrammeWithDetails;
  match: MatchResult;
  isSaved: boolean;
  t: MatchesTranslator;
}

/**
 * Renders the product spec's core UX requirement directly: a Match Score
 * is never shown as a bare number. Overall score + label, the five
 * dimension sub-scores, and the "why it matches you" / "potential
 * concerns" lists are always shown together, and every piece of copy here
 * — including the reasons/concerns themselves — is translated.
 */
export async function MatchCard({ programme, match, isSaved, t }: MatchCardProps) {
  const tMatching = await getTranslations("Matching");

  return (
    <article className="bg-surface-container-lowest border border-outline-variant/40 rounded-lg p-6 md:p-8 ambient-shadow space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-headline-sm text-headline-sm text-primary">
            {programme.name}
          </h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            {programme.university.name} · {programme.university.city},{" "}
            {programme.university.country.name}
          </p>
        </div>
        <form action={toggleSaveAction}>
          <input type="hidden" name="programmeId" value={programme.id} />
          <input type="hidden" name="isSaved" value={String(isSaved)} />
          <button
            type="submit"
            className={`font-label-caps text-label-caps px-6 py-3 rounded-full border transition-all active:scale-95 ${
              isSaved
                ? "bg-primary text-on-primary border-primary"
                : "bg-transparent text-primary border-primary hover:bg-surface-container"
            }`}
          >
            {isSaved ? t("unsave") : t("save")}
          </button>
        </form>
      </div>

      {match.overallScore != null && (
        <div className="flex items-center gap-6">
          <p className="font-display-xl text-display-xl text-primary">
            {match.overallScore}%
          </p>
          {match.overallLabel && (
            <p className="font-headline-sm text-headline-sm text-on-surface-variant">
              {t(LABEL_KEYS[match.overallLabel])}
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {match.dimensions.map((dimension) => (
          <div key={dimension.key} className="space-y-1">
            <p className="font-label-caps text-label-caps text-on-surface-variant">
              {t(DIMENSION_KEYS[dimension.key])}
            </p>
            <p
              className={`font-data-lg text-data-lg ${
                dimension.applicable ? "text-primary" : "text-on-surface-variant"
              }`}
            >
              {dimension.applicable ? `${dimension.score}%` : t("notApplicable")}
            </p>
          </div>
        ))}
      </div>

      {match.reasons.length > 0 && (
        <div className="space-y-1">
          <p className="font-label-caps text-label-caps text-on-surface-variant">
            {t("whyItMatches")}
          </p>
          <ul className="space-y-1">
            {match.reasons.map((reason, index) => (
              <li
                // Messages aren't guaranteed unique as plain strings
                // (two dimensions could render identically for different
                // reasons) — dimension order is stable, so index is a
                // safe key here.
                key={index}
                className="font-body-sm text-body-sm text-on-surface flex items-start gap-2"
              >
                <span className="text-success" aria-hidden="true">
                  ✓
                </span>{" "}
                {renderMatchMessage(reason, tMatching)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {match.concerns.length > 0 && (
        <div className="space-y-1">
          <p className="font-label-caps text-label-caps text-on-surface-variant">
            {t("potentialConcerns")}
          </p>
          <ul className="space-y-1">
            {match.concerns.map((concern, index) => (
              <li
                key={index}
                className="font-body-sm text-body-sm text-on-surface flex items-start gap-2"
              >
                <span className="text-warning" aria-hidden="true">
                  ⚠
                </span>{" "}
                {renderMatchMessage(concern, tMatching)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}
