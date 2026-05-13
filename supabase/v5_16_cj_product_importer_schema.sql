-- ASORTA v5.6.1 CJ Product Importer
-- Run this after v5_15_support_customer_portal_schema.sql.
-- Purpose: import CJ product details by SPU/SKU into Atlas Products without requiring a connected CJ store.

create extension if not exists pgcrypto;

alter table products add column if not exists cj_pid text;
alter table products add column if not exists cj_product_sku text;
alter table products add column if not exists cj_source_url text;
alter table products add column if not exists cj_raw_product jsonb;
alter table products add column if not exists cj_last_synced_at timestamptz;
alter table products add column if not exists cj_variant_count integer default 0;
alter table products add column if not exists cj_import_status text default 'manual';
alter table products add column if not exists cj_product_category_name text;
alter table products add column if not exists cj_product_weight numeric(12,2);
alter table products add column if not exists cj_sell_price_usd numeric(12,2);
alter table products add column if not exists cj_suggest_sell_price text;
alter table products add column if not exists cj_logistic_attributes text[] default '{}';

create table if not exists cj_product_mappings (
  id uuid primary key default gen_random_uuid(),
  product_slug text not null references products(slug) on delete cascade,
  variant_name text,
  cj_pid text,
  cj_product_sku text,
  cj_vid text not null,
  cj_variant_sku text,
  cj_variant_key text,
  cj_variant_image text,
  cj_variant_sell_price_usd numeric(12,2),
  cj_variant_weight_g numeric(12,2),
  cj_inventory jsonb default '[]'::jsonb,
  enabled boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(product_slug, cj_vid)
);

create table if not exists cj_import_logs (
  id uuid primary key default gen_random_uuid(),
  product_slug text,
  cj_pid text,
  cj_product_sku text,
  source_url text,
  status text not null default 'success',
  message text,
  payload jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_products_cj_pid on products(cj_pid);
create index if not exists idx_products_cj_product_sku on products(cj_product_sku);
create index if not exists idx_cj_product_mappings_product_slug on cj_product_mappings(product_slug);
create index if not exists idx_cj_product_mappings_cj_vid on cj_product_mappings(cj_vid);
create index if not exists idx_cj_product_mappings_cj_variant_sku on cj_product_mappings(cj_variant_sku);
create index if not exists idx_cj_import_logs_product_slug on cj_import_logs(product_slug);
create index if not exists idx_cj_import_logs_status on cj_import_logs(status);

alter table cj_product_mappings enable row level security;
alter table cj_import_logs enable row level security;

-- Atlas uses the Supabase service role server-side for imports.
-- No public policies are added here because CJ mappings and raw supplier payloads are internal data.
