-- Unifind — faculties, programme model v2, qualifications, test requirements
-- Implements product spec §48–§53:
--   §48 Faculties (requirements are often faculty/programme-specific)
--   §49 Programme model v2 (faculty_id, slug, degree_title, tuition min/max,
--       application_url, published)
--   §50 Structured test requirements (unified, qualification-linked)
--   §51 Configurable qualifications (admin can add new types)
--   §52 NMT data model (configurable max_score, default 200)
--   §53 User profile model (already covered by 0004/0009 — no changes needed
--       beyond the NMT/qualification links above)

-- ============================================================
-- §48 Faculties
-- ============================================================

create table faculties (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references universities (id) on delete cascade,
  name text not null,
  description text,
  website_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (university_id, name)
);

create index faculties_university_id_idx on faculties (university_id);

comment on table faculties is 'Faculty/school inside a university (spec §48). Many admission requirements are faculty- or programme-specific, so programmes link to their faculty rather than only the university.';

-- ============================================================
-- §49 Programme model v2
-- ============================================================

alter table programmes
  add column faculty_id uuid references faculties (id) on delete set null,
  add column slug text,
  add column degree_title text,
  add column application_url text,
  add column published boolean not null default true;

create unique index programmes_slug_idx on programmes (slug) where slug is not null;

comment on column programmes.faculty_id is 'Faculty offering this programme (spec §48–§49). Null when the programme is university-wide.';
comment on column programmes.slug is 'URL-friendly programme identifier (spec §49). Null until set by an admin.';
comment on column programmes.degree_title is 'Full degree title as awarded, e.g. "Bachelor of Science in Informatics" (spec §49).';
comment on column programmes.application_url is 'Official application/submission page (spec §49). Distinct from the information page (programme_url).';
comment on column programmes.published is 'Whether the programme is visible on the public site (spec §49). A programme is shown only when both it and its university are published.';

-- ============================================================
-- §49 Tuition: aggregated min/max range (canonical per-year unit)
-- ============================================================

-- Programme-level tuition is an aggregated range in a canonical *annual*
-- unit: "50,000–65,000 CZK/year" on cards, lists, budget filtering and
-- matching. The raw per-option amounts and their billing period live in
-- programme_tuition_variants below (the "costs" relationship of §49) —
-- min/max are never used to store per-specialization facts.

alter table programmes
  rename column tuition_fee_currency to tuition_currency;

alter table programmes
  add column tuition_min numeric(12, 2) check (tuition_min >= 0),
  add column tuition_max numeric(12, 2) check (tuition_max >= 0);

-- Annualize legacy rows: per_year passes through; per_semester doubles;
-- total spreads over the programme duration. The raw amounts + original
-- period are preserved in programme_tuition_variants below.
update programmes set
  tuition_min = case tuition_fee_period
    when 'per_semester' then tuition_fee_amount * 2
    when 'total' then
      case when duration_months > 0
        then round(tuition_fee_amount / (duration_months::numeric / 12), 2)
        else tuition_fee_amount end
    else tuition_fee_amount end,
  tuition_max = case tuition_fee_period
    when 'per_semester' then tuition_fee_amount * 2
    when 'total' then
      case when duration_months > 0
        then round(tuition_fee_amount / (duration_months::numeric / 12), 2)
        else tuition_fee_amount end
    else tuition_fee_amount end;

alter table programmes
  alter column tuition_min set not null,
  alter column tuition_max set not null,
  add constraint programmes_tuition_range_check check (tuition_min <= tuition_max);

comment on column programmes.tuition_min is 'Annual tuition, lower bound of the aggregated range (spec §49). Canonical unit: per year.';
comment on column programmes.tuition_max is 'Annual tuition, upper bound of the aggregated range (spec §49). Canonical unit: per year.';

-- ============================================================
-- §49 costs relationship: per-option tuition variants
-- ============================================================

-- Detailed tuition per specialization/option inside a programme
-- ("Software Engineering — 50,000 CZK/year"). The programme-level
-- min/max above is the aggregate derived from these; this table is the
-- source of detail for the programme details page.
create table programme_tuition_variants (
  id uuid primary key default gen_random_uuid(),
  programme_id uuid not null references programmes (id) on delete cascade,
  name text not null,
  tuition_min numeric(12, 2) not null check (tuition_min >= 0),
  tuition_max numeric(12, 2) not null check (tuition_max >= 0),
  currency text not null check (currency = upper(currency) and length(currency) = 3),
  period tuition_fee_period not null default 'per_year',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  check (tuition_min <= tuition_max)
);

create index programme_tuition_variants_programme_id_idx
  on programme_tuition_variants (programme_id);

comment on table programme_tuition_variants is 'Detailed tuition per specialization/option of a programme (spec §49 "costs" relationship). Period is kept per variant because a source may quote per-semester or lump-sum prices — the programme-level tuition_min/max are always the annualized aggregate.';

-- Preserve the legacy raw amount + period for programmes not billed per
-- year (nothing is dropped: the annualized figure lives on programmes,
-- the raw figure lives here).
insert into programme_tuition_variants
  (programme_id, name, tuition_min, tuition_max, currency, period)
select
  id,
  name,
  tuition_fee_amount,
  tuition_fee_amount,
  tuition_currency,
  tuition_fee_period
from programmes
where tuition_fee_period <> 'per_year';

-- ============================================================
-- §49: drop the legacy single-amount columns
-- ============================================================

alter table programmes
  drop column tuition_fee_amount,
  drop column tuition_fee_period;

-- ============================================================
-- §51 Configurable qualifications
-- ============================================================

-- Replaces the qualification_type enum (0009): the admin must be able to
-- add new qualification/test types without a migration (spec §51).
create table qualifications (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  category text not null default 'other'
    check (category in ('national', 'academic', 'language', 'other')),
  description text,
  max_score numeric(8, 2) check (max_score is null or max_score > 0),
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into qualifications (code, name, category, max_score, sort_order) values
  ('nmt', 'NMT', 'national', 200, 1),
  ('cefr', 'CEFR', 'language', null, 2),
  ('sat', 'SAT', 'academic', 1600, 10),
  ('act', 'ACT', 'academic', 36, 11),
  ('ib', 'IB Diploma', 'academic', 45, 12),
  ('a_levels', 'A-Levels', 'academic', null, 13),
  ('ap', 'Advanced Placement', 'academic', 5, 14),
  ('abitur', 'Abitur', 'academic', null, 15),
  ('matura', 'Matura', 'academic', null, 16),
  ('ielts', 'IELTS', 'language', 9, 20),
  ('toefl', 'TOEFL', 'language', 120, 21),
  ('cambridge', 'Cambridge English', 'language', null, 22),
  ('pte', 'PTE Academic', 'language', 90, 23),
  ('duolingo', 'Duolingo English Test', 'language', 160, 24),
  ('national_certificate', 'National certificate', 'other', null, 30),
  ('other', 'Other', 'other', null, 99)
on conflict (code) do nothing;

comment on table qualifications is 'Configurable qualification/test types (spec §51): NMT, SAT, ACT, IB, A-Levels, AP, Abitur, Matura, IELTS, TOEFL, Cambridge, PTE, Duolingo, CEFR, ... Admin can add new types — this is a table, not an enum. max_score is the scale ceiling (NMT default 200, spec §52).';

-- ============================================================
-- §50 Structured test requirements (unified)
-- ============================================================

-- One requirement model for every test type (spec §50): English/IELTS 6.5
-- >=, SAT/Math 720 >=, NMT/Mathematics <score> >=. Supersedes both
-- programme_language_requirements (0003) and
-- programme_qualification_requirements (0009).
create table programme_test_requirements (
  id uuid primary key default gen_random_uuid(),
  programme_id uuid not null references programmes (id) on delete cascade,
  qualification_id uuid not null references qualifications (id) on delete cascade,
  section text,
  subject text,
  minimum_score numeric(8, 2) check (minimum_score is null or minimum_score >= 0),
  minimum_score_display text,
  comparison text not null default 'greater_or_equal'
    check (comparison in ('greater_or_equal', 'greater', 'equal')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index programme_test_requirements_programme_id_idx
  on programme_test_requirements (programme_id);

comment on table programme_test_requirements is 'Structured test requirements per programme (spec §50): qualification + optional section/subject + minimum score + comparison. A row is a required test; the set of rows for a programme is the set of accepted tests. Free-text descriptions coexist via notes.';

-- Migrate legacy language requirements. Any test_type without a matching
-- qualification gets one created on the fly (e.g. custom types added by
-- an admin) so no data is lost.
insert into qualifications (code, name, category)
select distinct lower(replace(plr.test_type, ' ', '_')), plr.test_type, 'language'
from programme_language_requirements plr
where not exists (
  select 1 from qualifications q where lower(q.name) = lower(plr.test_type)
);

insert into programme_test_requirements
  (programme_id, qualification_id, minimum_score, minimum_score_display, notes)
select
  plr.programme_id,
  q.id,
  plr.min_score,
  plr.min_score_display,
  plr.notes
from programme_language_requirements plr
join qualifications q on lower(q.name) = lower(plr.test_type);

-- programme_qualification_requirements (0009) was never populated — its
-- role is fully superseded by programme_test_requirements.
drop table programme_qualification_requirements;
drop table programme_language_requirements;

-- ============================================================
-- §50 extra requirement flags
-- ============================================================

alter table programme_academic_requirements
  add column portfolio_required boolean not null default false,
  add column interview_required boolean not null default false;

comment on column programme_academic_requirements.portfolio_required is 'Whether the programme requires a portfolio (spec §50).';
comment on column programme_academic_requirements.interview_required is 'Whether the programme requires an interview (spec §50).';
-- required_qualification / accepted_qualifications (spec §50) are
-- expressed by programme_test_requirements rows: a row = a required test,
-- the row set = the accepted qualifications.
-- mathematics_required is covered by the richer required_math_background
-- enum from 0009 (spec §50 lists it as "also support"; the enum strictly
-- subsumes a boolean).
-- documents_required already exists as programmes.required_documents.

-- ============================================================
-- §52 NMT data model: configurable max_score
-- ============================================================

-- "Default max_score: 200. But make it configurable. Do not assume that
-- the NMT format will never change." (spec §52) — the 0–200 ceiling is
-- now a per-row column with default 200 instead of a hardcoded check.
alter table user_nmt_scores
  add column max_score numeric(5, 2) not null default 200 check (max_score > 0);

alter table user_nmt_scores drop constraint user_nmt_scores_score_check;
alter table user_nmt_scores
  add constraint user_nmt_scores_score_check check (score >= 0 and score <= max_score);

comment on column user_nmt_scores.max_score is 'Scale ceiling for this score (spec §52). Defaults to 200; configurable because the NMT format must not be assumed stable.';

-- Link user test scores to the qualifications registry so Language Fit
-- can match on qualification identity instead of free-text strings.
alter table user_test_scores
  add column qualification_id uuid references qualifications (id) on delete set null;

comment on column user_test_scores.qualification_id is 'The qualification this score belongs to (spec §50–§52). Null for legacy rows; matching falls back to test_type.';

-- ============================================================
-- §48–§53: user qualifications move from enum to registry
-- ============================================================

-- user_qualifications.qualification_type (enum) is replaced by a foreign
-- key to qualifications. The table has never been populated (0009 created
-- it without seed data), so the column is swapped rather than migrated.
alter table user_qualifications drop column qualification_type;
alter table user_qualifications
  add column qualification_id uuid not null references qualifications (id) on delete cascade;
alter table user_qualifications
  add constraint user_qualifications_user_id_qualification_id_key unique (user_id, qualification_id);

drop type qualification_type;

-- ============================================================
-- RLS
-- ============================================================

-- New catalog tables: public read, admin write (same pattern as 0010).
alter table faculties enable row level security;
alter table programme_tuition_variants enable row level security;
alter table qualifications enable row level security;
alter table programme_test_requirements enable row level security;

create policy "faculties are publicly readable"
  on faculties for select using (true);

create policy "programme_tuition_variants are publicly readable"
  on programme_tuition_variants for select using (true);

create policy "qualifications are publicly readable"
  on qualifications for select using (true);

create policy "programme_test_requirements are publicly readable"
  on programme_test_requirements for select using (true);

create policy "admins manage faculties"
  on faculties for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "admins manage programme_tuition_variants"
  on programme_tuition_variants for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "admins manage qualifications"
  on qualifications for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "admins manage programme_test_requirements"
  on programme_test_requirements for all
  using (public.is_admin())
  with check (public.is_admin());