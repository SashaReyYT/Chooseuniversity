-- Unifind — Onboarding v2: logical question chain
-- Adds the fields the redesigned onboarding flow needs that aren't in
-- the schema yet:
--   1. Country of residence (Q1) — distinct from nationality (you can
--      live somewhere without being from there; drives the exam question,
--      Q8).
--   2. Education stage (Q3) — finer than `education_level`: grade 9/10/11,
--      finished school, college, other. `education_level` stays as-is for
--      the degree the user holds/is working towards.
--   3. Start year (Q4).
--   4. Per-language self-assessment (Q7) — one level per chosen language.
--   5. NMT/analog exam results (Q8): NMT scores already live in
--      `user_nmt_scores`; adds `score_is_expected` so "expected result"
--      answers (not yet taken) are honest about being predictions. A
--      `national_exam_type` column records which exam the user answered
--      about (nmt / matura / abitur / ...), free-text to stay open.
--   6. Per-subject strength (Q9) — Good/Average/Poor for the subjects
--      relevant to the chosen field of study. Used to derive
--      `math_background` (and later more).
--   7. Budget levels (Q10): `budget_mode` already covers the tuition
--      answer; adds the parallel `living_cost_mode`.
--   8. Additional requirements (Q11) as explicit booleans.
--
-- Deliberately additive/nullable — existing rows and code keep working
-- unchanged.

-- ============================================================
-- 1. Country of residence
-- ============================================================

alter table user_profiles
  add column residence_country_code text references countries (code),
  add column residence_city text;

comment on column user_profiles.residence_country_code is
  'Country the user currently lives in (onboarding Q1). Distinct from nationality — drives which national exam question (Q8) applies.';
comment on column user_profiles.residence_city is
  'City the user currently lives in (onboarding Q1, optional free text).';

-- ============================================================
-- 2. Education stage
-- ============================================================

create type education_stage as enum (
  'grade_9', 'grade_10', 'grade_11', 'finished_school', 'college', 'other'
);

alter table user_profiles
  add column education_stage education_stage;

comment on column user_profiles.education_stage is
  'Where the user is in their education right now (onboarding Q3). In-school stages (grade_9..grade_11) skip the national-exam question entirely and answer subject strengths instead.';

-- ============================================================
-- 3. Start year
-- ============================================================

alter table user_profiles
  add column start_year integer
  check (start_year is null or start_year between 2000 and 2100);

comment on column user_profiles.start_year is
  'Year the user wants to begin studying (onboarding Q4).';

-- ============================================================
-- 4. Per-language proficiency
-- ============================================================

create table user_language_proficiency (
  user_id uuid not null references auth.users (id) on delete cascade,
  language_code text not null references languages (code),
  level text not null check (level in ('good', 'average', 'poor', 'not_sure')),

  primary key (user_id, language_code)
);

create index user_language_proficiency_user_id_idx
  on user_language_proficiency (user_id);

comment on table user_language_proficiency is
  'Self-assessed proficiency per study language (onboarding Q7). `english_level` on user_profiles remains the CEFR-typed column the Language Fit scorer reads; this table keeps the raw per-language answers.';

-- ============================================================
-- 5. National exam results (Q8)
-- ============================================================

alter table user_profiles
  add column national_exam_type text
  check (national_exam_type in ('nmt', 'matura', 'abitur', 'national_certificate', 'other'));

comment on column user_profiles.national_exam_type is
  'Which national entrance exam the user answered about (onboarding Q8): nmt for Ukraine, matura for Poland, abitur for Germany, etc. Free-text-ish enum so new countries can be added without code changes.';

alter table user_nmt_scores
  add column score_is_expected boolean not null default false;

comment on column user_nmt_scores.score_is_expected is
  'Whether the stored score is a real result or the user''s expected result for an exam they haven''t taken yet (onboarding Q8). Matching treats expected scores as provisional — never presented as confirmed facts.';

-- ============================================================
-- 6. Per-subject strength (Q9)
-- ============================================================

create table user_subject_strengths (
  user_id uuid not null references auth.users (id) on delete cascade,
  subject_code text not null,
  level text not null check (level in ('good', 'average', 'poor')),

  primary key (user_id, subject_code)
);

create index user_subject_strengths_user_id_idx
  on user_subject_strengths (user_id);

comment on table user_subject_strengths is
  'Self-assessed strength per core subject (onboarding Q9): math, physics, chemistry, biology, computer science, languages. Subject codes are stable keys shared with the UI; the engine derives math_background from the math entry.';

-- ============================================================
-- 7. Budget levels (Q10)
-- ============================================================

alter table user_profiles
  add column living_cost_mode budget_mode not null default 'unknown';

comment on column user_profiles.living_cost_mode is
  'Monthly living-cost budget level (onboarding Q10): low / medium / high / unknown. Mirrors budget_mode (which now holds the yearly tuition answer).';

-- ============================================================
-- 8. Additional requirements (Q11)
-- ============================================================

alter table user_profiles
  add column wants_scholarship boolean,
  add column wants_dormitory boolean,
  add column wants_work_during_study boolean,
  add column wants_stay_after_graduation boolean,
  add column open_to_additional_exams boolean;

comment on column user_profiles.wants_scholarship is 'Q11: needs a scholarship to afford studying.';
comment on column user_profiles.wants_dormitory is 'Q11: wants university dormitory accommodation.';
comment on column user_profiles.wants_work_during_study is 'Q11: wants to be able to work while studying.';
comment on column user_profiles.wants_stay_after_graduation is 'Q11: wants to stay in the country after graduating.';
comment on column user_profiles.open_to_additional_exams is 'Q11: willing to take extra entrance exams. False = hard preference against them.';

-- ============================================================
-- RLS for the new tables
-- ============================================================

alter table user_language_proficiency enable row level security;
alter table user_subject_strengths enable row level security;

create policy "users manage their own language proficiency"
  on user_language_proficiency for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users manage their own subject strengths"
  on user_subject_strengths for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);