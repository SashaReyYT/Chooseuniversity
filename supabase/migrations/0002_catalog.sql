-- Unifind — universities & programmes catalog
-- The structured, public-readable programme data the matching engine
-- scores against. Every field here exists because a later matching
-- sub-score or "why it matches you" reason reads it directly — this is
-- not a general-purpose CMS schema.

create type degree_level as enum ('foundation', 'bachelor', 'master', 'phd');
create type tuition_fee_period as enum ('per_year', 'per_semester', 'total');

create table universities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  country_code text not null references countries (code),
  city text not null,
  website_url text,
  logo_url text,
  description text,
  founded_year integer check (founded_year is null or founded_year between 800 and 2100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index universities_country_code_idx on universities (country_code);

create table programmes (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references universities (id) on delete cascade,
  name text not null,
  degree_level degree_level not null,
  field_of_study_id uuid not null references fields_of_study (id),
  -- Primary language of instruction. A programme taught partly bilingually
  -- can still be matched on its primary language; if/when true multi-
  -- language programmes are needed, add a join table rather than
  -- overloading this column.
  language_code text not null references languages (code),

  duration_months integer not null check (duration_months > 0),

  tuition_fee_amount numeric(12, 2) not null check (tuition_fee_amount >= 0),
  tuition_fee_currency text not null check (tuition_fee_currency = upper(tuition_fee_currency) and length(tuition_fee_currency) = 3), -- ISO 4217
  tuition_fee_period tuition_fee_period not null default 'per_year',

  estimated_living_cost_monthly numeric(10, 2) check (estimated_living_cost_monthly is null or estimated_living_cost_monthly >= 0),
  living_cost_currency text check (living_cost_currency is null or (living_cost_currency = upper(living_cost_currency) and length(living_cost_currency) = 3)),

  application_deadline date,
  intake_start date,

  description text,
  programme_url text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index programmes_university_id_idx on programmes (university_id);
create index programmes_field_of_study_id_idx on programmes (field_of_study_id);
create index programmes_language_code_idx on programmes (language_code);
create index programmes_degree_level_idx on programmes (degree_level);

comment on table universities is 'Universities offering the programmes students discover and match against.';
comment on table programmes is 'Individual study programmes. One row = one thing a student can apply to.';
comment on column programmes.tuition_fee_period is 'Unit the tuition_fee_amount is denominated in — needed to compare programmes on a common basis (Budget Fit) rather than raw numbers.';

-- Keep updated_at current on every UPDATE.
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger universities_set_updated_at
  before update on universities
  for each row execute function set_updated_at();

create trigger programmes_set_updated_at
  before update on programmes
  for each row execute function set_updated_at();
