# Database

Postgres schema for Unifind, managed as Supabase migrations under
`migrations/`. Applied in filename order:

1. `0001_reference_tables.sql` — countries, languages, fields of study
2. `0002_catalog.sql` — universities, programmes
3. `0003_programme_requirements.sql` — academic + language requirements
   per programme (feeds Academic/Admission/Language Fit sub-scores)
4. `0004_user_profile.sql` — user profile + test scores (mirrors the
   requirement tables' shape so the matching engine compares like-for-like)
5. `0005_saved_and_comparisons.sql` — shortlist and side-by-side comparisons
6. `0006_row_level_security.sql` — RLS: catalog is public-read, user data
   is owner-only
7. `0007_seed_czech_universities.sql` — real catalog data: 35 Czech
   universities and 6 sourced programmes with requirements. See the
   file's own header for sourcing/honesty notes on what's real vs. left
   NULL where unconfirmed.
8. `0008_university_living_costs.sql` — living-cost reference estimates
   per country/city and per programme, plus scholarships and enrolment
   facts for the public university pages
9. `0009_accommodation_living_costs_qualifications.sql` — university
   dormitory data, per-programme living-cost breakdowns, NMT scores,
   user qualifications
10. `0010_catalog_enrichment_sources_admin.sql` — university model
    extension (slug, cover image, official application URL, ranking
    data, student counts, coordinates, published flag), programme
    study-mode/application-fee/documents/scholarship/career columns,
    the `sources` ledger (§41), the import ledger (§43), and admin
    access via `admin_users` (§44)

Baseline reference data (countries, languages, the field-of-study
taxonomy) ships inside `0001_reference_tables.sql` itself, not a separate
seed file — see that migration's comment for why: later migrations with
real catalog data have foreign keys into these tables, and Supabase
applies migrations before `seed.sql`, so reference data seeded there
instead would break any migration that depends on it.

## Design decisions worth knowing

- **GPA and test scores are structured, not free text.** Every field a
  Match Score sub-score or a "why it matches you" line needs to read
  exists as its own typed column — this is what keeps the matching engine
  deterministic and explainable instead of guesswork over a blob.
- **Preference lists are Postgres arrays**, not join tables (e.g.
  `user_profiles.preferred_country_codes`). They're always read/written as
  a whole set for one user and never queried across users by individual
  value, so a join table would add cost with no matching query pattern to
  justify it.
- **`test_type` is free text**, not an enum, on both
  `programme_language_requirements` and `user_test_scores`. The matching
  engine only needs an exact string match between the two — it never needs
  to reason about the space of valid tests, so an enum would just add
  migration friction every time a new test type shows up.
- **No persisted match scores.** The engine (next stage) is meant to
  compute scores on demand from these tables, not cache a stale number —
  keep it that way unless a real performance need shows up.
- **Catalog writes are admin-only, public read stays open.** The RLS
  setup splits cleanly: catalog tables are public-read (visitors render
  programme pages directly) with insert/update/delete granted only
  through `public.is_admin()`, a `security definer` function reading
  `admin_users` without RLS — that indirection is what avoids the
  recursion a policy on `admin_users` reading itself would create
  (see `0010`). User-owned tables stay owner-only; admins never touch
  user data.
- **Sources are a ledger, not decoration.** Every fact worth citing
  links through `programme_sources`/`university_sources` to a
  `sources` row (URL, name, type). The rule that governs the data —
  "never invent, leave NULL" — is documented in `docs/data-acquisition.md`.
- **Imports are audited.** Every file upload creates an `imports` row
  with its status (`parsed` → `imported`/`review`/`failed`) and
  per-row problems in `import_errors`. Format contract and pipeline
  behavior live in `docs/data-import.md`.
- **No signup/login in V1.** Every visitor gets an anonymous Supabase
  session (`auth.signInAnonymously()`, wired in `src/proxy.ts`) — a real
  `auth.users` row with a stable UUID, no email/password. Every RLS
  policy here is keyed on `auth.uid()` (see `0006`), which anonymous users
  have just as much as signed-up ones, so `user_profiles`,
  `saved_programmes`, etc. all work unmodified for anonymous visitors.
  `enable_anonymous_sign_ins` must be on for the linked Supabase project
  (already set in `config.toml` for local dev — also needs enabling in
  the dashboard once a real project exists).

## Validating changes

This repo has no live Supabase project linked yet. Until it does, the
fastest way to sanity-check a migration is a local Postgres:

```bash
sudo apt-get install -y postgresql
sudo service postgresql start
sudo -u postgres psql -c "CREATE ROLE app WITH LOGIN SUPERUSER PASSWORD 'app';"
sudo -u postgres psql -c "CREATE DATABASE unifind OWNER app;"
# Supabase provides auth.users/auth.uid() in the real project; stub them
# locally only for testing RLS — do not carry this stub into migrations:
PGPASSWORD=app psql -h localhost -U app -d unifind -c "create schema auth; create table auth.users (id uuid primary key default gen_random_uuid());"

for f in migrations/*.sql; do PGPASSWORD=app psql -h localhost -U app -d unifind -v ON_ERROR_STOP=1 -f "$f"; done
```

Once a real project exists, use the Supabase CLI instead
(`supabase db push` / `supabase db reset`) and regenerate
`src/types/database.ts` with
`supabase gen types typescript --linked > src/types/database.ts`.
