-- Unifind — accommodation, living-cost breakdown, qualifications & preferences
-- Implements product spec §17–§30:
--   §17 Accommodation (university dormitory + city-wide fallback)
--   §18 Monthly cost-of-living breakdown with sourced estimates
--   §19 Academic background (graduation year / graduated status)
--   §20 Ukrainian NMT support (configurable subjects, 0–200 scale)
--   §21 Other qualifications (SAT/ACT/IB/A-levels/AP/Abitur/Matura/...)
--   §22 English proficiency (CEFR + test scores)
--   §23 Mathematics background
--   §24 Admission preferences
--   §25 Career priorities
--   §26 User match weights (per-dimension personalization)
--   §28 Hard requirements vs soft preferences (programme side)
--
-- Deliberately additive/nullable throughout — existing rows, the current
-- single-page profile form, and the existing matching engine keep working
-- unchanged until the UI/engine are updated to consume the new fields.

-- ============================================================
-- §17 Accommodation
-- ============================================================

-- University-owned/affiliated dormitory information. One row per
-- university (a university may have several dorms; V1 stores the primary
-- one — a join table can come later if multiple dorms per university are
-- needed).
create table university_accommodation (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null unique references universities (id) on delete cascade,

  dormitory_available boolean not null default false,
  dormitory_name text,
  room_type text,
  estimated_monthly_cost_min numeric(10, 2) check (estimated_monthly_cost_min is null or estimated_monthly_cost_min >= 0),
  estimated_monthly_cost_max numeric(10, 2) check (estimated_monthly_cost_max is null or estimated_monthly_cost_max >= 0),
  currency text check (currency is null or (currency = upper(currency) and length(currency) = 3)),
  check (
    (estimated_monthly_cost_min is null and estimated_monthly_cost_max is null) or
    (estimated_monthly_cost_min is not null and estimated_monthly_cost_max is not null and estimated_monthly_cost_min <= estimated_monthly_cost_max)
  ),
  estimated_deposit numeric(10, 2) check (estimated_deposit is null or estimated_deposit >= 0),
  estimated_capacity integer check (estimated_capacity is null or estimated_capacity > 0),
  distance_from_campus_km numeric(6, 2) check (distance_from_campus_km is null or distance_from_campus_km >= 0),
  official_link text,
  source_url text,
  source_name text,
  source_date date,
  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index university_accommodation_university_id_idx
  on university_accommodation (university_id);

comment on table university_accommodation is 'University dormitory information (spec §17). Never invent numbers — when unavailable, leave columns null and the UI shows "Information not available".';

-- City-wide accommodation estimate used when a university does not have
-- (or publish) its own dormitory data.
create table city_accommodation_estimates (
  id uuid primary key default gen_random_uuid(),
  country_code text not null references countries (code),
  city text not null,
  estimated_monthly_cost_min numeric(10, 2) check (estimated_monthly_cost_min is null or estimated_monthly_cost_min >= 0),
  estimated_monthly_cost_max numeric(10, 2) check (estimated_monthly_cost_max is null or estimated_monthly_cost_max >= 0),
  currency text check (currency is null or (currency = upper(currency) and length(currency) = 3)),
  check (
    (estimated_monthly_cost_min is null and estimated_monthly_cost_max is null) or
    (estimated_monthly_cost_min is not null and estimated_monthly_cost_max is not null and estimated_monthly_cost_min <= estimated_monthly_cost_max)
  ),
  source_url text,
  source_name text,
  source_type text check (source_type in ('official', 'external')),
  source_date date,
  notes text,

  unique (country_code, city)
);

comment on table city_accommodation_estimates is 'City-wide accommodation cost estimate (spec §17) used when university dormitory data is unavailable.';

-- ============================================================
-- §18 Monthly cost-of-living breakdown
-- ============================================================

-- Per-programme monthly living-cost breakdown. Every estimate carries
-- min/max, currency, and source attribution so the UI can distinguish
-- "Official university information" from "Estimated external information".
create table programme_living_cost_estimates (
  id uuid primary key default gen_random_uuid(),
  programme_id uuid not null unique references programmes (id) on delete cascade,

  accommodation_min numeric(10, 2) check (accommodation_min is null or accommodation_min >= 0),
  accommodation_max numeric(10, 2) check (accommodation_max is null or accommodation_max >= 0),
  food_min numeric(10, 2) check (food_min is null or food_min >= 0),
  food_max numeric(10, 2) check (food_max is null or food_max >= 0),
  transport_min numeric(10, 2) check (transport_min is null or transport_min >= 0),
  transport_max numeric(10, 2) check (transport_max is null or transport_max >= 0),
  utilities_min numeric(10, 2) check (utilities_min is null or utilities_min >= 0),
  utilities_max numeric(10, 2) check (utilities_max is null or utilities_max >= 0),
  internet_phone_min numeric(10, 2) check (internet_phone_min is null or internet_phone_min >= 0),
  internet_phone_max numeric(10, 2) check (internet_phone_max is null or internet_phone_max >= 0),
  study_materials_min numeric(10, 2) check (study_materials_min is null or study_materials_min >= 0),
  study_materials_max numeric(10, 2) check (study_materials_max is null or study_materials_max >= 0),
  other_min numeric(10, 2) check (other_min is null or other_min >= 0),
  other_max numeric(10, 2) check (other_max is null or other_max >= 0),
  total_min numeric(10, 2) check (total_min is null or total_min >= 0),
  total_max numeric(10, 2) check (total_max is null or total_max >= 0),
  currency text check (currency is null or (currency = upper(currency) and length(currency) = 3)),

  source_url text,
  source_name text,
  source_type text check (source_type in ('official', 'external')),
  source_date date,
  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table programme_living_cost_estimates is 'Monthly cost-of-living breakdown per programme (spec §18). Each estimate has amount, currency, period (monthly), source URL/name/type/date.';

-- ============================================================
-- §19 Academic background extensions
-- ============================================================

alter table user_profiles
  add column graduation_year integer check (graduation_year is null or graduation_year between 1950 and 2100),
  add column has_graduated boolean;

comment on column user_profiles.graduation_year is 'Year the user graduated (or will graduate) from their current education level (spec §19).';
comment on column user_profiles.has_graduated is 'Whether the user has already graduated from their current education level (spec §19).';

-- ============================================================
-- §20 Ukrainian NMT support
-- ============================================================

-- Configurable NMT subject list (spec §20: "The subject list should be
-- configurable"). Availability per year is supported so subjects can be
-- added/removed without code changes.
create table nmt_subjects (
  code text primary key,
  name text not null,
  available_from_year integer,
  available_until_year integer
);

insert into nmt_subjects (code, name) values
  ('ukrainian_language', 'Ukrainian language'),
  ('mathematics', 'Mathematics'),
  ('ukrainian_history', 'Ukrainian history'),
  ('english', 'English'),
  ('biology', 'Biology'),
  ('physics', 'Physics'),
  ('chemistry', 'Chemistry'),
  ('geography', 'Geography')
on conflict (code) do nothing;

comment on table nmt_subjects is 'Configurable NMT subject list (spec §20). Availability per year is supported so subjects can be added/removed without code changes.';

-- NMT scores: 0–200 scale per spec §20.
create table user_nmt_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  subject_code text not null references nmt_subjects (code),
  score numeric(5, 2) not null check (score >= 0 and score <= 200),
  test_year integer check (test_year is null or test_year between 2000 and 2100),
  created_at timestamptz not null default now(),

  unique (user_id, subject_code)
);

create index user_nmt_scores_user_id_idx on user_nmt_scores (user_id);

comment on table user_nmt_scores is 'Ukrainian NMT scores (spec §20). Score range 0–200. One row per (user, subject).';

-- ============================================================
-- §21 Other qualifications
-- ============================================================

create type qualification_type as enum (
  'sat', 'act', 'ib', 'a_levels', 'ap', 'abitur', 'matura',
  'national_certificate', 'other'
);

-- User's non-NMT academic qualifications. `details` is JSONB because the
-- sub-score shape differs per qualification (SAT total/math/reading,
-- ACT composite/english/math/reading/science, IB total + subject scores,
-- etc.) — a fixed column per sub-score would be unmaintainable.
create table user_qualifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  qualification_type qualification_type not null,
  details jsonb not null default '{}',
  year integer check (year is null or year between 1950 and 2100),
  notes text,
  created_at timestamptz not null default now(),

  unique (user_id, qualification_type)
);

create index user_qualifications_user_id_idx on user_qualifications (user_id);

comment on table user_qualifications is 'User''s academic qualifications beyond NMT (spec §21): SAT, ACT, IB, A-levels, AP, Abitur, Matura, national certificate, other. Sub-scores stored as JSONB since the shape differs per qualification.';

-- Which qualifications a programme recognizes (spec §21: "The database
-- should allow programme requirements to specify which qualification/test
-- they recognize").
create table programme_qualification_requirements (
  id uuid primary key default gen_random_uuid(),
  programme_id uuid not null references programmes (id) on delete cascade,
  qualification_type qualification_type not null,
  min_score numeric(6, 2) check (min_score is null or min_score >= 0),
  min_score_display text,
  notes text,

  unique (programme_id, qualification_type)
);

create index programme_qualification_requirements_programme_id_idx
  on programme_qualification_requirements (programme_id);

comment on table programme_qualification_requirements is 'Qualifications a programme recognizes and their minimum scores (spec §21).';

-- ============================================================
-- §22 English proficiency
-- ============================================================

create type cefr_level as enum ('a1', 'a2', 'b1', 'b2', 'c1', 'c2', 'native', 'not_sure');

alter table user_profiles
  add column english_level cefr_level;

comment on column user_profiles.english_level is 'Self-assessed English proficiency on the CEFR scale (spec §22).';

-- Existing test-score table gains a CEFR equivalent so the matching
-- engine can compare a user's test score against programme requirements
-- that specify a CEFR level rather than a raw test score.
alter table user_test_scores
  add column cefr_equivalent cefr_level;

comment on column user_test_scores.cefr_equivalent is 'CEFR equivalent of the test score where applicable (spec §22).';

-- ============================================================
-- §23 Mathematics background
-- ============================================================

create type math_background as enum ('excellent', 'good', 'average', 'weak', 'not_sure');

alter table user_profiles
  add column math_background math_background;

comment on column user_profiles.math_background is 'Self-assessed mathematics background (spec §23). Used alongside actual academic/test data where available.';

-- ============================================================
-- §24 Admission preferences
-- ============================================================

create type admission_preference as enum ('safest', 'balanced', 'competitive', 'no_preference');

alter table user_profiles
  add column admission_preference admission_preference;

comment on column user_profiles.admission_preference is 'How competitive the user wants their options to be (spec §24). Affects ranking/recommendation only — never the real admission requirements.';

-- ============================================================
-- §25 Career priorities
-- ============================================================

create table career_priorities (
  code text primary key,
  label text not null
);

insert into career_priorities (code, label) values
  ('career_opportunities', 'Career opportunities'),
  ('academic_reputation', 'Strong academic reputation'),
  ('research', 'Research'),
  ('internships', 'Internships'),
  ('employment_after_graduation', 'Employment after graduation'),
  ('international_environment', 'International environment'),
  ('affordable_education', 'Affordable education'),
  ('affordable_living', 'Affordable living'),
  ('big_city', 'Big city'),
  ('student_life', 'Student life'),
  ('small_class_sizes', 'Small class sizes'),
  ('practical_education', 'Practical education'),
  ('tech_ecosystem', 'Strong technology ecosystem'),
  ('stay_after_graduation', 'Possibility to stay after graduation')
on conflict (code) do nothing;

alter table user_profiles
  add column career_priorities text[] not null default '{}';

comment on table career_priorities is 'Career/lifestyle priorities a user can select (spec §25).';
comment on column user_profiles.career_priorities is 'User''s selected career priorities (spec §25). Part of the personalization model.';

-- ============================================================
-- §26 User match weights
-- ============================================================

-- Per-user weights for the matching dimensions (spec §26). Default 1 for
-- every dimension = the current equal-weight behavior. Weights are
-- normalized by the matching engine before computing the weighted score.
create table user_match_weights (
  user_id uuid primary key references auth.users (id) on delete cascade,
  academic numeric(5, 2) not null default 1 check (academic >= 0),
  admission numeric(5, 2) not null default 1 check (admission >= 0),
  budget numeric(5, 2) not null default 1 check (budget >= 0),
  language numeric(5, 2) not null default 1 check (language >= 0),
  location numeric(5, 2) not null default 1 check (location >= 0),
  career numeric(5, 2) not null default 1 check (career >= 0),
  format numeric(5, 2) not null default 1 check (format >= 0),
  lifestyle numeric(5, 2) not null default 1 check (lifestyle >= 0),
  updated_at timestamptz not null default now()
);

comment on table user_match_weights is 'Per-user dimension weights for the weighted Match Score (spec §26). Default 1 = equal weighting.';

-- ============================================================
-- §28 Hard requirements (programme side)
-- ============================================================

-- Hard requirements are separated from soft preferences (spec §28).
-- `required_degree_level` and `required_math_background` are hard
-- requirements: if the user clearly fails one, the programme must not
-- receive an artificially high Match Score.
alter table programme_academic_requirements
  add column required_degree_level degree_level,
  add column required_math_background math_background;

comment on column programme_academic_requirements.required_degree_level is 'Hard requirement: minimum degree level the applicant must hold (spec §28).';
comment on column programme_academic_requirements.required_math_background is 'Hard requirement: minimum mathematics background (spec §28).';

-- ============================================================
-- RLS for new tables
-- ============================================================

-- Catalog data — public read
alter table university_accommodation enable row level security;
alter table city_accommodation_estimates enable row level security;
alter table programme_living_cost_estimates enable row level security;
alter table nmt_subjects enable row level security;
alter table programme_qualification_requirements enable row level security;
alter table career_priorities enable row level security;

create policy "university_accommodation is publicly readable"
  on university_accommodation for select using (true);

create policy "city_accommodation_estimates are publicly readable"
  on city_accommodation_estimates for select using (true);

create policy "programme_living_cost_estimates are publicly readable"
  on programme_living_cost_estimates for select using (true);

create policy "nmt_subjects are publicly readable"
  on nmt_subjects for select using (true);

create policy "programme_qualification_requirements are publicly readable"
  on programme_qualification_requirements for select using (true);

create policy "career_priorities are publicly readable"
  on career_priorities for select using (true);

-- User data — owner-only
alter table user_nmt_scores enable row level security;
alter table user_qualifications enable row level security;
alter table user_match_weights enable row level security;

create policy "users manage their own NMT scores"
  on user_nmt_scores for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users manage their own qualifications"
  on user_qualifications for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users manage their own match weights"
  on user_match_weights for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);