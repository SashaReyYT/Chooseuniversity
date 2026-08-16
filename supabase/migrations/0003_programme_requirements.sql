-- Unifind — structured programme requirements
-- Split out from `programmes` because these map directly to individual
-- Match Score sub-scores (Academic Fit, Admission Fit, Language Fit) and
-- to individual "why it matches you" / "potential concern" lines. Keeping
-- them structured (not a free-text "requirements" blob) is what makes the
-- matching engine deterministic and explainable instead of guesswork.

create table programme_academic_requirements (
  id uuid primary key default gen_random_uuid(),
  programme_id uuid not null unique references programmes (id) on delete cascade,

  min_gpa numeric(4, 2) check (min_gpa is null or min_gpa >= 0),
  gpa_scale numeric(4, 2) check (gpa_scale is null or gpa_scale > 0),
  check (
    (min_gpa is null and gpa_scale is null) or
    (min_gpa is not null and gpa_scale is not null and min_gpa <= gpa_scale)
  ),

  -- e.g. {'Mathematics','Physics'} — subjects the applicant's prior
  -- education must include. Kept as a simple array: it's always read as a
  -- whole set for one programme, never queried across programmes by
  -- individual subject, so a join table would add cost with no matching
  -- benefit at this stage.
  required_subjects text[] not null default '{}',

  entrance_exam_required boolean not null default false,
  entrance_exam_notes text,

  notes text
);

comment on table programme_academic_requirements is 'Structured academic prerequisites for a programme — feeds the Academic Fit sub-score and its explanations.';

create table programme_language_requirements (
  id uuid primary key default gen_random_uuid(),
  programme_id uuid not null references programmes (id) on delete cascade,

  -- Free text rather than an enum: proficiency tests are numerous and
  -- programme-specific, and the matching engine only needs to compare a
  -- user's score for a *named* test against this row's min_score for the
  -- same test — it doesn't need to reason about the set of valid tests.
  test_type text not null,
  min_score numeric(6, 2) not null check (min_score >= 0),
  -- Human-readable form of the score, since scales differ wildly (IELTS
  -- "6.5" vs TOEFL "90" vs Duolingo "110") and the raw numeric alone isn't
  -- always safe to render directly.
  min_score_display text not null,

  notes text,

  unique (programme_id, test_type)
);

create index programme_language_requirements_programme_id_idx
  on programme_language_requirements (programme_id);

comment on table programme_language_requirements is 'Accepted language-proficiency tests and minimum scores for a programme — feeds the Language Fit sub-score. A programme may accept several test types; any one being met is sufficient.';
