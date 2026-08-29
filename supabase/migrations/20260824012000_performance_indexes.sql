-- Additional performance indexes for sort/filter columns used in
-- programmes.repository.ts search() and discover page sorting.

create index if not exists programmes_tuition_min_idx
  on programmes (tuition_min) where tuition_min is not null;

create index if not exists programmes_living_cost_idx
  on programmes (estimated_living_cost_monthly) where estimated_living_cost_monthly is not null;

create index if not exists programmes_degree_level_idx
  on programmes (degree_level);

create index if not exists programmes_duration_idx
  on programmes (duration_months);

-- Composite index for the most common filter combination
create index if not exists programmes_published_field_language_idx
  on programmes (published, field_of_study_id, language_code)
  where published = true;
