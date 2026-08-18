# Unifind

A deterministic, explainable university discovery and matching platform.
No AI in the matching path — structured user data + structured programme
requirements produce a Match Score with a full, translatable explanation.

See `docs/project-rules.md` for the constraints this project must keep,
and `docs/milestones.md` for what's actually been built and verified so
far.

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind v4 · Supabase (Postgres +
anonymous auth) · next-intl (`en`/`uk`) · Vitest

## Getting started

```bash
npm install
cp .env.local.example .env.local   # fill in your Supabase project's URL/anon key
npm run dev
```

Database setup: see `supabase/README.md` — includes a full local-Postgres
validation workflow that doesn't require a live Supabase project.

## Scripts

```bash
npm run dev      # local dev server
npm run build    # production build
npm run lint     # ESLint
npm run test     # Vitest (matching engine unit tests)
```

## Project layout

- `src/app/[locale]/` — routes: `/discover`, `/saved`, `/compare`,
  `/profile`, all locale-prefixed
- `src/lib/matching/` — the deterministic matching engine (pure
  TypeScript, no DB access — see its own README)
- `src/lib/repositories/`, `src/lib/services/` — the data/business-logic
  layers components call into (see their READMEs)
- `src/i18n/` — next-intl setup (see its README)
- `supabase/` — SQL migrations + RLS + local validation workflow (see its
  README)
- `docs/` — project rules and milestone history
