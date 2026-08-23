"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { LABEL_KEYS, formatTuition } from "@/components/match-display";
import type { MatchResult } from "@/lib/matching/engine";
import type { ProgrammeWithDetails } from "@/lib/repositories/programmes.repository";
import { toggleSaveAction } from "@/lib/favourites/toggle-save-action";

interface TopMatchEntry {
  entry: {
    programme: ProgrammeWithDetails;
    match: MatchResult | null;
  };
  category: "best" | "safe" | "ambitious";
  categoryKey: string;
  categoryDescKey: string;
}

interface TopMatchesClientProps {
  topMatches: TopMatchEntry[];
  uiLocale: string;
  /** Programme ids already in the user's saved list. */
  savedIds: Set<string>;
}

export function TopMatchesClient({ topMatches, uiLocale, savedIds }: TopMatchesClientProps) {
  const t = useTranslations("Discover");
  const tDiscover = useTranslations("Discover");
  const router = useRouter();

  const navigateToProgramme = (programmeId: string) => {
    // next-intl router is locale-aware — never prefix /en/ manually.
    router.push(`/programmes/${programmeId}`);
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
        {topMatches.map(({ entry, category, categoryKey, categoryDescKey }) => {
          const isSaved = savedIds.has(entry.programme.id);
          return (
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

              {/* Save button pinned to the university-name row */}
              <div className="flex items-start justify-between gap-3 pt-2">
                <div className="min-w-0 space-y-2">
                  <p className="font-body-sm text-body-sm text-on-surface-variant truncate">
                    {entry.programme.university.name}
                  </p>
                  <h3 className="font-headline-sm text-headline-sm text-primary line-clamp-1">
                    {entry.programme.name}
                  </h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    {entry.programme.university.city}
                  </p>
                </div>
                {/* stopPropagation so the card click doesn't fire too */}
                <form action={toggleSaveAction} onClick={(e) => e.stopPropagation()}>
                  <input type="hidden" name="programmeId" value={entry.programme.id} />
                  <input type="hidden" name="isSaved" value={String(isSaved)} />
                  <button
                    type="submit"
                    aria-label={isSaved ? t("unsave") : t("save")}
                    className={`flex shrink-0 items-center gap-2 font-label-caps text-label-caps px-4 py-2 rounded-full border transition-all active:scale-95 ${
                      isSaved
                        ? "bg-primary text-on-primary border-primary"
                        : "bg-transparent text-primary border-primary hover:bg-surface-container"
                    }`}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill={isSaved ? "currentColor" : "none"}
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                    </svg>
                    {isSaved ? t("unsave") : t("save")}
                  </button>
                </form>
              </div>

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
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                {t(categoryDescKey as Parameters<typeof t>[0])}
              </p>
              <div className="pt-2 flex items-center justify-between">
                <Link
                  href={`/programmes/${entry.programme.id}`}
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
          );
        })}
      </div>
    </section>
  );
}