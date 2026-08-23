-- Adds the `lifestyle_preferences` array to user_profiles.
--
-- The onboarding wizard (Q10 "student life") stores the multi-select city
-- preferences here ("affordable-living", "vibrant-nightlife", etc.). The
-- generated Database types already declared this column, but no migration
-- ever created it — inserts that included it failed with PGRST204
-- ("Could not find the 'lifestyle_preferences' column … in the schema
-- cache"). This migration brings the live schema in line with the types.
--
-- Nullable-with-default shape matches the sibling preference arrays so
-- existing rows and readers keep working unchanged.

alter table user_profiles
  add column if not exists lifestyle_preferences text[] not null default '{}';

comment on column user_profiles.lifestyle_preferences is
  'Self-selected city/lifestyle tags from onboarding Q10 (e.g. affordable-living, vibrant-nightlife). Preferences for matching, never hard requirements.';
