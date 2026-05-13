-- ASORTA v5.16 CJ product import foundation
-- Run after v5_15_support_customer_portal_schema.sql.
-- Keep CJ credentials out of the database. Use Vercel/env vars for CJ_API_KEY or CJ_ACCESS_TOKEN.

create extension if not exists pgcrypto;

alter table public.products add column if not exists cj_spu text;
alter table public.products add column if not exists cj_pid text;
alter table public.products add column if not exists cj_product_url text;
alter table public.products add column if not exists cj_source_country_code text default 'CN';
alter table public.products add column if not exists cj_default_logistic_name text;
alter table public.products add column if not exists cj_sync_status text default 'manual';
alter table public.products add column if not exists cj_last_imported_at timestamptz;
alter table public.products add column if not exists cj_raw_payload jsonb default '{}'::jsonb;

create table if not exists public.cj_product_mappings (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade,
  product_slug text not null,
  platform_variant_sku text,
  platform_variant_name text,
  cj_pid text,
  cj_spu text,
  cj_vid text not null default '',
  cj_variant_sku text not null default '',
  cj_variant_name text,
  cj_variant_image text,
  source_country_code text default 'CN',
  default_logistic_name text,
  inventory integer,
  cj_price numeric(10,2),
  enabled boolean not null default true,
  raw_payload jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists idx_cj_product_mappings_unique_variant on public.cj_product_mappings(product_slug, cj_vid, cj_variant_sku);
create index if not exists idx_cj_product_mappings_product_slug on public.cj_product_mappings(product_slug);
create index if not exists idx_cj_product_mappings_cj_spu on public.cj_product_mappings(cj_spu);
create index if not exists idx_cj_product_mappings_cj_variant_sku on public.cj_product_mappings(cj_variant_sku);
create index if not exists idx_products_cj_spu on public.products(cj_spu);
create index if not exists idx_products_cj_pid on public.products(cj_pid);

alter table public.cj_product_mappings enable row level security;

-- Atlas uses the service role server-side. No public policies are needed for CJ mapping rows.
