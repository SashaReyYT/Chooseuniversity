-- Unifind — seed data: additional real Czech programmes.
--
-- Ported from Nevora's own programme-catalogue research (see
-- TRANSFER_NOTES.md). These are the ~10 real, named, sourced programmes
-- that 0007 left out because they didn't have a confirmed tuition figure
-- and `tuition_fee_amount` was `not null` at the time — now that 0008
-- made it nullable, they can be added honestly (tuition left NULL,
-- displayed as "Tuition: contact university" rather than guessed).
-- duration_months = 36 throughout, same standard-Bachelor's-length
-- default as 0007 (see that file's header for the reasoning); UCT's
-- Economics and Management programme separately confirmed 3 years too.

-- ---------- new fields of study ----------
-- Each is a real, distinct discipline that doesn't cleanly fit the 15
-- fields already seeded (0001 + 0007's Agricultural Sciences).
insert into fields_of_study (name, category) values
  ('Biomedical Engineering', 'Engineering & Technology'),
  ('Physiotherapy', 'Health Sciences'),
  ('Mathematics', 'Natural Sciences'),
  ('Environmental Sciences', 'Natural Sciences'),
  ('Chemistry', 'Natural Sciences'),
  ('English Philology', 'Humanities')
on conflict (name) do nothing;

-- ---------- programmes ----------
with src as (
  select * from jsonb_to_recordset($seed$[
    {"university_name":"Czech Technical University in Prague","programme_name":"Biomedical Technology","field_name":"Biomedical Engineering","language_code":"en","programme_url":"https://www.fbmi.cvut.cz/en/admissions/how-to-apply"},
    {"university_name":"Prague University of Economics and Business","programme_name":"Bachelor of International and Diplomatic Studies","field_name":"International Relations","language_code":"en","programme_url":"https://admissions.vse.cz/bachelor-programmes/bachelor-of-international-and-diplomatic-studies/"},
    {"university_name":"Prague University of Economics and Business","programme_name":"Bachelor of International Business (IBB)","field_name":"Business Administration","language_code":"en","programme_url":"https://admissions.vse.cz/bachelors-programmes/"},
    {"university_name":"Mendel University in Brno","programme_name":"Economics and Management","field_name":"Economics","language_code":"en","programme_url":"https://pef.mendelu.cz/en/faculty-of-business-and-economics/admissions/admission-process/"},
    {"university_name":"Palacký University Olomouc","programme_name":"Physiotherapy","field_name":"Physiotherapy","language_code":"en","programme_url":"https://www.fzv.upol.cz/en/admissions/"},
    {"university_name":"University of Ostrava","programme_name":"English Philology","field_name":"English Philology","language_code":"en","programme_url":"https://dokumenty.osu.cz/ff/prijimacky2025/conditions-for-admission-ep-2025-2026.pdf"},
    {"university_name":"University of Ostrava","programme_name":"Mathematics","field_name":"Mathematics","language_code":"en","programme_url":"https://prf.osu.eu/24474/admission-procedure-step-by-step/"},
    {"university_name":"Czech University of Life Sciences Prague","programme_name":"Bachelor's Programme (Environmental Sciences)","field_name":"Environmental Sciences","language_code":"en","programme_url":"https://www.fzp.czu.cz/en/r-20074-applicants/r-9792-admission-procedures/r-14065-bachelor-s-study-programmes"},
    {"university_name":"University of Chemistry and Technology Prague","programme_name":"Economics and Management (with Marketing / International Trade specializations)","field_name":"Business Administration","language_code":"en","programme_url":"https://business.vscht.cz/study-with-us/bachelor-programs"},
    {"university_name":"University of Chemistry and Technology Prague","programme_name":"Chemistry and Technology (Bachelor's Programmes)","field_name":"Chemistry","language_code":"en","programme_url":"https://study.vscht.cz/bachelor-master-information/bachelor-programmes"}
  ]$seed$) as x(university_name text, programme_name text, field_name text, language_code text, programme_url text)
),
resolved as (
  select u.id as university_id, f.id as field_of_study_id,
         src.programme_name, src.language_code, src.programme_url
  from src
  join universities u on u.name = src.university_name and u.country_code = 'CZ'
  join fields_of_study f on f.name = src.field_name
)
insert into programmes (
  university_id, name, degree_level, field_of_study_id, language_code,
  duration_months, tuition_fee_period, programme_url
)
select
  r.university_id, r.programme_name, 'bachelor', r.field_of_study_id, r.language_code,
  36, 'per_year', r.programme_url
from resolved r
where not exists (
  select 1 from programmes p where p.university_id = r.university_id and p.name = r.programme_name
);

-- ---------- academic requirements ----------
with src as (
  select * from jsonb_to_recordset($seed$[
    {"university_name":"Czech Technical University in Prague","programme_name":"Biomedical Technology","entrance_exam_required":true,"notes":"Faculty of Biomedical Engineering runs its own admission procedure, including recognition (nostrification) of foreign secondary education."},
    {"university_name":"Prague University of Economics and Business","programme_name":"Bachelor of International and Diplomatic Studies","entrance_exam_required":true,"notes":"50 EUR application fee; a CV is required as part of the application."},
    {"university_name":"Prague University of Economics and Business","programme_name":"Bachelor of International Business (IBB)","entrance_exam_required":true,"notes":"50 EUR application fee; a CV is required as part of the application."},
    {"university_name":"Mendel University in Brno","programme_name":"Economics and Management","entrance_exam_required":true,"notes":"Faculty of Business and Economics sets a minimum passing score of 60/100 on its entrance test (from May 2023 applications onward)."},
    {"university_name":"Palacký University Olomouc","programme_name":"Physiotherapy","entrance_exam_required":true,"notes":"Faculty of Health Sciences requires an English proficiency check (CEFR B1) and its own entrance-exam format."},
    {"university_name":"University of Ostrava","programme_name":"English Philology","entrance_exam_required":true,"notes":"Faculty-specific admission process; requirements vary by faculty."},
    {"university_name":"University of Ostrava","programme_name":"Mathematics","entrance_exam_required":true,"notes":"Faculty-specific admission process; requirements vary by faculty."},
    {"university_name":"Czech University of Life Sciences Prague","programme_name":"Bachelor's Programme (Environmental Sciences)","entrance_exam_required":true,"notes":"English-taught Bachelor's applicants sit the GAP test (General Academic Prerequisites), an online exam administered by SCIO."},
    {"university_name":"University of Chemistry and Technology Prague","programme_name":"Economics and Management (with Marketing / International Trade specializations)","entrance_exam_required":false,"notes":"UCT Prague's School of Business runs a personal interview with an Admission Representative instead of a written entrance exam."},
    {"university_name":"University of Chemistry and Technology Prague","programme_name":"Chemistry and Technology (Bachelor's Programmes)","entrance_exam_required":false,"notes":"Admission conditions are set by each of the four chemistry/technology faculties individually."}
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
-- CEFR stored as an ordinal (A1=1 … C2=6), matching 0007's convention.
-- Palacký's page additionally gave an explicit IELTS-equivalent number
-- (5.0), so that's added as a second, more specific test type — the
-- matching engine treats meeting any one accepted test as sufficient.
with src as (
  select * from jsonb_to_recordset($seed$[
    {"university_name":"Palacký University Olomouc","programme_name":"Physiotherapy","test_type":"CEFR","min_score":3,"min_score_display":"B1"},
    {"university_name":"Palacký University Olomouc","programme_name":"Physiotherapy","test_type":"IELTS","min_score":5.0,"min_score_display":"5.0"},
    {"university_name":"University of Ostrava","programme_name":"English Philology","test_type":"CEFR","min_score":3,"min_score_display":"B1"},
    {"university_name":"University of Ostrava","programme_name":"Mathematics","test_type":"CEFR","min_score":3,"min_score_display":"B1"}
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