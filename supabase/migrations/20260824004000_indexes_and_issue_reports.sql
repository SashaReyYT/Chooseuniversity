-- Stability batch:
--  1. Performance indexes for the now-large catalogue (FK joins, filters,
--     and trigram search over names — pg_trgm powers ILIKE '%q%').
--  2. data_issue_reports — the "found an inaccuracy?" button on programme
--     pages writes here; admins triage via /admin/issues.

-- ============================================================
-- 1. Indexes
-- ============================================================
create extension if not exists pg_trgm;

create index if not exists programmes_published_idx
  on programmes (published);
create index if not exists programmes_field_of_study_idx
  on programmes (field_of_study_id);
create index if not exists programmes_language_idx
  on programmes (language_code);
create index if not exists programmes_university_idx
  on programmes (university_id);
create index if not exists programmes_name_trgm_idx
  on programmes using gin (name gin_trgm_ops);

create index if not exists universities_country_idx
  on universities (country_code);
create index if not exists universities_slug_idx
  on universities (slug) where slug is not null;
create index if not exists universities_name_trgm_idx
  on universities using gin (name gin_trgm_ops);

-- ============================================================
-- 2. Data-issue reports
-- ============================================================
create table data_issue_reports (
  id uuid primary key default gen_random_uuid(),
  programme_id uuid not null references programmes (id) on delete cascade,
  reported_by uuid references auth.users (id) on delete set null,
  field text not null check (field in (
    'tuition', 'requirements', 'deadline', 'documents', 'other')),
  message text not null check (char_length(message) between 4 and 1000),
  status text not null default 'open' check (status in ('open', 'resolved')),
  created_at timestamptz not null default now()
);

create index data_issue_reports_open_idx
  on data_issue_reports (created_at desc) where status = 'open';

comment on table data_issue_reports is
  'Crowdsourced corrections from users ("this tuition looks wrong"). Admins triage via /admin/issues; resolving keeps the row for audit.';

alter table data_issue_reports enable row level security;

create policy "authenticated users can report issues"
  on data_issue_reports for insert to authenticated
  with check (true);

create policy "admins read issue reports"
  on data_issue_reports for select to authenticated
  using (public.is_admin());

create policy "admins resolve issue reports"
  on data_issue_reports for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());
