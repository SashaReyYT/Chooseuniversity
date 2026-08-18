-- Unifind — currency exchange rates for cross-currency Budget Fit
-- (spec §15, §26–§27).
--
-- V1 approach (deliberately not a live FX API dependency): a small,
-- admin-configurable table of rates to a common base currency (EUR).
-- Same pattern as 0011's other small reference/catalog tables — public
-- read, admin write via `public.is_admin()`.
--
-- Storing everything against one base (rather than every currency pair)
-- keeps the table O(currencies) instead of O(currencies^2): converting
-- X -> Y is `amount * rate[X] / rate[Y]`, so a currency missing from
-- this table is simply "no rate available" for every pair it's part of,
-- not something that has to be checked pair-by-pair.
--
-- Rates below are reasonable point-in-time approximations for the
-- currencies already in play in the catalog and its supported
-- countries (see 0001's seed list) — they are a starting point for an
-- admin to keep current, not a claim of live-market accuracy. EUR = 1
-- by definition; it doesn't need special-casing anywhere that reads
-- this table.

create table currency_rates (
  currency text primary key check (currency = upper(currency) and length(currency) = 3), -- ISO 4217
  -- Units of EUR that one unit of `currency` is worth.
  rate_to_eur numeric not null check (rate_to_eur > 0),
  updated_at timestamptz not null default now()
);

comment on table currency_rates is 'Admin-configurable EUR-based exchange rates for cross-currency Budget Fit comparisons (spec §15). Not a live FX feed — see migration comment.';
comment on column currency_rates.rate_to_eur is 'Units of EUR that one unit of `currency` is worth. Convert X -> Y via amount * rate_to_eur[X] / rate_to_eur[Y].';

insert into currency_rates (currency, rate_to_eur) values
  ('EUR', 1),
  ('CZK', 0.040),
  ('GBP', 1.17),
  ('USD', 0.92),
  ('CHF', 1.04),
  ('SEK', 0.088),
  ('DKK', 0.134),
  ('PLN', 0.23),
  ('CAD', 0.68),
  ('UAH', 0.021)
on conflict (currency) do nothing;

alter table currency_rates enable row level security;

create policy "currency_rates are publicly readable"
  on currency_rates for select using (true);

create policy "admins manage currency_rates"
  on currency_rates for all
  using (public.is_admin())
  with check (public.is_admin());
