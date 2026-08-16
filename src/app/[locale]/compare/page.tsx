import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ComparisonService } from "@/lib/services/comparison.service";
import { MatchingService } from "@/lib/services/matching.service";
import { CompareToggleForm } from "@/components/compare-toggle-form";

function formatMoney(amount: number, currency: string) {
  return `${Math.round(amount).toLocaleString()} ${currency}`;
}

export default async function ComparePage({
  params,
}: PageProps<"/[locale]/compare">) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  const t = await getTranslations("Compare");
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Deliberately `listForUser` (never creates), not
  // `getOrCreateDefaultComparison` — merely viewing /compare shouldn't
  // have the side effect of creating an empty comparison set.
  const comparisons = user
    ? await new ComparisonService(supabase).listForUser(user.id)
    : [];
  const comparison = comparisons[0] ?? null;

  if (!comparison || comparison.programmes.length === 0) {
    return (
      <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-16 space-y-4">
        <h1 className="font-headline-md text-headline-md text-primary">
          {t("heading")}
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          {t("empty")}{" "}
          <Link href="/catalog" className="text-primary hover:underline">
            {t("emptyCta")}
          </Link>
        </p>
      </main>
    );
  }

  const matchingService = new MatchingService(supabase);
  const matches = await Promise.all(
    comparison.programmes.map((p) =>
      user ? matchingService.getMatchForProgramme(user.id, p.id) : null,
    ),
  );

  return (
    <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-16 space-y-8">
      <div className="space-y-2">
        <h1 className="font-headline-md text-headline-md text-primary">
          {t("heading")}
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          {t("description", { count: comparison.programmes.length })}
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
                    <CompareToggleForm
                      programmeId={programme.id}
                      inComparison
                      addLabel={t("remove")}
                      removeLabel={t("remove")}
                      variant="compact"
                    />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-outline-variant/30">
              <td className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wide py-4 pr-4">
                {t("matchScoreRow")}
              </td>
              {matches.map((m, i) => (
                <td key={comparison.programmes[i].id} className="py-4 pr-4">
                  {m?.match.overallScore != null ? (
                    <span className="font-headline-sm text-headline-sm text-primary">
                      {m.match.overallScore}%
                    </span>
                  ) : (
                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                      {t("notAvailable")}
                    </span>
                  )}
                </td>
              ))}
            </tr>
            <tr className="border-t border-outline-variant/30">
              <td className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wide py-4 pr-4">
                {t("locationRow")}
              </td>
              {comparison.programmes.map((programme) => (
                <td key={programme.id} className="py-4 pr-4 font-body-md text-body-md text-on-surface">
                  {programme.university.city}, {programme.university.country.name}
                </td>
              ))}
            </tr>
            <tr className="border-t border-outline-variant/30">
              <td className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wide py-4 pr-4">
                {t("degreeRow")}
              </td>
              {comparison.programmes.map((programme) => (
                <td key={programme.id} className="py-4 pr-4 font-body-md text-body-md text-on-surface">
                  {programme.degree_level} · {t("months", { months: programme.duration_months })}
                </td>
              ))}
            </tr>
            <tr className="border-t border-outline-variant/30">
              <td className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wide py-4 pr-4">
                {t("languageRow")}
              </td>
              {comparison.programmes.map((programme) => (
                <td key={programme.id} className="py-4 pr-4 font-body-md text-body-md text-on-surface">
                  {programme.language.name}
                </td>
              ))}
            </tr>
            <tr className="border-t border-outline-variant/30">
              <td className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wide py-4 pr-4">
                {t("tuitionRow")}
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
                {t("deadlineRow")}
              </td>
              {comparison.programmes.map((programme) => (
                <td key={programme.id} className="py-4 pr-4 font-body-md text-body-md text-on-surface">
                  {programme.application_deadline
                    ? new Date(programme.application_deadline).toLocaleDateString(locale)
                    : t("notAvailable")}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </main>
  );
}
