"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { LABEL_KEYS, formatTuition } from "@/components/match-display";
import type { MatchResult } from "@/lib/matching/engine";
import type { ProgrammeWithDetails } from "@/lib/repositories/programmes.repository";

interface TopMatchEntry {
  entry: {
    programme: ProgrammeWithDetails;
    match: MatchResult | null;
  };
  category: "best" | "safe" | "ambitious";
  categoryKey: string;
  categoryDescKey: string;
  idx: number;
}

interface TopMatchesClientProps {
  topMatches: TopMatchEntry[];
  locale: string;
  uiLocale: string;
}

export function TopMatchesClient({ topMatches, locale, uiLocale }: TopMatchesClientProps) {
  const t = useTranslations("Discover");
  const tDiscover = useTranslations("Discover");
  const router = useRouter();

  const navigateToProgramme = (programmeId: string) => {
    router.push(`/${locale}/programmes/${programmeId}`);
  };

  return (
    <section className="space-y-4" aria-labelledby="top-matches-heading">
      <header>
        <h2 id="top-matches-heading" className="font-headline-md text-headline-md text-primary">
          {t("topMatchesHeading")}
        </h2>
        <p className="font-body-md text-body-md text-on-surface-variant">
          {t("topMatchesSubtitle")}
        </p>
      </header>
      <div className="space-y-4">
        {topMatches.map(({ entry, category, categoryKey, categoryDescKey }) => (
          <article
            key={entry.programme.id}
            className={`relative rounded-xl border border-outline-variant/40 bg-surface-container-low p-6 space-y-4 hover:border-primary/50 transition-colors cursor-pointer ${
              category === "best" ? "border-primary/50 shadow-lg" : ""
            }`}
            onClick={() => navigateToProgramme(entry.programme.id)}
          >
            <span
              className={`absolute -top-3 left-4 z-10 font-label-caps text-label-caps rounded-full px-3 py-1 ${
                category === "best"
                  ? "bg-primary text-on-primary"
                  : category === "safe"
                  ? "bg-success text-on-success"
                  : "bg-warning text-on-warning"
              }`}
            >
              {t(categoryKey as Parameters<typeof t>[0])}
            </span>
            <div className="flex items-center gap-3">
              <p className="font-display-lg text-display-lg text-primary leading-none">
                {entry.match?.overallScore ?? "—"}%
              </p>
              {entry.match?.overallLabel && (
                <p className="font-headline-sm text-headline-sm text-on-surface-variant">
                  {tDiscover(LABEL_KEYS[entry.match.overallLabel!] as Parameters<typeof tDiscover>[0])}
                </p>
              )}
            </div>
            <h3 className="font-headline-sm text-headline-sm text-primary line-clamp-1">
              {entry.programme.name}
            </h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              {entry.programme.university.name} · {entry.programme.university.city}
            </p>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              {t(categoryDescKey as Parameters<typeof t>[0])}
            </p>
            <div className="pt-2 flex items-center justify-between">
              <Link
                href={`/${locale}/programmes/${entry.programme.id}`}
                className="font-label-caps text-label-caps text-primary underline"
                onClick={(e) => {
                  e.preventDefault();
                  navigateToProgramme(entry.programme.id);
                }}
              >
                {t("viewDetails")}
              </Link>
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                {formatTuition(entry.programme, uiLocale, tDiscover)}
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}