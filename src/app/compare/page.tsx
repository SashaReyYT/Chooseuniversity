import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ComparisonService } from "@/lib/services/comparison.service";
import { MatchingService } from "@/lib/services/matching.service";
import { RemoveFromComparisonButton } from "@/components/remove-from-comparison-button";

function formatMoney(amount: number, currency: string) {
  return `${Math.round(amount).toLocaleString()} ${currency}`;
}

export default async function ComparePage() {
  const user = await requireUser();
  const supabase = await createServerSupabaseClient();

  const comparison = await new ComparisonService(supabase).getActiveForUser(user.id);

  if (!comparison || comparison.programmes.length === 0) {
    return (
      <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-16 space-y-4">
        <h1 className="font-headline-md text-headline-md text-primary">Compare</h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Nothing to compare yet.{" "}
          <Link href="/dashboard" className="text-primary hover:underline">
            Browse your matches
          </Link>{" "}
          and add a few programmes to compare them side by side.
        </p>
      </main>
    );
  }

  const matchingService = new MatchingService(supabase);
  const matches = await Promise.all(
    comparison.programmes.map((p) => matchingService.getMatchForProgramme(user.id, p.id)),
  );

  return (
    <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-16 space-y-8">
      <div className="space-y-2">
        <h1 className="font-headline-md text-headline-md text-primary">
          {comparison.name}
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          {comparison.programmes.length} programmes side by side.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[640px]">
          <thead>
            <tr>
              <th className="text-left font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wide py-3 pr-4 w-40">
                &nbsp;
              </th>
              {comparison.programmes.map((programme) => (
                <th key={programme.id} className="text-left py-3 pr-4 align-top">
                  <Link
                    href={`/programmes/${programme.id}`}
                    className="font-headline-sm text-headline-sm text-primary hover:underline"
                  >
                    {programme.name}
                  </Link>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                    {programme.university.name}
                  </p>
                  <div className="mt-2">
                    <RemoveFromComparisonButton
                      comparisonId={comparison.id}
                      programmeId={programme.id}
                    />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-outline-variant/30">
              <td className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wide py-4 pr-4">
                Match Score
              </td>
              {matches.map((m, i) => (
                <td key={comparison.programmes[i].id} className="py-4 pr-4">
                  {m?.match.overallScore != null ? (
                    <span className="font-headline-sm text-headline-sm text-primary">
                      {m.match.overallScore}%
                    </span>
                  ) : (
                    <span className="font-body-sm text-body-sm text-on-surface-variant">N/A</span>
                  )}
                </td>
              ))}
            </tr>
            <tr className="border-t border-outline-variant/30">
              <td className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wide py-4 pr-4">
                Location
              </td>
              {comparison.programmes.map((programme) => (
                <td key={programme.id} className="py-4 pr-4 font-body-md text-body-md text-on-surface">
                  {programme.university.city}, {programme.university.country.name}
                </td>
              ))}
            </tr>
            <tr className="border-t border-outline-variant/30">
              <td className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wide py-4 pr-4">
                Degree
              </td>
              {comparison.programmes.map((programme) => (
                <td key={programme.id} className="py-4 pr-4 font-body-md text-body-md text-on-surface">
                  {programme.degree_level} · {programme.duration_months} months
                </td>
              ))}
            </tr>
            <tr className="border-t border-outline-variant/30">
              <td className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wide py-4 pr-4">
                Language
              </td>
              {comparison.programmes.map((programme) => (
                <td key={programme.id} className="py-4 pr-4 font-body-md text-body-md text-on-surface">
                  {programme.language.name}
                </td>
              ))}
            </tr>
            <tr className="border-t border-outline-variant/30">
              <td className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wide py-4 pr-4">
                Tuition
              </td>
              {comparison.programmes.map((programme) => (
                <td key={programme.id} className="py-4 pr-4 font-body-md text-body-md text-on-surface">
                  {formatMoney(programme.tuition_fee_amount, programme.tuition_fee_currency)} /{" "}
                  {programme.tuition_fee_period.replace("_", " ")}
                </td>
              ))}
            </tr>
            <tr className="border-t border-outline-variant/30">
              <td className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wide py-4 pr-4">
                Deadline
              </td>
              {comparison.programmes.map((programme) => (
                <td key={programme.id} className="py-4 pr-4 font-body-md text-body-md text-on-surface">
                  {programme.application_deadline
                    ? new Date(programme.application_deadline).toLocaleDateString()
                    : "—"}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </main>
  );
}
