-- Unifind — schema + seed: university ownership type (public/private).
--
-- Ported from Nevora's `0020_university_database.sql` (schema) and
-- `0021_seed_universities_czech.sql` (data) — see TRANSFER_NOTES.md.
-- This is the one piece of Nevora's `scoreCountryCity` that had real,
-- sourced data behind it: public-vs-private status is a verifiable fact
-- (Czech public universities are a defined legal category), unlike
-- Nevora's `citySizeByCity` and `part_time_work_opportunities`, which
-- were stub columns with no seeded values in Nevora either — those are
-- deliberately NOT ported here, since there'd be nothing but a guess to
-- put in them.
--
-- `preferred_ownership_type` mirrors Nevora's `ownership_preference`
-- column exactly (same three values), so `score-location.ts` can add it
-- as a third averaged signal alongside country/city, the same way
-- Nevora's `scoreCountryCity` did.

alter table universities
  add column ownership_type text check (ownership_type in ('public', 'private'));

alter table user_profiles
  add column preferred_ownership_type text
    check (preferred_ownership_type in ('public', 'private', 'no_preference'));

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
where u.name = src.name and u.country_code = 'CZ';
