-- Unifind — shortlist and comparisons
-- Supports "save favourites" and "compare universities/programmes" from
-- the product spec.

create table saved_programmes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  programme_id uuid not null references programmes (id) on delete cascade,
  note text,
  created_at timestamptz not null default now(),

  unique (user_id, programme_id)
);

create index saved_programmes_user_id_idx on saved_programmes (user_id);
create index saved_programmes_programme_id_idx on saved_programmes (programme_id);

comment on table saved_programmes is 'A user''s shortlist. One row per (user, programme) they''ve saved.';

create table comparisons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null default 'Comparison',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index comparisons_user_id_idx on comparisons (user_id);

create trigger comparisons_set_updated_at
  before update on comparisons
  for each row execute function set_updated_at();

create table comparison_items (
  id uuid primary key default gen_random_uuid(),
  comparison_id uuid not null references comparisons (id) on delete cascade,
  programme_id uuid not null references programmes (id) on delete cascade,
  position integer not null default 0,
  created_at timestamptz not null default now(),

  unique (comparison_id, programme_id)
);

create index comparison_items_comparison_id_idx on comparison_items (comparison_id);

comment on table comparisons is 'A named set of programmes a user is actively comparing side by side.';
comment on table comparison_items is 'Programmes belonging to a comparison, in display order.';
