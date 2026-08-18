-- Unifind — catalogue enrichment: full programme details, source links,
-- import pipeline, and admin access (product spec §40, §41, §43, §44,
-- §45, §47).
--
-- Deliberately additive/nullable throughout. Adds:
--   §47  University model: slug, short_description, cover_image_url,
--        official_application_url, ranking_data, student_count,
--        international_student_percentage, latitude/longitude, published
--   §40  Full programme details: study_mode, application fee, required
--        documents, scholarship notes, career notes
--   §41  Sources: `sources` + `programme_sources` + `university_sources`
--        with source_type metadata (official_university / official_faculty /
--        official_dormitory / public_reference). Backfills source rows from
--        the URLs already present in the catalog (never invented).
--   §43  Import pipeline: `imports` + `import_errors` so admin imports can
--        be tracked and parsing failures reviewed.
--   §44  Admin access: `admin_users` + RLS policies granting admins write
--        access to the catalog tables (public remains read-only).

-- ============================================================
-- §47 University model
-- ============================================================

alter table universities
  add column slug text,
  add column short_description text,
  add column cover_image_url text,
  add column official_application_url text,
  add column ranking_data jsonb,
  add column student_count integer check (student_count is null or student_count >= 0),
  add column international_student_percentage numeric(5, 2) check (
    international_student_percentage is null or
    (international_student_percentage >= 0 and international_student_percentage <= 100)
  ),
  add column latitude numeric(9, 6) check (latitude is null or (latitude >= -90 and latitude <= 90)),
  add column longitude numeric(9, 6) check (longitude is null or (longitude >= -180 and longitude <= 180)),
  add column published boolean not null default true;

comment on column universities.slug is 'URL-friendly identifier for the university (spec §47). Generated from the name; unique where present.';
comment on column universities.ranking_data is 'Ranking figures as JSON, e.g. {"qs": 244}. Never invent rankings — leave NULL and the UI shows "unavailable" (spec §47).';
comment on column universities.published is 'Whether the university is visible on the public site. Programmes stay hidden while their university is unpublished.';

create unique index universities_slug_idx on universities (slug) where slug is not null;

-- Backfill slugs for existing rows (deterministic slugify of the name,
-- deduplicated with a numeric suffix on collision).
do $$
declare
  uni record;
  base text;
  candidate text;
  suffix int;
begin
  for uni in select id, name from universities where slug is null loop
    base := lower(regexp_replace(regexp_replace(uni.name, '[^a-zA-Z0-9]+', '-', 'g'), '^-+|-+$', '', 'g'));
    if base = '' then
      base := 'university';
    end if;
    candidate := base;
    suffix := 1;
    while exists (select 1 from universities where slug = candidate and id <> uni.id) loop
      suffix := suffix + 1;
      candidate := base || '-' || suffix;
    end loop;
    update universities set slug = candidate where id = uni.id;
  end loop;
end $$;

-- ============================================================
-- §40 Full programme details
-- ============================================================

create type programme_study_mode as enum ('full_time', 'part_time', 'distance', 'online', 'hybrid');

alter table programmes
  add column study_mode programme_study_mode,
  add column application_fee_amount numeric(12, 2) check (application_fee_amount is null or application_fee_amount >= 0),
  add column application_fee_currency text check (
    application_fee_currency is null or
    (application_fee_currency = upper(application_fee_currency) and length(application_fee_currency) = 3)
  ),
  add column required_documents text[] not null default '{}',
  add column scholarship_notes text,
  add column career_notes text;

comment on column programmes.study_mode is 'How the programme is delivered (spec §40).';
comment on column programmes.application_fee_amount is 'Application/administrative fee, if published by the institution (spec §40). NULL = not published, not zero.';
comment on column programmes.required_documents is 'Documents required for the application, as published by the institution (spec §40).';
comment on column programmes.scholarship_notes is 'Scholarship/funding information as published by the institution (spec §40).';
comment on column programmes.career_notes is 'Career-related information (employment prospects, alumni outcomes) as published (spec §40).';

-- Existing seeded programmes are all standard on-campus bachelor's
-- programmes — a documented structural default, not a per-programme
-- verified figure (same rationale as `duration_months` in 0007).
update programmes set study_mode = 'full_time' where study_mode is null;

-- ============================================================
-- §41 Sources
-- ============================================================

create type source_type as enum (
  'official_university',
  'official_faculty',
  'official_dormitory',
  'public_reference'
);

create table sources (
  id uuid primary key default gen_random_uuid(),
  url text not null unique,
  name text not null,
  type source_type not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table sources is 'External sources backing catalog facts (spec §41). URLs must be real public pages — never invented.';

create trigger sources_set_updated_at
  before update on sources
  for each row execute function set_updated_at();

-- Which fact(s) of a programme/university a source backs. `fact_key` is
-- free text (e.g. 'tuition', 'admission', 'language', 'deadline',
-- 'living_costs', 'general') so future facts don't need a migration.
create table programme_sources (
  programme_id uuid not null references programmes (id) on delete cascade,
  source_id uuid not null references sources (id) on delete cascade,
  fact_key text not null default 'general',
  primary key (programme_id, source_id, fact_key)
);

create table university_sources (
  university_id uuid not null references universities (id) on delete cascade,
  source_id uuid not null references sources (id) on delete cascade,
  fact_key text not null default 'general',
  primary key (university_id, source_id, fact_key)
);

create index programme_sources_programme_id_idx on programme_sources (programme_id);
create index university_sources_university_id_idx on university_sources (university_id);

comment on table programme_sources is 'Links a programme to the sources backing its facts (spec §41).';
comment on table university_sources is 'Links a university to the sources backing its facts (spec §41).';

-- Backfill from URLs already present in the catalog — these are real
-- official URLs from the 0007 seed data, not invented. Fact coverage is
-- 'general' because the seed didn't track per-fact provenance.
insert into sources (url, name, type)
select distinct u.website_url, u.name || ' — official website', 'official_university'
from universities u
where u.website_url is not null
on conflict (url) do nothing;

insert into university_sources (university_id, source_id, fact_key)
select u.id, s.id, 'general'
from universities u
join sources s on s.url = u.website_url
where u.website_url is not null
on conflict do nothing;

insert into sources (url, name, type)
select distinct p.programme_url, u.name || ' — programme page', 'official_faculty'
from programmes p
join universities u on u.id = p.university_id
where p.programme_url is not null
on conflict (url) do nothing;

insert into programme_sources (programme_id, source_id, fact_key)
select p.id, s.id, 'general'
from programmes p
join sources s on s.url = p.programme_url
where p.programme_url is not null
on conflict do nothing;

-- ============================================================
-- §43 Import pipeline
-- ============================================================

create table imports (
  id uuid primary key default gen_random_uuid(),
  source_name text not null,
  source_url text,
  format text not null check (format in ('json', 'csv')),
  status text not null default 'imported' check (status in ('parsed', 'validated', 'review', 'imported', 'failed')),
  row_count integer not null default 0 check (row_count >= 0),
  imported_count integer not null default 0 check (imported_count >= 0),
  error_count integer not null default 0 check (error_count >= 0),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

comment on table imports is 'One row per ingested file (spec §43): where it came from, how many rows were parsed/imported, how many failed validation.';

create table import_errors (
  id uuid primary key default gen_random_uuid(),
  import_id uuid not null references imports (id) on delete cascade,
  row_number integer,
  field text,
  message text not null,
  raw_row jsonb,
  created_at timestamptz not null default now()
);

create index import_errors_import_id_idx on import_errors (import_id);

comment on table import_errors is 'Per-row parsing/validation failures from an import, for admin review (spec §44 "view parsing/import errors").';

-- ============================================================
-- §44 Admin access
-- ============================================================

create table admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  granted_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

comment on table admin_users is 'Users granted admin panel access (spec §44). Admin writes on catalog tables are gated through this table via RLS.';

-- Helper used by the RLS policies below. `security definer` reads
-- admin_users without RLS, which avoids the recursion that a policy
-- reading its own table would otherwise create.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
as $$
  select exists (select 1 from admin_users where user_id = auth.uid());
$$;

-- ============================================================
-- RLS
-- ============================================================

-- Sources: public read (they're shown on the public programme page).
alter table sources enable row level security;
alter table programme_sources enable row level security;
alter table university_sources enable row level security;

create policy "sources are publicly readable"
  on sources for select using (true);

create policy "programme_sources are publicly readable"
  on programme_sources for select using (true);

create policy "university_sources are publicly readable"
  on university_sources for select using (true);

-- Import pipeline + admin membership: admins only.
alter table imports enable row level security;
alter table import_errors enable row level security;
alter table admin_users enable row level security;

create policy "admins manage imports"
  on imports for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "admins manage import_errors"
  on import_errors for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "admins manage admin_users"
  on admin_users for all
  using (public.is_admin())
  with check (public.is_admin());

-- Admin write access to the catalog tables. Public read stays exactly as
-- it was in 0006/0009; this only adds insert/update/delete for admins.
-- (User-owned tables stay owner-only — admins don't touch user data.)

create policy "admins manage countries"
  on countries for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "admins manage languages"
  on languages for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "admins manage fields_of_study"
  on fields_of_study for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "admins manage universities"
  on universities for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "admins manage programmes"
  on programmes for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "admins manage programme_academic_requirements"
  on programme_academic_requirements for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "admins manage programme_language_requirements"
  on programme_language_requirements for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "admins manage programme_qualification_requirements"
  on programme_qualification_requirements for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "admins manage university_accommodation"
  on university_accommodation for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "admins manage city_accommodation_estimates"
  on city_accommodation_estimates for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "admins manage programme_living_cost_estimates"
  on programme_living_cost_estimates for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "admins manage nmt_subjects"
  on nmt_subjects for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "admins manage career_priorities"
  on career_priorities for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "admins manage sources"
  on sources for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "admins manage programme_sources"
  on programme_sources for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "admins manage university_sources"
  on university_sources for all
  using (public.is_admin())
  with check (public.is_admin());