# Matching engine

The deterministic, explainable matching engine described in the product
spec: structured user profile + structured programme requirements → an
overall Match Score broken into five sub-scores (Academic, Budget,
Language, Location, Admission), each with human-readable reasons
("✓ English-taught programme") and concerns ("⚠ Entrance exam required").

- `engine.ts` — `computeMatchScore(profile, programme, now?)`, the public
  entry point. Averages whichever dimensions had enough data to be scored
  (`applicable: true`) rather than penalizing missing profile data.
- `score-academic.ts`, `score-budget.ts`, `score-language.ts`,
  `score-location.ts`, `score-admission.ts` — one pure function per
  dimension. Each file's top comment documents its scoring rule and *why*
  it's shaped that way (e.g. why required subjects are a concern, not a
  score deduction).
- `messages.ts` — `MatchMessage`, the structured type reasons/concerns are
  made of: either `{ type: "translated", key, params }` (UI copy, resolved
  against the `Matching` namespace in `messages/{locale}.json` at render
  time — see `src/app/[locale]/matches/match-card.tsx`) or
  `{ type: "raw", text }` (DB-sourced content, e.g. a programme's own
  `entrance_exam_notes`, rendered verbatim — not this layer's job to
  translate arbitrary source data). Numbers and dates go into `params` as
  raw values, not pre-formatted strings — the scorer files don't know the
  active locale, so formatting happens at render time via next-intl's ICU
  support (`{amount, number}`, `{date, date, long}`), which is also what
  makes it locale-correct (e.g. `31,700` vs `31 700`).
- `types.ts` — `MatchUserProfile`, `MatchResult`, `MatchDimensionResult`,
  and the score→label thresholds.
- `test-fixtures.ts` + `*.test.ts` — 38 unit tests across all six scoring
  files (`npm run test`), plus `hasMessageKey`/`hasRawMessage`/
  `paramsForKey` helpers for asserting against structured messages instead
  of English substrings. Every dimension has both a "matches well" and a
  "doesn't match" case, plus the not-applicable / missing-data path.

Hard constraints this implementation respects, and any future change
here must too:
- No AI/LLM in the scoring path. Every function here is pure and
  deterministic — same inputs, same output, every time.
- Every score is explainable. A dimension is never just a number; it's
  always `{ score, applicable, reasons, concerns }`. The engine's overall
  result carries the same guarantee at the top level.
- Called by `src/lib/services/matching.service.ts` — never invoked
  directly from components. Components should never import from
  `src/lib/matching` directly.

Not yet implemented / open follow-ups for a later stage:
- Currency conversion for Budget Fit (currently flags a concern instead of
  converting — no FX-rate table in the schema yet).
- Configurable per-user dimension weights (currently equal-weighted; no
  product signal yet that any dimension should dominate).
