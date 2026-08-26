-- Adds missing language rows so the onboarding Q6 language picker can
-- offer native languages alongside English for every supported country.
--
-- Previously only 10 languages were seeded (en, de, nl, fr, es, it, pt,
-- cs, pl, uk). Countries like Sweden, Denmark, Finland and Norway had no
-- native-language entry, so the picker fell back to English-only.

insert into languages (code, name) values
  ('sv', 'Swedish'),
  ('da', 'Danish'),
  ('fi', 'Finnish'),
  ('no', 'Norwegian')
on conflict (code) do nothing;
