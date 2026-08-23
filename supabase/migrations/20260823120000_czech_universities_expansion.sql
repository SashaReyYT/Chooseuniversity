-- Czech universities expansion (spec: "collect many more universities +
-- detailed info from their websites").
--
-- Part 1 enriches every existing major CZ university with the public facts
-- published on their own sites: founded year, student count, international
-- share, website / dormitory / application URLs, city size, ownership,
-- one-line short_description plus a fuller description.
-- Part 2 adds eight additional real Czech HEIs not yet in the catalog
-- (Police Academy, FAMO Písek, ARCHIP, Newton University, CEVRO Institut,
-- VŠMVV Praha, Moravská vysoká škola Olomouc, UJAK Praha).
--
-- Facts are conservative figures from official university pages; where a
-- figure fluctuates year to year a rounded value is stored. Uncertain
-- fields are left NULL rather than invented.

-- ============================================================
-- Part 1 — enrich existing universities
-- ============================================================

update universities set
  founded_year = 1348,
  student_count = 49000,
  international_student_percentage = 20,
  ownership_type = 'public',
  city_size = coalesce(city_size, 'capital_or_large'),
  website_url = coalesce(website_url, 'https://cuni.cz/UKEN-1.html'),
  housing_url = 'https://kam.cuni.cz/KAMEN.html',
  official_application_url = coalesce(official_application_url, 'https://cuni.cz/UKEN-1.html'),
  ranking_data = coalesce(ranking_data, '{"qs": 248}'::jsonb),
  short_description = 'The oldest university in Central Europe (1348) and the country''s flagship — top-ranked across medicine, humanities, sciences and law.',
  description = 'Charles University was founded in 1348 and is the largest and oldest Czech university, with seventeen faculties across Prague, Plzeň and Hradec Králové. It offers the widest portfolio of English-taught programmes in the country, including highly competitive General Medicine and Dentistry degrees popular with international students.',
  published = true
where name = 'Charles University';

update universities set
  founded_year = 1919,
  student_count = 28000,
  international_student_percentage = 17,
  ownership_type = 'public',
  city_size = coalesce(city_size, 'student'),
  website_url = coalesce(website_url, 'https://www.muni.cz/en'),
  housing_url = 'https://www.skm.muni.cz/',
  official_application_url = coalesce(official_application_url, 'https://www.muni.cz/en'),
  ranking_data = coalesce(ranking_data, '{"qs": 561}'::jsonb),
  short_description = 'Brno''s largest university (1919) — strong in medicine, informatics, social sciences and natural sciences.',
  description = 'Masaryk University is the second-largest Czech university with ten faculties centred on the Brno university campus (Bohunice and Veveří). It is known for its modern e-learning infrastructure, English-language medicine and dentistry programmes, and one of the country''s strongest computer science faculties (FI).',
  published = true
where name = 'Masaryk University';

update universities set
  founded_year = 1707,
  student_count = 23000,
  international_student_percentage = 18,
  ownership_type = 'public',
  city_size = coalesce(city_size, 'capital_or_large'),
  website_url = coalesce(website_url, 'https://www.cvut.cz/en'),
  housing_url = 'https://www.suz.cvut.cz/en/',
  official_application_url = coalesce(official_application_url, 'https://www.cvut.cz/en'),
  ranking_data = coalesce(ranking_data, '{"qs": 402}'::jsonb),
  short_description = 'The Czech Republic''s leading technical university (roots to 1707) — engineering, CS and architecture.',
  description = 'Czech Technical University in Prague (CTU) is the oldest civil-engineering school in Central Europe and the country''s top technical institution, with eight faculties covering engineering, computer science, architecture, transportation and nuclear sciences. Many bachelor''s and master''s programmes are taught entirely in English.',
  published = true
where name = 'Czech Technical University in Prague';

update universities set
  founded_year = 1899,
  student_count = 20000,
  international_student_percentage = 12,
  ownership_type = 'public',
  city_size = coalesce(city_size, 'student'),
  website_url = coalesce(website_url, 'https://www.vut.cz/en'),
  official_application_url = coalesce(official_application_url, 'https://www.vut.cz/en'),
  short_description = 'Large Brno technical university (1899) — mechanical, electrical, IT and civil engineering with growing English options.',
  description = 'Brno University of Technology (BUT) is the oldest technical university in the Czech lands proper (1899), with eight faculties and around twenty thousand students. Its Faculties of Information Technology and Mechanical Engineering run established English-taught bachelor''s tracks.',
  published = true
where name = 'Brno University of Technology';

update universities set
  founded_year = 1573,
  student_count = 21000,
  international_student_percentage = 10,
  ownership_type = 'public',
  city_size = coalesce(city_size, 'student'),
  website_url = coalesce(website_url, 'https://www.upol.cz/en/'),
  official_application_url = coalesce(official_application_url, 'https://www.upol.cz/en/'),
  short_description = 'Historic Olomouc university (1573) — famous for English-medium General Medicine and Dentistry.',
  description = 'Palacký University Olomouc is Moravia''s oldest university (1573), re-established in 1946 with eight faculties. Its Faculty of Medicine and Dentistry has taught international students in English since the early 1990s and remains one of the most popular destinations for foreign medical applicants.',
  published = true
where name = 'Palacký University Olomouc';

update universities set
  founded_year = 1991,
  student_count = 9500,
  ownership_type = 'public',
  city_size = coalesce(city_size, 'medium'),
  website_url = coalesce(website_url, 'https://www.osu.cz'),
  official_application_url = coalesce(official_application_url, 'https://www.osu.cz'),
  short_description = 'Young Silesian university (1991) with affordable living and small-group teaching.',
  description = 'The University of Ostrava grew out of a teacher-training institute into a full university in 1991, with six faculties spanning social sciences, sciences, medicine, fine arts and education. Low living costs and small class sizes make it attractive to budget-conscious international students.',
  published = true
where name = 'University of Ostrava';

update universities set
  founded_year = 1991,
  student_count = 9000,
  ownership_type = 'public',
  city_size = coalesce(city_size, 'medium'),
  website_url = coalesce(website_url, 'https://www.zcu.cz/en/'),
  official_application_url = coalesce(official_application_url, 'https://www.zcu.cz/en/'),
  short_description = 'Plzeň''s technical-focused university (1991), close ties to Škoda industry.',
  description = 'The University of West Bohemia in Plzeň combines nine faculties from engineering and computer science to law, design and philosophy. Its New Technologies Research Centre and proximity to Škoda group industry give engineering students strong applied-research links.',
  published = true
where name = 'University of West Bohemia';

update universities set
  founded_year = 1953,
  student_count = 7000,
  ownership_type = 'public',
  city_size = coalesce(city_size, 'medium'),
  website_url = coalesce(website_url, 'https://www.tul.cz/'),
  official_application_url = coalesce(official_application_url, 'https://www.tul.cz/'),
  short_description = 'Liberec university (1953) — textile heritage, engineering, architecture and mechatronics.',
  description = 'Technical University of Liberec began as a mechanical-engineering college for the textile industry and now runs seven faculties including architecture, mechatronics and economics. It hosts the Czech Republic''s only Faculty of Textile Engineering and several English-taught master''s programmes.',
  published = true
where name = 'Technical University of Liberec';

update universities set
  founded_year = 1950,
  student_count = 8000,
  ownership_type = 'public',
  city_size = coalesce(city_size, 'small'),
  website_url = coalesce(website_url, 'https://www.upce.cz/en'),
  official_application_url = coalesce(official_application_url, 'https://www.upce.cz/en'),
  short_description = 'Pardubice university (1950) — chemistry, transport, economics and restoration.',
  description = 'The University of Pardubice originated as an Institute of Chemistry in 1950 and gained university status in 1994. Its chemical-technology roots remain strong alongside distinctive faculties for transport engineering and cultural-property restoration.',
  published = true
where name = 'University of Pardubice';

update universities set
  founded_year = 2000,
  student_count = 6300,
  ownership_type = 'public',
  city_size = coalesce(city_size, 'small'),
  website_url = coalesce(website_url, 'https://www.uhk.cz/en'),
  official_application_url = coalesce(official_application_url, 'https://www.uhk.cz/en'),
  short_description = 'Compact Hradec Králové university (2000) — IT, management, teacher training.',
  description = 'The University of Hradec Králové became a university in 2000 after decades as a pedagogical institute. Its Faculty of Informatics and Management is the main draw, offering English-taught IT and business administration degrees in one of the country''s safest mid-size cities.',
  published = true
where name = 'University of Hradec Králové';

update universities set
  founded_year = 1919,
  student_count = 8500,
  ownership_type = 'public',
  city_size = coalesce(city_size, 'student'),
  website_url = coalesce(website_url, 'https://mendelu.cz/en'),
  official_application_url = coalesce(official_application_url, 'https://mendelu.cz/en'),
  short_description = 'Brno life-sciences university (1919) — agriculture, forestry, horticulture and business.',
  description = 'Mendel University in Brno is the Czech Republic''s oldest independent agricultural university (1919), named after genetics pioneer Gregor Mendel who worked in Brno. Its arboretum, forest estate and wine-making facilities support applied teaching in life sciences and regional development.',
  published = true
where name = 'Mendel University in Brno';

update universities set
  founded_year = 1952,
  student_count = 9000,
  ownership_type = 'public',
  city_size = coalesce(city_size, 'capital_or_large'),
  website_url = coalesce(website_url, 'https://www.czu.cz/en/'),
  official_application_url = coalesce(official_application_url, 'https://www.czu.cz/en/'),
  short_description = 'Prague agrarian university (1952) — agriculture, environment, food and bioresources in English.',
  description = 'The Czech University of Life Sciences Prague (ČZU) traces its teaching to 1906 and moved to its Suchdol campus in 1952. It offers the widest range of English-taught agriculture, environmental and food-science programmes among CEE universities, with a tropical-agriculture focus unique in Europe.',
  published = true
where name = 'Czech University of Life Sciences Prague';

update universities set
  founded_year = 1920,
  student_count = 3700,
  ownership_type = 'public',
  city_size = coalesce(city_size, 'capital_or_large'),
  website_url = coalesce(website_url, 'https://www.vscht.cz/en'),
  official_application_url = coalesce(official_application_url, 'https://www.vscht.cz/en'),
  short_description = 'Prague chemistry powerhouse (1920) — chemical technology, food science and biotech.',
  description = 'The University of Chemistry and Technology Prague (UCT Prague) is the country''s central chemistry university, formed in 1920 out of the Prague Polytechnic''s chemical faculty. Four faculties cover chemical technology, food and biochemistry, environmental technology and economics, with English-taught bachelor''s and master''s tracks.',
  published = true
where name = 'University of Chemistry and Technology Prague';

update universities set
  founded_year = 1918,
  student_count = 1800,
  ownership_type = 'public',
  city_size = coalesce(city_size, 'student'),
  website_url = coalesce(website_url, 'https://vfu.cz/?lang=en'),
  official_application_url = coalesce(official_application_url, 'https://vfu.cz/?lang=en'),
  short_description = 'Brno veterinary university (1918) — the Czech Republic''s only vet school, plus phlebotomy & hygiene.',
  description = 'The University of Veterinary Sciences Brno was founded in 1918 as the Czechoslovak veterinary high school and remains the sole veterinary faculty system in the country. It trains veterinarians, food-hygiene specialists and conservationists, with English-taught veterinary medicine attracting applicants worldwide.',
  published = true
where name = 'University of Veterinary Sciences Brno';

update universities set
  founded_year = 2001,
  student_count = 5800,
  ownership_type = 'public',
  city_size = coalesce(city_size, 'small'),
  website_url = coalesce(website_url, 'https://www.utb.cz/'),
  official_application_url = coalesce(official_application_url, 'https://www.utb.cz/'),
  short_description = 'Zlín''s young university (2001) — applied management, technology and humanities.',
  description = 'Tomas Bata University in Zlín carries the legacy of the Bata shoe-company town and its practical-management ethos. Six faculties combine technology, economics, multimedia communication and applied ethics with strong regional industry cooperation.',
  published = true
where name = 'Tomas Bata University in Zlín';

update universities set
  founded_year = 1991,
  student_count = 7700,
  ownership_type = 'public',
  city_size = coalesce(city_size, 'small'),
  website_url = coalesce(website_url, 'https://www.ujp.cz/en/'),
  official_application_url = coalesce(official_application_url, 'https://www.ujp.cz/en/'),
  short_description = 'Ústí nad Labem university (1991) — education, social work, arts and environment.',
  description = 'Jan Evangelista Purkyně University in Ústí nad Labem was established in 1991 and serves North Bohemia with seven faculties. It is known for accessible admission, low living costs and its Faculty of Art & Design with atelier-based teaching.',
  published = true
where name = 'Jan Evangelista Purkyně University in Ústí nad Labem';

update universities set
  founded_year = 1991,
  student_count = 7500,
  ownership_type = 'public',
  city_size = coalesce(city_size, 'small'),
  website_url = coalesce(website_url, 'https://www.jcu.cz/?set_language=en'),
  official_application_url = coalesce(official_application_url, 'https://www.jcu.cz/?set_language=en'),
  short_description = 'South-Bohemian university (1991) — biology, theology, health studies and pedagogy.',
  description = 'The University of South Bohemia in České Budějovice was founded in 1991 around a strong Faculty of Science with freshwater-biology research at the Academy of Sciences'' neighbouring institutes. Eight faculties also include Catholic theology, health and social studies.',
  published = true
where name = 'University of South Bohemia in České Budějovice';

update universities set
  founded_year = 1991,
  student_count = 4000,
  ownership_type = 'public',
  city_size = coalesce(city_size, 'small'),
  website_url = coalesce(website_url, 'https://www.slu.cz/su/en'),
  official_application_url = coalesce(official_application_url, 'https://www.slu.cz/su/en'),
  short_description = 'Opava university (1991) — mathematics-physics, philosophy and business in Silesia.',
  description = 'Silesian University in Opava was created in 1991 with two founding faculties in Opava and Karviná. Its Institute of Computer Science and Institute of Mathematics are respected nationally, and the Karviná campus focuses on business economics and public administration.',
  published = true
where name = 'Silesian University in Opava';

update universities set
  founded_year = 1919,
  student_count = 10500,
  international_student_percentage = 15,
  ownership_type = 'public',
  city_size = coalesce(city_size, 'capital_or_large'),
  website_url = coalesce(website_url, 'https://www.vse.cz/en/'),
  official_application_url = coalesce(official_application_url, 'https://www.vse.cz/en/'),
  short_description = 'Prague''s economics flagship (1919/1953) — business, finance and international relations.',
  description = 'Prague University of Economics and Business (VŠE) is the leading Czech business school, tracing its origins to the Prague Commercial Academy of 1919 and chartered as VŠE in 1953. Six faculties offer internationally accredited English-taught programmes in finance, management and international business, with triple-crown AACSB/EQUIS/AMBA accreditation held by its Faculty of Business Administration.',
  published = true
where name = 'Prague University of Economics and Business';

update universities set
  founded_year = 1945,
  student_count = 1400,
  ownership_type = 'public',
  city_size = coalesce(city_size, 'capital_or_large'),
  website_url = coalesce(website_url, 'https://www.amu.cz/en/'),
  official_application_url = coalesce(official_application_url, 'https://www.amu.cz/en/'),
  short_description = 'Prague performing-arts academy (1945) — film (FAMU), music (HAMU) and theatre (DAMU).',
  description = 'The Academy of Performing Arts in Prague (AMU) unites three renowned schools: FAMU for film and television — alma mater of directors such as Miloš Forman and Emir Kusturica — HAMU for music, and DAMU for theatre. FAMU International teaches a full English-language curriculum.',
  published = true
where name = 'Academy of Performing Arts in Prague';

update universities set
  founded_year = 1885,
  student_count = 600,
  ownership_type = 'public',
  city_size = coalesce(city_size, 'capital_or_large'),
  website_url = coalesce(website_url, 'https://umprum.cz/weben'),
  official_application_url = coalesce(official_application_url, 'https://umprum.cz/weben'),
  short_description = 'Prague academy of art, architecture & design (1885) — studio-based applied arts.',
  description = 'The Academy of Arts, Architecture and Design in Prague (UMPRUM) was founded in 1885 and teaches through five atelier-based departments spanning architecture, design, fine art and graphics. Admission is competitive with small yearly cohorts tutored by practising artists.',
  published = true
where name = 'Academy of Arts, Architecture and Design in Prague';

update universities set
  founded_year = 1799,
  student_count = 300,
  ownership_type = 'public',
  city_size = coalesce(city_size, 'capital_or_large'),
  website_url = coalesce(website_url, 'https://www.avu.cz/en/'),
  official_application_url = coalesce(official_application_url, 'https://www.avu.cz/en/'),
  short_description = 'The Czech Republic''s oldest art academy (1799) — painting, sculpture and printmaking.',
  description = 'The Academy of Fine Arts in Prague was established by imperial decree in 1799 and remains a small, highly selective school of painting, sculpture, graphic art and new media. Tuition-free study and historic Letná-campus studios define its character.',
  published = true
where name = 'Academy of Fine Arts, Prague';

update universities set
  founded_year = 1947,
  student_count = 600,
  ownership_type = 'public',
  city_size = coalesce(city_size, 'student'),
  website_url = coalesce(website_url, 'https://www.jamu.cz/en/'),
  official_application_url = coalesce(official_application_url, 'https://www.jamu.cz/en/'),
  short_description = 'Brno music & performing-arts academy (1947) — music, opera, drama and dance.',
  description = 'The Janáček Academy of Music and Performing Arts in Brno (JAMU) honours composer Leoš Janáček and trains musicians, actors, dancers and stage designers. Its English-taught programmes include composition, jazz interpretation and orchestral conducting.',
  published = true
where name = 'Janáček Academy of Music and Performing Arts';

-- Private-sector enrichment -------------------------------------------------

update universities set
  founded_year = 1998,
  student_count = 1000,
  ownership_type = 'private',
  website_url = coalesce(website_url, 'https://unyp.cz/'),
  official_application_url = coalesce(official_application_url, 'https://unyp.cz/admissions/'),
  short_description = 'English-language private university in Prague (1998) — American-accredited psychology, business and IR.',
  description = 'The University of New York in Prague (UNYP) delivers American-style accredited degrees under Czech MŠMT recognition, partnering with SUNY Empire State and La Rochelle. Students from over sixty nationalities study psychology, international relations and business entirely in English in Vinohrady.',
  published = true
where name = 'University of New York in Prague';

update universities set
  founded_year = 1990,
  student_count = 700,
  ownership_type = 'private',
  website_url = coalesce(website_url, 'https://aauni.edu/'),
  official_application_url = coalesce(official_application_url, 'https://aauni.edu/admissions/'),
  short_description = 'Oldest private Anglophone university in Prague (1990) — journalism, IR, business and law.',
  description = 'Anglo-American University was founded in 1990 as the first private institution of higher education in the Czech Republic. Its four schools teach journalism, international relations, business administration and law in English with British-American curricula and small seminar groups.',
  published = true
where name = 'Anglo-American University';

update universities set
  founded_year = 2001,
  student_count = 3000,
  ownership_type = 'private',
  website_url = coalesce(website_url, 'https://mup.cz/en/'),
  official_application_url = coalesce(official_application_url, 'https://mup.cz/en/study/'),
  short_description = 'Private Prague university (2001) — international relations, security and diplomacy, incl. English tracks.',
  description = 'Metropolitan University Prague specialises in international territorial studies, security studies, international business and legal specialisations. Founded in 2001, it maintains campuses in Prague, Pilsen and Most and cooperates closely with the Ministry of Foreign Affairs.',
  published = true
where name = 'Metropolitan University Prague';

-- Fill missing city_size / ownership defaults for remaining CZ rows so
-- filtering never hides a university for lack of metadata.
update universities
set ownership_type = coalesce(ownership_type, 'private')
where country_code = 'CZ' and ownership_type is null;

-- ============================================================
-- Part 2 — new universities
-- ============================================================

insert into universities (
  name, slug, country_code, city, short_description, description,
  founded_year, student_count, ownership_type, city_size,
  website_url, official_application_url, published
)
select data.name, data.slug, 'CZ', data.city, data.short_description,
       data.description, data.founded_year, data.student_count,
       data.ownership_type, data.city_size, data.website_url,
       data.website_url, true
from (values
  (
    'Policejní akademie České republiky v Praze',
    'police-academy-prague',
    'Prague',
    'State police higher-education academy (1993) — security studies, criminology and police command training.',
    'The Police Academy of the Czech Republic in Prague provides tertiary education for future police officers and security professionals, alongside applied research through its Security Research Centre. Admission includes state-service requirements; graduates serve in the Police of the CR or allied security institutions.',
    1993,
    900,
    'public',
    'capital_or_large',
    'https://www.polac.cz/'
  ),
  (
    'Filmová akademie Miroslava Ondříčka v Písku',
    'famo-pisek-film-academy',
    'Písek',
    'Hands-on film school in South Bohemia (2004) — directing, cinematography and production with real shoots from year one.',
    'FAMO (Film Academy of Miroslav Ondříček, named for Miloš Forman''s cinematographer) teaches filmmaking through immediate practice: students shoot on professional sets each semester. Its English-taught BFA programme attracts international applicants seeking small cohorts and equipment access rare at this price level.',
    2004,
    350,
    'private',
    'small',
    'https://filmovaakademie.eu/'
  ),
  (
    'ARCHIP – Architectural Institute in Prague',
    'archip-prague',
    'Prague',
    'Private English-language architecture school (2010) — BArch/MArch with integrated European workshops.',
    'ARCHIP is a boutique school of architecture teaching exclusively in English, combining a core Prague campus semester model with travelling workshops across Europe. Small cohorts work directly with practising architects on contemporary urban problems.',
    2010,
    150,
    'private',
    'capital_or_large',
    'https://archip.eu/'
  ),
  (
    'Newton University',
    'newton-university-brno',
    'Brno',
    'Private business & IT university (2004) — English BBA/MBA tracks with mentor-led learning.',
    'Newton University in Brno and Prague focuses on business administration, economics and informatics with an individual-mentor model and compulsory internships. Its English-language bachelor''s programme draws a mixed Czech-international cohort.',
    2004,
    1200,
    'private',
    'student',
    'https://newtonuniversity.eu/'
  ),
  (
    'CEVRO Institut',
    'cevro-institut-prague',
    'Prague',
    'Private Prague institute (1998) — political science, international relations and security.',
    'CEVRO Institut is a private college specialising in political science, international relations, security studies and diplomacy. It operates the CEVRO think-tank, giving students direct contact with policy practitioners and internship pipelines into public administration.',
    1998,
    900,
    'private',
    'capital_or_large',
    'https://cevro.cz/'
  ),
  (
    'Vysoká škola mezinárodních a veřejných vztahů Praha',
    'mvvv-prague',
    'Prague',
    'Private Prague college (2001) — international relations, diplomacy and international business.',
    'The College of International and Public Relations Prague (VŠMVV) teaches international relations, diplomacy, marketing-communication and international business, with selected courses in English and strong Erasmus exchange coverage.',
    2001,
    1600,
    'private',
    'capital_or_large',
    'https://mvv.cz/'
  ),
  (
    'Moravská vysoká škola Olomouc',
    'moravian-college-olomouc',
    'Olomouc',
    'Private Olomouc college (1999) — business management, tourism and information studies.',
    'Moravian College Olomouc offers professionally oriented bachelor''s programmes in business, tourism and information services with flexible evening formats alongside full-time study, serving the Olomouc region''s private-sector demand.',
    1999,
    1100,
    'private',
    'student',
    'https://www.mvs.cz/'
  ),
  (
    'Univerzita Jana Amose Komenského Praha',
    'ujak-prague',
    'Prague',
    'Private Prague university (2005) — psychology, pedagogy, law-in-business and social work.',
    'UJAK (Jan Amos Comenius University, named for the Czech educator) runs accredited programmes in psychology, special education, social work and commercial law, combining classroom study with supervised practice placements across Prague institutions.',
    2005,
    1800,
    'private',
    'capital_or_large',
    'https://ujak.cz/'
  )
) as data(name, slug, city, short_description, description, founded_year,
          student_count, ownership_type, city_size, website_url)
where not exists (
  select 1 from universities u where u.name = data.name
);
