-- Unifind — schema: nullable tuition, university support facts,
-- dormitories, scholarships.
--
-- Two independent changes, both motivated by the same real data set
-- (see 0009/0010 seed migrations for where it comes from):
--
-- 1. `programmes.tuition_fee_amount` and `tuition_fee_currency` become
--    nullable (together — a currency with no amount, or vice versa,
--    isn't meaningful). Both were `not null` on the assumption that
--    every catalogued programme would have a confirmed figure; in
--    practice several real, named programmes have every other field
--    confirmed (name, degree, language, official page) but not a
--    published tuition number. Forcing a guessed number in to satisfy
--    the constraint would be worse than allowing "tuition not yet
--    published" as a real, representable state — Budget Fit already
--    treats missing data as "not applicable" everywhere else, so this
--    makes tuition consistent with that pattern instead of an exception
--    to it. Every other numeric identity/FK constraint is untouched.
--
-- 2. Three new pieces of university-level structured data, all
--    optional/nullable since coverage will always be partial:
--      - `universities.dormitory_available` /
--        `universities.international_office` /
--        `universities.erasmus_participation` /
--        `universities.international_support_notes` — feeds the new
--        Support Fit match dimension (see score-support.ts).
--      - `dormitories` — named on-campus housing options, informational
--        (not read by the matching engine; a future "housing" tab on a
--        programme/university page is the natural consumer).
--      - `scholarships` — named scholarship programmes, either
--        university-specific (`university_id` set) or national/
--        government ones available to applicants generally
--        (`university_id` null). Same status: informational for now.

alter table programmes
  alter column tuition_fee_amount drop not null,
  alter column tuition_fee_currency drop not null;

alter table universities
  add column dormitory_available boolean,
  add column international_office boolean,
  add column erasmus_participation boolean,
  add column international_support_notes text;

create table dormitories (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references universities (id) on delete cascade,
  name text not null,
  price_monthly numeric(10, 2) check (price_monthly is null or price_monthly >= 0),
  currency text check (currency is null or (currency = upper(currency) and length(currency) = 3)),
  capacity integer check (capacity is null or capacity > 0),
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (university_id, name)
);

create index dormitories_university_id_idx on dormitories (university_id);

create table scholarships (
  id uuid primary key default gen_random_uuid(),
  -- null = national/government scholarship, not tied to one university.
  university_id uuid references universities (id) on delete cascade,
  name text not null,
  description text,
  eligibility text,
  url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index scholarships_university_id_idx on scholarships (university_id);

comment on column universities.dormitory_available is 'Whether the university offers its own student housing — feeds Support Fit.';
comment on column universities.international_office is 'Whether a named international-student office/contact was confirmed — feeds Support Fit.';
comment on column universities.erasmus_participation is 'Whether the university participates in Erasmus+ — feeds Support Fit.';
comment on table dormitories is 'Named on-campus/university-operated housing options. Informational — not yet read by the matching engine.';
comment on table scholarships is 'Named scholarship programmes. university_id null = national/government scholarship. Informational — not yet read by the matching engine.';

create trigger dormitories_set_updated_at
  before update on dormitories
  for each row execute function set_updated_at();

create trigger scholarships_set_updated_at
  before update on scholarships
  for each row execute function set_updated_at();

alter table dormitories enable row level security;
alter table scholarships enable row level security;

create policy "dormitories are publicly readable"
  on dormitories for select
  using (true);

create policy "scholarships are publicly readable"
  on scholarships for select
  using (true);