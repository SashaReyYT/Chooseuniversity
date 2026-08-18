# Project rules

Non-negotiable constraints from the product spec. If a future change
seems to require breaking one of these, stop and confirm with the
product owner rather than silently reinterpreting the rule.

## Product

- **Not an AI chatbot.** The core matching functionality must never
  depend on an AI/LLM model. Matching is deterministic, transparent, and
  explainable — structured user data + structured programme requirements
  in, a score with reasons out. AI may be added later as an *addition*,
  never as a replacement for this.
- **Every Match Score must be explainable.** Never render a bare
  percentage. Always show the sub-score breakdown plus "why it matches
  you" / "potential concerns" — see `src/lib/matching/README.md` and the
  visual hierarchy rule below.
- **No user registration in V1.** No email/password, no social login, no
  account requirement anywhere in the core flow. Every visitor gets an
  anonymous Supabase session automatically (`src/proxy.ts`). The schema
  is deliberately designed so real accounts can be attached to the same
  `auth.uid()` later without a data migration — see
  `supabase/README.md`.

## Internationalization

- Exactly two UI languages: English (`en`) and Ukrainian (`uk`). Every
  user-facing string — including validation messages, empty states, and
  the matching engine's reasons/concerns — must be translatable. See
  `src/i18n/README.md`.
- Programme/university source data (names, descriptions) is not UI copy
  and is not translated by the i18n layer — see the distinction documented
  in `src/lib/matching/messages.ts`.
- `messages/en.json` and `messages/uk.json` must always have identical
  key sets. Check parity after editing either file (see
  `src/i18n/README.md` for the check).

## Architecture

- Clean service/repository layering: components never call Supabase
  directly. Repositories own queries, services own business logic and
  orchestration. See `src/lib/repositories/README.md` and
  `src/lib/services/README.md`.
- The matching engine (`src/lib/matching/`) is pure, deterministic
  TypeScript with no database access and no framework coupling — it's
  unit-tested in isolation from everything else.
- SQL migrations are the source of truth for schema, applied in order;
  see `supabase/README.md` for how to validate a migration locally
  without a live Supabase project.

## Visual design

- Design direction: premium, academic, editorial, minimal, warm
  off-white/ivory backgrounds, deep navy buttons, restrained
  success/warning accents, serif display type (Playfair Display) for
  editorial headings, clean sans-serif (Inter) for UI/data. Not a generic
  SaaS dashboard, not "AI startup" styling. See design tokens in
  `src/app/[locale]/globals.css`.
- **Visual hierarchy on any programme/match card, top to bottom:**
  1. Match badge (score + label) — §32, the largest element
  2. "Best For" contextual label (when applicable) — §34
  3. University name → Programme name → City, Country
  4. Compact metrics (Academic, Budget, Admission) + key facts (tuition · duration · language)
  5. Why it matches you — up to 3 strongest reasons
  6. One thing to know — top concern highlighted
  7. Actions — View Full Details, Save, Compare
  8. Detailed information (collapsed by default)

  A user should understand whether a programme fits them within a few
  seconds — don't give every field equal visual weight. See
  `src/components/programme-card.tsx` for the reference implementation.
- Four-concept navigation: **Discover / Saved / Compare / Profile**.
  Don't introduce a fifth top-level concept or rename these without
  updating `src/components/app-nav.tsx` and the `Nav` message namespace
  together.

## File naming

- Framework-required filenames (`page.tsx`, `layout.tsx`, `error.tsx`,
  `global-error.tsx`, `route.ts`, `proxy.ts`) must stay exactly as
  required by Next.js — renaming them breaks routing. This is the one
  documented exception to "avoid duplicate/generic filenames."
- `README.md` per folder is the other documented exception — it's what
  GitHub and most editors auto-render for folder-level docs; renaming it
  loses that.
- Everything else should have a specific, self-describing filename —
  avoid generic names like `actions.ts`, `types.ts`, or `utils.ts`
  repeated across folders when a more specific name is available (e.g.
  `toggle-save-action.ts`, not `actions.ts`).
