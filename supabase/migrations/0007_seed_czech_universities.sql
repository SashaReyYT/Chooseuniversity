-- Unifind — seed data: real Czech universities & programmes
--
-- This data was supplied by the project owner (not independently
-- re-verified by this migration's author) as real, sourced Czech
-- university/programme data: 35 named Czech universities, and — for the
-- subset researched in enough depth — real named programmes with sourced
-- tuition figures and official application pages.
--
-- SOURCING / HONESTY NOTE — read before adding more rows here
-- ---------------------------------------------------------------------
-- Per the supplied data: every fact below (name, city, website, founding
-- year, description, programme name, degree level, language, tuition,
-- official URL) was checked against the institution's own public pages —
-- nothing here is invented to fill a gap. Where a fact wasn't confidently
-- sourced, the row/column is simply left out rather than guessed:
--   * Universities: all 35 researched institutions are seeded (they're
--     real regardless of whether a programme has been catalogued yet).
--   * Programmes: `programmes.tuition_fee_amount` is NOT NULL in this
--     schema, so only the subset of researched programmes that had a
--     confirmed tuition figure are seeded here (6 of the ~16 originally
--     researched). The rest are real programmes too, but seeding them
--     with a guessed tuition would misrepresent them — left for a
--     follow-up research pass instead.
--   * `duration_months` uses 36 (the standard 3-year Bologna Bachelor's
--     length used across Czech public universities) as a documented
--     structural default, not a per-programme verified figure — flagged
--     here rather than silently assumed.
--   * `estimated_living_cost_monthly` / `application_deadline` /
--     `intake_start`: left NULL — not verified by the source project.
--   * CEFR requirements are stored as `test_type = 'CEFR'` with an
--     ordinal `min_score` (A1=1 … C2=6) so the existing Language Fit
--     scorer can compare them like any other test; `min_score_display`
--     keeps the human-readable level (e.g. "B2").
-- ---------------------------------------------------------------------

-- ---------- one new field of study ----------
-- Everything else needed already exists in 0001's seed (Computer
-- Science, Data Science, Business Administration, Economics, Biology).
-- Tropical AgriSciences doesn't cleanly fit any of those.
insert into fields_of_study (name, category) values
  ('Agricultural Sciences', 'Natural Sciences')
on conflict (name) do nothing;

-- ---------- universities (all 35 researched Czech institutions) ----------
-- ownership type and an editorial admission-difficulty tier from the
-- supplied data
-- are folded into the description text below (no dedicated columns for
-- them in this schema) since they're still useful context for a reader.
with src as (
  select * from jsonb_to_recordset($seed$[
    {"name":"Charles University","city":"Prague","website_url":"https://cuni.cz","founded_year":1348,"description":"Founded in 1348, the oldest and largest university in Central Europe, with 17 faculties spanning medicine, law, sciences and humanities. Public; top admission tier."},
    {"name":"Czech Technical University in Prague","city":"Prague","website_url":"https://cvut.cz","founded_year":1707,"description":"One of Europe's oldest technical universities, strong in engineering, IT, architecture and natural sciences. Public; top admission tier."},
    {"name":"Masaryk University","city":"Brno","website_url":"https://muni.cz","founded_year":1919,"description":"The second-largest Czech public university, with a broad faculty structure and a strong international student community. Public; top admission tier."},
    {"name":"Prague University of Economics and Business","city":"Prague","website_url":"https://vse.cz","founded_year":1919,"description":"The largest and most established Czech university for economics, business and management education. Public; top admission tier."},
    {"name":"Palacký University Olomouc","city":"Olomouc","website_url":"https://upol.cz","founded_year":1573,"description":"Czech Republic's second-oldest university, well regarded across medicine, sciences and humanities. Public; top admission tier."},
    {"name":"Brno University of Technology","city":"Brno","website_url":"https://vut.cz","founded_year":1849,"description":"Brno's leading technical university, covering engineering, IT, architecture and business. Public; strong admission tier."},
    {"name":"Czech University of Life Sciences Prague","city":"Prague","website_url":"https://czu.cz","founded_year":1906,"description":"Specializes in agriculture, forestry, environmental sciences, economics and life sciences. Public; strong admission tier."},
    {"name":"Mendel University in Brno","city":"Brno","website_url":"https://mendelu.cz","founded_year":1919,"description":"Named after Gregor Mendel; focuses on agriculture, forestry, horticulture and business. Public; strong admission tier."},
    {"name":"VŠB – Technical University of Ostrava","city":"Ostrava","website_url":"https://vsb.cz","founded_year":1849,"description":"A leading technical university for engineering, mining, IT and economics in the Moravian-Silesian region. Public; strong admission tier."},
    {"name":"University of Chemistry and Technology Prague","city":"Prague","website_url":"https://vscht.cz","founded_year":null,"description":"The Czech Republic's only university dedicated fully to chemistry, chemical engineering and related sciences. Public; strong admission tier."},
    {"name":"University of Veterinary Sciences Brno","city":"Brno","website_url":"https://vfu.cz","founded_year":null,"description":"The only Czech university dedicated to veterinary medicine and pharmacy. Public; strong admission tier."},
    {"name":"Academy of Performing Arts in Prague","city":"Prague","website_url":"https://amu.cz","founded_year":null,"description":"Leading Czech academy for theatre, film, music and dance; highly competitive audition-based admission. Public; strong admission tier."},
    {"name":"Academy of Fine Arts, Prague","city":"Prague","website_url":"https://avu.cz","founded_year":null,"description":"The Czech Republic's premier fine arts academy, admission by portfolio and studio examination. Public; strong admission tier."},
    {"name":"Academy of Arts, Architecture and Design in Prague","city":"Prague","website_url":"https://umprum.cz","founded_year":null,"description":"Specialized academy for design, applied arts and architecture. Public; strong admission tier."},
    {"name":"Janáček Academy of Music and Performing Arts","city":"Brno","website_url":"https://jamu.cz","founded_year":null,"description":"Brno's academy for music, theatre and performing arts. Public; strong admission tier."},
    {"name":"Technical University of Liberec","city":"Liberec","website_url":"https://tul.cz","founded_year":1994,"description":"Engineering-focused university with strong ties to textile, mechanical and mechatronic industries. Public; strong admission tier."},
    {"name":"Tomas Bata University in Zlín","city":"Zlín","website_url":"https://utb.cz","founded_year":2001,"description":"Growing university known for polymer engineering, management and applied informatics. Public; strong admission tier."},
    {"name":"University of West Bohemia","city":"Plzeň","website_url":"https://zcu.cz","founded_year":1990,"description":"Broad public university covering engineering, law, education and the arts in Plzeň. Public; average admission tier."},
    {"name":"University of South Bohemia in České Budějovice","city":"České Budějovice","website_url":"https://jcu.cz","founded_year":1991,"description":"Regional public university with strengths in biological sciences, agriculture and education. Public; average admission tier."},
    {"name":"University of Ostrava","city":"Ostrava","website_url":"https://osu.cz","founded_year":1991,"description":"Public university covering medicine, social sciences, education and natural sciences. Public; average admission tier."},
    {"name":"University of Hradec Králové","city":"Hradec Králové","website_url":"https://uhk.cz","founded_year":2000,"description":"Mid-sized public university with a focus on education, informatics and social studies. Public; average admission tier."},
    {"name":"University of Pardubice","city":"Pardubice","website_url":"https://upce.cz","founded_year":1950,"description":"Originally a chemistry-focused institute; now also covers transport, economics and health studies. Public; average admission tier."},
    {"name":"University of Defence","city":"Brno","website_url":"https://unob.cz","founded_year":null,"description":"Czech military university training officers for the armed forces; specialized admission process. Public; average admission tier."},
    {"name":"Jan Evangelista Purkyně University in Ústí nad Labem","city":"Ústí nad Labem","website_url":"https://ujep.cz","founded_year":1991,"description":"Regional public university with generally accessible admission across a broad range of faculties. Public; lower admission tier."},
    {"name":"Silesian University in Opava","city":"Opava","website_url":"https://slu.cz","founded_year":1991,"description":"Smaller regional public university covering business, philosophy/science and public policy. Public; lower admission tier."},
    {"name":"College of Polytechnics Jihlava","city":"Jihlava","website_url":"https://vspj.cz","founded_year":null,"description":"Small applied-sciences college offering practically oriented Bachelor's programmes. Public; lower admission tier."},
    {"name":"Institute of Technology and Business in České Budějovice","city":"České Budějovice","website_url":"https://vstecb.cz","founded_year":null,"description":"Applied technical and economics college with accessible admission requirements. Public; lower admission tier."},
    {"name":"Anglo-American University","city":"Prague","website_url":"https://aauni.edu","founded_year":null,"description":"Prague-based private university teaching entirely in English, US-style liberal-arts curriculum. Private; average admission tier."},
    {"name":"University of New York in Prague","city":"Prague","website_url":"https://unyp.cz","founded_year":null,"description":"Private English-language university offering degrees validated in partnership with US/UK institutions. Private; average admission tier."},
    {"name":"Škoda Auto University","city":"Mladá Boleslav","website_url":"https://savs.cz","founded_year":null,"description":"Private university founded by Škoda Auto, focused on business, management and automotive industry links. Private; average admission tier."},
    {"name":"University of Finance and Administration","city":"Prague","website_url":"https://vsfs.cz","founded_year":null,"description":"One of the largest private Czech universities, focused on finance, economics, law and media studies. Private; average admission tier."},
    {"name":"Unicorn University","city":"Prague","website_url":"https://unicornuniversity.net","founded_year":null,"description":"Private IT-focused university teaching software engineering and information technology management. Private; average admission tier."},
    {"name":"Metropolitan University Prague","city":"Prague","website_url":"https://mup.cz","founded_year":null,"description":"Private university offering international relations, media, law and humanities programmes. Private; average admission tier."},
    {"name":"AMBIS University","city":"Prague","website_url":"https://ambis.cz","founded_year":null,"description":"Private university with generally accessible admission, offering business, security and social-services programmes. Private; lower admission tier."},
    {"name":"Institute of Hospitality Management in Prague","city":"Prague","website_url":"https://vsh.cz","founded_year":null,"description":"Private college specializing in hospitality, tourism and gastronomy management. Private; lower admission tier."}
  ]$seed$) as x(name text, city text, website_url text, founded_year int, description text)
)
insert into universities (name, country_code, city, website_url, description, founded_year)
select src.name, 'CZ', src.city, src.website_url, src.description, src.founded_year
from src
where not exists (
  select 1 from universities u where u.name = src.name and u.country_code = 'CZ'
);

-- ---------- programmes ----------
-- Only the 6 real, researched programmes with a confirmed tuition figure
-- (see header note). duration_months = 36 for all (standard Czech
-- Bachelor's length; see header note).
with src as (
  select * from jsonb_to_recordset($seed$[
    {"university_name":"Czech Technical University in Prague","programme_name":"Informatics","field_name":"Computer Science","language_code":"en","tuition_fee_amount":128000,"tuition_fee_currency":"CZK","programme_url":"https://fit.cvut.cz/en/applicants/admissions-procedure/bachelor-study-program"},
    {"university_name":"Masaryk University","programme_name":"Biology and Biochemistry","field_name":"Biology","language_code":"en","tuition_fee_amount":3000,"tuition_fee_currency":"EUR","programme_url":"https://www.sci.muni.cz/en/international/study-in-english/bc"},
    {"university_name":"Masaryk University","programme_name":"Data Analytics","field_name":"Data Science","language_code":"en","tuition_fee_amount":14000,"tuition_fee_currency":"EUR","programme_url":"https://www.sci.muni.cz/en/international/study-in-english/bc"},
    {"university_name":"Prague University of Economics and Business","programme_name":"Bachelor of Business Administration (BBA)","field_name":"Business Administration","language_code":"en","tuition_fee_amount":5000,"tuition_fee_currency":"EUR","programme_url":"https://admissions.vse.cz/bachelors-programmes/"},
    {"university_name":"Prague University of Economics and Business","programme_name":"Bachelor of Economics of Markets and Organizations","field_name":"Economics","language_code":"en","tuition_fee_amount":5000,"tuition_fee_currency":"EUR","programme_url":"https://admissions.vse.cz/bachelors-programmes/"},
    {"university_name":"Czech University of Life Sciences Prague","programme_name":"Bachelor's Programme (Tropical AgriSciences)","field_name":"Agricultural Sciences","language_code":"en","tuition_fee_amount":8000,"tuition_fee_currency":"CZK","programme_url":"https://www.ftz.czu.cz/en/r-9420-study/r-10784-study-applicants/r-12048-bachelors-degree-programmes-information-about-admission-procedure"}
  ]$seed$) as x(
    university_name text, programme_name text, field_name text, language_code text,
    tuition_fee_amount numeric, tuition_fee_currency text, programme_url text
  )
),
resolved as (
  select
    u.id as university_id, f.id as field_of_study_id,
    src.programme_name, src.language_code, src.tuition_fee_amount,
    src.tuition_fee_currency, src.programme_url
  from src
  join universities u on u.name = src.university_name and u.country_code = 'CZ'
  join fields_of_study f on f.name = src.field_name
)
insert into programmes (
  university_id, name, degree_level, field_of_study_id, language_code,
  duration_months, tuition_fee_amount, tuition_fee_currency, tuition_fee_period,
  programme_url
)
select
  r.university_id, r.programme_name, 'bachelor', r.field_of_study_id, r.language_code,
  36, r.tuition_fee_amount, r.tuition_fee_currency, 'per_year',
  r.programme_url
from resolved r
where not exists (
  select 1 from programmes p where p.university_id = r.university_id and p.name = r.programme_name
);

-- ---------- academic requirements (entrance exam flag only — no GPA scale
-- is used by Czech admissions, so min_gpa/gpa_scale stay NULL) ----------
with src as (
  select * from jsonb_to_recordset($seed$[
    {"university_name":"Czech Technical University in Prague","programme_name":"Informatics","entrance_exam_required":true,"notes":"Faculty of Information Technology runs its own admission procedure; a CZK 950 administrative fee applies."},
    {"university_name":"Masaryk University","programme_name":"Biology and Biochemistry","entrance_exam_required":true,"notes":"Faculty of Science admission typically involves an essay or interview; entrance-exam waiver possible based on prior academic record."},
    {"university_name":"Masaryk University","programme_name":"Data Analytics","entrance_exam_required":true,"notes":"Faculty of Science admission typically involves an essay or interview; entrance-exam waiver possible based on prior academic record."},
    {"university_name":"Prague University of Economics and Business","programme_name":"Bachelor of Business Administration (BBA)","entrance_exam_required":true,"notes":"50 EUR application fee; a CV is required as part of the application."},
    {"university_name":"Prague University of Economics and Business","programme_name":"Bachelor of Economics of Markets and Organizations","entrance_exam_required":true,"notes":"50 EUR application fee; a CV is required as part of the application."},
    {"university_name":"Czech University of Life Sciences Prague","programme_name":"Bachelor's Programme (Tropical AgriSciences)","entrance_exam_required":true,"notes":"Applicants sit the GAP test (General Academic Prerequisites), an online exam administered by SCIO, alongside the standard application."}
  ]$seed$) as x(university_name text, programme_name text, entrance_exam_required boolean, notes text)
),
resolved as (
  select p.id as programme_id, src.entrance_exam_required, src.notes
  from src
  join universities u on u.name = src.university_name and u.country_code = 'CZ'
  join programmes p on p.university_id = u.id and p.name = src.programme_name
)
insert into programme_academic_requirements (programme_id, entrance_exam_required, notes)
select r.programme_id, r.entrance_exam_required, r.notes
from resolved r
where not exists (
  select 1 from programme_academic_requirements a where a.programme_id = r.programme_id
);

-- ---------- language requirements ----------
-- CEFR stored as an ordinal (A1=1 … C2=6) so the numeric-comparison
-- Language Fit scorer works unchanged; min_score_display keeps the
-- human-readable level. Only Masaryk University had a university-wide
-- English level (B2) confirmed for its English-taught programmes; the
-- other four programmes' sources didn't state a single verifiable
-- number, so no language_requirements row is added for them (left for a
-- future per-programme verification pass rather than guessed).
with src as (
  select * from jsonb_to_recordset($seed$[
    {"university_name":"Masaryk University","programme_name":"Biology and Biochemistry","test_type":"CEFR","min_score":4,"min_score_display":"B2"},
    {"university_name":"Masaryk University","programme_name":"Data Analytics","test_type":"CEFR","min_score":4,"min_score_display":"B2"}
  ]$seed$) as x(university_name text, programme_name text, test_type text, min_score numeric, min_score_display text)
),
resolved as (
  select p.id as programme_id, src.test_type, src.min_score, src.min_score_display
  from src
  join universities u on u.name = src.university_name and u.country_code = 'CZ'
  join programmes p on p.university_id = u.id and p.name = src.programme_name
)
insert into programme_language_requirements (programme_id, test_type, min_score, min_score_display)
select r.programme_id, r.test_type, r.min_score, r.min_score_display
from resolved r
where not exists (
  select 1 from programme_language_requirements l
  where l.programme_id = r.programme_id and l.test_type = r.test_type
);
