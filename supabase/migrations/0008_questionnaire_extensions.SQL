-- Unifind — full matching questionnaire extensions
-- Adds the structured fields the product spec's "Full Matching
-- Questionnaire" section needs that weren't part of the original
-- onboarding form: study format, a distinct location-preference shape
-- (vs. free-text cities), a budget mode for users who don't know an
-- exact number, a country launch/rollout flag, and a field-of-study
-- subcategory + primary-vs-additional-interest distinction.
--
-- Deliberately additive/nullable throughout — existing rows and the
-- current single-page profile form keep working unchanged until the
-- UI is updated to collect the new fields.

-- 1. Countries — launch-country rollout support (spec §13).
-- `code` stays the primary key (it's already a stable, small natural
-- key that every catalog/profile FK points at — adding a surrogate
-- `id` would just be a second identifier for the same row with no
-- query that needs it). `supported` + `sort_order` are what the spec
-- actually asks the architecture to provide: which countries the UI
-- should currently offer, and in what order.
alter table countries
  add column supported boolean not null default false,
  add column sort_order integer not null default 100;

comment on column countries.supported is 'Whether this country is currently offered in the UI. Launch country (Czechia) is true; the rest ship as reference data ready to switch on later.';
comment on column countries.sort_order is 'Explicit display order for supported countries (lower first). Unsupported countries fall back to name order.';

update countries set supported = true, sort_order = 0 where code = 'CZ';

-- 2. Study format (spec §12).
create type study_format as enum ('full_time', 'part_time', 'either');

alter table user_profiles
  add column preferred_study_format study_format;

comment on column user_profiles.preferred_study_format is 'V1 targets traditional on-campus programmes; online/hybrid are future values this enum can grow to hold.';

-- 3. Location preference (spec §14).
-- Kept alongside the existing `preferred_cities` free-text array rather
-- than replacing it: `location_preference_type` captures the *shape* of
-- what the user wants (an exact city vs. "any student city"), while
-- `preferred_cities` still holds actual city names when the type is
-- `specific_city`. This is what lets the matching engine tell "wants
-- exactly Prague" apart from "wants a big city, flexible on which one".
create type location_preference_type as enum (
  'specific_city',
  'any_city',
  'capital_or_large_city',
  'medium_city',
  'small_city',
  'student_city',
  'flexible'
);

alter table user_profiles
  add column location_preference_type location_preference_type,
  add column open_to_other_cities boolean;

comment on column user_profiles.location_preference_type is 'What kind of place the user is looking for, distinct from *which* city (see preferred_cities).';
comment on column user_profiles.open_to_other_cities is 'Whether the user would consider cities outside their stated preference — lets matching distinguish a hard requirement from a soft one.';

-- 4. Budget mode (spec §15).
-- `budget_max` (renamed in spirit to "the annual ceiling", existing
-- column kept as-is to avoid a breaking rename of a column the matching
-- engine and RLS-tested UI already depend on) stores the number when
-- the user gave one. `budget_mode` records *how* they answered, so a
-- `low`/`medium`/`high`/`unknown` response is never displayed back to
-- the user as if it were an exact figure they typed.
create type budget_mode as enum ('exact', 'low', 'medium', 'high', 'unknown');

alter table user_profiles
  add column budget_mode budget_mode not null default 'unknown';

comment on column user_profiles.budget_mode is 'How the budget was captured. ''exact'' means budget_min/budget_max hold a real user-entered figure; low/medium/high/unknown mean they do not, and any ceiling derived from this mode for scoring purposes must stay internal, never rendered as a false-precision number.';

-- 5. Field of study taxonomy + primary vs. additional interest (spec §11).
alter table fields_of_study
  add column subcategory text;

comment on column fields_of_study.subcategory is 'Optional finer-grained grouping within category, e.g. category ''Engineering & Technology'' / subcategory ''Software & AI''.';

alter table user_profiles
  add column primary_field_of_study_id uuid references fields_of_study (id);

comment on column user_profiles.primary_field_of_study_id is 'The single field the user is primarily looking to study. preferred_field_of_study_ids continues to hold this plus any additional interests, so existing matching logic that reads the array keeps working unchanged.';

-- A few fields named explicitly in the product spec (§11) that weren't
-- in the original 0001 seed, tagged with a subcategory now that the
-- column exists. Additive/idempotent like the rest of the reference
-- data — safe to re-run.
insert into fields_of_study (name, category, subcategory) values
  ('Software Engineering', 'Engineering & Technology', 'Software & AI'),
  ('Artificial Intelligence', 'Engineering & Technology', 'Software & AI'),
  ('Cybersecurity', 'Engineering & Technology', 'Software & AI'),
  ('Mathematics', 'Natural Sciences', null)
on conflict (name) do nothing;

update fields_of_study set subcategory = 'Software & AI'
  where name in ('Computer Science', 'Data Science') and subcategory is null;