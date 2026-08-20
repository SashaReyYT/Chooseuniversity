-- CEFR proficiency + old-questionnaire cleanup
--
-- 1. Q7 (language proficiency) now records CEFR levels (C2 → A0) instead
--    of the old good/average/poor/not_sure wording. A0 is a valid raw
--    answer but degrades to `not_sure` when mapped onto the CEFR-typed
--    `user_profiles.english_level` (no `a0` member in that enum).
-- 2. Drops columns that only the removed 12-step profile form wrote —
--    no reader remains anywhere in the app (verified by grep over src/).
--    `primary_field_of_study_id` is intentionally NOT dropped: the new
--    11-step questionnaire still writes it (Q5 primary field).

-- Rows written by the old questionnaire use good/average/poor/not_sure
-- wording that has no faithful CEFR equivalent; they're stale test data,
-- so delete them rather than guess a mapping.
delete from user_language_proficiency
  where level not in ('c2', 'c1', 'b2', 'b1', 'a2', 'a1', 'a0');

alter table user_language_proficiency
  drop constraint user_language_proficiency_level_check;

alter table user_language_proficiency
  add constraint user_language_proficiency_level_check
  check (level in ('c2', 'c1', 'b2', 'b1', 'a2', 'a1', 'a0'));

comment on column user_language_proficiency.level is
  'Self-assessed proficiency per study language (onboarding Q7) on the CEFR scale (C2–A0); A0 degrades to not_sure when mapped to user_profiles.english_level.';

alter table user_profiles
  drop constraint user_profiles_nationality_country_code_fkey;

alter table user_profiles
  drop column admission_preference,
  drop column career_priorities,
  drop column graduation_year,
  drop column nationality_country_code,
  drop column open_to_other_cities;