-- Onboarding v2 — reconciliation of the migration drafts
--
-- The questionnaire redesign (11-step order) was developed as three
-- overlapping drafts: 0017_onboarding_v2, 0017_subject_strength_
-- self_assessment and 0018_questionnaire_redesign (both 0017_* created
-- `user_subject_strengths` with different shapes, and the 0018 draft
-- re-created columns 0017 already added). They were never reconciled and
-- the duplicate drafts were deleted; the live schema follows
-- 20260820220000_onboarding_v2.sql exactly (verified against the
-- database), so nothing from the other drafts is re-applied here.
--
-- This file carries over the one genuinely missing piece:
--
--   1. `computer_science` in the `nmt_subjects` catalog — the base seed
--      (0009) has 8 subjects; the subject-strength self-rating (Q9)
--      offers it for Engineering & Technology / Natural Sciences.
--
-- The 0018 draft's `qualifications.country_code` (DB-driven national-exam
-- mapping) is deliberately NOT carried over: the onboarding wizard maps
-- residence country → exam in code (`RESIDENCE_EXAM_MAP`), and the column
-- was never added to the live database.

insert into nmt_subjects (code, name)
values ('computer_science', 'Computer Science / Informatics')
on conflict (code) do nothing;