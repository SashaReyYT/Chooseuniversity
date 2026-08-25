-- Feature batch:
--  1. saved_programmes.folder — user triage labels (dream/target/safety).
--     The `note` column already exists in the schema (unused so far) and is
--     surfaced by this release without changes.
--  2. programmes.is_template — marks the two generic placeholder rows
--     created by bulk expansion so admin metrics can track how many remain
--     to be replaced with real catalogues.

alter table saved_programmes
  add column if not exists folder text not null default 'none'
  check (folder in ('none', 'dream', 'target', 'safety'));

comment on column saved_programmes.folder is
  'User triage bucket for their shortlist: dream / target / safety. none = unsorted.';

alter table programmes
  add column if not exists is_template boolean not null default false;

comment on column programmes.is_template is
  'True for generic placeholder rows awaiting a real catalogue import (see bulk expansion migrations).';

-- Backfill: any university whose entire catalogue is ≤2 programmes is
-- running on bulk-expansion placeholders — mark those rows.
update programmes p set is_template = true
where (
  select count(*) from programmes p2 where p2.university_id = p.university_id
) <= 2;
