-- Generic per-subject self-assessment (chat spec item 9 / user request).
--
-- `user_profiles.math_background` already lets a user self-rate their maths
-- level (spec §23) and it's already a hard-requirement input on the matching
-- side (`programme_academic_requirements.required_math_background`, §28).
-- This migration generalises the same idea to the other core subjects in
-- `nmt_subjects`, for the case where a user can't yet report an exam score
-- (they haven't graduated school / taken their leaving exam yet) but can
-- still say how strong they are in a subject.
--
-- This intentionally reuses the existing `math_background` enum rather than
-- inventing a new scale, so "average" always means the same thing across the
-- app. Not yet wired into the matching engine (same "collect now, score
-- later" approach already used for accommodation/scholarship preferences) —
-- see TRANSFER_NOTES.md.

create table user_subject_strengths (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  subject_code text not null references nmt_subjects (code) on delete cascade,
  level math_background not null,
  created_at timestamptz not null default now(),
  unique (user_id, subject_code)
);

comment on table user_subject_strengths is 'Self-assessed strength per core subject, collected instead of exam scores when the user has not graduated school yet (has_graduated = false).';
comment on column user_subject_strengths.level is 'Reuses the math_background scale (excellent/good/average/weak/not_sure) for consistency across subjects.';

create index user_subject_strengths_user_id_idx on user_subject_strengths (user_id);

alter table user_subject_strengths enable row level security;

create policy "Users manage their own subject strengths"
  on user_subject_strengths
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
