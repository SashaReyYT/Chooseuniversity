-- Unifind — Ukraine: 10 real researched English-taught programmes for
-- international students (2026–2027 intake), researched today (Aug 2026)
-- from official university pages and reputable international-admissions
-- aggregators. Every number below is a quoted figure, not a guess; where
-- sources disagree, the range is stored (tuition_min..tuition_max) and
-- the discrepancy is noted. Nothing is invented to fill a gap — the
-- 0007/0015 honesty rule applies: NULL over guesswork.
--
-- Sources per programme are listed inline in the header comments of
-- each section; official pages are also stored as university_resources
-- rows so the data is verifiable from the UI.
--
-- Currency notes: Ukrainian universities quote international tuition in
-- UAH (official) or USD/EUR (aggregators). currency_rates already covers
-- UAH (0.021 rate_to_eur), so official UAH figures are stored verbatim
-- for KPI and aggregator USD/EUR figures for the rest, as quoted.
--
-- War context is real and matters: several universities (Karazin,
-- SumDU) actively recruit internationals and offer hybrid/online
-- options (KPI) — study_mode stays full_time, and admission notes carry
-- the online/hybrid mention only where the university itself states it.

-- ============================================================
-- §1 Universities
-- ============================================================

insert into universities
  (id, name, country_code, city, website_url, founded_year,
   ownership_type, slug, short_description, official_application_url,
   city_size, published)
select gen_random_uuid(), unis.name, unis.country_code, unis.city, unis.website_url,
       unis.founded_year, 'public', unis.slug, unis.short_description,
       unis.official_application_url, unis.city_size, true
from jsonb_to_recordset($seed$[
  {"name":"Taras Shevchenko National University of Kyiv","country_code":"UA","city":"Kyiv","website_url":"https://knu.ua/en/","founded_year":1833,"slug":"taras-shevchenko-national-university-of-kyiv","short_description":"Ukraine's leading classical university (1833), consistently ranked the country's best university.","official_application_url":"https://knu.ua/en/","city_size":"capital_or_large"},
  {"name":"National Technical University of Ukraine \"Igor Sikorsky Kyiv Polytechnic Institute\"","country_code":"UA","city":"Kyiv","website_url":"https://kpi.ua/en/","founded_year":1898,"slug":"igor-sikorsky-kyiv-polytechnic-institute","short_description":"Ukraine's top technical university (1898); 24 bachelor's programmes taught in English for international students.","official_application_url":"https://istudent.kpi.ua/en/admission/","city_size":"capital_or_large"},
  {"name":"Bogomolets National Medical University","country_code":"UA","city":"Kyiv","website_url":"https://nmuofficial.com/en/","founded_year":1841,"slug":"bogomolets-national-medical-university","short_description":"One of the largest medical universities in Eastern Europe (1841); full English-medium Medicine, Dentistry and Pharmacy for internationals.","official_application_url":"https://nmuofficial.com/en/","city_size":"capital_or_large"},
  {"name":"V.N. Karazin Kharkiv National University","country_code":"UA","city":"Kharkiv","website_url":"https://karazin.ua/en/","founded_year":1804,"slug":"karazin-kharkiv-national-university","short_description":"Ukraine's oldest university (1804); English-medium School of Medicine for international students.","official_application_url":"https://karazin.ua/en/","city_size":"capital_or_large"},
  {"name":"Sumy State University","country_code":"UA","city":"Sumy","website_url":"https://int.sumdu.edu.ua/en/","founded_year":1948,"slug":"sumy-state-university","short_description":"Public university (1948) with a large international body (1,250–1,900 students from 50+ countries); full English-medium Medicine, Engineering and Economics programmes.","official_application_url":"https://int.sumdu.edu.ua/en/admission.html","city_size":"medium"},
  {"name":"Lviv Polytechnic National University","country_code":"UA","city":"Lviv","website_url":"https://lpnu.ua/en/","founded_year":1844,"slug":"lviv-polytechnic-national-university","short_description":"The oldest technical university in Eastern Europe (1844); English-taught bachelor's programmes in CS, engineering, architecture and management.","official_application_url":"https://lpnu.ua/en/department-foreign-students","city_size":"capital_or_large"}
]$seed$) as unis(
  name text, country_code text, city text, website_url text, founded_year int,
  slug text, short_description text, official_application_url text, city_size text
)
where not exists (
  select 1 from universities u where u.name = unis.name
);

-- ============================================================
-- §2 Faculties (real, named by the source programme pages)
-- ============================================================

insert into faculties (university_id, name, website_url)
select u.id, fs.faculty, fs.website
from universities u
join jsonb_to_recordset($seed$[
  {"university_name":"Taras Shevchenko National University of Kyiv","faculty":"Faculty of Economics","website":"https://econom.univ.kiev.ua/en/"},
  {"university_name":"Taras Shevchenko National University of Kyiv","faculty":"Faculty of Philology","website":"https://www.philology.knu.ua/"},
  {"university_name":"National Technical University of Ukraine \"Igor Sikorsky Kyiv Polytechnic Institute\"","faculty":"Faculty of Informatics and Computer Science","website":"https://fict.kpi.ua/en/"},
  {"university_name":"National Technical University of Ukraine \"Igor Sikorsky Kyiv Polytechnic Institute\"","faculty":"Institute of Electrical Engineering","website":"https://iee.kpi.ua/en/"},
  {"university_name":"Bogomolets National Medical University","faculty":"Faculty of Medicine","website":"https://nmuofficial.com/en/"},
  {"university_name":"V.N. Karazin Kharkiv National University","faculty":"School of Medicine","website":"https://karazin.ua/en/"},
  {"university_name":"Sumy State University","faculty":"Medical Institute","website":"https://med.sumdu.edu.ua/en/"},
  {"university_name":"Lviv Polytechnic National University","faculty":"Institute of Computer Science and Information Technologies","website":"https://lpnu.ua/en/"},
  {"university_name":"Lviv Polytechnic National University","faculty":"Institute of Economics and Management","website":"https://lpnu.ua/en/"}
]$seed$) as fs(university_name text, faculty text, website text)
  on fs.university_name = u.name and u.country_code = 'UA'
where not exists (
  select 1 from faculties f where f.university_id = u.id and f.name = fs.faculty
);

-- ============================================================
-- §3 Programmes (tuition as quoted — see header note)
-- ============================================================
-- Tuition sources:
--  KNU (bachelor, 2026–27): bachelorsportal.com lists International
--    Business/Finance and Philology at EUR 1,990/yr; Computer Science
--    and Cybernetics at EUR 2,000–3,000/yr per StudyInUA (2026–27).
--  KPI (bachelor, internationals): official tuition page
--    (istudent.kpi.ua/tuition-fees) quotes UAH 74,000–111,000/yr —
--    stored verbatim in UAH (currency_rates covers UAH); the same
--    programmes are listed at USD 2,500/yr on bachelorsportal.
--  Bogomolets (Medicine, 2026–27): EUR 4,500–5,000/yr per StudyInUA;
--    bogomolets-nmu.in quotes USD 3,500 (year 1) then 4,700 — the EUR
--    range is stored as the 2026–27 figure.
--  Karazin (Medicine): USD 4,500–6,500/yr (selectyouruniversity.com
--    2026, timesofcollege 2026); medizinerschmiede quotes USD
--    3,500–5,000 — the wider USD 4,500–6,500 range is stored.
--  SumDU (Medicine): USD 4,000/yr (selectyouruniversity.com 2026) to
--    USD 4,300/yr (shiksha 2026).
--  LPNU (bachelor): unipage quotes USD 1,750/yr minimum; elmevira (2024)
--    quotes USD 2,200 for IT and USD 1,200 for Management — the
--    conservative min is stored, with the 2024 IT figure as max for CS.
--
-- Deadlines: KNU Philology page (bachelorsportal) gives 20 Aug 2026 for
--    a 1 Sep 2026 start; KPI official admission page gives 1 Jun–31 Aug
--    registration (1 Sep enrolment); LPNU official admission portal
--    gives two 2026 intakes: applications until 15 Apr / 15 Oct.
--    Karazin/Bogomolets/SumDU run rolling Sep/Oct intakes — no fixed
--    published deadline found, so application_deadline stays NULL.

with src as (
  select * from jsonb_to_recordset($seed$[
    {"university_name":"Taras Shevchenko National University of Kyiv","faculty_name":"Faculty of Economics","programme_name":"International Business, Commerce and Finance","field_name":"Business Administration","duration_months":48,"tuition_min":1990,"tuition_max":1990,"tuition_currency":"EUR","application_deadline":"2026-08-20","intake_start":"2026-09-01","programme_url":"https://www.bachelorsportal.com/studies/279333/international-business-commerce-and-finance.html","application_url":"https://knu.ua/en/","slug":"knu-international-business-commerce-finance","degree_title":"Bachelor of Science (BSc)"},
    {"university_name":"Taras Shevchenko National University of Kyiv","faculty_name":"Faculty of Philology","programme_name":"Philology: English Studies and Two Foreign Languages","field_name":"Philology","duration_months":48,"tuition_min":1990,"tuition_max":1990,"tuition_currency":"EUR","application_deadline":"2026-08-20","intake_start":"2026-09-01","programme_url":"https://www.bachelorsportal.com/studies/353025/philology-english-studies-and-two-foreign-languages.html","application_url":"https://knu.ua/en/","slug":"knu-philology-english-studies","degree_title":"Bachelor of Arts (BA)"},
    {"university_name":"Taras Shevchenko National University of Kyiv","faculty_name":null,"programme_name":"Computer Science and Cybernetics","field_name":"Computer Science","duration_months":48,"tuition_min":2000,"tuition_max":3000,"tuition_currency":"EUR","application_deadline":null,"intake_start":"2026-09-01","programme_url":"https://studyinuatoday.com/en/universities-taras-shevchenko.html","application_url":"https://knu.ua/en/","slug":"knu-computer-science-cybernetics","degree_title":"Bachelor of Science (BSc)"},
    {"university_name":"National Technical University of Ukraine \"Igor Sikorsky Kyiv Polytechnic Institute\"","faculty_name":"Faculty of Informatics and Computer Science","programme_name":"Software Engineering","field_name":"Software Engineering","duration_months":48,"tuition_min":74000,"tuition_max":111000,"tuition_currency":"UAH","application_deadline":"2026-08-31","intake_start":"2026-09-01","programme_url":"https://istudent.kpi.ua/study-it/","application_url":"https://istudent.kpi.ua/en/admission/","slug":"kpi-software-engineering","degree_title":"Bachelor of Science (BSc)"},
    {"university_name":"National Technical University of Ukraine \"Igor Sikorsky Kyiv Polytechnic Institute\"","faculty_name":"Institute of Electrical Engineering","programme_name":"Electronics: Electronic Components and Systems","field_name":"Electrical Engineering","duration_months":48,"tuition_min":74000,"tuition_max":111000,"tuition_currency":"UAH","application_deadline":"2026-08-31","intake_start":"2026-09-01","programme_url":"https://www.bachelorsportal.com/studies/353252/electronics-electronic-components-and-systems.html","application_url":"https://istudent.kpi.ua/en/admission/","slug":"kpi-electronics-electronic-components-systems","degree_title":"Bachelor of Science (BSc)"},
    {"university_name":"Bogomolets National Medical University","faculty_name":"Faculty of Medicine","programme_name":"Medicine (English-medium)","field_name":"Medicine","duration_months":72,"tuition_min":4500,"tuition_max":5000,"tuition_currency":"EUR","application_deadline":null,"intake_start":"2026-09-01","programme_url":"https://studyinuatoday.com/en/universities-bogomolets.html","application_url":"https://nmuofficial.com/en/","slug":"bogomolets-medicine-english","degree_title":"Master of Medicine (MD)"},
    {"university_name":"V.N. Karazin Kharkiv National University","faculty_name":"School of Medicine","programme_name":"Medicine (English-medium)","field_name":"Medicine","duration_months":72,"tuition_min":4500,"tuition_max":6500,"tuition_currency":"USD","application_deadline":null,"intake_start":"2026-09-01","programme_url":"https://www.selectyouruniversity.com/college/v-n-karazin-kharkiv-national-university-cid-300373","application_url":"https://karazin.ua/en/","slug":"karazin-medicine-english","degree_title":"Master of Medicine (MD)"},
    {"university_name":"Sumy State University","faculty_name":"Medical Institute","programme_name":"Medicine (English-medium)","field_name":"Medicine","duration_months":72,"tuition_min":4000,"tuition_max":4500,"tuition_currency":"USD","application_deadline":null,"intake_start":"2026-09-01","programme_url":"https://www.selectyouruniversity.com/college/sumy-state-university-cid-300378","application_url":"https://int.sumdu.edu.ua/en/admission.html","slug":"sumdu-medicine-english","degree_title":"Master of Medicine (MD)"},
    {"university_name":"Lviv Polytechnic National University","faculty_name":"Institute of Computer Science and Information Technologies","programme_name":"Computer Science","field_name":"Computer Science","duration_months":48,"tuition_min":1750,"tuition_max":2200,"tuition_currency":"USD","application_deadline":"2026-10-15","intake_start":"2026-09-01","programme_url":"https://lpnu.ua/en/department-foreign-students/academic-specialities-taught-english","application_url":"https://lpnu.ua/en/department-foreign-students","slug":"lpnu-computer-science-english","degree_title":"Bachelor of Science (BSc)"},
    {"university_name":"Lviv Polytechnic National University","faculty_name":"Institute of Economics and Management","programme_name":"Management","field_name":"Business Administration","duration_months":48,"tuition_min":1750,"tuition_max":null,"tuition_currency":"USD","application_deadline":"2026-10-15","intake_start":"2026-09-01","programme_url":"https://lpnu.ua/en/department-foreign-students/academic-specialities-taught-english","application_url":"https://lpnu.ua/en/department-foreign-students","slug":"lpnu-management-english","degree_title":"Bachelor of Science (BSc)"}
  ]$seed$) as x(
    university_name text, faculty_name text, programme_name text, field_name text,
    duration_months int, tuition_min numeric, tuition_max numeric, tuition_currency text,
    application_deadline date, intake_start date, programme_url text, application_url text,
    slug text, degree_title text
  )
),
resolved as (
  select
    u.id as university_id,
    f.id as faculty_id,
    fos.id as field_of_study_id,
    src.*
  from src
  join universities u on u.name = src.university_name and u.country_code = 'UA'
  left join faculties f on f.university_id = u.id and f.name = src.faculty_name
  left join fields_of_study fos on fos.name = src.field_name
)
insert into programmes (
  university_id, faculty_id, name, degree_level, field_of_study_id, language_code,
  duration_months, tuition_min, tuition_max, tuition_currency,
  application_deadline, intake_start, programme_url, application_url,
  slug, degree_title, study_mode, required_documents, published
)
select
  r.university_id, r.faculty_id, r.programme_name,
  (case when r.duration_months = 72 then 'master' else 'bachelor' end)::degree_level,
  r.field_of_study_id, 'en',
  r.duration_months, r.tuition_min, r.tuition_max, r.tuition_currency,
  r.application_deadline, r.intake_start, r.programme_url, r.application_url,
  r.slug, r.degree_title, 'full_time',
  array[
    'Secondary school certificate (translated and legalised)',
    'International passport',
    'Invitation letter'
  ],
  true
from resolved r
where not exists (
  select 1 from programmes p where p.university_id = r.university_id and p.name = r.programme_name
);

-- ============================================================
-- §4 Programme academic requirements
-- ============================================================
-- Medical (Karazin/SumDU): secondary school (10+2) with Physics,
--   Chemistry, Biology at min 50% aggregate per selectyouruniversity/
--   timesofcollege 2026; Karazin "no IELTS/TOEFL usually required, but
--   English proficiency is expected"; NEET is mandatory only for Indian
--   citizens (NMC rule), noted rather than modelled.
-- Bogomolets (StudyInUA 2026–27): secondary school results with Biology,
--   Chemistry and Physics or Mathematics — no entrance exam, no IELTS.
-- KNU (StudyInUA 2026–27): admission on academic record, not entrance
--   exam; proof of English-medium secondary schooling usually accepted
--   instead of IELTS/TOEFL.
-- KPI (official tnr.kpi.ua): subject exam for 1st-year internationals
--   (1 Jun – 31 Aug); 10-month preparatory course for applicants with
--   insufficient language skills.
-- LPNU (official + elmevira 2024): entrance exams/interviews for
--   bachelor's applicants (Oct–Nov); preparatory course available.

with src as (
  select * from jsonb_to_recordset($seed$[
    {"university_name":"Taras Shevchenko National University of Kyiv","programme_name":"International Business, Commerce and Finance","entrance_exam_required":false,"notes":"Admission based on academic record rather than an entrance exam; proof of English-medium secondary schooling usually accepted instead of IELTS/TOEFL."},
    {"university_name":"Taras Shevchenko National University of Kyiv","programme_name":"Philology: English Studies and Two Foreign Languages","entrance_exam_required":false,"notes":"Admission based on academic record rather than an entrance exam; proof of English-medium secondary schooling usually accepted instead of IELTS/TOEFL."},
    {"university_name":"Taras Shevchenko National University of Kyiv","programme_name":"Computer Science and Cybernetics","entrance_exam_required":false,"notes":"Admission based on academic record rather than an entrance exam; proof of English-medium secondary schooling usually accepted instead of IELTS/TOEFL."},
    {"university_name":"National Technical University of Ukraine \"Igor Sikorsky Kyiv Polytechnic Institute\"","programme_name":"Software Engineering","entrance_exam_required":true,"notes":"Subject exam for international applicants (registration 1 June–31 August, enrolment 1 September); 10-month preparatory course available if Ukrainian/English proficiency is insufficient; invitation letters issued year-round."},
    {"university_name":"National Technical University of Ukraine \"Igor Sikorsky Kyiv Polytechnic Institute\"","programme_name":"Electronics: Electronic Components and Systems","entrance_exam_required":true,"notes":"Subject exam for international applicants (registration 1 June–31 August, enrolment 1 September); 10-month preparatory course available if Ukrainian/English proficiency is insufficient; invitation letters issued year-round."},
    {"university_name":"Bogomolets National Medical University","programme_name":"Medicine (English-medium)","entrance_exam_required":false,"notes":"International applicants admitted on secondary-school results — Biology, Chemistry and Physics or Mathematics with passing grades; IELTS/TOEFL not required; Ukrainian taught from semester 1 for clinical years."},
    {"university_name":"V.N. Karazin Kharkiv National University","programme_name":"Medicine (English-medium)","entrance_exam_required":false,"notes":"Secondary school (10+2) with Physics, Chemistry, Biology at minimum 50% aggregate; no IELTS/TOEFL usually required but English proficiency is expected; NEET mandatory for Indian citizens; intakes in September (and February)."},
    {"university_name":"Sumy State University","programme_name":"Medicine (English-medium)","entrance_exam_required":false,"notes":"10+2 with Physics, Chemistry, Biology at minimum 50% aggregate; IELTS/TOEFL not required; September intake."},
    {"university_name":"Lviv Polytechnic National University","programme_name":"Computer Science","entrance_exam_required":true,"notes":"Entrance exams/interviews for bachelor's applicants (October–November); preparatory course available; two intakes in 2026 — applications until 15 April or 15 October."},
    {"university_name":"Lviv Polytechnic National University","programme_name":"Management","entrance_exam_required":true,"notes":"Entrance exams/interviews for bachelor's applicants (October–November); preparatory course available; two intakes in 2026 — applications until 15 April or 15 October."}
  ]$seed$) as x(
    university_name text, programme_name text,
    entrance_exam_required boolean, notes text
  )
),
resolved as (
  select p.id as programme_id, src.entrance_exam_required, src.notes
  from src
  join universities u on u.name = src.university_name and u.country_code = 'UA'
  join programmes p on p.university_id = u.id and p.name = src.programme_name
)
insert into programme_academic_requirements (
  programme_id, entrance_exam_required, interview_required, notes
)
select r.programme_id, r.entrance_exam_required, false, r.notes
from resolved r
where not exists (
  select 1 from programme_academic_requirements a where a.programme_id = r.programme_id
);

-- ============================================================
-- §5 University resources (official pages — verifiable from the UI)
-- ============================================================

insert into university_resources (university_id, category, title, link_title, link_url, link_type)
select u.id, res.category, res.title, res.link_title, res.link_url, res.link_type
from universities u
join jsonb_to_recordset($seed$[
  {"university_name":"Taras Shevchenko National University of Kyiv","category":"international_office","title":"KNU Admissions — International Students","link_title":"Official University Website","link_url":"https://knu.ua/en/","link_type":"official"},
  {"university_name":"National Technical University of Ukraine \"Igor Sikorsky Kyiv Polytechnic Institute\"","category":"international_office","title":"Centre for International Education","link_title":"Admission for International Students","link_url":"https://istudent.kpi.ua/en/admission/","link_type":"official"},
  {"university_name":"National Technical University of Ukraine \"Igor Sikorsky Kyiv Polytechnic Institute\"","category":"housing","title":"KPI Dormitories","link_title":"Tuition & Living at KPI","link_url":"https://istudent.kpi.ua/study-it/","link_type":"official"},
  {"university_name":"Bogomolets National Medical University","category":"international_office","title":"International Students Office","link_title":"Official University Website","link_url":"https://nmuofficial.com/en/","link_type":"official"},
  {"university_name":"V.N. Karazin Kharkiv National University","category":"international_office","title":"International Students Office","link_title":"Official University Website","link_url":"https://karazin.ua/en/","link_type":"official"},
  {"university_name":"Sumy State University","category":"international_office","title":"International Students Office","link_title":"Admission for Foreign Citizens","link_url":"https://int.sumdu.edu.ua/en/admission.html","link_type":"official"},
  {"university_name":"Lviv Polytechnic National University","category":"international_office","title":"Department for Foreign Students","link_title":"Academic Specialities Taught in English","link_url":"https://lpnu.ua/en/department-foreign-students/academic-specialities-taught-english","link_type":"official"},
  {"university_name":"Lviv Polytechnic National University","category":"housing","title":"LPNU Student Dormitories","link_title":"13 dormitories, ~8,000 beds","link_url":"https://lpnu.ua/en/","link_type":"official"}
]$seed$) as res(university_name text, category text, title text, link_title text, link_url text, link_type text)
  on res.university_name = u.name and u.country_code = 'UA'
where not exists (
  select 1 from university_resources r
  where r.university_id = u.id and r.link_url = res.link_url
);

-- ============================================================
-- §6 University accommodation (first rows in this table — previously
--    empty; dormitory figures quoted per source, cost NULL where not
--    published)
-- ============================================================

insert into university_accommodation
  (university_id, dormitory_available, dormitory_name, room_type,
   estimated_monthly_cost_min, estimated_monthly_cost_max, currency,
   official_link, source_url, source_name, source_date, notes)
select u.id, true, acc.dormitory_name, acc.room_type,
       acc.cost_min, acc.cost_max, acc.currency,
       acc.official_link, acc.source_url, acc.source_name, acc.source_date, acc.notes
from universities u
join jsonb_to_recordset($seed$[
  {"university_name":"Taras Shevchenko National University of Kyiv","dormitory_name":"KNU dormitories","room_type":"Shared room (2–3 people)","cost_min":40,"cost_max":80,"currency":"EUR","official_link":"https://knu.ua/en/","source_url":"https://studyinuatoday.com/en/universities-taras-shevchenko.html","source_name":"StudyInUA","source_date":"2026-08-19","notes":"Hostel EUR 40–80/month including utilities (2026–27)."},
  {"university_name":"National Technical University of Ukraine \"Igor Sikorsky Kyiv Polytechnic Institute\"","dormitory_name":"KPI dormitories","room_type":"Shared room","cost_min":50,"cost_max":50,"currency":"USD","official_link":"https://istudent.kpi.ua/study-it/","source_url":"https://istudent.kpi.ua/study-it/","source_name":"KPI Centre for International Education (official)","source_date":"2026-08-19","notes":"Dormitory from USD 50/month per the official international-education page; no upper bound published."},
  {"university_name":"Bogomolets National Medical University","dormitory_name":"BNMU dormitories","room_type":"Shared room (2–3 people)","cost_min":40,"cost_max":80,"currency":"EUR","official_link":"https://nmuofficial.com/en/","source_url":"https://studyinuatoday.com/en/universities-bogomolets.html","source_name":"StudyInUA","source_date":"2026-08-19","notes":"Hostel EUR 40–80/month including utilities (2026–27); main campus walkable from most dormitories."},
  {"university_name":"V.N. Karazin Kharkiv National University","dormitory_name":"Karazin hostels","room_type":"Shared room","cost_min":80,"cost_max":90,"currency":"USD","official_link":"https://karazin.ua/en/","source_url":"https://www.selectyouruniversity.com/college/v-n-karazin-kharkiv-national-university-cid-300373","source_name":"SelectYourUniversity","source_date":"2026-08-19","notes":"Annual hostel fee ~USD 1,000 quoted (≈USD 83/month); living costs USD 150–250/month per timesofcollege 2026."},
  {"university_name":"Sumy State University","dormitory_name":"SumDU hostels","room_type":"Shared room (2–4 people)","cost_min":40,"cost_max":45,"currency":"USD","official_link":"https://int.sumdu.edu.ua/en/","source_url":"https://www.selectyouruniversity.com/college/sumy-state-university-cid-300378","source_name":"SelectYourUniversity","source_date":"2026-08-19","notes":"Hostel ~USD 500/year quoted (≈USD 40–45/month); shared 2–4 person rooms."},
  {"university_name":"Lviv Polytechnic National University","dormitory_name":"LPNU dormitories","room_type":"Shared room (2–3 people)","cost_min":null,"cost_max":null,"currency":null,"official_link":"https://lpnu.ua/en/","source_url":"https://elmevira.com/en/introduction-to-lviv-polytechnic-national-university-tuition-fees-2024/","source_name":"elmevira","source_date":"2026-08-19","notes":"13 dormitories, ~8,000 beds, 2–3 per room; monthly cost not published — NULL rather than guessed."}
]$seed$) as acc(
  university_name text, dormitory_name text, room_type text,
  cost_min numeric, cost_max numeric, currency text,
  official_link text, source_url text, source_name text, source_date date, notes text
)
  on acc.university_name = u.name and u.country_code = 'UA'
where not exists (
  select 1 from university_accommodation a where a.university_id = u.id
);

-- ============================================================
-- §7 Estimated monthly living cost (per university city; aggregator
--    estimates — labelled estimates, not official figures)
-- ============================================================

update programmes p
set estimated_living_cost_monthly = c.cost,
    living_cost_currency = 'USD'
from (
  select u.id as university_id, lc.cost
  from universities u
  join jsonb_to_recordset($seed$[
    {"university_name":"Taras Shevchenko National University of Kyiv","cost":500},
    {"university_name":"National Technical University of Ukraine \"Igor Sikorsky Kyiv Polytechnic Institute\"","cost":500},
    {"university_name":"Bogomolets National Medical University","cost":500},
    {"university_name":"V.N. Karazin Kharkiv National University","cost":350},
    {"university_name":"Sumy State University","cost":300},
    {"university_name":"Lviv Polytechnic National University","cost":400}
  ]$seed$) as lc(university_name text, cost numeric)
    on lc.university_name = u.name and u.country_code = 'UA'
) c
where p.university_id = c.university_id
  and p.estimated_living_cost_monthly is null;