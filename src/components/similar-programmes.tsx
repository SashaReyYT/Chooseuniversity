import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ProgrammesRepository } from "@/lib/repositories/programmes.repository";
import { formatTuition } from "@/components/match-display";
import { UniLogo } from "@/components/uni-logo";

/**
 * "Students also viewed" — same field of study at other universities,
 * published only. Deliberately lightweight: no match recomputation.
 */
export async function SimilarProgrammes({
  programmeId,
  fieldOfStudyId,
}: {
  programmeId: string;
  fieldOfStudyId: string;
}) {
  const t = await getTranslations("ProgrammeDetails");
  const tDiscover = await getTranslations("Discover");
  const supabase = await createServerSupabaseClient();

  const similar = await new ProgrammesRepository(supabase)
    .search({ fieldOfStudyId })
    .then((rows) => rows.filter((r) => r.id !== programmeId).slice(0, 3));

  if (similar.length === 0) return null;

  return (
    <section className="space-y-4" aria-labelledby="similar-heading">
      <h2 id="similar-heading" className="font-headline-sm text-headline-sm text-primary">
        {t("similarHeading")}
      </h2>
      <div className="grid gap-4 md:grid-cols-3">
        {similar.map((p) => (
          <Link
            key={p.id}
            href={`/programmes/${p.id}`}
            className="group rounded-xl border border-outline-variant/40 bg-surface-container-low p-4 space-y-2 hover:border-primary/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <UniLogo name={p.university.name} className="w-9 h-9 text-sm" />
              <p className="font-body-xs text-body-xs text-on-surface-variant truncate">
                {p.university.name}
              </p>
            </div>
            <h3 className="font-body-md text-body-md text-primary line-clamp-2 group-hover:underline">
              {p.name}
            </h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              {formatTuition(p, "en", tDiscover)} · {p.duration_months}{" "}
              {tDiscover("months")}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}