-- ASORTA v5.34 - manual Cardmarket market value pricing engine
-- Run this in Supabase SQL Editor before using Atlas -> Prijsbeheer.

alter table public.products
  add column if not exists cardmarket_url text,
  add column if not exists market_value numeric(12,2),
  add column if not exists market_source text default 'manual',
  add column if not exists market_checked_at timestamptz,
  add column if not exists auto_pricing_enabled boolean default false,
  add column if not exists min_margin_percent numeric(6,2) default 15,
  add column if not exists min_price numeric(12,2),
  add column if not exists price_locked boolean default false,
  add column if not exists pricing_status text default 'manual',
  add column if not exists suggested_price numeric(12,2),
  add column if not exists last_pricing_note text,
  add column if not exists pricing_updated_at timestamptz;

create table if not exists public.product_pricing_logs (
  id uuid primary key default gen_random_uuid(),
  product_slug text not null,
  product_name text,
  action text not null,
  old_price numeric(12,2),
  market_value numeric(12,2),
  suggested_price numeric(12,2),
  applied_price numeric(12,2),
  min_safe_price numeric(12,2),
  margin_percent numeric(8,2),
  source text,
  status text,
  note text,
  actor_email text,
  raw_input text,
  created_at timestamptz not null default now()
);

create index if not exists product_pricing_logs_product_slug_idx on public.product_pricing_logs(product_slug);
create index if not exists product_pricing_logs_created_at_idx on public.product_pricing_logs(created_at desc);

update public.products
set
  market_source = coalesce(market_source, 'manual'),
  min_margin_percent = coalesce(min_margin_percent, 15),
  auto_pricing_enabled = coalesce(auto_pricing_enabled, false),
  price_locked = coalesce(price_locked, false),
  pricing_status = coalesce(pricing_status, 'manual')
where true;
