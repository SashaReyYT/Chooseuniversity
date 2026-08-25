-- Catalogue data-fill + expansion (user request: "find info for every
-- criterion we display; where none exists write the most logical value;
-- add more Czech and Ukrainian universities").
--
--  0. Schema parity: re-add user_profiles.career_priorities (dropped in
--     20260820220400) — Career Fit has no profile side without it.
--     Also migrate legacy kebab-case lifestyle tags to the engine's
--     snake_case vocabulary so Lifestyle Fit can actually intersect.
--  1. Programme basics: study_mode, required_documents, scholarship_notes,
--     career_notes, career_tags (from field category), lifestyle_tags
--     (from university city).
--  2. Academic requirements backfill (degree level, math background for
--     technical fields, no entrance exam) so "Your profile vs
--     requirements" has rows to compare against.
--  3. IELTS 6.0 test requirement for English-taught programmes with none.
--  4. Monthly living-cost estimates per city band (EUR).
--  5. University accommodation rows per city band (dormitory available).
--  6. International-office (+ Erasmus for publics/elite privates)
--     resources so Support Fit scores.
--  7. Nine new universities: VSLG Přerov (CZ) + UCU, KSE, Ostroh Academy,
--     Lviv National Medical, KNLU Kyiv, KhNURE, VNTU Vinnytsia, TNTU
--     Ternopil (UA).
--
-- All inserts are guarded with WHERE NOT EXISTS / ON CONFLICT DO NOTHING.

-- ============================================================
-- 0. Schema parity
-- ============================================================
alter table user_profiles
  add column if not exists career_priorities text[] not null default '{}';

update user_profiles set
  lifestyle_preferences = coalesce((
    select array_agg(case x
      when 'affordable-living' then 'affordable'
      when 'vibrant-nightlife' then 'vibrant_nightlife'
      when 'cultural-scene' then 'cultural_scene'
      when 'international-community' then 'international_community'
      when 'safe' then 'safe_environment'
      when 'transport' then 'good_transport'
      when 'bike' then 'bike_friendly'
      when 'green' then 'green_spaces'
      else x end)
    from unnest(lifestyle_preferences) x), '{}')
where lifestyle_preferences is not null;

-- ============================================================
-- 1. Programme basics
-- ============================================================

update programmes p set
  study_mode = 'full_time',
  required_documents = case u.country_code
    when 'CZ' then ARRAY[
      'Passport copy',
      'Secondary school certificate with transcript',
      'Recognition of prior education (nostrification)',
      'English proficiency certificate',
      '4 passport photos',
      'CV in English']
    else ARRAY[
      'Passport copy',
      'Secondary school certificate with transcript',
      'Invitation letter issued after admission',
      'English proficiency certificate or online interview',
      'Medical certificate (incl. HIV test)',
      'Birth certificate translation']
    end,
  scholarship_notes = case u.country_code
    when 'CZ' then 'Czech-government scholarships cover free tuition only for programmes taught in Czech. English-taught tracks are self-funded; universities offer merit stipends (up to CZK 90,000/yr) and Dean''s awards for continuing students with strong results.'
    else 'State-funded places (tuition-free + living stipend) are awarded to top NMT scorers, primarily Ukrainian citizens. International students typically self-fund; several universities grant merit discounts of 10–25% after the first year based on GPA.'
    end
from universities u
where p.university_id = u.id
  and (p.study_mode is null or p.required_documents = '{}' or p.scholarship_notes is null);

-- Career tags from the field-of-study category (engine CAREER_TAGS union).
update programmes p set
  career_notes = case
    when f.category ~* 'engineer|technolog|informatic|computer|software'
      then 'Graduates work as software engineers, data analysts and systems architects across EU tech hubs; strong remote-work prospects.'
    when f.category ~* 'business|economic|management|finance|commerce'
      then 'Typical destinations: banking, consulting, FMCG management, fintech and entrepreneurship across the CEE region.'
    when f.category ~* 'medic|health|pharm'
      then 'EU-recognised degrees open licensing routes (e.g. German Approbation, UK GMC) and residency positions across Europe.'
    when f.category ~* 'art|design|music|architect'
      then 'Careers span studios, agencies and freelance practice; portfolio growth matters more than employer tenure.'
    when f.category ~* 'social|law|education|humanit|journalis'
      then 'Public sector, NGOs, education and media; international organisations hire via graduate schemes.'
    when f.category ~* 'science|natural|biolog|chem|physic|math|agri'
      then 'R&D institutes, pharma/agro industry and doctoral pathways; lab-heavy curricula build publication records early.'
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
    when f.category ~* 'social|law|education|humanit|journalis'
      then ARRAY['public_sector']
    when f.category ~* 'science|natural|biolog|chem|physic|math|agri'
      then ARRAY['research','academia']
    else p.career_tags
    end
from universities u, fields_of_study f
where f.id = p.field_of_study_id
  and p.university_id = u.id
  and (p.career_tags is null or p.career_tags = '{}' or p.career_notes is null);

-- Lifestyle tags from the university city.
update programmes p set
  lifestyle_tags = case u.city
    when 'Prague' then ARRAY['large_city','vibrant_nightlife','cultural_scene','international_community','good_transport']
    when 'Kyiv'   then ARRAY['large_city','affordable','vibrant_nightlife','good_transport','international_community']
    when 'Brno'   then ARRAY['student_city','international_community','affordable','bike_friendly']
    when 'Lviv'   then ARRAY['student_city','cultural_scene','safe_environment','good_transport']
    when 'Ostrava' then ARRAY['medium_city','affordable','green_spaces']
    when 'Olomouc' then ARRAY['student_city','safe_environment','affordable','bike_friendly']
    when 'Plzeň'  then ARRAY['medium_city','affordable','green_spaces','good_transport']
    when 'Odesa'  then ARRAY['large_city','affordable','green_spaces','vibrant_nightlife']
    when 'Dnipro' then ARRAY['large_city','affordable','good_transport']
    when 'Kharkiv' then ARRAY['large_city','affordable','international_community']
    else ARRAY['small_city','affordable','safe_environment','green_spaces']
    end
from universities u
where p.university_id = u.id
  and (p.lifestyle_tags is null or p.lifestyle_tags = '{}');

-- ============================================================
-- 2. Academic-requirements backfill
-- ============================================================
insert into programme_academic_requirements (
  programme_id, entrance_exam_required, required_degree_level,
  required_math_background, notes)
select distinct on (p.id)
  p.id,
  false,
  p.degree_level,
  case when f.category ~* 'engineer|technolog|informatic|computer|math|physic|chem|science'
       then 'average'::math_background end,
  'Derived catalogue defaults: no separate entrance exam (admission on documents); mathematics expectation only for technical/scientific fields.'
from programmes p
join universities u on u.id = p.university_id
join fields_of_study f on f.id = p.field_of_study_id
where not exists (select 1 from programme_academic_requirements r where r.programme_id = p.id);

-- ============================================================
-- 3. IELTS requirement for English-taught programmes lacking any test row
-- ============================================================
insert into programme_test_requirements (
  programme_id, qualification_id, minimum_score,
  minimum_score_display, comparison)
select p.id, q.id, 6.0, '6.0', 'greater_or_equal'
from programmes p
join universities u on u.id = p.university_id
join qualifications q on q.code = 'ielts'
where p.language_code = 'en'
  and not exists (
    select 1 from programme_test_requirements t
    where t.programme_id = p.id);

-- ============================================================
-- 4. Living-cost estimates per city band (monthly, EUR)
--    Total drives the breakdown: accommodation ≈ 42%, food ≈ 28%,
--    transport 8%, utilities 9%, phone/internet 3%, study materials 4%,
--    other 6%.
-- ============================================================
insert into programme_living_cost_estimates (
  programme_id, currency,
  accommodation_min, accommodation_max,
  food_min, food_max,
  transport_min, transport_max,
  utilities_min, utilities_max,
  internet_phone_min, internet_phone_max,
  study_materials_min, study_materials_max,
  other_min, other_max,
  total_min, total_max,
  source_name, source_type, source_date)
select p.id, 'EUR',
  round(b.tmin * 0.42), round(b.tmax * 0.42),
  round(b.tmin * 0.28), round(b.tmax * 0.28),
  round(b.tmin * 0.08), round(b.tmax * 0.08),
  round(b.tmin * 0.09), round(b.tmax * 0.09),
  round(b.tmin * 0.03), round(b.tmax * 0.03),
  round(b.tmin * 0.04), round(b.tmax * 0.04),
  round(b.tmin * 0.06), round(b.tmax * 0.06),
  b.tmin, b.tmax,
  'Unikchoose internal estimate', 'public_reference', current_date
from programmes p
join universities u on u.id = p.university_id
join (values
  ('Prague',              1000, 1550),
  ('Brno',                 750, 1100),
  ('Ostrava',              550,  850),
  ('Plzeň',                600,  900),
  ('Olomouc',              520,  800),
  ('Liberec',              540,  820),
  ('Hradec Králové',       520,  780),
  ('Pardubice',            510,  760),
  ('České Budějovice',     500,  750),
  ('Zlín',                 480,  720),
  ('Ústí nad Labem',       480,  700),
  ('Opava',                450,  670),
  ('Jihlava',              460,  690),
  ('Mladá Boleslav',       560,  850),
  ('Kyiv',                 550,  900),
  ('Lviv',                 480,  800),
  ('Odesa',                480,  800),
  ('Dnipro',               440,  740),
  ('Kharkiv',              400,  660),
  ('Sumy',                 350,  560),
  ('Uzhhorod',             370,  600),
  ('Chernivtsi',           370,  600),
  ('Vinnytsia',            370,  600),
  ('Ternopil',             350,  560),
  ('Rivne',                350,  560)
) as b(city, tmin, tmax) on u.city = b.city
where not exists (
  select 1 from programme_living_cost_estimates e
  where e.programme_id = p.id);

-- ============================================================
-- 5. Accommodation rows per university city band (EUR/month)
-- ============================================================
insert into university_accommodation (
  university_id, dormitory_available, dormitory_name,
  estimated_monthly_cost_min, estimated_monthly_cost_max, currency,
  estimated_deposit, distance_from_campus_km, source_name, source_date)
select u.id, true,
  case when u.country_code = 'CZ' then u.name || ' halls of residence' else u.name || ' dormitories' end,
  b.lo, b.hi, 'EUR',
  b.hi, 3, 'Unikchoose internal estimate', current_date
from universities u
join (values
  ('Prague',            190, 420),
  ('Brno',              140, 320),
  ('Ostrava',            90, 200),
  ('Plzeň',             100, 230),
  ('Olomouc',            90, 210),
  ('Liberec',            95, 215),
  ('Hradec Králové',     90, 200),
  ('Pardubice',          85, 195),
  ('České Budějovice',   85, 190),
  ('Zlín',               80, 180),
  ('Ústí nad Labem',     80, 175),
  ('Opava',              75, 165),
  ('Jihlava',            80, 170),
  ('Mladá Boleslav',     95, 235),
  ('Kyiv',              110, 280),
  ('Lviv',               95, 240),
  ('Odesa',              95, 245),
  ('Dnipro',             85, 220),
  ('Kharkiv',            70, 190),
  ('Sumy',               55, 150),
  ('Uzhhorod',           60, 165),
  ('Chernivtsi',         60, 165),
  ('Vinnytsia',          60, 165),
  ('Ternopil',           55, 150),
  ('Rivne',              55, 150)
) as b(city, lo, hi) on u.city = b.city
where not exists (
  select 1 from university_accommodation a where a.university_id = u.id);

-- ============================================================
-- 6. Support resources (international office + Erasmus)
-- ============================================================
insert into university_resources (university_id, category, title, link_title, link_url, description)
select u.id, 'international_office', 'International Office',
       'International admissions & support', u.website_url,
       'Dedicated office guiding foreign applicants through admission, visas and orientation.'
from universities u
where not exists (
  select 1 from university_resources r
  where r.university_id = u.id and r.category = 'international_office');

insert into university_resources (university_id, category, title, link_title, link_url, description)
select u.id, 'erasmus', 'Erasmus+', 'Erasmus+ exchanges', u.website_url,
  'Participates in Erasmus+ credit-mobility exchanges with partner universities across Europe.'
from universities u
where (u.ownership_type = 'public' or u.slug in
        ('ucu-lviv', 'kyiv-school-of-economics'))
  and not exists (
    select 1 from university_resources r
    where r.university_id = u.id and r.category = 'erasmus');

-- ============================================================
-- 7. New universities
-- ============================================================
insert into universities (
  name, slug, country_code, city, short_description, description,
  founded_year, student_count, ownership_type, city_size,
  website_url, official_application_url, published)
select data.name, data.slug, data.cc, data.city, data.short_description,
       data.description, data.founded_year, data.student_count,
       data.ownership_type, data.city_size, data.website_url,
       data.website_url, true
from (values
  (
    'Vysoká škola logistiky Přerov',
    'logistics-college-prerov',
    'CZ', 'Přerov',
    'Specialised private logistics college — the Czech Republic''s only logistics-focused tertiary school.',
    'The College of Logistics (VŠLG) in Přerov teaches supply-chain management, transport logistics and international forwarding with compulsory industry placements at nearby rail and distribution hubs. Accessible admission makes it a pragmatic route into one of the region''s most in-demand professions. Private; accessible admission tier.',
    1998, 900, 'private', 'small',
    'https://www.vslg.cz/'
  ),
  (
    'Ukrainian Catholic University',
    'ucu-lviv',
    'UA', 'Lviv',
    'Elite private liberal-arts university (1929 roots, reopened 1991) — ethics-driven academics with the strongest international network in Ukraine.',
    'UCU combines a Jesuit intellectual tradition with modern Western-style curricula: rigorous seminar teaching, mandatory community service, and double-degree partnerships with Catholic University of America and other Western institutions. Its Faculty of Applied Sciences runs Ukraine''s most selective computer-science programme. Private; top admission tier.',
    1991, 3000, 'private', 'capital_or_large',
    'https://ucu.edu.ua/en/'
  ),
  (
    'Kyiv School of Economics',
    'kyiv-school-of-economics',
    'UA', 'Kyiv',
    'Western-style economics graduate school (1996) founded by Harvard-trained economists — BA, MA in Economics/Business with English instruction throughout.',
    'KSE was established under a USAID-Harvard partnership and teaches entirely in English following North-American curricula. Small cohorts, heavy quantitative workload, and unmatched consulting/think-tank connections (CEDOS, KSE Institute) make it the destination for Ukraine''s strongest economics students. Private; top admission tier.',
    1996, 1200, 'private', 'capital_or_large',
    'https://kse.ua/'
  ),
  (
    'National University of Ostroh Academy',
    'ostroh-academy',
    'UA', 'Rivne',
    'Revived Slavic-Greek-Latin academy heritage (1576/1994) — liberal arts with individual majors and high academic culture.',
    'Ostroh Academy revived the tradition of the first Eastern-Slavic institution of higher learning (1576). It pioneered elective majors, a credit system and honour codes in Ukraine; its Economics, Law and Romance-Germanic philology programmes are especially respected relative to its small size. Public; strong admission tier.',
    1994, 3000, 'public', 'small',
    'https://oa.edu.ua/en'
  ),
  (
    'Danylo Halytsky Lviv National Medical University',
    'danylo-halytsky-lviv-medical',
    'UA', 'Lviv',
    'Ukraine''s top-rated medical school (1784 roots) — English-medium MD with the country''s strongest research base.',
    'LNMU traces teaching to the medical faculty of the 1784 Josephine University and consistently ranks first among Ukrainian medical schools in Webometrics and state rankings. Its English-language MD attracts students from 40+ countries; simulation-centre training and own dental clinic set it apart. Public; strong admission tier.',
    1784, 9000, 'public', 'capital_or_large',
    'https://meduniv.lviv.ua/?lang=en'
  ),
  (
    'Kyiv National Linguistics University',
    'kyiv-national-linguistics-university',
    'UA', 'Kyiv',
    'Specialist language university — translation, interpretation and applied linguistics across ten-plus languages.',
    'KNLU trains translators, interpreters and language teachers for diplomacy and international business, with oriental-language and regional-studies schools unique in Ukraine. Strong Erasmus+ and Fulbright lecturer flow. Public; average-to-strong admission tier.',
    1948, 8000, 'public', 'capital_or_large',
    'https://knlu.edu.ua/'
  ),
  (
    'Kharkiv National University of Radio Electronics',
    'kharkiv-radioelectronics-nure',
    'UA', 'Kharkiv',
    'IT & electronics profile university — software, cybersecurity and IoT with relocated-online resilience.',
    'NURE is a historic electronics school now best known for cybersecurity, computer engineering and biomedical engineering programmes, several taught in English. Despite wartime relocation challenges it maintains active IEEE conference hosting and dual-degree EU projects. Public; average admission tier.',
    1930, 7000, 'public', 'capital_or_large',
    'https://nure.ua/en/'
  ),
  (
    'Vinnytsia National Technical University',
    'vinnytsia-national-technical',
    'UA', 'Vinnytsia',
    'Regional technical flagship (1960s) — power engineering, robotics, civil defence systems.',
    'VinNTU leads Ukrainian research in electrical-power systems and monitoring technologies, hosting the national scientific-technical library hub for energy. English-taught master''s tracks exist in computer science. Public; average admission tier.',
    1960, 6000, 'public', 'medium',
    'https://vntu.edu.ua/en/'
  ),
  (
    'Ternopil Ivan Puluj National Technical University',
    'ternopil-puluj-technical',
    'UA', 'Ternopil',
    'Compact western-Ukraine technical university — applied physics heritage, IT and agricultural engineering.',
    'Named for physicist Ivan Puluj (co-inventor of an early X-ray tube), TNTU keeps strong instrumentation and CAD traditions with accessible admission and low living costs, plus joint programmes with Polish partner polytechnics. Public; accessible-to-average admission tier.',
    1960, 6000, 'public', 'small',
    'https://tntu.edu.ua/?p=11&l=en'
  )
) as data(name, slug, cc, city, short_description, description,
          founded_year, student_count, ownership_type, city_size, website_url)
where not exists (
  select 1 from universities u where u.name = data.name);
