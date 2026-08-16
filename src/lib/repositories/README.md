# Repositories

Repositories are the only layer allowed to talk to Supabase/Postgres
directly. Each repository wraps queries for one domain concept (e.g.
`programmes.repository.ts`, `universities.repository.ts`,
`user-profile.repository.ts`) and returns plain typed data — no
Supabase-specific types leak past this layer.

Rules:
- No React, no Next.js request/response concerns here — repositories are
  framework-agnostic and receive a Supabase client instance as an argument
  (or via dependency injection), so they work the same from Server
  Components, Route Handlers, and Server Actions.
- No business logic (matching, scoring, filtering rules) — that belongs in
  `src/lib/services`.
- One repository per aggregate/table cluster, not one per query.

## Status

The schema exists now (`supabase/migrations/`), validated end-to-end
against a real Postgres instance including RLS enforcement (see the
migration files' comments and `supabase/seed.sql` for sample data).

Implemented so far:
- `programmes.repository.ts` — public catalog reads (programmes joined
  with university + country, field of study, language, academic
  requirements, language requirements — everything the matching engine
  needs to score a programme and explain the score). Includes
  `findByIds` for bulk-hydrating a set of programmes (e.g. a shortlist or
  comparison) in one query.
- `user-profile.repository.ts` — the current user's own profile (owner-only
  via RLS)
- `user-test-scores.repository.ts` — the current user's own test scores
  (owner-only via RLS)
- `saved-programmes.repository.ts` — the current user's shortlist
  (owner-only via RLS)
- `comparisons.repository.ts` — the current user's comparison sets and
  their items (owner-only via RLS, `comparison_items` via its parent
  comparison)
- `reference-data.repository.ts` — public reads for countries, languages,
  and fields of study (used by the onboarding form's dropdowns)

Not yet implemented (add as their features are built):
- `universities.repository.ts` (only needed standalone if universities are
  ever browsed independently of their programmes — for now
  `programmes.repository.ts` embeds what's needed)

Do not add ad-hoc `supabase.from(...)` calls directly inside components or
route handlers — route everything through a repository so the query
surface stays in one place.
