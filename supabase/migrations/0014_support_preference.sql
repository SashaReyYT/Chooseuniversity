-- Unifind — Support Fit as the ninth Match Score dimension (P1#8)
-- The support scorer (`score-support.ts`) predates the engine refactor and
-- was never wired into `computeMatchScore`. This migration gives it the two
-- things it needs to become a real dimension:
--   1. `user_profiles.support_preference` — a user-side gate: the dimension
--      is only scored for students who explicitly say they want strong
--      international support (everyone else gets a clutter-free score).
--   2. `user_match_weights.support` — the per-user weight column for the
--      weighted average, mirroring the existing eight dimension columns.
-- Both additions are idempotent, matching the 0013 style.

-- ============================================================
-- §1 User-side support preference
-- ============================================================

alter table user_profiles
  add column if not exists support_preference text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'user_profiles'::regclass
      and conname = 'user_profiles_support_preference_check'
  ) then
    alter table user_profiles
      add constraint user_profiles_support_preference_check
      check (support_preference in ('wants_support', 'no_preference'));
  end if;
end $$;

comment on column user_profiles.support_preference is
  'Whether the student wants universities with strong international-student support (wants_support) or does not care (no_preference). Gates the Support Fit dimension: null/no_preference keeps the dimension out of the weighted score.';

-- ============================================================
-- §2 Per-user weight for the ninth dimension
-- ============================================================

alter table user_match_weights
  add column if not exists support numeric(5, 2) not null default 1
    check (support >= 0);

comment on column user_match_weights.support is
  'Weight for the Support Fit dimension (spec §26). Default 1 = equal weighting, same as the other eight dimensions.';