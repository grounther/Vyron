-- ASORTA v5.19 mobile/i18n/Atlas fixes
-- Run after v5_18_shopify_dsers_paypal_checkout.sql.

create extension if not exists pgcrypto;

create table if not exists public.site_content (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  value text,
  type text default 'text',
  updated_at timestamptz default now()
);

alter table public.site_content add column if not exists type text default 'text';
alter table public.site_content add column if not exists updated_at timestamptz default now();

alter table public.site_content enable row level security;

drop policy if exists "Public can read site content" on public.site_content;
create policy "Public can read site content"
on public.site_content
for select
using (true);

-- Never expose supplier/DSers cost as a storefront compare-at price.
update public.products
set
  estimated_cost = coalesce(estimated_cost, compare_at),
  compare_at = null,
  updated_at = now()
where compare_at is not null
  and price is not null
  and compare_at <= price;
