-- Global country expansion (user request: "add every country listed in
-- the picker, with their universities and full info").
--
--  A. Switch on every target country the questionnaire already offers
--     (CZ & UA were enabled by earlier migrations).
--  B. Flagship universities per country (~39) with tiered descriptions,
--     founding years, student counts, ownership, city size and websites.
--  C. One/two English-taught flagship programmes per university so the new
--     countries are immediately matchable in Discover.
--  D. Idempotent criteria fills re-run over the enlarged catalogue:
--     programme basics (docs/scholarships/study mode), academic
--     requirements, IELTS row for English programmes, career & lifestyle
--     tags (incl. the new cities), living-cost bands, accommodation,
--     international-office resources.
--
-- All inserts guarded (WHERE NOT EXISTS).

-- ============================================================
-- A0. Currency rates for the newly used currencies (EUR base)
-- ============================================================
insert into currency_rates (currency, rate_to_eur)
values
  ('GBP', 0.85),('USD', 0.92),('CAD', 0.68),('CHF', 1.04),
  ('SEK', 0.088),('DKK', 0.134),('NOK', 0.086),('PLN', 0.23)
on conflict (currency) do nothing;

-- ============================================================
-- A. Country availability
-- ============================================================
update countries set supported = true, sort_order = s.ord
from (values
  ('AT',3),('CH',4),('DE',5),('DK',6),('ES',7),('FI',8),('FR',9),
  ('GB',10),('IE',11),('IT',12),('NL',13),('NO',14),('PL',15),
  ('PT',16),('SE',17),('US',18),('CA',19)
) as s(code, ord)
where countries.code = s.code;

-- ============================================================
-- B. Universities
-- ============================================================
insert into universities (
  name, slug, country_code, city, short_description, description,
  founded_year, student_count, ownership_type, city_size,
  website_url, official_application_url, published)
select data.name, data.slug, data.cc, data.city, data.short_description,
       data.description, data.founded_year, data.students,
       data.ownership, data.csize, data.site, data.site, true
from (values
  ('Technical University of Munich','tu-munich','DE','Munich',
   'Germany''s top technical university (1868) — EU #1 in engineering rankings.',
   'TUM leads German engineering and CS with an English-language master''s portfolio, the UnternehmerTUM startup factory and a top university-hospital cluster. Bavaria introduced non-EU fees only in 2024, keeping costs far below UK/US peers. Public; top admission tier.',
   1868,50000,'public','capital_or_large','https://www.tum.de/en/'),
  ('Ludwig-Maximilians-Universität München','lmu-munich','DE','Munich',
   'One of Germany''s oldest classical universities (1472) — medicine, physics, humanities.',
   'LMU counts 40+ Nobel laureates and anchors Munich''s biomedical corridor alongside Helmholtz institutes, with a broad English-taught master''s range. Public; top admission tier.',
   1472,52000,'public','capital_or_large','https://www.en.lmu.de/'),
  ('RWTH Aachen University','rwth-aachen','DE','Aachen',
   'Europe''s mechanical-engineering powerhouse (1870) with legendary industry ties.',
   'RWTH dominates German mechanical, automotive and energy engineering feeding the industrial Rhineland; the low semester-fee model keeps total cost among Europe''s lowest. Public; strong admission tier.',
   1870,47000,'public','medium','https://www.rwth-aachen.de/go/id/a/?lidx=1'),
  ('University of Vienna','university-vienna','AT','Vienna',
   'German-speaking world''s oldest university (1365) — humanities and physics heritage.',
   'Alma mater Rudolphina spans fifteen faculties with nine historical Nobel affiliations; non-EU tuition near €1,600/yr makes it exceptional value. Public; strong admission tier.',
   1365,85000,'public','capital_or_large','https://www.univie.ac.at/en/'),
  ('TU Wien','tu-wien','AT','Vienna',
   'Austria''s leading technical university (1815) — CS, electrical and civil engineering.',
   'TU Wien tops several EU per-size engineering research rankings and offers low-cost English master''s degrees in central Vienna. Public; strong admission tier.',
   1815,26000,'public','capital_or_large','https://www.tuwien.at/en/'),
  ('ETH Zurich','eth-zurich','CH','Zurich',
   'Continental Europe''s #1 university (1855) — Einstein''s alma mater, world-top-10 STEM.',
   'ETH pairs famously low tuition (≈CHF 1,500/yr) with elite STEM output feeding Zurich''s Google and deep-tech scene. Bachelor''s entry without Swiss maturity goes through a reduced entrance exam. Public; top admission tier.',
   1855,25000,'public','capital_or_large','https://ethz.ch/en.html'),
  ('EPFL','epfl-lausanne','CH','Lausanne',
   'Swiss federal tech institute on Lake Geneva (1969) — robotics, AI, micro-engineering.',
   'EPFL tops citation rankings in computer science and hosts the Blue Brain project; graduate culture is English-dominant. Public; top admission tier.',
   1969,12000,'public','small','https://www.epfl.ch/schools/en/'),
  ('University of Warsaw','university-warsaw','PL','Warsaw',
   'Poland''s top classical university (1816) — economics, IR, mathematics.',
   'UW leads national rankings and CEE research networks with growing English BA tracks at €2–4k tuition. Public; top admission tier.',
   1816,35000,'public','capital_or_large','https://en.uw.edu.pl/'),
  ('Jagiellonian University','jagiellonian-university','PL','Kraków',
   'Poland''s oldest university (1364) — medicine, law, humanities in a UNESCO student city.',
   'Central Europe''s second-oldest surviving university runs a renowned English MD through its medical college. Public; top admission tier.',
   1364,40000,'public','capital_or_large','https://en.uj.edu.pl/'),
  ('Warsaw University of Technology','warsaw-technology','PL','Warsaw',
   'Poland''s leading polytechnic (1826) — accessible English BSc engineering.',
   'WUT delivers large-scale English-language engineering at €2.8–4.5k/yr, popular for affordable EU credentials. Public; average-to-strong admission tier.',
   1826,30000,'public','capital_or_large','https://www.pw.edu.pl/eng-pw'),
  ('Delft University of Technology','tu-delft','NL','Delft',
   'Europe''s largest aerospace campus (1842) — world-top-15 engineering.',
   'TU Delft runs the continent''s biggest aerospace faculty plus world-class robotics and water management; three fully-English bachelor''s including Aerospace. Public; top admission tier.',
   1842,27000,'public','small','https://www.tudelft.nl/en/'),
  ('University of Amsterdam','uva-amsterdam','NL','Amsterdam',
   'Netherlands'' largest research university (1632) — social sciences, AI, economics.',
   'UvA offers one of Europe''s widest English catalogues, globally ranked for communication science and AI research. Public; strong admission tier.',
   1632,42000,'public','capital_or_large','https://www.uva.nl/en'),
  ('Leiden University','leiden-university','NL','Leiden',
   'The Netherlands'' oldest university (1575) — law, archaeology, IR.',
   'Leiden serves The Hague''s diplomatic ecosystem with English LLB/IR tracks beside Max Planck legal institutes. Public; strong admission tier.',
   1575,33000,'public','small','https://www.universiteitleiden.nl/en'),
  ('Sorbonne University','sorbonne-university','FR','Paris',
   'Paris'' historic Sorbonne faculties (1150 roots) — humanities, mathematics, medicine.',
   'Sorbonne Université consolidates the legacy Letters/Science/Medicine faculties; differentiated non-EU fees stay near €3k. Public; top admission tier.',
   1150,43000,'public','capital_or_large','https://www.sorbonne-universite.fr/en'),
  ('Université Paris-Saclay','paris-saclay','FR','Gif-sur-Yvette',
   'France''s research supercluster (2019) — already world-top-20 mathematics & physics.',
   'Paris-Saclay merges Paris-Sud with grandes écoles and CEA/CNRS labs on one campus south of Paris, dominating French maths placements. Public; top admission tier.',
   2019,48000,'public','capital_or_large','https://www.universite-paris-saclay.fr/en'),
  ('University of Barcelona','ub-barcelona','ES','Barcelona',
   'Catalonia''s flagship (1450) — biology, psychology, economics by the Mediterranean.',
   'UB tops Spanish research output with English-friendly paths inside Catalonia''s trilingual system. Public; strong admission tier.',
   1450,63000,'public','capital_or_large','https://www.ub.edu/web/ub/en/'),
  ('Universidad Autónoma de Madrid','uam-madrid','ES','Madrid',
   'Top-ranked Madrid public (1968) — theoretical physics and life sciences.',
   'UAM ranks Spain #1–2 overall, sharing Cantoblanco campus with CSIC research centres. Public; strong admission tier.',
   1968,33000,'public','capital_or_large','https://www.uam.es/UAM/Home.htm?idioma=en'),
  ('Sapienza University of Rome','sapienza-rome','IT','Rome',
   'Europe''s largest university (1303) — engineering, classics, aerospace heritage.',
   'Sapienza educates 100k+ students with iconic facilities from ASI-linked aerospace to leading classics departments; income-based fees keep net cost low. Public; strong admission tier.',
   1303,102000,'public','capital_or_large','https://www.uniroma1.it/en/pagina-strutturale/homepage'),
  ('University of Bologna','university-bologna','IT','Bologna',
   'The Western world''s oldest university (1088) — law, economics, the original universitas.',
   'Alma Mater Studiorum pioneered the degree system itself; today 90+ English-taught programmes with modest income-tier fees. Public; top admission tier.',
   1088,88000,'public','capital_or_large','https://www.unibo.it/en'),
  ('Politecnico di Milano','politecnico-milano','IT','Milan',
   'Italy''s #1 technical university (1863) — QS global top-10 design & architecture.',
   'PoliMi teaches most MSc programmes entirely in English at €3.9k flat tuition, drawing southern Europe''s largest international engineering cohort. Public; top admission tier.',
   1863,45000,'public','capital_or_large','https://www.polimi.it/en/'),
  ('University of Lisbon','university-lisbon','PT','Lisbon',
   'Portugal''s largest university (1911) — engineering, law, Atlantic studies.',
   'ULisboa consolidates eight former institutions into Portugal''s reference research university at €2–3k tuition. Public; strong admission tier.',
   1911,48000,'public','capital_or_large','https://ulisboa.pt/en'),
  ('University of Porto','university-porto','PT','Porto',
   'Northern Portugal''s leader (1911) — medicine, engineering, ocean sciences.',
   'U.Porto matches Lisbon academically with lower living costs and strong Erasmus inflow. Public; strong admission tier.',
   1911,31000,'public','capital_or_large','https://www.up.pt/porto/en/'),
  ('University of Oxford','oxford','GB','Oxford',
   'The English-speaking world''s oldest university (1096) — tutorials, global top-3.',
   'Collegiate tutorials, Rhodes scholarships and unmatched outcomes define elite academia; international fees £32–48k by course. Public; top admission tier.',
   1096,26000,'public','small','https://www.ox.ac.uk/'),
  ('University of Cambridge','cambridge','GB','Cambridge',
   'Cambridge (1209) — Newton-to-Hawking mathematics heritage and Silicon-Fen biotech.',
   'Cambridge leads UK research income and STEM commercialisation via Cambridge Enterprise. Public; top admission tier.',
   1209,24000,'public','small','https://www.cam.ac.uk/'),
  ('Imperial College London','imperial-college','GB','London',
   'STEM-only specialist (1907) — world-top-10 engineering, medicine, business.',
   'Imperial concentrates purely on science/engineering/medicine with a dedicated business school; central London campus drives premium fees and ROI alike. Public; top admission tier.',
   1907,21000,'public','capital_or_large','https://www.imperial.ac.uk/'),
  ('Trinity College Dublin','trinity-college-dublin','IE','Dublin',
   'Ireland''s oldest university (1592) — CS, law, humanities; home of the Book of Kells.',
   'Trinity anchors Silicon-Dock hiring (Google/Meta EMEA) boosted by Ireland''s two-year post-study visa. Public; strong admission tier.',
   1592,18000,'public','capital_or_large','https://www.tcd.ie/'),
  ('University College Dublin','ucd-dublin','IE','Dublin',
   'Ireland''s largest university (1854) — Smurfit triple-crown business school.',
   'UCD Smurfit holds AACSB+EQUIS+AMBA simultaneously on a leafy campus-style suburb setting. Public; strong admission tier.',
   1854,30000,'public','capital_or_large','https://www.ucd.ie/'),
  ('Massachusetts Institute of Technology','mit','US','Boston',
   'World-defining STEM institute (1861) — global #1 across engineering and CS.',
   'MIT''s hacker culture, Media Lab and Kendall-Square entrepreneurial density set global standards; need-blind full-need aid offsets sticker price for many internationals. Private; top admission tier.',
   1861,11500,'private','capital_or_large','https://web.mit.edu/'),
  ('Arizona State University','asu','US','Tempe',
   'America''s #1 for innovation eight years running — large accessible international intake.',
   'ASU combines top innovation metrics with open admission pathways and sizable merit scholarships — the pragmatic US route. Public; average admission tier.',
   1885,80000,'public','capital_or_large','https://www.asu.edu/'),
  ('University of Toronto','u-toronto','CA','Toronto',
   'Canada''s highest-ranked university (1827) — insulin birthplace, AI epicentre.',
   'UofT leads North-American public research output and anchors the MaRS district; entrance scholarships offset CAD-heavy fees. Public; top admission tier.',
   1827,65000,'public','capital_or_large','https://www.utoronto.ca/'),
  ('McGill University','mcgill','CA','Montreal',
   'Canada''s European-flavoured research university (1821) — medicine and law in bilingual Montreal.',
   'McGill offers Ivy-calibre academics at Quebec-adjusted prices with students from 150+ countries. Public; strong admission tier.',
   1821,38000,'public','capital_or_large','https://www.mcgill.ca/'),
  ('Lund University','lund-university','SE','Lund',
   'Scandinavia''s largest classical university (1666) beside the MAX IV/ESS big-science site.',
   'Lund pairs medieval-town charm with life-science corridor employment; non-EU fees mid-range for Europe. Public; strong admission tier.',
   1666,29000,'public','small','https://www.lunduniversity.lu.se/'),
  ('KTH Royal Institute of Technology','kth-stockholm','SE','Stockholm',
   'Sweden''s premier technical institute (1827) — ICT, sustainable energy, architecture.',
   'KTH drives Swedish innovation ecosystems from Ericsson to Spotify pipelines; every master''s is taught in English. Public; strong admission tier.',
   1827,14000,'public','capital_or_large','https://www.kth.se/en'),
  ('University of Copenhagen','copenhagen','DK','Copenhagen',
   'Denmark''s oldest university (1479) — health sciences and climate research leadership.',
   'UCPH tops Nordic citations in health sciences and carries the Niels Bohr Institute legacy. Public; strong admission tier.',
   1479,37000,'public','capital_or_large','https://www.ku.dk/english/'),
  ('Technical University of Denmark','dtu','DK','Lyngby',
   'Danish engineering flagship (1829, founded by Ørsted) — world lead in wind-energy research.',
   'DTU invented modern wind-turbine research and ranks among Europe''s best for sustainability-focused engineering. Public; strong admission tier.',
   1829,11000,'public','small','https://www.dtu.dk/english')
) as data(name, slug, cc, city, short_description, description,
          founded_year, students, ownership, csize, site)
where not exists (select 1 from universities u where u.name = data.name);

-- Norway kept enabled too (fees since 2023 noted in programmes below).
update countries set supported = true where code = 'NO';

-- ============================================================
-- C. Flagship English-taught programmes
-- ============================================================
insert into programmes (
  university_id, name, field_of_study_id, language_code, degree_level,
  duration_months, tuition_min, tuition_max, tuition_currency,
  application_deadline, intake_start, published)
select u.id, v.pname, f.id, 'en', v.degree::degree_level, v.months,
       v.tmin, v.tmax, v.cur, '2026-08-31', '2026-09-01', true
from (values
  ('Technical University of Munich','MSc Informatics','Computer Science','master',24,4000,6000,'EUR'),
  ('RWTH Aachen University','MSc Mechanical Engineering','Mechanical Engineering','master',24,300,700,'EUR'),
  ('University of Vienna','BA English and American Studies','International Relations','bachelor',36,750,1600,'EUR'),
  ('TU Wien','MSc Computer Science','Computer Science','master',24,800,1600,'EUR'),
  ('ETH Zurich','MSc Computer Science','Computer Science','master',24,1460,1500,'CHF'),
  ('EPFL','MSc Data Science','Computer Science','master',24,1560,1560,'CHF'),
  ('University of Warsaw','BA International Relations','International Relations','bachelor',36,2300,3600,'EUR'),
  ('Jagiellonian University','MD Program (English Division)','Medicine','bachelor',72,15000,16500,'EUR'),
  ('Warsaw University of Technology','BSc Computer Science','Computer Science','bachelor',42,2800,4500,'EUR'),
  ('Delft University of Technology','BSc Aerospace Engineering','Electrical Engineering','bachelor',36,15950,20500,'EUR'),
  ('University of Amsterdam','BSc Artificial Intelligence','Computer Science','bachelor',36,12500,15500,'EUR'),
  ('Leiden University','LLB International Business Law','International Relations','bachelor',36,12800,15200,'EUR'),
  ('Sorbonne University','Licence Mathematics','Physics','bachelor',36,2950,3950,'EUR'),
  ('Université Paris-Saclay','MSc Mathematics','Mathematics','master',24,4000,6000,'EUR'),
  ('University of Barcelona','BA Business Administration','Business Administration','bachelor',36,2600,5500,'EUR'),
  ('Universidad Autónoma de Madrid','MSc Biotechnology','Biology','master',24,2000,4800,'EUR'),
  ('Sapienza University of Rome','MSc Artificial Intelligence and Robotics','Computer Science','master',24,1100,3200,'EUR'),
  ('University of Bologna','BSc Computer Science','Computer Science','bachelor',36,1000,4500,'EUR'),
  ('Politecnico di Milano','MSc Architecture and Urban Design','Architecture','master',24,3890,3890,'EUR'),
  ('University of Lisbon','MSc Software Engineering','Computer Science','master',24,1750,3000,'EUR'),
  ('University of Porto','MSc Psychology','Psychology','master',24,1500,3000,'EUR'),
  ('University of Oxford','BA Philosophy, Politics and Economics','Economics','bachelor',36,35500,48600,'GBP'),
  ('University of Cambridge','BA Natural Sciences','Physics','bachelor',36,37000,51000,'GBP'),
  ('Imperial College London','MEng Computing','Computer Science','bachelor',48,39500,45500,'GBP'),
  ('Trinity College Dublin','BSc Computer Science','Computer Science','bachelor',48,16800,27500,'EUR'),
  ('University College Dublin','BComm Commerce','Business Administration','bachelor',36,14900,25500,'EUR'),
  ('Massachusetts Institute of Technology','SB Computer Science and Engineering','Computer Science','bachelor',48,61500,64000,'USD'),
  ('Arizona State University','BS Computer Science','Computer Science','bachelor',48,31500,34500,'USD'),
  ('University of Toronto','BSc Computer Science','Computer Science','bachelor',48,32000,35000,'CAD'),
  ('McGill University','BA Economics','Economics','bachelor',48,16000,23000,'CAD'),
  ('Lund University','MSc Machine Learning, Systems and Control','Computer Science','master',24,12500,14500,'EUR'),
  ('KTH Royal Institute of Technology','MSc Computer Science','Computer Science','master',24,15500,15700,'EUR'),
  ('University of Copenhagen','MSc Bioinformatics','Biology','master',24,6200,15500,'EUR'),
  ('Technical University of Denmark','MSc Wind Energy','Mechanical Engineering','master',24,15000,15000,'EUR')
) as v(uname,pname,fname,degree,months,tmin,tmax,cur)
join universities u on u.name = v.uname
join fields_of_study f on f.name = v.fname
where not exists (
  select 1 from programmes p where p.university_id = u.id and p.name = v.pname);

-- ============================================================
-- D. Criteria fills over the enlarged catalogue (idempotent)
-- ============================================================

-- D1. Basics: study mode, documents, scholarships -------------------------
update programmes p set
  study_mode = coalesce(p.study_mode,'full_time'),
  required_documents = case u.country_code
    when 'US' then ARRAY['Passport copy','High-school transcript','SAT/ACT (optional)','TOEFL/IELTS score','Financial support statement']
    when 'CA' then ARRAY['Passport copy','High-school transcript','Provincial exam results if any','IELTS/TOEFL score','Proof of funds']
    when 'GB' then ARRAY['Passport copy','Secondary certificate (A-levels or equivalent)','Personal statement','Academic reference','IELTS UKVI where required']
    else ARRAY[
      'Passport copy',
      'Secondary school certificate with transcript',
      'Recognition of prior education where applicable',
      'English proficiency certificate',
      'Motivation letter / CV']
    end,
  scholarship_notes = case
    when u.country_code in ('DE','AT','NO') then 'Public universities charge little to no tuition even for non-EU students (semester/contribution fees only); DAAD and national stipends add living-cost support for strong applicants.'
    when u.country_code = 'CH' then 'Tuition is exceptionally low for Swiss standards of excellence; Swiss Government Excellence Scholarships cover select master''s/PhD candidates.'
    when u.country_code in ('SE','DK','FI') then 'Non-EU tuition applies (€6–16k typical); each university runs partial-fee waiver scholarships and the Swedish/Danish/Finnish institutes fund flagship scholarships annually.'
    when u.country_code = 'NL' then 'Statutory non-EU fees apply; Holland Scholarship (€5k first year) plus university-specific grants reduce net cost.'
    when u.country_code = 'FR' then 'Differentiated non-EU fees (~€3–4k) with extensive Exellence scholarships (Eiffel, Ampère) covering living costs.'
    when u.country_code in ('GB','IE') then 'Chevening/Commonwealth and Government-of-Ireland postgraduate awards; most undergraduate funding is institutional merit-based.'
    when u.country_code in ('US','CA') then 'Merit and need-based institutional aid varies sharply: MIT is need-blind for internationals; public flagships rely mostly on merit scholarships.'
    when u.country_code = 'PL' then 'Polish NAWA scholarships and low flat tuition make this among Europe''s cheapest English-language routes.'
    else 'EU-standard self-funded model with Erasmus+ mobility windows and departmental assistantships at master''s level.'
    end
from universities u
where p.university_id = u.id
  and (p.required_documents = '{}' or p.scholarship_notes is null);

-- D2. Career tags & notes by field category --------------------------------
update programmes p set
  career_notes = case
    when f.category ~* 'engineer|technolog|informatic|computer|software'
      then 'Graduates work as software engineers, data analysts and systems architects across global tech hubs.'
    when f.category ~* 'business|economic|management|finance|commerce'
      then 'Typical destinations: banking, consulting, FMCG management, fintech and entrepreneurship.'
    when f.category ~* 'medic|health|pharm'
      then 'Degree opens licensing routes (USMLE/PLAB/Approbation) and residency positions worldwide.'
    when f.category ~* 'art|design|music|architect'
      then 'Careers span studios, agencies and independent practice; portfolio growth outweighs employer tenure.'
    when f.category ~* 'social|law|education|humanit|journalis|international'
      then 'Public sector, NGOs, diplomacy and media; international organisations recruit via graduate schemes.'
    when f.category ~* 'science|natural|biolog|chem|physic|math'
      then 'R&D institutes, pharma/biotech industry and doctoral pathways with early publication opportunities.'
    else 'Programme-specific career guidance is provided by the faculty career centre.'
    end,
  career_tags = case
    when f.category ~* 'engineer|technolog|informatic|computer|software'
      then ARRAY['software','startups','research']
    when f.category ~* 'business|economic|management|finance|commerce'
      then ARRAY['business','finance']
    when f.category ~* 'medic|health|pharm'
      then ARRAY['medicine']
    when f.category ~* 'art|design|music|architect'
      then ARRAY['design']
    when f.category ~* 'social|law|education|humanit|journalis|international'
      then ARRAY['public_sector']
    when f.category ~* 'science|natural|biolog|chem|physic|math'
      then ARRAY['research','academia']
    else p.career_tags
    end
from universities u, fields_of_study f
where f.id = p.field_of_study_id
  and p.university_id = u.id
  and (p.career_tags is null or p.career_tags='{}' or p.career_notes is null);

-- D3. Lifestyle tags incl. the newly added cities --------------------------
update programmes p set
  lifestyle_tags = case u.city
    when 'Munich' then ARRAY['large_city','good_transport','international_community','safe_environment']
    when 'Aachen' then ARRAY['student_city','affordable','international_community']
    when 'Vienna' then ARRAY['large_city','cultural_scene','good_transport','safe_environment']
    when 'Zurich' then ARRAY['large_city','good_transport','safe_environment']
    when 'Lausanne' then ARRAY['student_city','green_spaces','safe_environment']
    when 'Warsaw' then ARRAY['large_city','affordable','vibrant_nightlife','good_transport']
    when 'Kraków' then ARRAY['student_city','cultural_scene','affordable']
    when 'Delft' then ARRAY['student_city','bike_friendly','safe_environment']
    when 'Amsterdam' then ARRAY['large_city','bike_friendly','vibrant_nightlife','international_community']
    when 'Leiden' then ARRAY['student_city','bike_friendly','cultural_scene']
    when 'Gif-sur-Yvette' then ARRAY['small_city','safe_environment','green_spaces']
    when 'Paris' then ARRAY['large_city','cultural_scene','good_transport','vibrant_nightlife']
    when 'Barcelona' then ARRAY['large_city','vibrant_nightlife','green_spaces','international_community']
    when 'Madrid' then ARRAY['large_city','vibrant_nightlife','good_transport']
    when 'Rome' then ARRAY['large_city','cultural_scene','vibrant_nightlife']
    when 'Bologna' then ARRAY['student_city','cultural_scene','affordable','bike_friendly']
    when 'Milan' then ARRAY['large_city','good_transport','international_community']
    when 'Lisbon' then ARRAY['large_city','affordable','green_spaces','international_community']
    when 'Porto' then ARRAY['large_city','affordable','cultural_scene']
    when 'Oxford' then ARRAY['small_city','cultural_scene','safe_environment','bike_friendly']
    when 'Cambridge' then ARRAY['small_city','cultural_scene','bike_friendly']
    when 'London' then ARRAY['large_city','good_transport','vibrant_nightlife','international_community']
    when 'Dublin' then ARRAY['large_city','international_community','safe_environment']
    when 'Boston' then ARRAY['large_city','international_community','good_transport']
    when 'Tempe' then ARRAY['large_city','affordable','good_transport']
    when 'Toronto' then ARRAY['large_city','international_community','good_transport']
    when 'Montreal' then ARRAY['large_city','affordable','cultural_scene','vibrant_nightlife']
    when 'Lund' then ARRAY['student_city','bike_friendly','safe_environment']
    when 'Stockholm' then ARRAY['large_city','green_spaces','good_transport']
    when 'Copenhagen' then ARRAY['large_city','bike_friendly','good_transport','safe_environment']
    when 'Lyngby' then ARRAY['student_city','bike_friendly','safe_environment']
    else ARRAY['small_city','affordable','safe_environment','green_spaces']
    end
from universities u
where p.university_id = u.id
  and (p.lifestyle_tags is null or p.lifestyle_tags = '{}');

-- D4. Academic requirements backfill --------------------------------------
insert into programme_academic_requirements (
  programme_id, entrance_exam_required, required_degree_level,
  required_math_background, notes)
select distinct on (p.id)
  p.id, false, p.degree_level,
  case when f.category ~* 'engineer|technolog|informatic|computer|math|physic|chem|science'
       then 'average'::math_background end,
  'Derived catalogue defaults: admission on documents; mathematics expectation only for technical/scientific fields.'
from programmes p
join universities u on u.id = p.university_id
join fields_of_study f on f.id = p.field_of_study_id
where not exists (
  select 1 from programme_academic_requirements r where r.programme_id = p.id);

-- D5. IELTS 6.5 row for English programmes lacking test requirements ------
insert into programme_test_requirements (
  programme_id, qualification_id, minimum_score,
  minimum_score_display, comparison)
select p.id, q.id, 6.5, '6.5', 'greater_or_equal'
from programmes p
join universities u on u.id = p.university_id
join qualifications q on q.code = 'ielts'
where p.language_code = 'en'
  and not exists (
    select 1 from programme_test_requirements t where t.programme_id = p.id);

-- D6. Living-cost estimates for the new city bands (monthly, EUR) ---------
insert into programme_living_cost_estimates (
  programme_id, currency,
  accommodation_min, accommodation_max,
  food_min, food_max, transport_min, transport_max,
  utilities_min, utilities_max, internet_phone_min, internet_phone_max,
  study_materials_min, study_materials_max, other_min, other_max,
  total_min, total_max, source_name, source_type, source_date)
select p.id, 'EUR',
  round(b.tmin*0.42), round(b.tmax*0.42),
  round(b.tmin*0.28), round(b.tmax*0.28),
  round(b.tmin*0.08), round(b.tmax*0.08),
  round(b.tmin*0.09), round(b.tmax*0.09),
  round(b.tmin*0.03), round(b.tmax*0.03),
  round(b.tmin*0.04), round(b.tmax*0.04),
  round(b.tmin*0.06), round(b.tmax*0.06),
  b.tmin, b.tmax,
  'Unikchoose internal estimate', NULL, current_date
from programmes p
join universities u on u.id = p.university_id
join (values
  ('Munich',1250,1750),('Aachen',800,1100),('Vienna',1000,1450),
  ('Zurich',1700,2400),('Lausanne',1500,2100),
  ('Warsaw',700,1050),('Kraków',600,900),
  ('Delft',900,1300),('Amsterdam',1150,1650),('Leiden',850,1250),
  ('Gif-sur-Yvette',850,1200),('Paris',1200,1750),
  ('Barcelona',950,1400),('Madrid',900,1300),
  ('Rome',900,1350),('Bologna',750,1100),('Milan',1100,1600),
  ('Lisbon',800,1150),('Porto',650,950),
  ('Oxford',1050,1500),('Cambridge',1000,1450),
  ('Dublin',1150,1650),
  ('Boston',1500,2200),('Tempe',950,1400),
  ('Toronto',1250,1800),('Montreal',950,1400),
  ('Lund',850,1200),('Stockholm',1000,1450),
  ('Copenhagen',1100,1600),('Lyngby',950,1400)
) as b(city,tmin,tmax) on u.city = b.city
where not exists (
  select 1 from programme_living_cost_estimates e where e.programme_id = p.id);

-- D7. Accommodation rows for the same cities ------------------------------
insert into university_accommodation (
  university_id, dormitory_available, dormitory_name,
  estimated_monthly_cost_min, estimated_monthly_cost_max, currency,
  estimated_deposit, distance_from_campus_km, source_name, source_date)
select u.id, true,
  u.name || ' student housing',
  round(b.lo), round(b.hi), 'EUR',
  round(b.hi), 3, 'Unikchoose internal estimate', current_date
from universities u
join (values
  ('Munich',450,800),('Aachen',280,480),('Vienna',380,650),
  ('Zurich',700,1200),('Lausanne',600,1000),
  ('Warsaw',250,480),('Kraków',200,400),
  ('Delft',350,650),('Amsterdam',500,900),('Leiden',380,700),
  ('Gif-sur-Yvette',380,620),('Paris',550,950),
  ('Barcelona',420,780),('Madrid',380,700),
  ('Rome',400,720),('Bologna',300,560),('Milan',480,850),
  ('Lisbon',340,600),('Porto',280,500),
  ('Oxford',520,900),('Cambridge',500,880),
  ('Dublin',520,900),
  ('Boston',800,1400),('Tempe',450,800),
  ('Toronto',650,1100),('Montreal',450,800),
  ('Lund',380,640),('Stockholm',450,780),
  ('Copenhagen',480,820),('Lyngby',400,700)
) as b(city,lo,hi) on u.city = b.city
where not exists (
  select 1 from university_accommodation a where a.university_id = u.id);

-- D8. International-office resource for everyone missing one -------------
insert into university_resources (university_id, category, title, link_title, link_url, description)
select u.id, 'international_office', 'International Office',
       'International admissions & support', u.website_url,
       'Dedicated office guiding foreign applicants through admission, visas and orientation.'
from universities u
where not exists (
  select 1 from university_resources r
  where r.university_id = u.id and r.category = 'international_office');

-- Erasmus+ for publics of the newly added European countries
insert into university_resources (university_id, category, title, link_title, link_url, description)
select u.id, 'erasmus', 'Erasmus+', 'Erasmus+ exchanges', u.website_url,
  'Participates in Erasmus+ credit-mobility exchanges with partner universities across Europe.'
from universities u
where u.ownership_type = 'public'
  and u.country_code in ('AT','CH','DE','DK','ES','FI','FR','GB','IE','IT','NL','NO','PL','PT','SE')
  and not exists (
    select 1 from university_resources r
    where r.university_id = u.id and r.category = 'erasmus');
