# Services

Services hold business logic and orchestrate one or more repositories.

Rules:
- Services call repositories, never `supabase.from(...)` directly.
- Services are what Route Handlers / Server Actions / Server Components
  call — components should not import repositories directly.
- Keep the matching engine (`src/lib/matching`) explainable: every score a
  service produces should come with the structured breakdown (sub-scores +
  reasons) needed to render the "why it matches you" UI described in the
  product spec, not just a final number.

## Implemented

- `matching.service.ts` — `MatchingService`. Loads a user's profile + test
  scores + the programme catalog via the repository layer and runs each
  programme through `computeMatchScore` (`src/lib/matching/engine.ts`).
  Contains no scoring logic itself, only wiring and sorting:
  - `listMatchesForUser(userId, filters?)` — every programme matching
    `filters` (search/field/degree/language/tuition/sort, spec §35–36 —
    same shape `ProgrammesRepository.search` takes), ranked per
    `filters.sortBy` (`sortRankedMatches`, unit-tested). Omitting
    `filters` returns every programme, best-fit first.
  - `getMatchForProgramme(userId, programmeId)` — one programme's match,
    for a programme detail page.
- `favourites.service.ts` — `FavouritesService`. The shortlist: saves,
  unsaves, checks save status, and lists a user's saved programmes
  hydrated with full catalog details.
- `comparison.service.ts` — `ComparisonService`. Named comparison sets:
  create/rename/delete a comparison, add/remove a programme, and list
  comparisons with their items hydrated (in display order) with full
  catalog details.
- `profile.service.ts` — `ProfileService`. The onboarding upsert rule
  (create on first submission, update on any resubmission) on top of
  `user-profile.repository.ts`, so callers don't need to know which case
  they're in.

Neither `favourites.service.ts` nor `comparison.service.ts` know about
`MatchingService` — they don't attach a Match Score to what they return.
A caller building a UI that shows both (e.g. "your saved programmes with
their fit score") should call both services and join the results itself,
rather than this layer guessing which combination a given screen needs.
