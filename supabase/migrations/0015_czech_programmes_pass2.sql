-- Unifind — Czech programmes pass 2: the 10 real researched programmes
-- that were left out of 0007 because they had no confirmed tuition figure
-- (see 0007's honesty note). Sourced from the sister project's researched
-- data (0041/0042 — every row is a real, named programme with an official
-- page; nothing invented to fill a gap).
--
-- Tuition: none of these 10 has a public figure — the official pages
-- state no annual amount. Seeding a guessed number would misrepresent
-- them (0007's rule), so instead of guessing, tuition_min/tuition_max/
-- tuition_currency become NULLABLE and stay NULL for these programmes.
-- The UI/engine treats NULL as "not published" (honest unknown, spec §29):
-- Budget Fit degrades to UNKNOWN, cards render "Tuition not published",
-- budget filters/sorts exclude them. The admin CSV import pipeline still
-- requires a figure, so a real number gets filled in once researched.
--
-- Admission notes come from the sister project's per-university
-- admission research (0041), mapped per programme the same way 0007
-- mapped its five; CEFR levels are stored as test requirements (B1=3)
-- only where the university explicitly stated one for the relevant
-- faculty. Fields of study: six new taxonomy rows (Mathematics,
-- Environmental Sciences, Chemistry, Biomedical Engineering,
-- Physiotherapy, Philology — mirroring 0007's Agricultural Sciences
-- precedent; a real programme's field deserves a real taxonomy row,
-- not a wrong nearest-match).

-- ============================================================
-- §1 Tuition becomes nullable ("not published" state)
-- ============================================================

alter table programmes
  alter column tuition_min drop not null,
  alter column tuition_max drop not null,
  alter column tuition_currency drop not null;

alter table programmes drop constraint programmes_tuition_range_check;
alter table programmes
  add constraint programmes_tuition_range_check
  check (tuition_min is null or tuition_max is null or tuition_min <= tuition_max);

alter table programmes drop constraint programmes_tuition_fee_currency_check;
alter table programmes
  add constraint programmes_tuition_fee_currency_check
  check (
    tuition_currency is null or
    (tuition_currency = upper(tuition_currency) and length(tuition_currency) = 3)
  );

comment on column programmes.tuition_min is
  'Annual tuition, lower bound of the aggregated range (spec §49). Canonical unit: per year. NULL = not published by the institution — displayed as "Tuition not published", excluded from budget scoring (spec §29) rather than guessed.';

-- ============================================================
-- §2 Fields of study additions
-- ============================================================

insert into fields_of_study (name, category) values
  ('Mathematics', 'Natural Sciences'),
  ('Environmental Sciences', 'Natural Sciences'),
  ('Chemistry', 'Natural Sciences'),
  ('Biomedical Engineering', 'Engineering & Technology'),
  ('Physiotherapy', 'Health Sciences'),
  ('Philology', 'Humanities')
on conflict (name) do nothing;

-- ============================================================
-- §3 Faculties (real, named by the source programme pages)
-- ============================================================

insert into faculties (university_id, name, website_url)
select u.id, fs.faculty, fs.website
from universities u
join jsonb_to_recordset($seed$[
  {"university_name":"Czech Technical University in Prague","faculty":"Faculty of Information Technology","website":"https://fit.cvut.cz/en/"},
  {"university_name":"Czech Technical University in Prague","faculty":"Faculty of Biomedical Engineering","website":"https://www.fbmi.cvut.cz/en/"},
  {"university_name":"Masaryk University","faculty":"Faculty of Science","website":"https://www.sci.muni.cz/en"},
  {"university_name":"Mendel University in Brno","faculty":"Faculty of Business and Economics","website":"https://pef.mendelu.cz/en/"},
  {"university_name":"Palacký University Olomouc","faculty":"Faculty of Health Sciences","website":"https://www.fzv.upol.cz/en/"},
  {"university_name":"University of Ostrava","faculty":"Faculty of Arts","website":"https://ff.osu.eu/"},
  {"university_name":"University of Ostrava","faculty":"Faculty of Science","website":"https://prf.osu.eu/"},
  {"university_name":"Czech University of Life Sciences Prague","faculty":"Faculty of Environmental Sciences","website":"https://www.fzp.czu.cz/en/"},
  {"university_name":"Czech University of Life Sciences Prague","faculty":"Faculty of Tropical AgriSciences","website":"https://www.ftz.czu.cz/en/"},
  {"university_name":"University of Chemistry and Technology Prague","faculty":"School of Business","website":"https://business.vscht.cz/"}
]$seed$) as fs(university_name text, faculty text, website text)
  on fs.university_name = u.name and u.country_code = 'CZ'
where not exists (
  select 1 from faculties f where f.university_id = u.id and f.name = fs.faculty
);

-- ============================================================
-- §4 Programmes (tuition NULL — see header note)
-- ============================================================

with src as (
  select * from jsonb_to_recordset($seed$[
    {"university_name":"Czech Technical University in Prague","faculty_name":"Faculty of Biomedical Engineering","programme_name":"Biomedical Technology","field_name":"Biomedical Engineering","duration_months":36,"programme_url":"https://www.fbmi.cvut.cz/en/admissions/how-to-apply"},
    {"university_name":"Prague University of Economics and Business","faculty_name":null,"programme_name":"Bachelor of International and Diplomatic Studies","field_name":"International Relations","duration_months":36,"programme_url":"https://admissions.vse.cz/bachelor-programmes/bachelor-of-international-and-diplomatic-studies/"},
    {"university_name":"Prague University of Economics and Business","faculty_name":null,"programme_name":"Bachelor of International Business (IBB)","field_name":"Business Administration","duration_months":36,"programme_url":"https://admissions.vse.cz/bachelors-programmes/"},
    {"university_name":"Mendel University in Brno","faculty_name":"Faculty of Business and Economics","programme_name":"Economics and Management","field_name":"Economics","duration_months":36,"programme_url":"https://pef.mendelu.cz/en/faculty-of-business-and-economics/admissions/admission-process/"},
    {"university_name":"Palacký University Olomouc","faculty_name":"Faculty of Health Sciences","programme_name":"Physiotherapy","field_name":"Physiotherapy","duration_months":36,"programme_url":"https://www.fzv.upol.cz/en/admissions/"},
    {"university_name":"University of Ostrava","faculty_name":"Faculty of Arts","programme_name":"English Philology","field_name":"Philology","duration_months":36,"programme_url":"https://dokumenty.osu.cz/ff/prijimacky2025/conditions-for-admission-ep-2025-2026.pdf"},
    {"university_name":"University of Ostrava","faculty_name":"Faculty of Science","programme_name":"Mathematics","field_name":"Mathematics","duration_months":36,"programme_url":"https://prf.osu.eu/24474/admission-procedure-step-by-step/"},
    {"university_name":"Czech University of Life Sciences Prague","faculty_name":"Faculty of Environmental Sciences","programme_name":"Bachelor's Programme (Environmental Sciences)","field_name":"Environmental Sciences","duration_months":36,"programme_url":"https://www.fzp.czu.cz/en/r-20074-applicants/r-9792-admission-procedures/r-14065-bachelor-s-study-programmes"},
    {"university_name":"University of Chemistry and Technology Prague","faculty_name":"School of Business","programme_name":"Economics and Management (with Marketing / International Trade specializations)","field_name":"Economics","duration_months":36,"programme_url":"https://business.vscht.cz/study-with-us/bachelor-programs"},
    {"university_name":"University of Chemistry and Technology Prague","faculty_name":null,"programme_name":"Chemistry and Technology (Bachelor's Programmes)","field_name":"Chemistry","duration_months":36,"programme_url":"https://study.vscht.cz/bachelor-master-information/bachelor-programmes"}
  ]$seed$) as x(
    university_name text, faculty_name text, programme_name text, field_name text,
    duration_months int, programme_url text
  )
),
resolved as (
  select
    u.id as university_id,
    f.id as faculty_id,
    fos.id as field_of_study_id,
    src.programme_name, src.duration_months, src.programme_url
  from src
  join universities u on u.name = src.university_name and u.country_code = 'CZ'
  left join faculties f on f.university_id = u.id and f.name = src.faculty_name
  left join fields_of_study fos on fos.name = src.field_name
)
insert into programmes (
  university_id, faculty_id, name, degree_level, field_of_study_id, language_code,
  duration_months, tuition_min, tuition_max, tuition_currency, programme_url, published
)
select
  r.university_id, r.faculty_id, r.programme_name, 'bachelor', r.field_of_study_id, 'en',
  r.duration_months, null, null, null, r.programme_url, true
from resolved r
where not exists (
  select 1 from programmes p where p.university_id = r.university_id and p.name = r.programme_name
);

-- ============================================================
-- §5 Programme academic requirements (entrance-exam flags + notes,
--    per the sister project's per-university admission research)
-- ============================================================

with src as (
  select * from jsonb_to_recordset($seed$[
    {"university_name":"Czech Technical University in Prague","programme_name":"Biomedical Technology","entrance_exam_required":true,"notes":"A CZK 950 administrative fee applies to the entrance procedure; recognition of foreign secondary education runs as part of the faculty's own admission process."},
    {"university_name":"Prague University of Economics and Business","programme_name":"Bachelor of International and Diplomatic Studies","entrance_exam_required":true,"notes":"50 EUR application fee and a CV are required; programme-specific entrance-exam format set by the faculty."},
    {"university_name":"Prague University of Economics and Business","programme_name":"Bachelor of International Business (IBB)","entrance_exam_required":true,"notes":"50 EUR application fee and a CV are required; programme-specific entrance-exam format set by the faculty."},
    {"university_name":"Mendel University in Brno","programme_name":"Economics and Management","entrance_exam_required":true,"notes":"Faculty of Business and Economics sets a minimum passing score of 60/100 on its entrance test."},
    {"university_name":"Palacký University Olomouc","programme_name":"Physiotherapy","entrance_exam_required":true,"notes":"Faculty of Health Sciences requires English at least CEFR B1 (PET/FCE, BULATS 60, IELTS 5 or TOEFL iBT 40); applicants without a certificate sit a university English test."},
    {"university_name":"University of Ostrava","programme_name":"English Philology","entrance_exam_required":true,"notes":"Requirements vary by faculty; the university requires at least CEFR B1 from international applicants."},
    {"university_name":"University of Ostrava","programme_name":"Mathematics","entrance_exam_required":true,"interview_required":true,"notes":"Faculty of Science admission includes an interview about motivation and chosen specialisation; a CZK 25,000 deposit applies before visa document preparation."},
    {"university_name":"Czech University of Life Sciences Prague","programme_name":"Bachelor's Programme (Environmental Sciences)","entrance_exam_required":true,"notes":"Applicants sit the GAP test (General Academic Prerequisites), an online admission exam administered by SCIO, alongside the standard e-application (registration fee CZK 500–850 depending on faculty)."},
    {"university_name":"University of Chemistry and Technology Prague","programme_name":"Economics and Management (with Marketing / International Trade specializations)","entrance_exam_required":false,"interview_required":true,"notes":"School of Business runs a personal interview with an Admission Representative as a standard part of the admission process; no separate written entrance exam."},
    {"university_name":"University of Chemistry and Technology Prague","programme_name":"Chemistry and Technology (Bachelor's Programmes)","entrance_exam_required":false,"notes":"The four chemistry/technology faculties set their own faculty-specific admission conditions."}
  ]$seed$) as x(
    university_name text, programme_name text,
    entrance_exam_required boolean, interview_required boolean, notes text
  )
),
resolved as (
  select p.id as programme_id, src.entrance_exam_required,
         coalesce(src.interview_required, false) as interview_required, src.notes
  from src
  join universities u on u.name = src.university_name and u.country_code = 'CZ'
  join programmes p on p.university_id = u.id and p.name = src.programme_name
)
insert into programme_academic_requirements (
  programme_id, entrance_exam_required, interview_required, notes
)
select r.programme_id, r.entrance_exam_required, r.interview_required, r.notes
from resolved r
where not exists (
  select 1 from programme_academic_requirements a where a.programme_id = r.programme_id
);

-- ============================================================
-- §6 English test requirements (CEFR B1 = 3, only where the faculty
--    explicitly stated the level)
-- ============================================================

with src as (
  select * from jsonb_to_recordset($seed$[
    {"university_name":"Palacký University Olomouc","programme_name":"Physiotherapy"},
    {"university_name":"University of Ostrava","programme_name":"English Philology"},
    {"university_name":"University of Ostrava","programme_name":"Mathematics"}
  ]$seed$) as x(university_name text, programme_name text)
),
resolved as (
  select p.id as programme_id
  from src
  join universities u on u.name = src.university_name and u.country_code = 'CZ'
  join programmes p on p.university_id = u.id and p.name = src.programme_name
)
insert into programme_test_requirements
  (programme_id, qualification_id, minimum_score, minimum_score_display, comparison)
select r.programme_id, q.id, 3, 'B1', 'greater_or_equal'
from resolved r
join qualifications q on q.code = 'cefr'
where not exists (
  select 1 from programme_test_requirements t
  where t.programme_id = r.programme_id and t.qualification_id = q.id
);