-- Unifind — seed data: international-student support, scholarships and
-- dormitories for the 35 Czech universities seeded in 0007.
--
-- Ported from Nevora the same way as 0007 (see that file's header and
-- TRANSFER_NOTES.md): every boolean/note below is something Nevora's own
-- research explicitly evidenced on an official page — never inferred
-- from a university's general reputation or size. Where a fact couldn't
-- be evidenced either way, it's left NULL here too.

-- ---------- university-level support facts (all 35) ----------
with src as (
  select * from jsonb_to_recordset($seed$[
    {"name":"Charles University","international_office":true,"erasmus_participation":true,"dormitory_available":true,"notes":"Central 'Incoming Students' hub plus per-faculty coordination for over 11,000 international students across foundation, full-degree, exchange and free-mover tracks."},
    {"name":"Czech Technical University in Prague","international_office":true,"erasmus_participation":true,"dormitory_available":true,"notes":"A central Department of Foreign Relations coordinates cross-university international affairs, while individual faculties run their own admissions/visa/dormitory support."},
    {"name":"Masaryk University","international_office":true,"erasmus_participation":true,"dormitory_available":true,"notes":"The Language Centre's international-student guide covers halls-of-residence booking (ISKAM system), private-accommodation links, and the education-recognition process."},
    {"name":"Prague University of Economics and Business","international_office":true,"erasmus_participation":true,"dormitory_available":true,"notes":"All English-taught degree-programme students are guaranteed university accommodation (Jarov dormitory area) if they apply within the deadline."},
    {"name":"Palacký University Olomouc","international_office":true,"erasmus_participation":true,"dormitory_available":null,"notes":"A central Welcome Office plus faculty-level International Relations Officers coordinate visa, accommodation guidance and general life-in-Czech-Republic support."},
    {"name":"Brno University of Technology","international_office":true,"erasmus_participation":true,"dormitory_available":true,"notes":"The Admission Office publishes a Welcome Guide covering dormitory reservation, dining services and ESN (Erasmus Student Network) activity."},
    {"name":"Czech University of Life Sciences Prague","international_office":true,"erasmus_participation":true,"dormitory_available":true,"notes":"A dedicated Welcome Centre for International Scholars and an International Relations office coordinate visa support and accommodation confirmation."},
    {"name":"Mendel University in Brno","international_office":true,"erasmus_participation":true,"dormitory_available":null,"notes":"Runs a buddy-system pairing each incoming international student with a Czech volunteer student to help with accommodation, documents and orientation."},
    {"name":"VŠB – Technical University of Ostrava","international_office":true,"erasmus_participation":true,"dormitory_available":true,"notes":"One of the largest central campuses in the Czech Republic (Poruba) houses most faculties and dormitories together; a full-degree scholarship exists for eligible international applicants."},
    {"name":"University of Chemistry and Technology Prague","international_office":true,"erasmus_participation":true,"dormitory_available":null,"notes":"UCT Prague's School of Business assigns each applicant a dedicated Admission Representative through application, visa and arrival."},
    {"name":"University of Veterinary Sciences Brno","international_office":true,"erasmus_participation":true,"dormitory_available":true,"notes":"An Erasmus+ Coordinator and a Czech-student buddy programme support incoming students; foreign students can be housed at the university's own Kaunic Hall of Residence."},
    {"name":"Academy of Performing Arts in Prague","international_office":true,"erasmus_participation":true,"dormitory_available":null,"notes":"AMU International coordinates the academy's English-language programmes and international professional/creative-research networks."},
    {"name":"Academy of Fine Arts, Prague","international_office":true,"erasmus_participation":true,"dormitory_available":false,"notes":"A named International Coordinator for Incoming Mobilities handles Erasmus+ admissions; AVU does not operate its own dormitories."},
    {"name":"Academy of Arts, Architecture and Design in Prague","international_office":true,"erasmus_participation":true,"dormitory_available":true,"notes":"UMPRUM runs Erasmus+ mobility through 45+ exchange agreements; the academy operates a small dormitory with about 70 places, though most students find private flats."},
    {"name":"Janáček Academy of Music and Performing Arts","international_office":true,"erasmus_participation":true,"dormitory_available":true,"notes":"JAMU has Erasmus+ agreements with 60+ partner universities in 20+ countries; its own Astorka hall of residence sits next to the academy's theatre building."},
    {"name":"Technical University of Liberec","international_office":true,"erasmus_participation":null,"dormitory_available":null,"notes":"A dedicated International Office runs the assessment-of-foreign-education process and general admission support for international applicants."},
    {"name":"Tomas Bata University in Zlín","international_office":true,"erasmus_participation":true,"dormitory_available":null,"notes":"Reports an international-student share above 10% of its roughly 10,000 students and runs exchange programmes alongside degree-seeking intake."},
    {"name":"University of West Bohemia","international_office":true,"erasmus_participation":true,"dormitory_available":true,"notes":"A centralized International Office coordinates visa assistance and the ESN UWB buddy system for 900+ international students from 64 countries; ten dormitories sit near the Bory campus."},
    {"name":"University of South Bohemia in České Budějovice","international_office":true,"erasmus_participation":true,"dormitory_available":true,"notes":"A central International Office (with a 24/7 emergency line) and ESN USB Budweis support incoming students; the single campus houses faculties and dormitories together."},
    {"name":"University of Ostrava","international_office":true,"erasmus_participation":true,"dormitory_available":true,"notes":"The Centre for International Cooperation runs an International Relations Office Desk plus an ESN Ostravska buddy programme; the university's own Jan Opletal Halls of Residence house about 514 students."},
    {"name":"University of Hradec Králové","international_office":true,"erasmus_participation":true,"dormitory_available":true,"notes":"A central Foreign Affairs Department coordinates Erasmus+ agreements hosting roughly 50-80 exchange students each semester; the Palachova halls (about 869 places) reserve part for Erasmus arrivals."},
    {"name":"University of Pardubice","international_office":true,"erasmus_participation":null,"dormitory_available":null,"notes":"The Office of International Affairs helps incoming students with visas, accommodation and paperwork in English, French and Czech."},
    {"name":"University of Defence","international_office":null,"erasmus_participation":true,"dormitory_available":null,"notes":"The Czech Republic's only military university; has held an Erasmus Charter for Higher Education since 2021, with mobility prioritised toward NATO/EU/allied military academies."},
    {"name":"Jan Evangelista Purkyně University in Ústí nad Labem","international_office":true,"erasmus_participation":true,"dormitory_available":true,"notes":"A named External Relations Department coordinates incoming/outgoing Erasmus+ students; UJEP accommodates foreign students in its own dormitories on request, at roughly CZK 4,530/month."},
    {"name":"Silesian University in Opava","international_office":true,"erasmus_participation":true,"dormitory_available":true,"notes":"Each faculty runs its own Office of Foreign Relations; accommodation is available at faculty dormitories such as the School of Business Administration's Na Vyhlídce hall."},
    {"name":"College of Polytechnics Jihlava","international_office":true,"erasmus_participation":true,"dormitory_available":true,"notes":"A named International Office is the first point of contact for incoming/outgoing students; Erasmus+ agreements with 50 partner institutions across 20 European countries and on-campus accommodation."},
    {"name":"Institute of Technology and Business in České Budějovice","international_office":true,"erasmus_participation":true,"dormitory_available":true,"notes":"A named international relations coordinator runs admissions for roughly 150 international mobility students a year; dormitory rooms sit directly on the Okružní campus."},
    {"name":"Anglo-American University","international_office":true,"erasmus_participation":true,"dormitory_available":true,"notes":"AAU's Student Services Center handles admissions and support for a student body from 80+ countries; the university offers its own housing near the Maniny tram stop."},
    {"name":"University of New York in Prague","international_office":true,"erasmus_participation":null,"dormitory_available":false,"notes":"The International Student Services Office guides admitted students on visas, housing and campus life; UNYP recommends partnered residences rather than operating its own dormitories."},
    {"name":"Škoda Auto University","international_office":true,"erasmus_participation":true,"dormitory_available":false,"notes":"A named International Office, headed under a Vice-Rector for International Relations, has run the university's Erasmus+ programme since 2005; the university owns no dormitories but lists recommended private accommodation."},
    {"name":"University of Finance and Administration","international_office":true,"erasmus_participation":true,"dormitory_available":true,"notes":"The International Office's Erasmus+ and Programmes Team runs exchange, Free Mover and Global Practical Training admissions; VŠFS operates its own student accommodation facility in Prague 5."},
    {"name":"Unicorn University","international_office":true,"erasmus_participation":true,"dormitory_available":true,"notes":"A named International Office supports roughly 1,000 students (about a quarter international), including Erasmus+ and Double Degree partnerships; on-campus dormitory accommodation across its three Prague locations."},
    {"name":"Metropolitan University Prague","international_office":true,"erasmus_participation":true,"dormitory_available":false,"notes":"A named International Office and International Student Services unit run MUP's Erasmus+ programme (roughly 200 exchange students a year); MUP has no dormitories of its own and directs students to partner housing."},
    {"name":"AMBIS University","international_office":true,"erasmus_participation":true,"dormitory_available":false,"notes":"AMBIS runs a dedicated International Office for visa support and orientation and holds an active Erasmus institutional code; the university does not provide its own student accommodation."},
    {"name":"Institute of Hospitality Management in Prague","international_office":true,"erasmus_participation":true,"dormitory_available":null,"notes":"A named Head of the International Affairs Department oversees the Erasmus+ programme."}
  ]$seed$) as x(name text, international_office boolean, erasmus_participation boolean, dormitory_available boolean, notes text)
)
update universities u
set international_office = src.international_office,
    erasmus_participation = src.erasmus_participation,
    dormitory_available = src.dormitory_available,
    international_support_notes = src.notes,
    updated_at = now()
from src
where u.name = src.name and u.country_code = 'CZ';

-- ---------- scholarships ----------
-- One national/government programme (university_id null) plus two
-- university-specific ones.
with src as (
  select * from jsonb_to_recordset($seed$[
    {
      "university_name": null,
      "name": "Czech Government Scholarships (Foreign Development Assistance)",
      "description": "Scholarships offered by the Government of the Czech Republic within its Foreign Development Assistance framework, available to nationals of a defined list of partner countries applying to Czech public universities.",
      "eligibility": "Nationals of Bosnia and Herzegovina, Georgia, Ukraine, and Belarus (democratic forces) as listed on VŠE's admissions page; the full country list and terms are set by the Czech Ministry of Education, Youth and Sports."
    },
    {
      "university_name": "Prague University of Economics and Business",
      "name": "Professor Miroslav Vlček Scholarship",
      "description": "An annual scholarship awarded by universities in the Study in Prague consortium; the 2025 award went to a second-year Bachelor's student in the Economic Data Science programme at VŠE's Faculty of Informatics and Statistics.",
      "eligibility": "VŠE students nominated within the Study in Prague consortium's annual selection; introduced in 2020."
    },
    {
      "university_name": "VŠB – Technical University of Ostrava",
      "name": "VSB-TUO Full-degree Scholarship",
      "description": "A scholarship intended for foreign applicants to full-time Bachelor's, follow-up Master's or Doctoral study programmes taught in English at VŠB-TUO.",
      "eligibility": "Foreign applicants (and first-year foreign students) of full-time English-taught Bachelor's, follow-up Master's or Doctoral programmes at VŠB-TUO."
    }
  ]$seed$) as x(university_name text, name text, description text, eligibility text)
),
resolved as (
  select u.id as university_id, src.name, src.description, src.eligibility
  from src
  left join universities u on u.name = src.university_name and u.country_code = 'CZ'
  where src.university_name is null or u.id is not null
)
insert into scholarships (university_id, name, description, eligibility)
select r.university_id, r.name, r.description, r.eligibility
from resolved r
where not exists (
  select 1 from scholarships s
  where coalesce(s.university_id::text, '') = coalesce(r.university_id::text, '') and s.name = r.name
);

-- ---------- dormitories ----------
-- Only named, university-operated (or campus-sited) halls with at least
-- one verifiable figure (price and/or capacity) are seeded; general
-- "private housing nearby" mentions don't get a row.
with src as (
  select * from jsonb_to_recordset($seed$[
    {"university_name":"Prague University of Economics and Business","name":"Jarov dormitory area (Palachova, Thalerova, University Hotel, Jarov II)","price_monthly":null,"currency":"CZK","capacity":null,"description":"Guaranteed accommodation area for newly enrolled degree-programme students who apply within the deadline; exact per-building pricing isn't published as a single figure."},
    {"university_name":"Masaryk University","name":"MU Halls of Residence — standard tier (calculated from nightly rate)","price_monthly":3000,"currency":"CZK","capacity":null,"description":"MU's Language Centre states a nightly rate of CZK 100/person for halls of residence; this row is that rate multiplied by a 30-night month, not an official monthly tariff."},
    {"university_name":"Masaryk University","name":"MU Halls of Residence — upper tier (calculated from nightly rate)","price_monthly":5400,"currency":"CZK","capacity":null,"description":"MU's Language Centre states a nightly rate up to CZK 180/person for halls of residence; this row is that rate multiplied by a 30-night month, not an official monthly tariff."},
    {"university_name":"University of Veterinary Sciences Brno","name":"Kaunic Hall of Residence","price_monthly":null,"currency":"CZK","capacity":null,"description":"The university's own hall of residence, built in 1922-23; used to accommodate VETUNI students including incoming Erasmus+ students."},
    {"university_name":"Jan Evangelista Purkyně University in Ústí nad Labem","name":"UJEP Dormitories","price_monthly":4530,"currency":"CZK","capacity":null,"description":"UJEP's own dormitories, offered to foreign students on request subject to availability; the university's Erasmus+ pages state a cost of approximately CZK 4,530/month."},
    {"university_name":"University of West Bohemia","name":"UWB Dormitories (SKM)","price_monthly":2500,"currency":"CZK","capacity":null,"description":"University of West Bohemia's own International Office fact sheet lists an approximate rent of CZK 2,500/month, run via the SKM housing service near the Bory campus."},
    {"university_name":"Institute of Technology and Business in České Budějovice","name":"VŠTE Campus Dormitory","price_monthly":2840,"currency":"CZK","capacity":null,"description":"Dormitory rooms located directly on VŠTE's own Okružní campus; the institute's official Erasmus+ fact sheet lists a rental fee of about CZK 2,840/month including utilities."},
    {"university_name":"University of Ostrava","name":"Jan Opletal Halls of Residence (Hladnov)","price_monthly":null,"currency":"CZK","capacity":514,"description":"The University of Ostrava's own halls of residence in the Slezská Ostrava district, about 10 minutes from the city centre by trolleybus."},
    {"university_name":"Academy of Arts, Architecture and Design in Prague","name":"UMPRUM Dormitory","price_monthly":null,"currency":"CZK","capacity":70,"description":"A small dormitory operated by the academy with about 70 places; most UMPRUM students instead find accommodation in private flats around Prague."},
    {"university_name":"University of Hradec Králové","name":"Palachova Halls of Residence","price_monthly":null,"currency":"CZK","capacity":869,"description":"The university's own halls of residence, an eight-storey block with 7 entrances and a stated total capacity of 869 places; a portion is reserved for incoming Erasmus students."}
  ]$seed$) as x(university_name text, name text, price_monthly numeric, currency text, capacity int, description text)
),
resolved as (
  select u.id as university_id, src.name, src.price_monthly, src.currency, src.capacity, src.description
  from src
  join universities u on u.name = src.university_name and u.country_code = 'CZ'
)
insert into dormitories (university_id, name, price_monthly, currency, capacity, description)
select r.university_id, r.name, r.price_monthly, r.currency, r.capacity, r.description
from resolved r
where not exists (
  select 1 from dormitories d where d.university_id = r.university_id and d.name = r.name
);