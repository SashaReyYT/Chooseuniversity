"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { LABEL_KEYS, formatTuition } from "@/components/match-display";
import type { MatchResult } from "@/lib/matching/engine";
import type { ProgrammeWithDetails } from "@/lib/repositories/programmes.repository";
import { toggleSaveAction } from "@/lib/favourites/toggle-save-action";
import { SaveButton } from "@/components/save-button";
import {
  TopMatchCard,
  type TopMatchCardData,
} from "@/components/top-match-card";

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
          const data: TopMatchCardData = {
            programmeId: entry.programme.id,
            programmeName: entry.programme.name,
            universityName: entry.programme.university.name,
            city: entry.programme.university.city,
            score: entry.match?.overallScore ?? null,
            label:
              entry.match?.overallLabel != null
                ? tDiscover(LABEL_KEYS[entry.match.overallLabel])
                : null,
            tuition: formatTuition(entry.programme, uiLocale, tDiscover),
          };

          return (
            <TopMatchCard
              key={entry.programme.id}
              data={data}
              category={category}
              categoryLabel={t(categoryKey as Parameters<typeof t>[0])}
              categoryDesc={t(categoryDescKey as Parameters<typeof t>[0])}
              viewDetailsLabel={t("viewDetails")}
              localePrefix=""
              onCardClick={() => router.push(`/programmes/${entry.programme.id}`)}
              actions={
                <SaveButton
                  action={toggleSaveAction}
                  programmeId={entry.programme.id}
                  isSaved={savedIds.has(entry.programme.id)}
                  labelSave={t("save")}
                  labelSaved={t("unsave")}
                />
              }
            />
          );
        })}
      </div>
    </section>
  );
}