-- Unifind — seed data
--
-- Two parts:
--  1. Reference data (countries, languages, fields of study) — a working
--     starter set, not exhaustive. Extend as real programme data needs
--     more entries.
--  2. A small, clearly-labeled sample catalog (3 universities, 6
--     programmes with full requirement rows) so the matching engine
--     (next stage) and UI work have real, structured rows to run against
--     instead of hand-mocked fixtures. Delete or replace before any real
--     launch.

-- 1. Reference data ---------------------------------------------------

insert into countries (code, name) values
  ('NL', 'Netherlands'),
  ('DE', 'Germany'),
  ('CZ', 'Czech Republic'),
  ('GB', 'United Kingdom'),
  ('IE', 'Ireland'),
  ('FR', 'France'),
  ('ES', 'Spain'),
  ('IT', 'Italy'),
  ('PT', 'Portugal'),
  ('PL', 'Poland'),
  ('AT', 'Austria'),
  ('CH', 'Switzerland'),
  ('SE', 'Sweden'),
  ('DK', 'Denmark'),
  ('FI', 'Finland'),
  ('US', 'United States'),
  ('CA', 'Canada'),
  ('UA', 'Ukraine');

insert into languages (code, name) values
  ('en', 'English'),
  ('de', 'German'),
  ('nl', 'Dutch'),
  ('fr', 'French'),
  ('es', 'Spanish'),
  ('it', 'Italian'),
  ('pt', 'Portuguese'),
  ('cs', 'Czech'),
  ('pl', 'Polish'),
  ('uk', 'Ukrainian');

insert into fields_of_study (name, category) values
  ('Computer Science', 'Engineering & Technology'),
  ('Data Science', 'Engineering & Technology'),
  ('Mechanical Engineering', 'Engineering & Technology'),
  ('Electrical Engineering', 'Engineering & Technology'),
  ('Business Administration', 'Business & Economics'),
  ('Economics', 'Business & Economics'),
  ('International Relations', 'Social Sciences'),
  ('Psychology', 'Social Sciences'),
  ('Medicine', 'Health Sciences'),
  ('Biology', 'Natural Sciences'),
  ('Physics', 'Natural Sciences'),
  ('Architecture', 'Arts & Design'),
  ('Graphic Design', 'Arts & Design'),
  ('Law', 'Law');

-- 2. Sample catalog -----------------------------------------------------
-- SAMPLE DATA — for development/testing only.

do $$
declare
  v_charles_university uuid;
  v_tu_delft uuid;
  v_university_college_dublin uuid;

  v_cs uuid;
  v_data_science uuid;
  v_business uuid;
  v_mech_eng uuid;

  v_prog uuid;
begin
  select id into v_cs from fields_of_study where name = 'Computer Science';
  select id into v_data_science from fields_of_study where name = 'Data Science';
  select id into v_business from fields_of_study where name = 'Business Administration';
  select id into v_mech_eng from fields_of_study where name = 'Mechanical Engineering';

  -- Universities ---------------------------------------------------

  insert into universities (name, country_code, city, website_url, description, founded_year)
  values ('Charles University', 'CZ', 'Prague', 'https://cuni.cz', 'One of the oldest universities in Central Europe, founded in 1348.', 1348)
  returning id into v_charles_university;

  insert into universities (name, country_code, city, website_url, description, founded_year)
  values ('TU Delft', 'NL', 'Delft', 'https://tudelft.nl', 'A leading technical university known for engineering and design.', 1842)
  returning id into v_tu_delft;

  insert into universities (name, country_code, city, website_url, description, founded_year)
  values ('University College Dublin', 'IE', 'Dublin', 'https://ucd.ie', 'Ireland''s largest university, strong in business and sciences.', 1854)
  returning id into v_university_college_dublin;

  -- Programmes at Charles University --------------------------------

  insert into programmes (
    university_id, name, degree_level, field_of_study_id, language_code,
    duration_months, tuition_fee_amount, tuition_fee_currency, tuition_fee_period,
    estimated_living_cost_monthly, living_cost_currency,
    application_deadline, intake_start, description
  ) values (
    v_charles_university, 'Computer Science & Information Technology', 'bachelor', v_cs, 'en',
    36, 12000, 'EUR', 'per_year',
    700, 'EUR',
    '2027-03-15', '2027-09-01', 'A broad computer science programme covering algorithms, systems, and software engineering.'
  ) returning id into v_prog;

  insert into programme_academic_requirements (programme_id, min_gpa, gpa_scale, required_subjects, entrance_exam_required, entrance_exam_notes)
  values (v_prog, 3.0, 4.0, array['Mathematics'], true, 'Entrance test in mathematics and logical reasoning.');

  insert into programme_language_requirements (programme_id, test_type, min_score, min_score_display)
  values
    (v_prog, 'IELTS', 6.0, '6.0'),
    (v_prog, 'TOEFL', 80, '80');

  -- Programmes at TU Delft --------------------------------------------

  insert into programmes (
    university_id, name, degree_level, field_of_study_id, language_code,
    duration_months, tuition_fee_amount, tuition_fee_currency, tuition_fee_period,
    estimated_living_cost_monthly, living_cost_currency,
    application_deadline, intake_start, description
  ) values (
    v_tu_delft, 'MSc Computer Science', 'master', v_cs, 'en',
    24, 18500, 'EUR', 'per_year',
    1100, 'EUR',
    '2027-01-15', '2027-09-01', 'Research-oriented master''s with tracks in AI, software technology, and cybersecurity.'
  ) returning id into v_prog;

  insert into programme_academic_requirements (programme_id, min_gpa, gpa_scale, required_subjects, entrance_exam_required)
  values (v_prog, 3.2, 4.0, array['Mathematics', 'Computer Science'], false);

  insert into programme_language_requirements (programme_id, test_type, min_score, min_score_display)
  values (v_prog, 'IELTS', 6.5, '6.5');

  insert into programmes (
    university_id, name, degree_level, field_of_study_id, language_code,
    duration_months, tuition_fee_amount, tuition_fee_currency, tuition_fee_period,
    estimated_living_cost_monthly, living_cost_currency,
    application_deadline, intake_start, description
  ) values (
    v_tu_delft, 'MSc Data Science & Technology', 'master', v_data_science, 'en',
    24, 18500, 'EUR', 'per_year',
    1100, 'EUR',
    '2027-01-15', '2027-09-01', 'Applied statistics, machine learning, and large-scale data systems.'
  ) returning id into v_prog;

  insert into programme_academic_requirements (programme_id, min_gpa, gpa_scale, required_subjects, entrance_exam_required)
  values (v_prog, 3.2, 4.0, array['Mathematics', 'Statistics'], false);

  insert into programme_language_requirements (programme_id, test_type, min_score, min_score_display)
  values (v_prog, 'IELTS', 6.5, '6.5');

  insert into programmes (
    university_id, name, degree_level, field_of_study_id, language_code,
    duration_months, tuition_fee_amount, tuition_fee_currency, tuition_fee_period,
    estimated_living_cost_monthly, living_cost_currency,
    application_deadline, intake_start, description
  ) values (
    v_tu_delft, 'BSc Mechanical Engineering', 'bachelor', v_mech_eng, 'nl',
    36, 2600, 'EUR', 'per_year',
    1100, 'EUR',
    '2027-05-01', '2027-09-01', 'Dutch-taught bachelor''s covering mechanics, materials, and design.'
  ) returning id into v_prog;

  insert into programme_academic_requirements (programme_id, min_gpa, gpa_scale, required_subjects, entrance_exam_required)
  values (v_prog, 2.8, 4.0, array['Mathematics', 'Physics'], false);

  insert into programme_language_requirements (programme_id, test_type, min_score, min_score_display)
  values (v_prog, 'CNaVT', 3, 'Profiel Educatief Startbekwaam');

  -- Programmes at University College Dublin ----------------------------

  insert into programmes (
    university_id, name, degree_level, field_of_study_id, language_code,
    duration_months, tuition_fee_amount, tuition_fee_currency, tuition_fee_period,
    estimated_living_cost_monthly, living_cost_currency,
    application_deadline, intake_start, description
  ) values (
    v_university_college_dublin, 'BSc Business & Analytics', 'bachelor', v_business, 'en',
    36, 22000, 'EUR', 'per_year',
    1300, 'EUR',
    '2027-02-01', '2027-09-01', 'Core business fundamentals with a data analytics specialization.'
  ) returning id into v_prog;

  insert into programme_academic_requirements (programme_id, min_gpa, gpa_scale, required_subjects, entrance_exam_required)
  values (v_prog, 3.0, 4.0, array['Mathematics'], false);

  insert into programme_language_requirements (programme_id, test_type, min_score, min_score_display)
  values (v_prog, 'IELTS', 6.5, '6.5');

  insert into programmes (
    university_id, name, degree_level, field_of_study_id, language_code,
    duration_months, tuition_fee_amount, tuition_fee_currency, tuition_fee_period,
    estimated_living_cost_monthly, living_cost_currency,
    application_deadline, intake_start, description
  ) values (
    v_university_college_dublin, 'MSc Computer Science (Conversion)', 'master', v_cs, 'en',
    12, 25000, 'EUR', 'per_year',
    1300, 'EUR',
    '2027-06-01', '2027-09-01', 'One-year conversion master''s for graduates of non-CS bachelor''s degrees.'
  ) returning id into v_prog;

  insert into programme_academic_requirements (programme_id, min_gpa, gpa_scale, required_subjects, entrance_exam_required, entrance_exam_notes)
  values (v_prog, 2.8, 4.0, array[]::text[], false, 'No prior CS background required — designed as a conversion course.');

  insert into programme_language_requirements (programme_id, test_type, min_score, min_score_display)
  values (v_prog, 'IELTS', 6.5, '6.5');
end $$;
