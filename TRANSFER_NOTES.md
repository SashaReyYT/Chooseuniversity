# Transfer notes: what came from Nevora, and what's still there

Nevora is a sister project (Vite + vanilla JS/ES modules, not Next.js) that
had already done real research on Czech universities and built its own
matching engine. Its stack is different enough from this project's
(Next.js 16 + React 19 + TypeScript + Supabase) that copying source files
directly wouldn't compile — so instead of copying code, this pass **ported
the researched data** into this project's own schema, and **left the
matching engine alone** since this project's `src/lib/matching/` is
already an independent, tested implementation of the same idea.

## What was ported (in `supabase/migrations/0007_seed_czech_universities.sql`)

- **35 real Czech universities** — name, city, website, founding year and
  a description (folding in ownership type and Nevora's own editorial
  admission-difficulty tier as text, since this schema has no dedicated
  columns for those).
- **6 real programmes** (out of ~16 Nevora had researched) at 5 of those
  universities — the ones with a *confirmed* tuition figure, since
  `programmes.tuition_fee_amount` is `not null` in this schema and the
  other ~10 only had a name/degree level/language sourced, no tuition.
  Each has a real official admissions URL.
- **Academic/language requirements** for those 6 programmes, translated
  into this schema's `programme_academic_requirements` /
  `programme_language_requirements` tables (CEFR levels stored as an
  ordinal 1–6 so the existing numeric-comparison scorer works unchanged).
- One new `fields_of_study` row (`Agricultural Sciences`) for the one
  programme that didn't fit the existing 14.

Full sourcing rationale and what was deliberately left NULL is in the
migration file's own header comment — read that before extending it.

## What's still in Nevora and NOT yet ported

**More programmes for the same 35 universities.** Nevora's
`supabase/migrations/0042_seed_programs.sql` has ~10 more real, named
programmes without a confirmed tuition figure (Biomedical Technology at
ČVUT, International Business at VŠE, Economics and Management at Mendel,
Physiotherapy at Palacký, English Philology and Mathematics at Ostrava,
Environmental Sciences at ČZU, two programmes at UCT Prague). Also see
`0041_seed_admission_requirements.sql` for per-university admission notes
(entrance exam format, application fees, interview requirements) covering
20+ universities — only the 5 relevant to the 6 seeded programmes were
pulled in here. A real next step: research the missing tuition figures
(most of these programmes' official pages likely list them; Nevora's own
notes say this just wasn't done yet), then add them the same way.

**Update:** university-level support facts (`dormitory_available`,
`international_office`, `erasmus_participation`,
`international_support_notes`) were ported in `0008`/`0009`, and are now
scored — `src/lib/matching/score-support.ts` (Support Fit, the engine's
6th dimension). Like Admission Fit it's profile-independent (no
"international support preference" field in `user_profiles` yet), and it
averages only the facts Nevora's research actually confirmed, per
Language Fit's known-signals pattern — see that file's header comment.
Dedicated `scholarships`/`dormitories` tables also exist (seeded in
`0009`) but are informational only so far, not read by the matching
engine or any UI tab yet.

**Still not in this project's matching engine, no schema support yet:**
- **Country/ownership/city-size preference** (Nevora's
  `scoreCountryCity`) — needs an ownership-type column and a city-size
  classification; this project's `score-location.ts` only compares
  country code / city name against the user's stated preference, it
  doesn't score public-vs-private or city size.
- **Erasmus / part-time-work as a *user preference*** (Nevora's
  `scorePreferences`) — the university-side Erasmus fact is now scored
  (above), but there's no `user_profiles` column yet for "I want a
  university that supports part-time work" to weight it against.
- **Living-cost budget as a separate dimension** (`scoreLivingBudget`) —
  this project already folds living cost into Budget Fit
  (`score-budget.ts`), so this one's arguably already covered, just
  combined rather than split out.

None of these are hard to add later — same pattern as the existing
`score-*.ts` files: one new table/column, one new `score-*.ts` file, one
line in `engine.ts`'s `dimensions` array.

**Not ported at all (different product shape, would need real
redesign work, not just data transfer):**
- `src/app/financial/` — a full financial planner/scholarship
  center/affordability simulator.
- `src/app/relocation/` — visa/settlement guidance after admission.
- `src/app/assistant/` — the AI Advisor chat (calls an LLM; this project
  has no AI-assistant surface yet).

**Not yet ported — up next:**
- `src/data/resources.js` — generic per-country resource links (visa
  portal, scholarship database, etc.). Only its `cz` entry is even
  relevant to this project (the `de`/`ca`/`us` entries are for other
  Nevora destinations this project doesn't cover) — not ported yet since
  it's a smaller, lower-value follow-up than `universityInternationalResources.js` was.

**Documents checklist — ported, deliberately partial.** Nevora's
`src/data/requiredDocuments.js` is wired into a roadmap/journey system
(`REQUIRED_DOCS_BY_GOAL_TYPE`, per-step tracking) plus real file upload
to Supabase Storage (`src/app/documents/`, `storageService.js`) — neither
has an equivalent here, and neither was ported: this app is a university
picker, not a journey planner, and doesn't let users upload/store their
own files. What *was* ported is the static reference content only —
`src/lib/documents/document-profiles.ts` (8 of Nevora's 12 document
profiles — the `study_abroad`-relevant ones; `visa`/`lease`/
`employment_letter`/`license` were for its `moving`/`work` journey types)
— shown read-only via `<DocumentChecklist />` on a programme's page. No
new database table, no per-user tracking, no upload.

**University resource links — ported.** Nevora's
`src/data/universityInternationalResources.js` (bilingual en/uk static
data, real sourced links/contacts per university across 7 categories:
international office, housing, visa support, buddy programme, student
services, Erasmus, arrival info) — ported into a new
`university_resources` table (`0012` schema, `0013` seed), English text
only (no i18n layer in this project yet). Coverage is honestly partial:
Nevora only researched this level of detail for 7 of the 35 universities
(its own "Задача 19" scope — Charles University, ČVUT, Masaryk, VŠE,
Palacký, Brno UT, ČZU) — 49 rows total, all real links. Shown read-only
via `<UniversityResources>` on a programme's page
(`UniversityResourcesRepository` / `CatalogService.listUniversityResources`).
Informational only, like `dormitories`/`scholarships` — not read by the
matching engine.

These are genuinely useful ideas for later, but each is a feature, not a
data file — worth scoping as its own task rather than a data port.
