# Milestones

Chronicle of completed development stages. Each entry reflects work
that was actually implemented and verified (build/typecheck/lint/tests,
plus runtime smoke tests where a live Supabase project isn't available —
see the caveat at the bottom), not aspirational.

## Done

**1. Project scaffold**
Next.js 16 + TypeScript + Tailwind v4 + App Router. Design tokens ported
from the visual reference into `globals.css`. Self-hosted fonts
(`@fontsource`, not `next/font/google`, to avoid a runtime dependency on
Google's CDN). Supabase client/server setup. Empty-but-documented
`repositories`/`services`/`matching` layers.

**2. Database schema**
Full Postgres schema as 7 versioned migrations (reference data,
catalog, programme requirements, user profile, saved/comparisons, RLS).
Validated end-to-end against a real local Postgres instance, including
row-level security actually tested with multiple simulated users (not
just policy syntax review). Real Czech university/programme seed data
(35 universities, 6 sourced programmes) — see
`supabase/migrations/0007_seed_czech_universities.sql` for sourcing
notes.

**3. Matching engine**
Five deterministic scoring dimensions (Academic, Budget, Language,
Location, Admission Fit) — pure functions, no AI, no database access.
38 unit tests. Every dimension returns structured reasons/concerns, never
a bare score.

**4. Anonymous sessions + i18n foundation**
No signup/login — every visitor gets an anonymous Supabase session
(`src/proxy.ts`). Full next-intl setup (`en`/`uk`, locale-prefixed
routing, typed messages).

**5. Repository/service layer completion**
Favourites and comparisons repositories + services, completing the
architecture layer the matching engine and UI build on.

**6. Onboarding → matches (first working end-to-end screen)**
Profile form + the first real Match Score UI, wired to the actual
matching engine and real data. Found and fixed a real bug during runtime
testing: no error boundary meant a Supabase outage crashed the page with
a raw 500 — added translated `error.tsx`/`global-error.tsx`.

**7. Matching engine i18n**
Converted the matching engine's reasons/concerns from hardcoded English
strings to structured, translatable messages (`MatchMessage`). Fixed a
real bug in the process: the admission deadline was hardcoded to
`en-GB` formatting regardless of UI locale.

**8. Discover / Saved / Compare / Profile IA**
Renamed routes to the four-concept navigation
(`/matches`→`/discover`, `/onboarding`→`/profile`), added `/saved` and
`/compare`, persistent nav component, and rebuilt the programme card
around the spec's visual hierarchy (Match → explanation → facts →
concerns → metadata → details). Found and fixed a real TypeScript
control-flow narrowing limitation (see `docs/project-rules.md` if this
pattern comes up again: an explicit `return` is required after
next-intl's `redirect()` for narrowing to work, because its type
signature is too complex for TS to recognize as unconditionally `never`).

**9. Housekeeping**
Removed genuinely dead code, renamed generic/duplicate filenames
(`actions.ts` × 3, `types.ts` × 2) to be self-descriptive, added this
`docs/` folder.

**10. Programme card (spec §32–§36)**

Rebuilt `ProgrammeCard` around the §32 visual hierarchy:
Match badge → names → compact metrics + facts → why it matches → one thing → actions → details.
Configurable match-score thresholds and labels (§33) centralized in `match-types.ts`.
"Best For" labels (§34) computed per-user/per-programme in `best-for.ts` (9 unit tests) — never stored on universities.
Server-side search (§35) on programme name, university, city, country, field, degree via ILIKE — no client-side filtering.
Filtering and sorting (§36): field, degree, language, tuition, living cost, admission difficulty, match score, with sort by Best Match / Lowest Tuition / Lowest Cost.

Housekeeping during this milestone:
- i18n parity fix: discovered `getTranslations("Matching")` was structurally wrong (matching messages are flat top-level keys, not nested under `"Matching"`). Replaced with global `getTranslations()` across all callers; message keys like `"academic.meetsGpa"` resolve via dot-path.
- Duplicate action files consolidated: `src/lib/toggle-save-action.ts` and `src/lib/toggle-compare-action.ts` removed (already existed in `favourites/` and `compare/` subdirectories).
- Duplicate `"Compare"` namespace in `messages/en.json` removed (JSON duplicate-key was silently ignored, hiding the older keys from the type system).
- Pre-existing type errors (PageProps, test‑fixtures accommodation null/undefined, degreeLevel union, attrGpaRequirement key) fixed.
- `en.json`/`uk.json` key parity verified for all namespaces.
- Build: tsc 0 errors, eslint 0 warnings, vitest 47/47, next build successful.

- Real pixel-level screens from the Stitch mockups (landing page, and the
  questionnaire wizard added in milestone 12) — current screens are
  functional, not pixel-matched to the design references.
- Currency conversion for Budget Fit (flags a concern instead; no FX-rate
  table in the schema yet).
- Multiple named comparison sets (V1 has one implicit comparison per
  user — see `ComparisonService.getOrCreateDefaultComparison`).

**11. Programme details, compare, admin, and data pipeline (spec §37–§47)**

- **Saved/Compare (spec §37–§38):** bookmark icon on the details page
  (matches the card pattern); compare is fully live — max-3 enforced in
  `ComparisonService.addProgrammeWithinLimit` with a
  `notice=compare-limit` redirect banner; sticky label column, diff
  highlighting + legend, tuition-period suffix, application-fee row,
  ranking-based academic reputation, career notes row. Discovered and
  fixed a pre-existing type error in the old compare page rewrite
  (implicit any).
- **Programme details (§39–§41):** "Your profile vs requirements"
  table (English/mathematics/degree/GPA/entrance-exam rows with ✓/⚠/✗/—
  states, "Add to your profile" CTA when user data is missing) backed by
  a pure, unit-tested helper `src/lib/matching/profile-vs-requirements.ts`
  (16 tests; caught and fixed a `Number("")` → 0 numeric bug class and
  an invalid-degree-level gate during testing). Full details sections:
  study mode, application fee, required documents, scholarships, career
  notes, accommodation (dormitory availability/cost/deposit/capacity/
  distance/link), living-cost breakdown table, university stats
  (students, international %, ranking data), official application link,
  and the §41 Sources list rendering real backlinks with type labels.
- **Database (§42–§47):** migration `0010` — university model extension
  (slug, cover image, official application URL, ranking JSON, student
  counts, coordinates, published), programme study-mode/application-
  fee/documents/scholarship/career columns, `sources` ledger, import
  ledger, `admin_users` + `public.is_admin()` RLS policies (security
  definer avoids admin_users recursion). Types updated by hand in
  `src/types/database.ts` (no live Supabase to generate from).
- **Admin panel (§44–§45):** `/admin` with `requireAdminForPage`/
  `requireAdminForAction` gates (defense in depth on top of RLS),
  sidebar layout, and 11 sections: Dashboard (metrics + recent
  imports), Universities and Programmes CRUD (all §47 fields, slug
  auto-generation), Countries (support toggles), Study fields,
  Requirements (GPA/subjects/exam/degree/math/language-test editor with
  completeness status), Costs (per-programme living-cost breakdown),
  Accommodation (per-university dormitory editor), Sources (create +
  link with fact keys), Imports (file upload → validation → insertion
  with error review), Settings (grant/revoke admin access).
- **Import pipeline (§43/§45):** `src/lib/admin/import-pipeline.ts` —
  pure parse+validate (JSON/CSV, quote-aware CSV splitting, required
  columns, degree-level enum, unknown university/field/language
  rejection, row-numbered errors), 13 unit tests. `imports`/
  `import_errors` ledger records every run for admin review.
- **Docs (§42–§43):** `docs/data-acquisition.md` (sourcing rules:
  never invent, NULL over guesswork, source ledger, acquisition
  workflow) and `docs/data-import.md` (format, contract, error
  handling); `supabase/README.md` extended with 0008–0010 and the new
  design decisions.
- Verification: tsc 0 errors, eslint 0 problems, vitest 76/76, `next
  build` clean across all routes.

**12. Multi-step questionnaire wizard (spec §10, §55–§56)**

Replaced the single ~718-line onboarding form with a 12-step wizard —
the previous implementation directly contradicted the spec's explicit
instruction ("Do not create one enormous form. Use steps."). Steps:
study level, field of study, study format, country & location, budget,
academic background, tests & qualifications, English, mathematics,
admission preference, career priorities, review.

- Fully controlled form state (one `values` object) instead of
  `defaultValue`/`defaultChecked`, so switching steps never loses data —
  each step's fields stay in React state rather than living only in
  uncontrolled DOM nodes that would unmount between steps.
- Progress indicator ("Step N of 12" + bar) and working Back/Continue,
  per §55.
- Conditional logic per §56: budget mode gates the exact-amount fields
  (unchanged from before), location type gates the city input
  (unchanged), and two *new* conditional flows — NMT taken (yes/no/
  planning/other) gates the subject-picker + per-subject 0–200 score
  inputs (§20), and selecting an "other qualification" (SAT/ACT/IB/etc,
  §21) reveals its own score/year inputs.
- Review step (§57) shows a plain-language summary of every section with
  a jump-back "Edit" link, before the real submit.
- Draft persistence to `localStorage` (spec §55: "Persist progress
  locally") — resumes step + answers on refresh, but only pre-submission
  and only when there's no server-side profile yet (server data always
  wins over a stale local draft, and a completed profile clears it).
- **New data actually captured and saved, not just asked and discarded:**
  NMT subject scores (`user_nmt_scores`), other qualifications
  (`user_qualifications`), and an English proficiency test score
  (`user_test_scores`) — these tables existed in the schema since
  earlier migrations but nothing wrote to them before this milestone.
  Added `UserQualificationsRepository`, extended `ProfileService` with
  `replaceNmtScores`/`replaceQualifications`/`setEnglishTestScore`/
  `getFullProfileForUser`, and extended `ReferenceDataRepository` with
  `listNmtSubjects`/`listQualifications`. The server action now
  validates submitted subject codes/qualification IDs against what's
  actually configured in the database rather than trusting form values.
- Not in scope for this milestone (unchanged): the matching engine does
  not yet score against NMT/qualification/English-test data (only GPA)
  — see `score-academic.ts`'s existing comment on why subject-level
  matching isn't scored numerically. This milestone is data capture;
  wiring it into the Academic Fit dimension is a follow-up.
- i18n: 23 new keys added to both `en.json`/`uk.json` (631/631 keys,
  verified programmatically for exact parity).
- Verification: tsc 0 errors, eslint 0 problems, vitest 78/78, `next
  build` clean across all routes.

**13. Discover: combined ranking + search/filter/sort, and a real language filter (spec §35–§36)**

Two gaps from the milestone-11 note, closed together since they touch the
same page and the same query params:

- **Combined ranking + filters:** `MatchingService.listMatchesForUser`
  previously always called `ProgrammesRepository.listWithDetails()` (the
  full, unfiltered catalog) whenever a profile existed, so `discover`'s
  search box and field/degree/language/sort controls only ever worked for
  a user who *hadn't* completed the questionnaire. `listMatchesForUser`
  now takes an optional `MatchSearchFilters` argument and routes through
  `ProgrammesRepository.search(...)` — the same server-side query the
  no-profile browse path already used — then computes Match Scores on
  the filtered result set. A completed-profile user now gets the same
  search/filter controls as a browsing one, with their personalized
  Match Score layered on top rather than replaced by it. Existing callers
  (`page.tsx`, `compare/page.tsx`, `saved/page.tsx`) call it with no
  arguments and are unaffected — an empty filter object returns every
  programme, same as before.
  - Sorting is now sort-aware end-to-end: `lowest_tuition` and
    `lowest_cost` sort ascending on that field (ignoring Match Score
    entirely, matching what a profile-less user sees), `best_match` /
    `highest_match` / unset keeps the existing highest-score-first order
    with unscored programmes sorted last, never dropped. Extracted as a
    standalone `sortRankedMatches` function and unit-tested (5 tests) —
    the first service-layer pure logic to get test coverage, since
    sorting has no Supabase dependency and is worth locking down
    independently of the matching engine's own tests.
- **Language filter:** `discover`'s language `<select>` showed a single
  hardcoded "All languages" option. Now populated from
  `ReferenceDataRepository.listLanguages()`, the same call the profile
  wizard already uses, so adding a language to the catalog makes it
  filterable without a code change.

Verification: tsc 0 errors, eslint 0 problems, vitest 83/83, `next build`
clean across all routes.

**14. Cross-currency Budget Fit (spec §15, §26–§27, §29)**

Per this doc's earlier note, `scoreBudgetFit` only compared budget and
tuition correctly when currencies matched; a mismatch was flagged as a
concern but the score was still computed by comparing the raw numbers
as if the currencies were equal — an actual bug, not just a documented
limitation.

- **`currency_rates` table** (migration 0012): admin-configurable,
  EUR-based (`rate_to_eur`), not a live FX API — a deliberate V1 choice
  per the stage brief. Public-read + admin-write RLS, same pattern as
  every other small reference table. Seeded with the currencies already
  in play (EUR, CZK, GBP, USD, CHF, SEK, DKK, PLN, CAD, UAH).
- **`convertAmount`** (`src/lib/matching/currency.ts`): a pure helper —
  `amount * rate[from] / rate[to]` — that returns `null` (never throws,
  never guesses) when either currency's rate is missing. The matching
  engine stays DB-free; `MatchingService` loads the rate table once via
  `ReferenceDataRepository.listCurrencyRates()` and threads it through
  `computeMatchScore` → `scoreBudgetFit` as a plain `CurrencyRateTable`.
- **`scoreBudgetFit`** now converts the programme's tuition+living total
  into the user's budget currency when they differ, producing a real
  score (with a `budget.currencyConverted` note, since it's still an
  approximation). When no rate is available for either currency, the
  dimension degrades to genuine UNKNOWN (`applicable: false`,
  `score: null`, `budget.currencyMismatch` concern) instead of silently
  treating the mismatched amounts as equal — this is the behavior change
  from before, and it's the correct one per spec §29.
- Rewrote `score-budget.test.ts`'s currency-mismatch test into three:
  same-currency (unchanged), known-rate cross-currency (real converted
  score, asserted against exact converted amounts), and no-rate
  cross-currency (UNKNOWN, no crash — including the empty-rate-table
  default case).

Verification: tsc 0 errors, eslint 0 problems, vitest 86/86, `next build`
clean across all routes. Migration 0012 validated against a real local
Postgres instance — actual RLS behavior tested with a non-superuser
role (public read succeeds, non-admin write denied, admin write
succeeds), not just policy syntax review.

**15. Multiple named comparison sets (spec §38, optional/low priority)**

The service layer (`ComparisonService.createComparison` /
`.renameComparison` / `.deleteComparison` / `.listForUser`) and schema
already supported this from milestone 11 — nothing there was V1-limited,
just unreached by any UI. This stage is the first thing that lets a user
get past one implicit comparison per account.

- `/compare?comparisonId=<id>` selects which set is shown; with no
  param (or one that doesn't resolve), it falls back to the most
  recently created set — the same one every other page's "add to
  compare" targets via `getOrCreateDefaultComparison`. A user who never
  creates a second set sees exactly the pre-existing single-comparison
  behavior; `toggleCompareAction` (the "add to compare" button on
  programme cards elsewhere in the app) is untouched.
- New `comparison-set-actions.ts` server actions
  (create/rename/delete), following the same pattern as
  `toggleCompareAction`: plain `<form action={...}>`, no client
  component. Deleting redirects back to `/compare` with no
  `comparisonId`, which naturally falls back to whatever's left.
  Authorization is RLS (`comparisons` keyed to `auth.uid()`), the same
  boundary `ComparisonsRepository` already relied on — these actions
  don't reinvent an ownership check on top of it.
- `/compare` now renders a tab switcher (only when a user has more than
  one set) plus inline create/rename/delete forms, using a new shared
  `formDangerButtonClassName` in `form-styles.ts` rather than reaching
  into the admin-only button styles for a public-facing page.
- Did not build a full admin-style management page or a delete
  confirmation dialog — neither is in the acceptance criteria, and the
  existing "Remove" button elsewhere in Compare has no confirmation
  either, so this matches the existing UX bar rather than inventing a
  new one.

Verification: tsc 0 errors, eslint 0 problems, vitest 86/86, `next build`
clean across all routes. No new migration was needed — schema was
already additive-ready — so the create/rename/delete/list-by-recency
flow was sanity-checked directly against a local Postgres instance
instead.

**16. Pixel-level landing page + questionnaire wizard (spec §5, §6, §9)**

The Stitch reference screenshots/mockups arrived
(`stitch_unimatch_premium.zip`) — this stage was blocked on them per the
earlier note. Focused on the two highest-visibility screens per the
brief: the landing page and the new questionnaire wizard.

- **Design tokens**: confirmed `globals.css` (ported in an earlier
  milestone from the "Academic Excellence System" reference) already
  matches the mockups pixel-for-pixel on colors/type/spacing. No token
  changes needed — this stage was purely layout/component work.
- **Landing page** (`unifind_premium_landing_page_updated` reference):
  found the page was still carrying stale Stage-0 scaffold content — a
  `"Scaffold — Stage 3"` dev badge in the header, and a `description`
  string that described the *project's* scaffolding rather than the
  product's pitch. Both fixed (both locales). Added the "How it Works"
  3-step section, which didn't exist in the app at all before. Restyled
  the hero and `QuickMatchForm` card to the mockup's rounded-xl/overlap/
  ambient-shadow treatment.
  - Real-data note: the mockup's hero uses a fixed "Charles University,
    94% Match" photo card. The app already showed the visitor's actual
    top match here (not a mockup value) as of an earlier milestone — that
    stays. The photo itself has a real, if currently empty, home:
    `universities.cover_image_url` exists in the schema (0010) and is
    admin-editable, but no seeded university has one set. The card uses
    it when present and degrades to a `primary`-toned gradient
    otherwise, so it'll pixel-match automatically once a university gets
    a cover image, rather than needing another round of this work.
- **Questionnaire wizard** (`unifind_personalized_matching_test`
  reference, "Where would you like to study?"): the real wizard is 11
  steps + review — the mockup's 8-step flow is illustrative, not a
  literal step count to match — so this stage matched the *chrome*
  (header, progress, footer) and the one screen that's a literal 1:1
  match (country selection) rather than rewriting all 11 steps' content.
  - Country selection changed from a native `<select multiple>` to a
    card-tile grid with a checkmark badge — the exact control in the
    reference screenshot. Added `formTileOptionClassName` /
    `formTileOptionSelectedClassName` to `form-styles.ts` as the
    reusable extension point, per this stage's own instruction to extend
    existing tokens rather than inventing parallel ones. Submits exactly
    as the old multi-select did (`formData.getAll` server-side) — no
    server action changes needed.
    Real-data note: only Czechia is `supported = true` in the seed data
    (0008) today, versus the mockup's five countries, so this renders as
    a one-tile grid in practice. The grid layout was built to degrade to
    that honestly.
  - Moved "Back" from a bottom button into a header icon-button next to
    a centered "STEP X OF Y" label, and collapsed the footer to a single
    full-width "Continue →" pill — matching the mockup's structure.
    Deliberately kept in-flow rather than `fixed`: the mockup's screens
    are standalone (no persistent nav), but this app has a sitewide
    bottom nav bar (an earlier, deliberate IA decision from milestone 8)
    present on every page including the wizard — stacking a second fixed
    bottom bar on top of it would conflict with that, so the CTA styling
    was matched without the fixed positioning.
- Did not attempt: a sitewide fixed top app bar (mockup's back-arrow +
  wordmark + bookmark header). Every other page in the app uses an
  in-flow heading, not a fixed top bar — introducing one only for these
  two pages would be visually inconsistent with the rest of the site,
  and introducing it everywhere is a bigger, unrelated change outside
  this stage's two named screens.

Verification: tsc 0 errors, eslint 0 problems, vitest 86/86, `next build`
clean across all routes, i18n key parity confirmed (en/uk). No visual
screenshot diffing was possible — the sandboxed browser tool can't reach
this container's dev server — so pixel fidelity was verified by close
structural comparison against the reference `code.html`/`screen.png`
pairs instead of an automated diff.



## A note on verification limits

This project has no live Supabase project linked. Everything schema- and
RLS-related was validated against a real local Postgres instance with
simulated multi-user RLS tests — not just "the SQL parses." Everything
auth-flow-related (anonymous sessions, profile creation) is correct per
Supabase's documented API and has been runtime-tested against a
placeholder Supabase URL to confirm pages fail *gracefully* (error
boundaries) rather than crash — but the actual anonymous-session
round-trip can only be fully confirmed once a real Supabase project is
linked.
