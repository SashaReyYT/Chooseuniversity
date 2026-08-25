import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Link, redirect } from "@/i18n/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ProfileService } from "@/lib/services/profile.service";
import { MatchingService } from "@/lib/services/matching.service";
import { FavouritesService } from "@/lib/services/favourites.service";
import { ComparisonService } from "@/lib/services/comparison.service";
import { ProgrammeCard } from "@/components/programme-card";
import { AppShell } from "@/components/app-shell";
import { toMatchProfile } from "@/lib/matching/profile-mapper";
import type { MatchResult } from "@/lib/matching/engine";
import { updateSavedFolder, updateSavedNote } from "@/lib/favourites/saved-meta-actions";

export default async function SavedPage({
  params,
  searchParams,
}: PageProps<"/[locale]/saved"> & {
  searchParams?: Promise<Record<string, string | undefined>>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const activeFolder = sp?.folder ?? "all";

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  const t = await getTranslations("Saved");
  const tDiscover = await getTranslations("Discover");
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Shouldn't happen — src/proxy.ts establishes an anonymous session for
    // every visitor — but if it somehow does (session establishment
    // failed, cookies blocked), send the visitor home rather than a bare
    // 404, which would misleadingly imply the page itself doesn't exist.
    //
    // The extra `return` below is deliberate, not dead code: next-intl's
    // `redirect` is typed to return `never`, but its signature is complex
    // enough (generic/conditional on path params) that TypeScript's
    // control-flow narrowing doesn't reliably pick that up — without this
    // `return`, TS still treats `user` as possibly null afterwards even
    // though this branch always exits at runtime.
    redirect({ href: "/", locale });
    return;
  }

  const favouritesService = new FavouritesService(supabase);
  const comparisonService = new ComparisonService(supabase);
  const profileData = await new ProfileService(supabase).getFullProfileForUser(user.id);

  const [saved, comparisons, matchesById] = await Promise.all([
    favouritesService.listSavedProgrammesForUser(user.id),
    comparisonService.listForUser(user.id),
    // Only compute matches when a profile exists — matching against no
    // profile data is meaningless, and ProgrammeCard already renders
    // gracefully with `match: null` (see its "no score" hint).
    profileData?.profile
      ? new MatchingService(supabase)
          .listMatchesForUser(user.id)
          .then((ranked) => new Map(ranked.map((r) => [r.programme.id, r.match])))
      : Promise.resolve(new Map<string, MatchResult>()),
  ]);

  const comparedProgrammeIds = new Set(
    comparisons[0]?.programmes.map((p) => p.id) ?? [],
  );
  const defaultComparisonName = tDiscover("heading");

  // Folder/note metadata lives on the raw saved rows — fetched separately
  // because listSavedProgrammesForUser hydrates programme details instead.
  const { data: metaRows } = await supabase
    .from("saved_programmes")
    .select("programme_id, note, folder")
    .eq("user_id", user.id);
  const metaById = new Map(
    (metaRows ?? []).map((m) => [
      m.programme_id,
      { note: m.note, folder: m.folder },
    ]),
  );

  const FOLDERS = ["all", "none", "dream", "target", "safety"] as const;
  const folderFiltered =
    activeFolder === "all"
      ? saved
      : saved.filter((s) => (metaById.get(s.programme.id)?.folder ?? "none") === activeFolder);

  const groupIf = (
    predicate: (item: typeof saved[number]) => boolean,
  ) => folderFiltered.filter(predicate);

  // Build match profile for Best For labels
  const matchProfile = profileData ? toMatchProfile(profileData) : null;

  // Group by match level (§37), respecting the active folder filter
  const excellentMatches = groupIf(({ programme }) => {
    const m = matchesById.get(programme.id);
    return m?.overallLabel === "Excellent Fit";
  });
  const strongMatches = groupIf(({ programme }) => {
    const m = matchesById.get(programme.id);
    return m?.overallLabel === "Strong Fit";
  });
  const otherSaved = groupIf(({ programme }) => {
    const m = matchesById.get(programme.id);
    return !m || (m.overallLabel !== "Excellent Fit" && m.overallLabel !== "Strong Fit");
  });

  const folderTabs: { value: string; labelKey: "folderAll" | "folderNone" | "folderDream" | "folderTarget" | "folderSafety" }[] = [
    { value: "all", labelKey: "folderAll" },
    { value: "none", labelKey: "folderNone" },
    { value: "dream", labelKey: "folderDream" },
    { value: "target", labelKey: "folderTarget" },
    { value: "safety", labelKey: "folderSafety" },
  ];

  const renderProgrammeCard = (savedItem: { programme: import("@/lib/repositories/programmes.repository").ProgrammeWithDetails }) => {
    const meta = metaById.get(savedItem.programme.id);
    return (
      <div key={savedItem.programme.id} className="space-y-3">
        <ProgrammeCard
          programme={savedItem.programme}
          match={matchesById.get(savedItem.programme.id) ?? null}
          profile={matchProfile}
          isSaved
          isInComparison={comparedProgrammeIds.has(savedItem.programme.id)}
          t={tDiscover}
          defaultComparisonName={defaultComparisonName}
        />

        {/* Folder triage */}
        <form action={updateSavedFolder} className="flex flex-wrap items-center gap-2 -mt-2">
          <input type="hidden" name="programmeId" value={savedItem.programme.id} />
          <span className="font-label-caps text-label-caps text-on-surface-variant">
            {t("folderLabel")}
          </span>
          {FOLDERS.filter((f) => f !== "all").map((f) => (
            <button
              key={f}
              type="submit"
              name="folder"
              value={f}
              className={`font-label-caps text-label-caps rounded-full px-3 py-1.5 border transition-colors ${
                (meta?.folder ?? "none") === f
                  ? "bg-primary text-on-primary border-primary"
                  : "border-outline-variant text-on-surface hover:border-primary"
              }`}
            >
              {t(`folder${f.charAt(0).toUpperCase()}${f.slice(1)}` as Parameters<typeof t>[0])}
            </button>
          ))}
        </form>

        {/* Private note — column existed in schema, surfaced here */}
        <details className="group">
          <summary className="cursor-pointer font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors inline-flex items-center gap-1 list-none">
            <span className="material-symbols-outlined text-base" aria-hidden="true">edit_note</span>
            {(meta?.note?.trim()?.length ?? 0) > 0 ? t("noteEditHas") : t("noteEditEmpty")}
          </summary>
          <form action={updateSavedNote} className="mt-2 space-y-2 max-w-md">
            <input type="hidden" name="programmeId" value={savedItem.programme.id} />
            <textarea
              name="note"
              rows={3}
              maxLength={500}
              defaultValue={meta?.note ?? ""}
              placeholder={t("notePlaceholder")}
              className="w-full font-body-sm text-body-sm bg-surface-container-lowest border border-outline-variant rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              type="submit"
              className="font-label-caps text-label-caps text-primary border border-primary rounded-full px-4 py-2 hover:bg-surface-container transition-colors"
            >
              {t("noteSave")}
            </button>
          </form>
        </details>
      </div>
    );
  };

  return (
    <AppShell>
      <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-16 space-y-8">
      <div className="space-y-1">
        <h1 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-primary">
          {t("heading")}
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          {t("description")}
        </p>
      </div>

      {/* Folder triage tabs */}
      <nav className="flex flex-wrap gap-2" aria-label={t("foldersNav")}>
        {folderTabs.map((tab) => (
          <Link
            key={tab.value}
            href={tab.value === "all" ? "/saved" : `/saved?folder=${tab.value}`}
            aria-current={activeFolder === tab.value ? "true" : undefined}
            className={`font-label-caps text-label-caps rounded-full px-4 py-2 border transition-colors ${
              activeFolder === tab.value
                ? "bg-primary text-on-primary border-primary"
                : "border-outline-variant text-on-surface hover:border-primary"
            }`}
          >
            {t(tab.labelKey)}
          </Link>
        ))}
      </nav>

      {saved.length === 0 ? (
        <div className="space-y-4">
          <p className="font-body-md text-body-md text-on-surface-variant">
            {t("empty")}
          </p>
          <Link
            href="/discover"
            className="inline-block font-label-caps text-label-caps text-primary underline"
          >
            {t("browseCta")}
          </Link>
        </div>
      ) : folderFiltered.length === 0 ? (
        <p className="font-body-md text-body-md text-on-surface-variant">
          {t("folderEmpty")}
        </p>
      ) : (
        <div className="space-y-8">
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            {t("count", { count: folderFiltered.length })}
          </p>

          {excellentMatches.length > 0 && (
            <section className="space-y-4">
              <h2 className="font-headline-sm text-headline-sm text-primary">
                {t("groupExcellent")}
              </h2>
              <div className="space-y-6">
                {excellentMatches.map(renderProgrammeCard)}
              </div>
            </section>
          )}

          {strongMatches.length > 0 && (
            <section className="space-y-4">
              <h2 className="font-headline-sm text-headline-sm text-primary">
                {t("groupStrong")}
              </h2>
              <div className="space-y-6">
                {strongMatches.map(renderProgrammeCard)}
              </div>
            </section>
          )}

          {otherSaved.length > 0 && (
            <section className="space-y-4">
              <h2 className="font-headline-sm text-headline-sm text-primary">
                {t("groupOther")}
              </h2>
              <div className="space-y-6">
                {otherSaved.map(renderProgrammeCard)}
              </div>
            </section>
          )}
        </div>
      )}
      </main>
    </AppShell>
  );
}
