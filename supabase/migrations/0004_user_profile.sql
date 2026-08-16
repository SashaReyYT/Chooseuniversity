-- Unifind — user profile & test scores
-- The structured "who the student is" side of matching, mirrored 1:1
-- against the requirement tables in 0003 (same GPA scale concept, same
-- test_type/score shape) so the matching engine can compare them directly
-- field-for-field instead of translating between two different shapes.

create type education_level as enum ('high_school', 'bachelor', 'master');

create table user_profiles (
  -- 1:1 with auth.users. Row is created when the user completes the
  -- onboarding questionnaire (see the Stitch "Questionnaire" mockups) —
  -- not automatically on signup, since a bare auth row has none of the
  -- structured data matching needs yet.
  id uuid primary key references auth.users (id) on delete cascade,

  full_name text,
  nationality_country_code text references countries (code),

  current_education_level education_level,
  current_gpa numeric(4, 2) check (current_gpa is null or current_gpa >= 0),
  current_gpa_scale numeric(4, 2) check (current_gpa_scale is null or current_gpa_scale > 0),
  check (
    (current_gpa is null and current_gpa_scale is null) or
    (current_gpa is not null and current_gpa_scale is not null and current_gpa <= current_gpa_scale)
  ),

  budget_min numeric(12, 2) check (budget_min is null or budget_min >= 0),
  budget_max numeric(12, 2) check (budget_max is null or budget_max >= 0),
  budget_currency text check (budget_currency is null or (budget_currency = upper(budget_currency) and length(budget_currency) = 3)),
  check (budget_min is null or budget_max is null or budget_min <= budget_max),

  preferred_degree_level degree_level,

  -- Preference lists: always read/written as a whole set for one user by
  -- the matching engine (never queried across users by individual value),
  -- so plain arrays are the right shape here — a join table would add
  -- write/read overhead with no query pattern that needs it.
  preferred_country_codes text[] not null default '{}',
  preferred_cities text[] not null default '{}',
  preferred_field_of_study_ids uuid[] not null default '{}',
  preferred_language_codes text[] not null default '{}',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table user_profiles is 'Structured student profile the matching engine scores programmes against. One row per user, created at end of onboarding.';

create trigger user_profiles_set_updated_at
  before update on user_profiles
  for each row execute function set_updated_at();

create table user_test_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,

  -- Same free-text shape as programme_language_requirements.test_type —
  -- the matching engine joins on this column being an exact match.
  test_type text not null,
  score numeric(6, 2) not null check (score >= 0),
  score_display text not null,
  test_date date,

  created_at timestamptz not null default now(),

  unique (user_id, test_type)
);

create index user_test_scores_user_id_idx on user_test_scores (user_id);

comment on table user_test_scores is 'Language/standardized test scores a user has entered — compared against programme_language_requirements for Language Fit.';
