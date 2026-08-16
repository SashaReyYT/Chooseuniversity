import { Link } from "@/i18n/navigation";
import { SaveToggleForm } from "@/components/save-toggle-form";
import { CompareToggleForm } from "@/components/compare-toggle-form";
import type { ProgrammeWithDetails } from "@/lib/repositories/programmes.repository";

function formatMoney(amount: number, currency: string) {
  return `${Math.round(amount).toLocaleString()} ${currency}`;
}

export interface ProgrammeCardLabels {
  save: string;
  unsave: string;
  compareAdd: string;
  compareRemove: string;
  viewDetails: string;
}

interface ProgrammeCardProps {
  programme: ProgrammeWithDetails;
  isSaved: boolean;
  inComparison: boolean;
  /** Overall Match Score (0-100), or omitted when there's no profile to score against (e.g. anonymous browsing on /catalog). */
  matchScore?: number | null;
  labels: ProgrammeCardLabels;
}

/**
 * Summary card for a single programme, shared between the `/catalog`
 * grid and the `/favourites` shortlist so both screens render programme
 * rows identically. Deliberately lighter than `matches/match-card.tsx`'s
 * `MatchCard` (no dimension breakdown or reasons/concerns) — this is a
 * browsing-density view, not the full match explanation.
 */
export function ProgrammeCard({
  programme,
  isSaved,
  inComparison,
  matchScore,
  labels,
}: ProgrammeCardProps) {
  return (
    <article className="bg-surface-container-lowest border border-outline-variant/40 rounded-lg p-6 ambient-shadow space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href={`/programmes/${programme.id}`}
            className="font-headline-sm text-headline-sm text-primary hover:underline"
          >
            {programme.name}
          </Link>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
            {programme.university.name} · {programme.university.city},{" "}
            {programme.university.country.name}
          </p>
        </div>
        {matchScore != null && (
          <span className="shrink-0 font-label-caps text-label-caps bg-tertiary-fixed text-on-tertiary-fixed px-3 py-1.5 rounded-full">
            {matchScore}%
          </span>
        )}
      </div>

      <p className="font-body-sm text-body-sm text-on-surface">
        {programme.degree_level} · {programme.language.name} ·{" "}
        {programme.duration_months} mo · {formatMoney(programme.tuition_fee_amount, programme.tuition_fee_currency)}
      </p>

      <div className="flex items-center gap-3 flex-wrap">
        <SaveToggleForm
          programmeId={programme.id}
          isSaved={isSaved}
          saveLabel={labels.save}
          unsaveLabel={labels.unsave}
          variant="compact"
        />
        <CompareToggleForm
          programmeId={programme.id}
          inComparison={inComparison}
          addLabel={labels.compareAdd}
          removeLabel={labels.compareRemove}
          variant="compact"
        />
        <Link
          href={`/programmes/${programme.id}`}
          className="font-label-caps text-label-caps text-primary hover:underline ml-auto"
        >
          {labels.viewDetails}
        </Link>
      </div>
    </article>
  );
}
