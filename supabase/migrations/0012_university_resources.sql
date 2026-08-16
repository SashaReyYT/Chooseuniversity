-- Unifind — schema: university_resources.
--
-- Ported from Nevora's `src/data/universityInternationalResources.js`
-- (see TRANSFER_NOTES.md). Nevora's version is a bilingual (en/uk)
-- static JS module keyed by an internal slug map, with a category
-- registry, per-entry `available: false` placeholders, and multiple
-- links/contacts per entry. This schema keeps the shape that's actually
-- used (a real link + a real contact, one of each — Nevora's own data
-- never populated more than one of either) but drops:
--   - the bilingual title/description — this project has no i18n layer
--     yet, so only the English text is ported (same choice as 0007's
--     university descriptions);
--   - `available: false` placeholder rows — nothing to seed there.
--
-- Like `dormitories`/`scholarships` (0008), this is informational only —
-- not read by the matching engine — for a future "resources" tab on a
-- university/programme page.

create table university_resources (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references universities (id) on delete cascade,
  category text not null check (
    category in (
      'international_office',
      'housing',
      'visa_support',
      'buddy_program',
      'student_services',
      'erasmus',
      'arrival_info'
    )
  ),
  title text not null,
  description text,
  link_title text,
  link_url text,
  link_type text check (link_type in ('official', 'guide', 'portal')),
  contact_type text,
  contact_value text,
  contact_label text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (university_id, category)
);

create index university_resources_university_id_idx on university_resources (university_id);

comment on table university_resources is 'External links (international office, housing, visa support, etc.) per university and category. Informational — not read by the matching engine.';

create trigger university_resources_set_updated_at
  before update on university_resources
  for each row execute function set_updated_at();

alter table university_resources enable row level security;

create policy "university resources are publicly readable"
  on university_resources for select
  using (true);
