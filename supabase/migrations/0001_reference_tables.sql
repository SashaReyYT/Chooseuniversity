-- Unifind — reference/lookup tables
-- These are small, slow-changing tables that the rest of the schema and
-- the matching engine key off of (country codes, language codes, a field
-- of study taxonomy). Public read, no user-facing writes.

create extension if not exists "pgcrypto";

create table countries (
  code text primary key check (code = upper(code) and length(code) = 2), -- ISO 3166-1 alpha-2
  name text not null
);

create table languages (
  code text primary key check (code = lower(code) and length(code) = 2), -- ISO 639-1
  name text not null
);

create table fields_of_study (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  -- Broad grouping used for filter UI (e.g. "Engineering & Technology",
  -- "Business & Economics"). Free text rather than an enum: the taxonomy
  -- will likely grow before it stabilizes enough to lock down.
  category text not null
);

create index fields_of_study_category_idx on fields_of_study (category);

comment on table countries is 'ISO 3166-1 alpha-2 country reference data.';
comment on table languages is 'ISO 639-1 language reference data.';
comment on table fields_of_study is 'Field-of-study taxonomy that programmes are tagged with.';

-- Baseline reference rows ship as part of the migration, not
-- `supabase/seed.sql`. This isn't optional/dev-only data: real catalog
-- migrations (e.g. 0007's Czech universities) have foreign keys into
-- these tables, and Supabase applies migrations before seed.sql, so any
-- catalog data seeded via a later migration would fail its FK checks if
-- these rows only existed in seed.sql. Extend this list as new
-- countries/languages/fields are needed — it's additive and safe to
-- re-run (`on conflict do nothing`).

insert into countries (code, name) values
  ('NL', 'Netherlands'),
  ('DE', 'Germany'),
  ('CZ', 'Czech Republic'),
  ('GB', 'United Kingdom'),
  ('IE', 'Ireland'),
  ('FR', 'France'),
  ('ES', 'Spain'),
  ('IT', 'Italy'),
  ('PT', 'Portugal'),
  ('PL', 'Poland'),
  ('AT', 'Austria'),
  ('CH', 'Switzerland'),
  ('SE', 'Sweden'),
  ('DK', 'Denmark'),
  ('FI', 'Finland'),
  ('US', 'United States'),
  ('CA', 'Canada'),
  ('UA', 'Ukraine')
on conflict (code) do nothing;

insert into languages (code, name) values
  ('en', 'English'),
  ('de', 'German'),
  ('nl', 'Dutch'),
  ('fr', 'French'),
  ('es', 'Spanish'),
  ('it', 'Italian'),
  ('pt', 'Portuguese'),
  ('cs', 'Czech'),
  ('pl', 'Polish'),
  ('uk', 'Ukrainian')
on conflict (code) do nothing;

insert into fields_of_study (name, category) values
  ('Computer Science', 'Engineering & Technology'),
  ('Data Science', 'Engineering & Technology'),
  ('Mechanical Engineering', 'Engineering & Technology'),
  ('Electrical Engineering', 'Engineering & Technology'),
  ('Business Administration', 'Business & Economics'),
  ('Economics', 'Business & Economics'),
  ('International Relations', 'Social Sciences'),
  ('Psychology', 'Social Sciences'),
  ('Medicine', 'Health Sciences'),
  ('Biology', 'Natural Sciences'),
  ('Physics', 'Natural Sciences'),
  ('Architecture', 'Arts & Design'),
  ('Graphic Design', 'Arts & Design'),
  ('Law', 'Law')
on conflict (name) do nothing;
