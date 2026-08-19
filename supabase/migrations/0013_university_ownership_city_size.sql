-- Unifind — Location Fit v2: university ownership + city-size classification
-- Implements P1#7: port the data-backed half of the legacy location scorer
-- (see TRANSFER_NOTES.md): public-vs-private is a verifiable fact (Czech
-- public universities are a defined legal category); city-size classification
-- uses actual 2024 population figures (Czech Statistical Office).
-- Both columns are idempotent (`if not exists`) because a previous manual
-- migration already added `universities.ownership_type` to the live DB
-- without a repo migration file.

-- ============================================================
-- §1 University ownership (public/private)
-- ============================================================

alter table universities
  add column if not exists ownership_type text
    check (ownership_type in ('public', 'private'));

comment on column universities.ownership_type is
  'Legal ownership form: public (state-funded) or private. Public-vs-private status is a verifiable legal fact, unlike the legacy city-size stubs.';

-- Seed for fresh installs; the live DB already has this data, so the
-- guard makes this a no-op there.
with src as (
  select * from jsonb_to_recordset($seed$[
    {"name":"Charles University","ownership_type":"public"},
    {"name":"Czech Technical University in Prague","ownership_type":"public"},
    {"name":"Masaryk University","ownership_type":"public"},
    {"name":"Prague University of Economics and Business","ownership_type":"public"},
    {"name":"Palacký University Olomouc","ownership_type":"public"},
    {"name":"Brno University of Technology","ownership_type":"public"},
    {"name":"Czech University of Life Sciences Prague","ownership_type":"public"},
    {"name":"Mendel University in Brno","ownership_type":"public"},
    {"name":"VŠB – Technical University of Ostrava","ownership_type":"public"},
    {"name":"University of Chemistry and Technology Prague","ownership_type":"public"},
    {"name":"University of Veterinary Sciences Brno","ownership_type":"public"},
    {"name":"Academy of Performing Arts in Prague","ownership_type":"public"},
    {"name":"Academy of Fine Arts, Prague","ownership_type":"public"},
    {"name":"Academy of Arts, Architecture and Design in Prague","ownership_type":"public"},
    {"name":"Janáček Academy of Music and Performing Arts","ownership_type":"public"},
    {"name":"Technical University of Liberec","ownership_type":"public"},
    {"name":"Tomas Bata University in Zlín","ownership_type":"public"},
    {"name":"University of West Bohemia","ownership_type":"public"},
    {"name":"University of South Bohemia in České Budějovice","ownership_type":"public"},
    {"name":"University of Ostrava","ownership_type":"public"},
    {"name":"University of Hradec Králové","ownership_type":"public"},
    {"name":"University of Pardubice","ownership_type":"public"},
    {"name":"University of Defence","ownership_type":"public"},
    {"name":"Jan Evangelista Purkyně University in Ústí nad Labem","ownership_type":"public"},
    {"name":"Silesian University in Opava","ownership_type":"public"},
    {"name":"College of Polytechnics Jihlava","ownership_type":"public"},
    {"name":"Institute of Technology and Business in České Budějovice","ownership_type":"public"},
    {"name":"Anglo-American University","ownership_type":"private"},
    {"name":"University of New York in Prague","ownership_type":"private"},
    {"name":"Škoda Auto University","ownership_type":"private"},
    {"name":"University of Finance and Administration","ownership_type":"private"},
    {"name":"Unicorn University","ownership_type":"private"},
    {"name":"Metropolitan University Prague","ownership_type":"private"},
    {"name":"AMBIS University","ownership_type":"private"},
    {"name":"Institute of Hospitality Management in Prague","ownership_type":"private"}
  ]$seed$) as x(name text, ownership_type text)
)
update universities u
set ownership_type = src.ownership_type
from src
where u.name = src.name and u.country_code = 'CZ' and u.ownership_type is null;

-- ============================================================
-- §2 City-size classification
-- ============================================================

-- Classified by population (2024, Czech Statistical Office):
--   capital_or_large  > 500k        (Prague)
--   medium            100k–500k     (Brno, Ostrava, Plzeň, Liberec, ...)
--   small             < 100k
--   student           university-town status is a distinct, user-facing
--                     quality (Brno, Olomouc) — mutually exclusive with
--                     the size bands above.
alter table universities
  add column if not exists city_size text
    check (city_size in ('capital_or_large', 'medium', 'small', 'student'));

comment on column universities.city_size is
  'Population-band classification of the university''s city: capital_or_large (>500k), medium (100k–500k), small (<100k), or student (university-town status, e.g. Brno/Olomouc). Facts from the Czech Statistical Office (2024).';

with src as (
  select * from jsonb_to_recordset($seed$[
    {"city":"Prague","city_size":"capital_or_large"},
    {"city":"Brno","city_size":"student"},
    {"city":"Ostrava","city_size":"medium"},
    {"city":"Plzeň","city_size":"medium"},
    {"city":"Olomouc","city_size":"student"},
    {"city":"Liberec","city_size":"medium"},
    {"city":"Hradec Králové","city_size":"small"},
    {"city":"Pardubice","city_size":"small"},
    {"city":"České Budějovice","city_size":"small"},
    {"city":"Ústí nad Labem","city_size":"small"},
    {"city":"Zlín","city_size":"small"},
    {"city":"Jihlava","city_size":"small"},
    {"city":"Karlovy Vary","city_size":"small"},
    {"city":"Opava","city_size":"small"},
    {"city":"Frýdek-Místek","city_size":"small"},
    {"city":"Karviná","city_size":"small"},
    {"city":"Uherské Hradiště","city_size":"small"}
  ]$seed$) as x(city text, city_size text)
)
update universities u
set city_size = src.city_size
from src
where u.city = src.city and u.city_size is null;

-- ============================================================
-- §3 User preference: preferred ownership type
-- ============================================================

-- Mirrors the legacy `ownership_preference` exactly (same three values) so
-- `score-location.ts` can add it as a third averaged signal alongside
-- country/city, the way the legacy location scorer did.
alter table user_profiles
  add column if not exists preferred_ownership_type text
    check (preferred_ownership_type in ('public', 'private', 'no_preference'));

comment on column user_profiles.preferred_ownership_type is
  'User preference for university ownership: public, private, or no_preference (default). Drives the ownership signal in Location Fit (P1#7).';