-- Bulk university expansion, part 2: Benelux/Iberia/Austria/Switzerland/
-- Nordics/Ireland/North America + the shared criteria-fill pipeline that
-- guarantees every inserted row gets documents, scholarships, requirements,
-- tags, living-cost estimates, accommodation and support resources, plus
-- two templated English programmes so each university is matchable.
--
-- Small states (CH/DK/NO/FI/IE and to a lesser degree AT/PT/SE) host fewer
-- HEIs than 30; their complete realistic inventory is included instead of
-- padding with fictional rows.

-- Ensure all referenced country codes exist
insert into countries (code, name)
values
  ('AT','Austria'),('CH','Switzerland'),('DE','Germany'),('DK','Denmark'),
  ('ES','Spain'),('FI','Finland'),('FR','France'),('GB','United Kingdom'),
  ('IE','Ireland'),('IT','Italy'),('NL','Netherlands'),('NO','Norway'),
  ('PT','Portugal'),('SE','Sweden')
on conflict (code) do nothing;

-- ============================================================
-- Universities — bulk insert
-- ============================================================
insert into universities (
  name, slug, country_code, city, founded_year, student_count,
  ownership_type, city_size, website_url, published)
select d.name, d.slug, d.cc, d.city, d.yr, d.students, d.own, d.csz,
       d.site, true
from (values
-- ---------- NETHERLANDS (30) ----------
('University of Groningen','rug-groningen','NL','Groningen',1618,36000,'public','medium','https://www.rug.nl/?lang=en'),
('Utrecht University','uu-utrecht','NL','Utrecht',1636,39000,'public','medium','https://www.uu.nl/en'),
('Eindhoven University of Technology','tue','NL','Eindhoven',1956,13000,'public','medium','https://www.tue.nl/en/'),
('University of Twente','utwente','NL','Enschede',1961,13000,'public','medium','https://www.utwente.nl/en/'),
('Wageningen University','wur','NL','Wageningen',1918,13000,'public','small','https://www.wur.nl/en.htm'),
('Erasmus University Rotterdam','eur-nl','NL','Rotterdam',1913,33000,'public','capital_or_large','https://www.eur.nl/en'),
('Vrije Universiteit Amsterdam','vu-amsterdam','NL','Amsterdam',1880,31000,'public','capital_or_large','https://www.vu.nl/en'),
('Radboud University','radboud','NL','Nijmegen',1923,24000,'public','medium','https://www.ru.nl/en'),
('Maastricht University','maastricht-university','NL','Maastricht',1976,22000,'public','medium','https://www.maastrichtuniversity.nl/'),
('Tilburg University','tilburg-university','NL','Tilburg',1927,20000,'public','small','https://www.tilburguniversity.edu/'),
('Saxion University of Applied Sciences','saxion','NL','Enschede',1998,27000,'public','medium','https://www.saxion.edu/'),
('Fontys University of Applied Sciences','fontys','NL','Eindhoven',1996,44000,'public','medium','https://fontys.edu/'),
('Hanze University of Applied Sciences','hanze','NL','Groningen',1986,28000,'public','medium','https://www.hanze.nl/en'),
('The Hague University of Applied Sciences','thuas','NL','The Hague',1987,21000,'public','capital_or_large','https://www.thehagueuniversity.com/'),
('Amsterdam University of Applied Sciences','hva','NL','Amsterdam',1993,43000,'public','capital_or_large','https://www.amsterdamuas.com/'),
('Rotterdam University of Applied Sciences','hr-rotterdam','NL','Rotterdam',1987,37000,'public','capital_or_large','https://www.rotterdamuas.com/'),
('HU University of Applied Sciences Utrecht','hu-utrecht','NL','Utrecht',1995,43000,'public','medium','https://www.hu.nl/en'),
('Avans University of Applied Sciences','avans','NL','Breda',2004,29000,'public','medium','https://www.avans.nl/en'),
('Windesheim University of Applied Sciences','windesheim','NL','Zwolle',1996,26000,'public','small','https://www.windesheim.com/'),
('NHL Stenden University of Applied Sciences','nhl-stenden','NL','Leeuwarden',2018,22000,'public','small','https://www.nhlstenden.com/'),
('Zuyd University of Applied Sciences','zuyd','NL','Maastricht',2003,19000,'public','medium','https://www.zuyd.nl/en'),
('HAN University of Applied Sciences','han','NL','Arnhem',1996,34000,'public','medium','https://www.han.nl/international/english/'),
('Inholland University of Applied Sciences','inholland','NL','Diemen',2002,32000,'public','small','https://www.inholland.com/'),
('ArtEZ University of the Arts','artez','NL','Arnhem',1949,4000,'public','medium','https://www.artez.nl/en'),
('Design Academy Eindhoven','dae','NL','Eindhoven',1947,1500,'public','medium','https://www.designacademy.nl/'),
('Hotelschool The Hague','hth','NL','The Hague',1929,2500,'public','capital_or_large','https://www.hotelschool.nl/en'),
('Nyenrode Business Universiteit','nyenrode','NL','Breukelen',1946,1500,'private','small','https://www.nyenrode.eu/en/'),
('Wittenborg University of Applied Sciences','wittenborg','NL','Apeldoorn',2001,2000,'private','small','https://www.wittenborg.eu/'),
('Tio University of Applied Sciences','tio','NL','Houten',1969,2000,'private','small','https://www.tio.nl/en/'),
('Van Hall Larenstein','vhl','NL','Velp',2003,3000,'public','small','https://www.vhluniversity.com/'),
-- ---------- PORTUGAL (30) ----------
('University of Coimbra','uc-coimbra','PT','Coimbra',1290,24000,'public','small','https://www.uc.pt/en'),
('NOVA University Lisbon','nova-lisbon','PT','Lisbon',1973,20000,'public','capital_or_large','https://www.unl.pt/en'),
('University of Minho','uminho','PT','Braga',1973,25000,'public','medium','https://www.uminho.pt/EN'),
('University of Aveiro','ua-pt','PT','Aveiro',1973,15000,'public','small','https://www.ua.pt/en/'),
('ISCTE – Lisbon University Institute','iscte','PT','Lisbon',1972,12000,'public','capital_or_large','https://www.iscte-iul.pt/en'),
('University of Évora','uevora','PT','Évora',1559,10000,'public','small','https://www.uevora.pt/en'),
('University of Beira Interior','ubi','PT','Covilhã',1979,8000,'public','small','https://www.ubi.pt/en'),
('University of Algarve','ualg','PT','Faro',1979,9000,'public','small','https://www.ualg.pt/en/'),
('UTAD – University of Trás-os-Montes e Alto Douro','utad','PT','Vila Real',1986,7000,'public','small','https://www.utad.pt/en/'),
('University of Madeira','uma-madeira','PT','Funchal',1988,5000,'public','small','https://www.uma.pt/'),
('University of the Azores','uac','PT','Ponta Delgada',1976,5000,'public','small','https://www.uac.pt/'),
('Universidade Aberta','uab-pt','PT','Lisbon',1988,12000,'public','capital_or_large','https://portal.uab.pt/en/'),
('Polytechnic Institute of Lisbon','ipl-lisboa','PT','Lisbon',1985,25000,'public','capital_or_large','https://www.ipl.pt/en/'),
('Polytechnic of Porto','ipp-porto','PT','Porto',1985,20000,'public','capital_or_large','https://www.ipp.pt/en/'),
('Polytechnic Institute of Setúbal','ips-setubal','PT','Setúbal',1979,8000,'public','capital_or_large','https://www.ips.pt/'),
('Polytechnic of Leiria','ipleiria','PT','Leiria',1985,13000,'public','small','https://www.ipleiria.pt/en/'),
('Polytechnic Institute of Guarda','ipg','PT','Guarda',1999,4000,'public','small','https://www.ipg.pt/'),
('Polytechnic University of Viseu','ipv-viseu','PT','Viseu',1985,7000,'public','small','https://www.ipv.pt/'),
('Polytechnic Institute of Tomar','ipt-tomar','PT','Tomar',1983,4000,'public','small','https://www.ipt.pt/en/'),
('Polytechnic Institute of Santarém','ipsantarém','PT','Santarém',1999,5000,'public','small','https://www.esa.ipsantarem.pt/'),
('Polytechnic Institute of Portalegre','ipp-portalegre','PT','Portalegre',1999,3000,'public','small','https://www.ipportalegre.pt/'),
('Polytechnic Institute of Castelo Branco','ipcb','PT','Castelo Branco',1985,4000,'public','small','https://www.ipcb.pt/'),
('Polytechnic Institute of Bragança','ipbraganca','PT','Bragança',1980,6000,'public','small','https://www.ipb.pt/index.html.en'),
('Lusófona University','lusofona','PT','Lisbon',1998,12000,'private','capital_or_large','https://www.ulusofona.pt/en'),
('Universidade Portucalense','uportu','PT','Porto',1986,6000,'private','capital_or_large','https://upt.pt/en/'),
('Universidade Católica Portuguesa','catolica','PT','Lisbon',1967,13000,'private','capital_or_large','https://www.ucp.pt/'),
('Lusíada University','lusada','PT','Lisbon',1991,9000,'private','capital_or_large','https://www.lis.ulusiada.pt/en-us/Home'),
('Universidade Atlântica','uatlantica','PT','Barcarena',1996,3000,'private','small','https://uatlantica.pt/en/'),
('Universidade Europeia','ueuropeia','PT','Lisbon',2007,9000,'private','capital_or_large','https://universidadeeuropeia.pt/en/'),
('IADE Creative University','iade','PT','Lisbon',1969,5000,'private','capital_or_large','https://www.iade.pt/en'),
-- ---------- AUSTRIA (30) ----------
('University of Graz','uni-graz','AT','Graz',1585,30000,'public','medium','https://www.uni-graz.at/en/'),
('Graz University of Technology','tu-graz','AT','Graz',1811,16000,'public','medium','https://www.tugraz.at/en/'),
('University of Leoben','montanuniversitaet','AT','Leoben',1840,4000,'public','small','https://www.unileoben.ac.at/en/'),
('University of Innsbruck','uibk','AT','Innsbruck',1669,28000,'public','small','https://www.uibk.ac.at/index.html.en'),
('Johannes Kepler University Linz','jku','AT','Linz',1966,24000,'public','capital_or_large','https://www.jku.at/en/'),
('University of Salzburg','plus-salzburg','AT','Salzburg',1622,14000,'public','small','https://www.plus.ac.at/?L=1'),
('University of Klagenfurt','aau-klagenfurt','AT','Klagenfurt',1970,10000,'public','small','https://www.aau.at/en/'),
('University of Natural Resources and Life Sciences Vienna','boku','AT','Vienna',1872,11000,'public','capital_or_large','https://boku.ac.at/en'),
('University of Veterinary Medicine Vienna','vetmeduni','AT','Vienna',1765,2300,'public','capital_or_large','https://www.vetmeduni.ac.at/en/'),
('Academy of Fine Arts Vienna','akbild','AT','Vienna',1692,1500,'public','capital_or_large','https://www.akbild.ac.at/Portal_EN/homepage?set_language=en'),
('University of Applied Arts Vienna','angewandte','AT','Vienna',1867,1800,'public','capital_or_large','https://www.dieangewandte.at/'),
('Mozarteum University Salzburg','mozarteum','AT','Salzburg',1841,1800,'public','small','https://www.moz.ac.at/en/'),
('mdw – University of Music and Performing Arts Vienna','mdw','AT','Vienna',1817,3000,'public','capital_or_large','https://www.mdw.ac.at/?PageId=1424&l=e'),
('Filmacademy Vienna','filmakademie-wien','AT','Vienna',1954,300,'public','capital_or_large',NULL),
('University for Continuing Education Krems','donau-uni-krems','AT','Krems an der Donau',1994,6000,'public','small','https://www.donau-uni.ac.at/en.html'),
('FH Campus Wien','fh-campus-wien','AT','Vienna',2001,8000,'public','capital_or_large','https://www.fh-campuswien.ac.at/en.html'),
('FH JOANNEUM Graz','fh-joanneum','AT','Graz',1995,5000,'public','medium','https://www.fh-joanneum.at/en/'),
('St. Pölten University of Applied Sciences','fh-stpoelten','AT','St. Pölten',1993,3500,'public','small','https://www.fhstp.ac.at/en'),
('University of Applied Sciences Upper Austria','fh-ooe','AT','Wels',1993,6000,'public','medium','https://www.fh-ooe.at/en/'),
('FH Technikum Wien','fh-technikum','AT','Vienna',1994,4500,'public','capital_or_large','https://www.technikum-wien.at/en/'),
('FH Salzburg','fh-salzburg','AT','Puch bei Salzburg',1995,3000,'public','small','https://www.fh-salzburg.ac.at/en/'),
('Vorarlberg University of Applied Sciences','fhv','AT','Dornbirn',1989,1500,'public','small','https://www.fhv.at/en/'),
('FH Kärnten','fh-kaernten','AT','Villach',1995,2200,'public','small','https://www.fh-kaernten.at/en'),
('IMC University of Applied Sciences Krems','imc-krems','AT','Krems an der Donau',1994,2500,'private','small','https://www.imc.ac.at/en/'),
('Lauder Business School','lbs-vienna','AT','Vienna',2003,600,'private','capital_or_large','https://lbs.edu.pl/en/lbs-vienna-austria/'),
('MODUL University Vienna','modul-vienna','AT','Vienna',2007,800,'private','capital_or_large','https://www.modul.ac.at/'),
('Webster Vienna Private University','webster-vienna','AT','Vienna',1981,600,'private','capital_or_large','https://webster.ac.at/'),
('Central European University','ceu-vienna','AT','Vienna',1991,1500,'private','capital_or_large','https://www.ceu.edu/'),
('Vienna University of Economics and Business','wu-wien','AT','Vienna',1898,22000,'public','capital_or_large','https://www.wu.ac.at/en/'),
('Medical University of Vienna','meduni-wien','AT','Vienna',1365,8000,'public','capital_or_large','https://www.meduniwien.ac.at/web/en/'),
-- ---------- SWITZERLAND (20) ----------
('University of Zurich','uzh','CH','Zurich',1833,28000,'public','capital_or_large','https://www.uzh.ch/en.html'),
('University of Geneva','unige','CH','Geneva',1559,17000,'public','capital_or_large','https://www.unige.ch/en/'),
('University of Bern','unibe','CH','Bern',1834,19000,'public','small','https://www.unibe.ch/index_eng.html'),
('University of Basel','unibas','CH','Basel',1460,13000,'public','small','https://www.unibas.ch/en.html'),
('University of Lausanne','unil','CH','Lausanne',1537,15000,'public','small','https://www.unil.ch/index_en.html'),
('University of Fribourg','unifr','CH','Fribourg',1889,10000,'public','small','https://www3.unifr.ch/home/en/'),
('University of Neuchâtel','unine','CH','Neuchâtel',1838,4000,'public','small','https://www.unine.ch/_home/w/Home_englisch'),
('University of Lucerne','unilu','CH','Lucerne',2000,1600,'public','small','https://www.unilu.ch/en/'),
('University of St. Gallen','unisg','CH','St. Gallen',1898,9000,'public','small','https://www.unisg.ch/en/'),
('USI Università della Svizzera italiana','usi-ch','CH','Lugano',1996,3000,'public','small','https://www.usi.ch/en'),
('ZHAW Zurich University of Applied Sciences','zhaw','CH','Winterthur',2007,13000,'public','small','https://www.zhaw.ch/en/university/'),
('Lucerne University of Applied Sciences','hslu','CH','Lucerne',2007,11000,'public','small','https://www.hslu.ch/en/lucerne-university-of-applied-sciences-and-arts/'),
('FHNW University of Applied Sciences Northwestern Switzerland','fhnw','CH','Brugg',2006,12000,'public','small','https://www.fhnw.ch/en/about-fhnw'),
('OST – Eastern Switzerland University of Applied Sciences','ost-ch','CH','Rapperswil',2020,5000,'public','small','https://www.ost.ch/en/'),
('Bern University of Applied Sciences','bfh','CH','Bern',1997,8000,'public','small','https://www.bfh.ch/en/'),
('SUPSI University of Applied Sciences Southern Switzerland','supsi','CH','Manno',1997,5000,'public','small','https://www.supsi.ch/home_en.html'),
('Kalaidos University of Applied Sciences','kalaidos','CH','Zurich',1997,3000,'private','capital_or_large','https://www.kalaidos-fh.ch/en'),
('Graduate Institute Geneva','iheid','CH','Geneva',1927,1000,'private','capital_or_large','https://graduateinstitute.ch/'),
('Franklin University Switzerland','franklin-ch','CH','Sorengo',1969,600,'private','small','https://www.fus.edu/'),
('Les Roches Global Hospitality','les-roches','CH','Crans-Montana',1954,2000,'private','small','https://lesroches.edu/')
,
-- ---------- SWEDEN (28 additional) ----------
('Stockholm University','su-se','SE','Stockholm',1878,31000,'public','capital_or_large','https://www.su.se/english/'),
('University of Gothenburg','gu-se','SE','Gothenburg',1891,37000,'public','capital_or_large','https://www.gu.se/en'),
('Uppsala University','uu-se','SE','Uppsala',1477,45000,'public','small','https://www.uu.se/en/'),
('Umeå University','umu','SE','Umeå',1965,31000,'public','small','https://www.umu.se/en/'),
('Linköping University','liu','SE','Linköping',1975,32000,'public','medium','https://liu.se/en'),
('Karlstad University','kau','SE','Karlstad',1999,12000,'public','small','https://www.kau.se/en'),
('Örebro University','oru','SE','Örebro',1999,15000,'public','small','https://www.oru.se/english/'),
('Mid Sweden University','miun','SE','Sundsvall',1993,11000,'public','small','https://www.miun.se/en/'),
('Malmö University','mau','SE','Malmö',1998,24000,'public','capital_or_large','https://mau.se/en/'),
('Linnaeus University','lnu-se','SE','Växjö',2010,31000,'public','small','https://lnu.se/en/'),
('Halmstad University','hh-se','SE','Halmstad',1983,8000,'public','small','https://www.hh.se/englishsite.html'),
('University of Skövde','his-se','SE','Skövde',1977,9000,'public','small','https://www.his.se/en/'),
('University of Gävle','hig','SE','Gävle',1977,16000,'public','small','https://www.hig.se/tmp/en/index.html'),
('Dalarna University','du-se','SE','Falun',1977,10000,'public','small','https://www.du.se/en/'),
('Blekinge Institute of Technology','bth','SE','Karlskrona',1989,7000,'public','small','https://www.bth.se/eng/'),
('Chalmers University of Technology','chalmers','SE','Gothenburg',1829,10000,'private','capital_or_large','https://www.chalmers.se/en/'),
('Luleå University of Technology','ltu','SE','Luleå',1971,15000,'public','small','https://www.ltu.se/?l=en'),
('Swedish University of Agricultural Sciences','slu','SE','Uppsala',1977,4000,'public','small','https://www.slu.se/en/'),
('Karolinska Institutet','ki-se','SE','Solna',1810,7000,'public','capital_or_large','https://ki.se/en'),
('Stockholm School of Economics','sse-se','SE','Stockholm',1909,1800,'private','capital_or_large','https://www.hhs.se/en/'),
('Jönköping University','ju-jonkoping','SE','Jönköping',1977,9000,'private','small','https://www.ju.se/en'),
('Mälardalen University','mdh-mdm','SE','Eskilstuna',1977,13000,'public','medium','https://www.mdu.se/en'),
('Södertörn University','sh-se','SE','Huddinge',1996,11000,'public','small','https://www.sh.se/english'),
('Konstfack University of Arts','konstfack','SE','Stockholm',1844,900,'public','capital_or_large','https://www.konstfack.se/en/'),
('Royal College of Music Stockholm','kmh','SE','Stockholm',1771,900,'public','capital_or_large','https://www.kmh.se/english'),
('University West','hv-west','SE','Trollhättan',1990,6000,'public','small','https://www.hv.se/en/'),
('Sophiahemmet University','sophiahemmet','SE','Stockholm',1889,600,'private','capital_or_large',NULL),
('Beckmans College of Design','beckmans','SE','Stockholm',1939,300,'private','capital_or_large','https://beckmans.se/en/'),
-- ---------- DENMARK (19) ----------
('Aarhus University','au-dk','DK','Aarhus',1928,33000,'public','capital_or_large','https://international.au.dk/'),
('University of Southern Denmark','sdu','DK','Odense',1966,25000,'public','capital_or_large','https://www.sdu.dk/en'),
('Aalborg University','aalborg-uni','DK','Aalborg',1974,19000,'public','medium','https://www.en.aau.dk/'),
('Roskilde University','ruc','DK','Roskilde',1972,8000,'public','small','https://ruc.dk/en'),
('IT University of Copenhagen','itu-dk','DK','Copenhagen',1999,2200,'public','capital_or_large','https://en.itu.dk/'),
('Copenhagen Business School','cbs','DK','Copenhagen',1917,20000,'public','capital_or_large','https://www.cbs.dk/en'),
('University College Copenhagen','ucl-cph-professionshojskole','DK','Copenhagen',2008,20000,'public','capital_or_large','https://ucc.dk/en'),
('VIA University College','via-dk','DK','Aarhus',2008,18000,'public','capital_or_large','https://en.via.dk/'),
('University College Copenhagen Metropolitan','metropol-dk','DK','Copenhagen',2008,15000,'public','capital_or_large','https://phmetropol.dk/en'),
('University College Absalon','absalon-dk','DK','Sorø',2008,7000,'public','small','https://www.phabsalon.dk/en/'),
('UCL University College Denmark','ucl-odense','DK','Odense',2008,12000,'public','capital_or_large','https://ucl.dk/international'),
('University College Lillebaelt','ucl-dk-lillebaelt','DK','Vejle',2008,8500,'public','small','https://www.ucl.dk/english'),
('University College Zealand','uc-zealand','DK','Roskilde',2008,9000,'public','small','https://uczealand.dk/international/'),
('UCN University College of Northern Denmark','ucn','DK','Aalborg',2008,9000,'public','medium','https://www.ucn.dk/english'),
('Royal Danish Academy','kadk-royal','DK','Copenhagen',1754,2000,'public','capital_or_large','https://royaldanishacademy.com/'),
('Design School Kolding','dskd','DK','Kolding',1967,700,'public','small','https://www.designskolenkolding.dk/en'),
('Aarhus School of Architecture','aaa-dk','DK','Aarhus',1965,800,'public','capital_or_large','https://aarch.dk/en/'),
('Danish National School of Performing Arts','snspa','DK','Copenhagen',2015,600,'public','capital_or_large','https://scenekunstskolen.dk/en'),
('Rhythmic Music Conservatory','rmc-dk','DK','Copenhagen',1986,300,'public','capital_or_large','https://rmc.dk/en'),
-- ---------- NORWAY (18) ----------
('University of Oslo','uio','NO','Oslo',1811,28000,'public','capital_or_large','https://www.uio.no/english/'),
('University of Bergen','uib-no','NO','Bergen',1946,18000,'public','capital_or_large','https://www.uib.no/en'),
('Norwegian University of Science and Technology','ntnu','NO','Trondheim',1760,42000,'public','medium','https://www.ntnu.edu/'),
('UiT The Arctic University of Norway','uit-tromso','NO','Tromsø',1968,16000,'public','medium','https://en.uit.no/'),
('University of Agder','uia-no','NO','Kristiansand',2007,12000,'public','medium','https://www.uia.no/en'),
('University of Stavanger','uis-no','NO','Stavanger',2005,12000,'public','medium','https://www.uis.no/en'),
('Oslo Metropolitan University','oslomet','NO','Oslo',2018,20000,'public','capital_or_large','https://www.oslomet.no/en'),
('Norwegian University of Life Sciences','nmbu','NO','Ås',1859,6000,'public','small','https://www.nmbu.no/en'),
('Western Norway University of Applied Sciences','hvl','NO','Bergen',2017,16000,'public','capital_or_large','https://www.hvl.no/en/'),
('Inland Norway University of Applied Sciences','inn-university','NO','Elverum',1994,13000,'public','small','https://inn.no/english'),
('Nord University','nord-no','NO','Bodø',2016,11000,'public','small','https://www.nord.no/en'),
('University of South-Eastern Norway','usn-no','NO','Bø i Telemark',2018,18000,'public','small','https://www.usn.no/english/'),
('Molde University College','himolde','NO','Molde',1994,2000,'public','small','https://www.himolde.no/english/'),
('Norwegian School of Economics','nhh','NO','Bergen',1936,3500,'public','capital_or_large','https://www.nhh.no/en/'),
('BI Norwegian Business School','bi-oslo','NO','Oslo',1943,20000,'private','capital_or_large','https://www.bi.edu/'),
('Kristiania University College','kristiania','NO','Oslo',1914,12000,'private','capital_or_large','https://kristiania.no/en/'),
('VID Specialized University','vid-no','NO','Oslo',2016,5000,'private','capital_or_large','https://www.vid.no/en/'),
('Oslo National Academy of the Arts','khio','NO','Oslo',1996,1500,'public','capital_or_large','https://khio.no/en')
,
-- ---------- FINLAND (24) ----------
('University of Helsinki','helsinki-fi','FI','Helsinki',1640,36000,'public','capital_or_large','https://www.helsinki.fi/en'),
('Aalto University','aalto','FI','Espoo',2010,17000,'public','medium','https://www.aalto.fi/en'),
('University of Turku','utu-fi','FI','Turku',1920,20000,'public','small','https://www.utu.fi/en'),
('Åbo Akademi University','abo-fi','FI','Turku',1918,5500,'public','small','https://www.abo.fi/en/'),
('Tampere University','tampere-fi','FI','Tampere',2019,21000,'public','small','https://www.tuni.fi/en'),
('University of Eastern Finland','uef','FI','Kuopio',2010,15000,'public','medium','https://www.uef.fi/en/'),
('University of Jyväskylä','jyu','FI','Jyväskylä',1934,14000,'public','small','https://www.jyu.fi/en'),
('University of Oulu','oulu-fi','FI','Oulu',1958,13000,'public','small','https://www.oulu.fi/en/'),
('University of Vaasa','vaasa-fi','FI','Vaasa',1968,5000,'public','small','https://www.univaasa.fi/en/'),
('Hanken School of Economics','hanken-fi','FI','Helsinki',1909,2300,'public','capital_or_large','https://www.hanken.fi/en'),
('LUT University','lut-fi','FI','Lappeenranta',1969,6500,'public','small','https://www.lut.fi/en'),
('University of Lapland','ulapland','FI','Rovaniemi',1979,4500,'public','small','https://www.ulapland.fi/EN'),
('University of the Arts Helsinki','uniarts','FI','Helsinki',2013,2000,'public','capital_or_large','https://www.uniarts.fi/en'),
('Metropolia University of Applied Sciences','metropolia','FI','Helsinki',2008,16500,'public','capital_or_large','https://www.metropolia.fi/en/'),
('Laurea University of Applied Sciences','laurea','FI','Vantaa',1991,10000,'public','small','https://www.laurea.fi/en/'),
('Haaga-Helia University of Applied Sciences','haaga-helia','FI','Helsinki',2007,10500,'public','capital_or_large','https://www.haaga-helia.fi/en'),
('Tampere University of Applied Sciences','tamk','FI','Tampere',1997,10000,'public','small','https://www.tuni.fi/en/tamk'),
('Turku University of Applied Sciences','turkuamk','FI','Turku',1992,9500,'public','small','https://www.turkuamk.fi/en/'),
('LAB University of Applied Sciences','lab-fi','FI','Lahti',2020,9000,'public','small','https://www.lab.fi/en/'),
('Oulu University of Applied Sciences','oamk','FI','Oulu',1996,8500,'public','small','https://www.oamk.fi/en/'),
('JAMK University of Applied Sciences','jamk','FI','Jyväskylä',1991,8500,'public','small','https://www.jamk.fi/en'),
('Satakunta University of Applied Sciences','samk','FI','Pori',1997,6000,'public','small','https://www.samk.fi/en/'),
('Arcada University of Applied Sciences','arcada','FI','Helsinki',1991,3000,'private','capital_or_large','https://www.arcada.fi/en'),
('Humak University of Applied Sciences','humak','FI','Helsinki',1998,2500,'private','capital_or_large','https://www.humak.fi/en/'),
-- ---------- IRELAND (14) ----------
('University of Galway','university-galway','IE','Galway',1845,19000,'public','medium','https://www.universityofgalway.ie/'),
('University College Cork','ucc','IE','Cork',1845,21000,'public','medium','https://www.ucc.ie/en/'),
('University of Limerick','ul-ie','IE','Limerick',1989,17000,'public','medium','https://www.ul.ie/'),
('Maynooth University','mu-ie','IE','Maynooth',1997,13000,'public','small','https://www.maynoothuniversity.ie/'),
('Dublin City University','dcu','IE','Dublin',1989,18000,'public','capital_or_large','https://www.dcu.ie/'),
('RCSI University of Medicine and Health Sciences','rcsi','IE','Dublin',1784,4000,'private','capital_or_large','https://www.rcsi.com/dublin/'),
('Technological University Dublin','tudublin','IE','Dublin',2019,28000,'public','capital_or_large','https://www.tudublin.ie/'),
('Atlantic Technological University','atu-ie','IE','Sligo',2022,21000,'public','small','https://www.atu.ie/'),
('Munster Technological University','mtu','IE','Cork',2021,18000,'public','medium','https://www.mtu.ie/'),
('South East Technological University','setu','IE','Waterford',2022,15000,'public','small','https://www.setu.ie/'),
('Griffith College Dublin','griffith-ie','IE','Dublin',1974,7000,'private','capital_or_large','https://www.griffith.ie/'),
('Dublin Business School','dbs-ie','IE','Dublin',1975,9000,'private','capital_or_large','https://www.dbs.ie/'),
('American College Dublin','acd','IE','Dublin',1993,700,'private','capital_or_large','https://americancollege.ie/'),
('National College of Ireland','nci-ie','IE','Dublin',1951,5000,'private','capital_or_large','https://www.ncirl.ie/')
,
-- ---------- UNITED STATES (28) ----------
('Harvard University','harvard','US','Cambridge',1636,25000,'private','small','https://www.harvard.edu/'),
('Stanford University','stanford','US','Stanford',1885,19000,'private','small','https://www.stanford.edu/'),
('UC Berkeley','berkeley','US','Berkeley',1868,45000,'public','small','https://www.berkeley.edu/'),
('UCLA','ucla','US','Los Angeles',1919,46000,'public','capital_or_large','https://www.ucla.edu/'),
('Yale University','yale','US','New Haven',1701,14000,'private','small','https://www.yale.edu/'),
('Princeton University','princeton','US','Princeton',1746,9000,'private','small','https://www.princeton.edu/'),
('Columbia University','columbia','US','New York',1754,33000,'private','capital_or_large','https://www.columbia.edu/'),
('University of Pennsylvania','upenn','US','Philadelphia',1740,28000,'private','capital_or_large','https://www.upenn.edu/'),
('University of Chicago','uchicago','US','Chicago',1890,22000,'private','capital_or_large','https://www.uchicago.edu/'),
('Duke University','duke','US','Durham',1838,17000,'private','small','https://duke.edu/'),
('Northwestern University','northwestern','US','Evanston',1851,22000,'private','small','https://www.northwestern.edu/'),
('University of Michigan','umich','US','Ann Arbor',1817,48000,'public','small','https://umich.edu/'),
('Georgia Institute of Technology','gatech','US','Atlanta',1885,44000,'public','capital_or_large','https://www.gatech.edu/'),
('University of Illinois Urbana-Champaign','illinois','US','Champaign',1867,56000,'public','small','https://illinois.edu/'),
('University of Washington','uw-seattle','US','Seattle',1861,52000,'public','capital_or_large','https://www.washington.edu/'),
('New York University','nyu','US','New York',1831,59000,'private','capital_or_large','https://www.nyu.edu/'),
('University of Southern California','usc','US','Los Angeles',1880,49000,'private','capital_or_large','https://www.usc.edu/'),
('University of Texas at Austin','utexas','US','Austin',1883,52000,'public','capital_or_large','https://www.utexas.edu/'),
('Ohio State University','osu','US','Columbus',1870,65000,'public','capital_or_large','https://www.osu.edu/'),
('Pennsylvania State University','psu','US','State College',1855,88000,'public','small','https://www.psu.edu/'),
('University of Florida','uf-florida','US','Gainesville',1853,55000,'public','medium','https://www.ufl.edu/'),
('UNC Chapel Hill','unc','US','Chapel Hill',1789,32000,'public','small','https://www.unc.edu/'),
('Boston University','bu-boston','US','Boston',1839,36000,'private','small','https://www.bu.edu/'),
('Northeastern University','northeastern','US','Boston',1898,30000,'private','small','https://www.northeastern.edu/'),
('Purdue University','purdue','US','West Lafayette',1869,50000,'public','small','https://www.purdue.edu/'),
('University of Wisconsin–Madison','wisc','US','Madison',1848,50000,'public','small','https://www.wisc.edu/'),
('Texas A&M University','tamu','US','College Station',1876,74000,'public','small','https://www.tamu.edu/'),
('University of Minnesota Twin Cities','umn','US','Minneapolis',1851,54000,'public','capital_or_large','https://twin-cities.umn.edu/'),
-- ---------- CANADA (28) ----------
('University of British Columbia','ubc','CA','Vancouver',1908,70000,'public','capital_or_large','https://www.ubc.ca/'),
('University of Waterloo','uwaterloo','CA','Waterloo',1957,42000,'public','small','https://uwaterloo.ca/'),
('University of Alberta','ualberta','CA','Edmonton',1908,44000,'public','capital_or_large','https://www.ualberta.ca/'),
('Université de Montréal','udem','CA','Montreal',1878,58000,'public','capital_or_large','https://www.umontreal.ca/en/'),
('McMaster University','mcmaster','CA','Hamilton',1887,37000,'public','small','https://www.mcmaster.ca/'),
('Queen''s University at Kingston','queens-ca','CA','Kingston',1841,30000,'public','small','https://www.queensu.ca/'),
('University of Calgary','ucalgary','CA','Calgary',1966,37000,'public','capital_or_large','https://www.ucalgary.ca/'),
('Western University','western-on','CA','London',1878,34000,'public','small','https://www.uwo.ca/'),
('University of Ottawa','uottawa','CA','Ottawa',1848,48000,'public','capital_or_large','https://www2.uottawa.ca/en'),
('Dalhousie University','dalhousie','CA','Halifax',1818,21000,'public','medium','https://www.dal.ca/'),
('Simon Fraser University','sfu','CA','Burnaby',1965,36000,'public','capital_or_large','https://www.sfu.ca/'),
('University of Victoria','uvic','CA','Victoria',1963,22000,'public','small','https://www.uvic.ca/'),
('University of Manitoba','umanitoba','CA','Winnipeg',1877,30000,'public','small','https://umanitoba.ca/'),
('University of Saskatchewan','usask','CA','Saskatoon',1907,31000,'public','small','https://www.usask.ca/'),
('Université Laval','ulaval','CA','Québec City',1663,43000,'public','small','https://www.ulaval.ca/en'),
('Université de Sherbrooke','usherbrooke','CA','Sherbrooke',1954,31000,'public','small','https://www.usherbrooke.ca/en'),
('Concordia University','concordia-ca','CA','Montreal',1974,46000,'public','capital_or_large','https://www.concordia.ca/'),
('York University','yorku','CA','Toronto',1959,55000,'public','capital_or_large','https://www.yorku.ca/'),
('University of Guelph','guelph','CA','Guelph',1964,30000,'public','small','https://www.uoguelph.ca/'),
('Carleton University','carleton','CA','Ottawa',1942,31000,'public','capital_or_large','https://carleton.ca/'),
('University of Windsor','uwindsor','CA','Windsor',1857,16000,'public','small','https://www.uwindsor.ca/'),
('University of New Brunswick','unb','CA','Fredericton',1785,10000,'public','small','https://www.unb.ca/'),
('Memorial University of Newfoundland','mun','CA','St. John''s',1925,18000,'public','small','https://www.mun.ca/'),
('University of Regina','uregina','CA','Regina',1974,16000,'public','small','https://www.uregina.ca/'),
('University of Winnipeg','uwinnipeg','CA','Winnipeg',1871,10000,'public','small','https://www.uwinnipeg.ca/'),
('Brock University','brock','CA','St. Catharines',1964,19000,'public','small','https://brocku.ca/'),
('Trent University','trent','CA','Peterborough',1964,9000,'public','small','https://www.trentu.ca/'),
('Toronto Metropolitan University','tmu','CA','Toronto',1948,45000,'public','capital_or_large','https://www.torontomu.ca/')
) as d(name,slug,cc,city,yr,students,own,csz,site)
where not exists (select 1 from universities u where u.name = d.name)
  and not exists (select 1 from universities u2 where u2.slug = d.slug);

-- ============================================================
-- Template English programmes for every university without any
-- ============================================================
insert into programmes (
  university_id, name, field_of_study_id, language_code, degree_level,
  duration_months, tuition_min, tuition_max, tuition_currency,
  application_deadline, intake_start, published)
select u.id, v.pname, f.id, 'en', v.degree::degree_level, v.months,
       t.tmin, t.tmax, t.cur, '2026-08-31', '2026-09-01', true
from universities u
cross join fields_of_study f
join (values
  ('BSc Computer Science','Computer Science','bachelor',36),
  ('MSc International Business','Business Administration','master',24)
) as v(pname,fname,degree,months) on true
join (values
  ('UA',2000,5000,'USD'),('DE',0,700,'EUR'),('AT',750,1600,'EUR'),
  ('CH',1460,1600,'CHF'),('PL',2200,4200,'EUR'),('NL',11000,17000,'EUR'),
  ('FR',2950,6000,'EUR'),('ES',1300,5500,'EUR'),('IT',1000,4500,'EUR'),
  ('PT',1500,3500,'EUR'),('GB',18000,38000,'GBP'),('IE',14000,26000,'EUR'),
  ('US',30000,40000,'USD'),('CA',18000,34000,'CAD'),('SE',12000,15500,'EUR'),
  ('DK',6500,15500,'EUR'),('FI',9000,16000,'EUR'),('NO',12500,23000,'EUR'),
  ('CZ',2500,4500,'EUR')
) as t(cc,tmin,tmax,cur) on t.cc = u.country_code
where f.name = v.fname
  and not exists (select 1 from programmes p where p.university_id = u.id);

-- ============================================================
-- Shared criteria fills over everything inserted above
-- ============================================================

-- Basics ------------------------------------------------------------------
update programmes p set
  study_mode = coalesce(p.study_mode,'full_time'),
  required_documents = case u.country_code
    when 'US' then ARRAY['Passport copy','High-school transcript','SAT/ACT optional','TOEFL/IELTS score','Financial support statement']
    when 'CA' then ARRAY['Passport copy','High-school transcript','IELTS/TOEFL score','Proof of funds']
    when 'GB' then ARRAY['Passport copy','Secondary certificate or equivalents','Personal statement','Academic reference','IELTS UKVI where required']
    else ARRAY['Passport copy','Secondary school certificate with transcript','Recognition of prior education where applicable','English proficiency certificate','Motivation letter / CV']
    end,
  scholarship_notes = case
    when u.country_code in ('DE','AT','NO') then 'Little to no tuition even for non-EU students (semester contributions); DAAD/OeAD and national stipends add living-cost support.'
    when u.country_code = 'CH' then 'Exceptionally low tuition for elite education; Swiss Government Excellence Scholarships fund selected candidates.'
    when u.country_code in ('SE','DK','FI') then 'Non-EU tuition applies; national institutes and universities run annual fee-waiver scholarships.'
    when u.country_code = 'NL' then 'Statutory non-EU fees; Holland Scholarship (€5k year one) plus institutional grants.'
    when u.country_code = 'FR' then 'Differentiated non-EU fees (~€3–4k); Eiffel and campus-specific excellence scholarships widely available.'
    when u.country_code in ('GB','IE') then 'Chevening/Commonwealth and Government-of-Ireland awards; most undergraduate funding is institutional merit.'
    when u.country_code in ('US','CA') then 'Merit/need-based aid varies sharply: elite privates are need-blind or near-it, publics rely on merit scholarships.'
    else 'Self-funded model with Erasmus+ mobility windows and departmental assistantships at master''s level.'
    end
from universities u
where p.university_id = u.id
  and (p.required_documents = '{}' or p.scholarship_notes is null);

-- Career tags & notes ------------------------------------------------------
update programmes p set
  career_notes = case
    when f.category ~* 'engineer|technolog|informatic|computer|software' then 'Graduates work as software engineers, data analysts and systems architects across global tech hubs.'
    when f.category ~* 'business|economic|management|finance|commerce' then 'Careers in banking, consulting, FMCG management, fintech and entrepreneurship.'
    when f.category ~* 'medic|health|pharm' then 'Degree opens licensing routes (USMLE/PLAB/Approbation) and residency worldwide.'
    when f.category ~* 'social|law|education|humanit|journalis|international' then 'Public sector, NGOs, diplomacy and media; IOs recruit via graduate schemes.'
    when f.category ~* 'science|natural|biolog|chem|physic|math' then 'R&D institutes, industry labs and doctoral pathways with early publication opportunities.'
    else 'Programme-specific career guidance via the faculty career centre.'
    end,
  career_tags = case
    when f.category ~* 'engineer|technolog|informatic|computer|software' then ARRAY['software','startups','research']
    when f.category ~* 'business|economic|management|finance|commerce' then ARRAY['business','finance']
    when f.category ~* 'medic|health|pharm' then ARRAY['medicine']
    when f.category ~* 'social|law|education|humanit|journalis|international' then ARRAY['public_sector']
    when f.category ~* 'science|natural|biolog|chem|physic|math' then ARRAY['research','academia']
    else p.career_tags end
from universities u, fields_of_study f
where f.id = p.field_of_study_id
  and p.university_id = u.id
  and (p.career_tags is null or p.career_tags='{}' or p.career_notes is null);

-- Neutral lifestyle default for cities without a curated band --------------
update programmes p set
  lifestyle_tags = ARRAY['student_city','affordable','international_community']
from universities u
where p.university_id = u.id
  and (p.lifestyle_tags is null or p.lifestyle_tags='{}');

-- Academic requirements ----------------------------------------------------
insert into programme_academic_requirements (
  programme_id, entrance_exam_required, required_degree_level,
  required_math_background, notes)
select distinct on (p.id)
  p.id, false, p.degree_level,
  case when f.category ~* 'engineer|technolog|informatic|computer|math|physic|chem|science'
       then 'average'::math_background end,
  'Derived defaults: admission on documents; mathematics expectation only for technical fields.'
from programmes p
join fields_of_study f on f.id = p.field_of_study_id
where not exists (
  select 1 from programme_academic_requirements r where r.programme_id = p.id);

-- IELTS for English programmes --------------------------------------------
insert into programme_test_requirements (
  programme_id, qualification_id, minimum_score,
  minimum_score_display, comparison)
select p.id, q.id, 6.5, '6.5', 'greater_or_equal'
from programmes p
join qualifications q on q.code = 'ielts'
where p.language_code = 'en'
  and not exists (select 1 from programme_test_requirements t where t.programme_id = p.id);

-- Country-band living costs for every programme still lacking them --------
insert into programme_living_cost_estimates (
  programme_id, currency,
  accommodation_min, accommodation_max, food_min, food_max,
  transport_min, transport_max, utilities_min, utilities_max,
  internet_phone_min, internet_phone_max,
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
  ('CZ',550,850),('UA',400,700),('DE',850,1200),('AT',900,1250),
  ('CH',1600,2300),('PL',550,850),('NL',1050,1550),('FR',950,1400),
  ('ES',800,1200),('IT',800,1200),('PT',700,1000),('GB',1150,1700),
  ('IE',1150,1650),('US',1300,2000),('CA',1000,1500),('SE',950,1400),
  ('DK',950,1400),('FI',900,1350),('NO',1000,1500)
) as b(cc,tmin,tmax) on b.cc = u.country_code
where not exists (
  select 1 from programme_living_cost_estimates e where e.programme_id = p.id);

-- Country-band accommodation ----------------------------------------------
insert into university_accommodation (
  university_id, dormitory_available, dormitory_name,
  estimated_monthly_cost_min, estimated_monthly_cost_max, currency,
  estimated_deposit, distance_from_campus_km, source_name, source_date)
select u.id, true, u.name || ' student housing',
  round(b.lo), round(b.hi), 'EUR', round(b.hi), 3,
  'Unikchoose internal estimate', current_date
from universities u
join (values
  ('CZ',220,420),('UA',150,320),('DE',350,650),('AT',380,600),
  ('CH',600,1100),('PL',200,400),('NL',400,800),('FR',400,750),
  ('ES',350,650),('IT',350,650),('PT',300,550),('GB',500,950),
  ('IE',500,900),('US',550,1000),('CA',450,800),('SE',400,700),
  ('DK',400,720),('FI',380,680),('NO',450,750)
) as b(cc,lo,hi) on b.cc = u.country_code
where not exists (
  select 1 from university_accommodation a where a.university_id = u.id);

-- Support resources --------------------------------------------------------
insert into university_resources (university_id, category, title, link_title, link_url, description)
select u.id, 'international_office', 'International Office',
       'International admissions & support', coalesce(u.website_url,''), NULL
from universities u
where not exists (
  select 1 from university_resources r
  where r.university_id = u.id and r.category = 'international_office');

insert into university_resources (university_id, category, title, link_title, link_url, description)
select u.id, 'erasmus', 'Erasmus+', 'Erasmus+ exchanges', u.website_url,
  'Participates in Erasmus+ credit-mobility exchanges across Europe.'
from universities u
where u.ownership_type = 'public'
  and u.country_code in ('AT','CH','CZ','DE','DK','ES','FI','FR','GB','IE','IT','NL','NO','PL','PT','SE','UA')
  and not exists (
    select 1 from university_resources r
    where r.university_id = u.id and r.category = 'erasmus');
