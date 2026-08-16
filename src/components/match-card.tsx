import Link from "next/link";
import type { ProgrammeWithDetails } from "@/lib/repositories/programmes.repository";
import type { MatchResult } from "@/lib/matching/types";
import { SaveButton } from "@/components/save-button";
import { CompareButton } from "@/components/compare-button";

const LABEL_COLOR: Record<string, string> = {
  "Excellent Fit": "text-success",
  "Great Fit": "text-success",
  "Good Fit": "text-secondary",
  "Fair Fit": "text-warning",
  "Limited Fit": "text-error",
};

function formatMoney(amount: number, currency: string) {
  return `${Math.round(amount).toLocaleString()} ${currency}`;
}

/**
 * One programme in a results/matches list: Match Score with its label,
 * the sub-dimension breakdown collapsed behind <details> (per the
 * matching engine's explainability contract — reasons/concerns are always
 * available, never just the top-line number), and save/compare actions.
 */
export function MatchCard({
  programme,
  match,
  saved,
  inComparison,
}: {
  programme: ProgrammeWithDetails;
  match: MatchResult | null;
  saved: boolean;
  inComparison: boolean;
}) {
  return (
    <article className="bg-surface-container-lowest border border-outline-variant/40 rounded-lg p-6 ambient-shadow flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wide">
            {programme.university.name} · {programme.university.city},{" "}
            {programme.university.country.name}
          </p>
          <Link href={`/programmes/${programme.id}`}>
            <h3 className="font-headline-sm text-headline-sm text-primary mt-1 hover:underline">
              {programme.name}
            </h3>
          </Link>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
            {programme.degree_level} · {programme.language.name}-taught ·{" "}
            {programme.duration_months} months
          </p>
        </div>

        {match?.overallScore != null && match.overallLabel ? (
          <div className="text-right shrink-0">
            <p className="font-headline-md text-headline-md text-primary">
              {match.overallScore}%
            </p>
            <p
              className={`font-body-sm text-body-sm ${LABEL_COLOR[match.overallLabel] ?? "text-on-surface-variant"}`}
            >
              {match.overallLabel}
            </p>
          </div>
        ) : (
          <div className="text-right shrink-0">
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Not enough data to score yet
            </p>
          </div>
        )}
      </div>

      <p className="font-data-lg text-data-lg text-on-surface">
        {formatMoney(programme.tuition_fee_amount, programme.tuition_fee_currency)} /{" "}
        {programme.tuition_fee_period.replace("_", " ")}
      </p>

      {match && (match.reasons.length > 0 || match.concerns.length > 0) && (
        <details className="group">
          <summary className="font-label-caps text-label-caps text-primary cursor-pointer select-none">
            Why this match
          </summary>
          <div className="mt-3 space-y-1.5">
            {match.reasons.map((reason) => (
              <p
                key={reason}
                className="font-body-sm text-body-sm text-on-surface flex items-start gap-2"
              >
                <span className="text-success">✓</span> {reason}
              </p>
            ))}
            {match.concerns.map((concern) => (
              <p
                key={concern}
                className="font-body-sm text-body-sm text-on-surface flex items-start gap-2"
              >
                <span className="text-warning">⚠</span> {concern}
              </p>
            ))}
          </div>
        </details>
      )}

      <div className="flex gap-3 pt-2">
        <SaveButton programmeId={programme.id} initiallySaved={saved} />
        <CompareButton programmeId={programme.id} initiallyInComparison={inComparison} />
      </div>
    </article>
  );
}
