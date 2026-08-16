-- Unifind — Row Level Security
--
-- Two access patterns:
--  1. Catalog data (reference tables, universities, programmes,
--     requirements): world-readable, no direct client writes. Content is
--     managed server-side (service role / an admin tool, both out of
--     scope for this stage), so no insert/update/delete policies are
--     defined for anon/authenticated — RLS enabled with only a select
--     policy means those operations are simply denied.
--  2. User data (profile, test scores, saved programmes, comparisons):
--     owner-only, keyed on auth.uid().

-- 1. Catalog data — public read
alter table countries enable row level security;
alter table languages enable row level security;
alter table fields_of_study enable row level security;
alter table universities enable row level security;
alter table programmes enable row level security;
alter table programme_academic_requirements enable row level security;
alter table programme_language_requirements enable row level security;

create policy "countries are publicly readable"
  on countries for select
  using (true);

create policy "languages are publicly readable"
  on languages for select
  using (true);

create policy "fields_of_study are publicly readable"
  on fields_of_study for select
  using (true);

create policy "universities are publicly readable"
  on universities for select
  using (true);

create policy "programmes are publicly readable"
  on programmes for select
  using (true);

create policy "programme_academic_requirements are publicly readable"
  on programme_academic_requirements for select
  using (true);

create policy "programme_language_requirements are publicly readable"
  on programme_language_requirements for select
  using (true);

-- 2. User data — owner-only
alter table user_profiles enable row level security;
alter table user_test_scores enable row level security;
alter table saved_programmes enable row level security;
alter table comparisons enable row level security;
alter table comparison_items enable row level security;

create policy "users manage their own profile"
  on user_profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "users manage their own test scores"
  on user_test_scores for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users manage their own saved programmes"
  on saved_programmes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users manage their own comparisons"
  on comparisons for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- comparison_items has no user_id of its own — ownership is via its
-- parent comparison, so the policy checks through that relationship.
create policy "users manage items in their own comparisons"
  on comparison_items for all
  using (
    exists (
      select 1 from comparisons
      where comparisons.id = comparison_items.comparison_id
      and comparisons.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from comparisons
      where comparisons.id = comparison_items.comparison_id
      and comparisons.user_id = auth.uid()
    )
  );
