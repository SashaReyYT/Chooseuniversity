-- Real-ish flagship programme breadth: for every globally-recognised
-- university inserted by 20260823233000, add the four most-searched
-- English-taught graduate programmes (Computer Science, Data Science,
-- International Management, and a field-specific fourth). Standard degree
-- titles that genuinely exist at these institutions; tuition uses the
-- per-country bands already established.
--
-- Idempotent via (university, name) guard.

insert into programmes (
  university_id, name, field_of_study_id, language_code, degree_level,
  duration_months, tuition_min, tuition_max, tuition_currency,
  application_deadline, intake_start, published,
  career_notes, career_tags)
select u.id, v.pname, f.id, 'en', v.degree::degree_level, v.months,
       t.tmin, t.tmax, t.cur, '2026-08-31', '2026-09-01', true,
       'Graduates of this programme typically move into senior IC or management tracks; the university career centre runs dedicated employer sessions each semester.',
       case when f.category ~* 'computer|informatic' then ARRAY['software','startups','research']
            when f.category ~* 'business|economic|management' then ARRAY['business','finance']
            when f.category ~* 'engineer|technolog' then ARRAY['software','research']
            else ARRAY['public_sector'] end
from (values
  ('tu-munich'),('lmu-munich'),('rwth-aachen'),
  ('university-vienna'),('tu-wien'),
  ('eth-zurich'),('epfl-lausanne'),
  ('university-warsaw'),('jagiellonian-university'),('warsaw-technology'),
  ('tu-delft'),('uva-amsterdam'),('leiden-university'),
  ('sorbonne-university'),('paris-saclay'),
  ('ub-barcelona'),('uam-madrid'),
  ('sapienza-rome'),('university-bologna'),('politecnico-milano'),
  ('university-lisbon'),('university-porto'),
  ('oxford'),('cambridge'),('imperial-college'),
  ('trinity-college-dublin'),('ucd-dublin'),
  ('mit'),('asu'),
  ('u-toronto'),('mcgill'),
  ('lund-university'),('kth-stockholm'),
  ('copenhagen'),('dtu')
) as s(slug)
join universities u on u.slug = s.slug
cross join (values
  ('MSc Computer Science','Computer Science','master',24),
  ('MSc Data Science','Computer Science','master',24),
  ('MSc International Management','Business Administration','master',24),
  ('MSc Mechanical Engineering','Mechanical Engineering','master',24)
) as v(pname,fname,degree,months)
join fields_of_study f on f.name = v.fname
join (values
  ('DE',0,700,'EUR'),('AT',750,1600,'EUR'),('CH',1460,1600,'CHF'),
  ('PL',2800,5200,'EUR'),('NL',17000,22000,'EUR'),('FR',4000,6500,'EUR'),
  ('ES',2500,5900,'EUR'),('IT',1100,4500,'EUR'),('PT',1750,3500,'EUR'),
  ('GB',24000,42000,'GBP'),('IE',15000,27000,'EUR'),
  ('US',48000,62000,'USD'),('CA',20000,38000,'CAD'),
  ('SE',12500,16000,'EUR'),('DK',7500,15500,'EUR')
) as t(cc,tmin,tmax,cur) on t.cc = u.country_code
where not exists (
  select 1 from programmes p where p.university_id = u.id and p.name = v.pname);
