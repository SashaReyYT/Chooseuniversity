-- Ukrainian universities expansion (spec: several cities, majority Kyiv,
-- covering the full admission-spectrum from top-tier to accessible).
--
-- Adds seventeen real institutions on top of the six already seeded by
-- 0016_ukraine_programmes.sql (Shevchenko KNU, Igor Sikorsky KPI, Bogomolets,
-- Karazin, Sumdu, Lviv Polytechnic). Eleven are Kyiv-based; the rest cover
-- Lviv, Odesa, Dnipro, Uzhhorod and Chernivtsi so the catalog spans regions.
--
-- Tier vocabulary mirrors the Czech seed: descriptions end with an honest
-- admission-tier note (top / strong / average / accessible). Facts are
-- rounded figures from official sites; unknown years stay NULL.

-- Switch Ukraine on in the country picker (Q2) now that a real catalogue
-- exists; Czechia keeps sort_order 0, Ukraine follows.
update countries set supported = true, sort_order = 1 where code = 'UA';

insert into universities (
  name, slug, country_code, city, short_description, description,
  founded_year, student_count, ownership_type, city_size,
  website_url, official_application_url, published
)
select data.name, data.slug, 'UA', data.city, data.short_description,
       data.description, data.founded_year, data.student_count,
       data.ownership_type, data.city_size, data.website_url,
       data.website_url, true
from (values
  -- ================= KYIV — top tier =================
  (
    'National University of Kyiv-Mohyla Academy',
    'kyiv-mohyla-academy',
    'Kyiv',
    'Prestigious liberal-arts academy tracing to 1615 — the most selective non-classical university in Ukraine.',
    'NaUKMA revived its historic predecessor (1615, closed 1920) in 1991 as Ukraine''s first Western-style university with elective majors, credit system and rigorous seminar teaching. Small cohorts, independent-minded culture and consistently high employer regard make it the most selective destination outside the classical universities. Public; top admission tier.',
    1615,
    3000,
    'public',
    'capital_or_large',
    'https://ukma.edu.ua/en/'
  ),
  -- ================= KYIV — strong =================
  (
    'Kyiv National Economic University named after Vadym Hetman',
    'hetman-economics-university-kyiv',
    'Kyiv',
    'Ukraine''s flagship economics university (1906) — finance, banking, marketing and IT economics.',
    'KNEU named after banker Vadym Hetman grew out of the Kyiv Commercial Institute (1906) into the national leader in economics education. Its graduates dominate Ukrainian finance and the NBU; selected bachelor''s tracks are taught in English, and admission scores sit just below the classical universities. Public; strong admission tier.',
    1906,
    10000,
    'public',
    'capital_or_large',
    'https://kneu.edu.ua/en/'
  ),
  (
    'National University of Life and Environmental Sciences of Ukraine',
    'life-environmental-sciences-kyiv',
    'Kyiv',
    'Leading agrarian university (1898) with a vast Goloseevo campus — agronomy, biotech, veterinary, environmental economics.',
    'NUBiP combines a centuries-old agronomy school with modern biotech, food science, land management and veterinary medicine, plus English-language options in selected master''s programmes. Its forest-park campus is among the largest university green areas in Europe. Public; strong-to-average admission tier.',
    1898,
    18000,
    'public',
    'capital_or_large',
    'https://nubip.edu.ua/'
  ),
  -- ================= KYIV — average =================
  (
    'National Aviation University',
    'national-aviation-university-kyiv',
    'Kyiv',
    'Europe''s largest aviation university (1933) — aerospace engineering, air navigation, airport management in English.',
    'NAU trains engineers, air-traffic specialists and managers for global aviation, with long-established English-taught bachelor''s and master''s tracks that historically attracted thousands of international students. Campus includes its own training airfield. Public; average admission tier.',
    1933,
    13000,
    'public',
    'capital_or_large',
    'https://nau.edu.ua/en/'
  ),
  (
    'Kyiv National University of Construction and Architecture',
    'construction-architecture-kyiv',
    'Kyiv',
    'Specialist construction & architecture university (1930) with English-taught civil engineering.',
    'KNUCA (KISI) is Ukraine''s central school for structural engineering, urban planning and architecture, offering an established English-language civil-engineering programme alongside Ukrainian tracks. Compact campus near Lybidska metro. Public; average admission tier.',
    1930,
    6000,
    'public',
    'capital_or_large',
    'https://knuba.edu.ua/en'
  ),
  (
    'National University of Food Technologies',
    'food-technologies-kyiv',
    'Kyiv',
    'Applied food-science and technology university — processing, biotechnology, hospitality economics.',
    'NUFT consolidates Ukraine''s food-industry education: meat, dairy, grain, beverage technology plus packaging, restaurant business and applied microbiology, with industry internships built into every track. Public; average admission tier.',
    null,
    11000,
    'public',
    'capital_or_large',
    'https://nuft.edu.ua/en/'
  ),
  (
    'Kyiv National University of Technologies and Design',
    'technologies-design-kyiv',
    'Kyiv',
    'Fashion, light-industry technologies and design university (1930) — Ukraine''s leading design school.',
    'KNUTD is the reference institution for fashion design, textile technology, industrial design and service economics, hosting the country''s main fashion-education shows and labs. Practical portfolio-driven admission for design majors. Public; average admission tier.',
    1930,
    9000,
    'public',
    'capital_or_large',
    'https://knutd.edu.ua/'
  ),
  (
    'National Pedagogical Drahomanov University',
    'drahomanov-pedagogical-kyiv',
    'Kyiv',
    'Large teacher-training university (1920) — languages, history, psychology, special education.',
    'NPU named after Mykhailo Drahomanov is the national centre for teacher education, also strong in foreign philology, psychology and inclusive education. Broad intake with moderate entry scores and extensive evening/part-time formats. Public; average admission tier.',
    1920,
    15000,
    'public',
    'capital_or_large',
    'https://npu.edu.ua/'
  ),
  -- ================= KYIV — accessible =================
  (
    'Borys Grinchenko Kyiv Metropolitan University',
    'grinchenko-kyiv-university',
    'Kyiv',
    'City university of Kyiv (heritage 1817) — pedagogy, humanities, media and public administration.',
    'Grinchenko University operates under the Kyiv City Council, combining teacher-training traditions (tracing to the Galagan College of 1817) with modern journalism, design and public-management schools. Accessible admission with a solid city-funded infrastructure. Public; accessible admission tier.',
    1817,
    6000,
    'public',
    'capital_or_large',
    'https://kubg.edu.ua/en/'
  ),
  (
    'Kyiv International University',
    'kyiv-international-university',
    'Kyiv',
    'Private university (1994) whose International Faculty of Medicine teaches MD entirely in English.',
    'KIU offers law, international relations, journalism and pharmacy, and is best known internationally for its English-medium medical faculty serving students from India, Africa and the Middle East. Private; accessible admission tier.',
    1994,
    3500,
    'private',
    'capital_or_large',
    'https://kiu.com.ua/en/'
  ),
  (
    'Open International University of Human Development "Ukraine"',
    'university-ukraine-open',
    'Kyiv',
    'Large open-access private network university (1998) with branches nationwide and flexible study formats.',
    'University "Ukraine" was created to widen access to higher education, running dozens of regional branches with evening, distance and part-time pathways across law, economics, IT and humanities. Minimal entry barriers by design. Private; accessible admission tier.',
    1998,
    10000,
    'private',
    'capital_or_large',
    'https://openu.edu.ua/'
  ),
  -- ================= REGIONS =================
  (
    'Ivan Franko National University of Lviv',
    'ivan-franko-lviv-university',
    'Lviv',
    'Classical university of 1661 — Ukraine''s oldest, strong in humanities, physics and IT.',
    'Franko University is the oldest higher-education institution in Ukraine (imperial charter 1661) and one of its most decorated research centres, from mathematics and physics (home of the Banach space school) to journalism and international relations. Selective for its size, with growing English-taught offerings. Public; strong admission tier.',
    1661,
    12000,
    'public',
    'capital_or_large',
    'https://lnu.lviv.ua/en/'
  ),
  (
    'Odesa I. I. Mechnikov National University',
    'mechnikov-odesa-university',
    'Odesa',
    'Southern flagship classical university (1865) — biology, chemistry, philology and economics.',
    'Mechnikov University anchors higher education in Odesa with a rich natural-sciences tradition and active international partnerships. Moderate-to-selective admission depending on faculty, with several French-language dual-degree programmes unique in Ukraine. Public; strong-to-average admission tier.',
    1865,
    9000,
    'public',
    'capital_or_large',
    'https://onu.edu.ua/en'
  ),
  (
    'Odesa National Medical University',
    'odesa-national-medical-university',
    'Odesa',
    'One of Ukraine''s largest medical schools (1900) — English-medium General Medicine and Dentistry at scale.',
    'ONMedU has taught international students in English since the early 1990s and remains among the biggest destinations for foreign medical applicants in Eastern Europe, with dedicated English-language departments and clinical bases across Odesa hospitals. Public; strong admission tier.',
    1900,
    6000,
    'public',
    'capital_or_large',
    'https://odmu.edu.ua/index.php?lang=en'
  ),
  (
    'Oles Honchar Dnipro National University',
    'honchar-dnipro-university',
    'Dnipro',
    'Major Dnipro classical university (1918) — rocketry-linked physics, IT and international economics.',
    'DNU named after writer Oles Honchar leads education in Ukraine''s aerospace capital, feeding the nearby Yuzhmash and design-bureau ecosystem with physicists and engineers while maintaining strong philology and law faculties. Public; average-to-strong admission tier.',
    1918,
    8000,
    'public',
    'capital_or_large',
    'https://dnu.dp.ua/en'
  ),
  (
    'Uzhhorod National University',
    'uzhhorod-national-university',
    'Uzhhorod',
    'Transcarpathian university (1945) — popular English-medium General Medicine and Dentistry.',
    'UzhNu serves Ukraine''s westernmost region with growing international enrolment centred on its English-taught medical programmes, plus Slovak/Hungarian-border cross-border cooperation in economics and tourism. Public; average admission tier.',
    1945,
    10000,
    'public',
    'medium',
    'https://www.uzhnu.edu.ua/eng/'
  ),
  (
    'Yuriy Fedkovych Chernivtsi National University',
    'chernivtsi-national-university',
    'Chernivtsi',
    'Bukovinian university (1875) in a UNESCO-listed residence — English MD plus strong philology and mathematics.',
    'Chernivtsi University occupies one of Europe''s most beautiful campuses (the former Metropolitans'' residence) and offers English-language General Medicine and Dentistry alongside respected mathematics, philology and music faculties. Public; average-to-strong admission tier.',
    1875,
    9000,
    'public',
    'medium',
    'https://yu.edu.ua/en/'
  )
) as data(name, slug, city, short_description, description, founded_year,
          student_count, ownership_type, city_size, website_url)
where not exists (
  select 1 from universities u where u.name = data.name
);
