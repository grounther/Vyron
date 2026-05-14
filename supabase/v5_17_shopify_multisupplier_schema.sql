-- ASORTA/Vyron v5.17 Shopify input + multi-supplier fulfillment foundation
-- Run this after the existing v5_16 CJ import schemas.
-- This migration keeps Shopify as product-input only; your own site remains frontend/checkout.

create extension if not exists pgcrypto;

-- Security fix: public product reads should never expose draft products.
drop policy if exists "Public can read active products" on public.products;
create policy "Public can read active products" on public.products
for select using (status in ('active','launch'));

-- Shopify product sync metadata.
alter table public.products add column if not exists shopify_product_id text;
alter table public.products add column if not exists shopify_variant_id text;
alter table public.products add column if not exists shopify_handle text;
alter table public.products add column if not exists shopify_status text;
alter table public.products add column if not exists shopify_vendor text;
alter table public.products add column if not exists shopify_product_type text;
alter table public.products add column if not exists shopify_tags text[] default '{}';
alter table public.products add column if not exists shopify_raw jsonb default '{}'::jsonb;
alter table public.products add column if not exists shopify_synced_at timestamptz;

-- Generic supplier metadata read from Shopify metafields or Atlas.
alter table public.products add column if not exists supplier text;
alter table public.products add column if not exists supplier_product_id text;
alter table public.products add column if not exists supplier_variant_id text;
alter table public.products add column if not exists supplier_sku text;
alter table public.products add column if not exists supplier_raw jsonb default '{}'::jsonb;

create unique index if not exists idx_products_shopify_product_id on public.products(shopify_product_id) where shopify_product_id is not null;
create index if not exists idx_products_shopify_handle on public.products(shopify_handle);
create index if not exists idx_products_supplier on public.products(supplier);

-- Variant-level supplier routing. One customer order can split into CJ + DSers + manual fulfillment orders.
create table if not exists public.product_supplier_mappings (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade,
  product_slug text not null,
  platform text default 'shopify',
  platform_product_id text,
  platform_variant_id text not null default '',
  platform_variant_sku text,
  platform_variant_name text,
  supplier text not null, -- cj, dsers, manual, future providers
  supplier_product_id text,
  supplier_variant_id text,
  supplier_sku text,
  supplier_cost numeric(10,2),
  supplier_shipping_method text,
  supplier_raw jsonb default '{}'::jsonb,
  is_primary boolean default true,
  enabled boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists idx_product_supplier_mappings_unique on public.product_supplier_mappings(product_slug, platform_variant_id, supplier);
create index if not exists idx_product_supplier_mappings_slug on public.product_supplier_mappings(product_slug);
create index if not exists idx_product_supplier_mappings_supplier on public.product_supplier_mappings(supplier);
create index if not exists idx_product_supplier_mappings_supplier_sku on public.product_supplier_mappings(supplier_sku);

alter table public.product_supplier_mappings enable row level security;
-- No public policy: Atlas/server-side service role reads these mappings.

-- Integration observability.
create table if not exists public.integration_sync_logs (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  event text,
  status text not null,
  message text,
  payload jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

alter table public.integration_sync_logs enable row level security;
-- No public policy: Atlas/server-side service role reads these logs.

-- Own checkout/order extensions.
alter table public.orders add column if not exists payment_id text;
alter table public.orders add column if not exists currency text default 'EUR';
alter table public.orders add column if not exists shipping_address jsonb default '{}'::jsonb;
alter table public.orders add column if not exists billing_address jsonb default '{}'::jsonb;
alter table public.orders add column if not exists supplier_order_id text;
alter table public.orders add column if not exists raw jsonb default '{}'::jsonb;

alter table public.order_items add column if not exists variant_sku text;
alter table public.order_items add column if not exists supplier text;
alter table public.order_items add column if not exists supplier_product_id text;
alter table public.order_items add column if not exists supplier_variant_id text;
alter table public.order_items add column if not exists supplier_sku text;
alter table public.order_items add column if not exists supplier_shipping_method text;
alter table public.order_items add column if not exists raw jsonb default '{}'::jsonb;

create table if not exists public.fulfillment_orders (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade,
  supplier text not null,
  status text not null default 'pending',
  supplier_order_id text,
  supplier_payment_id text,
  tracking_number text,
  tracking_url text,
  payload jsonb default '{}'::jsonb,
  raw jsonb default '{}'::jsonb,
  error_message text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_fulfillment_orders_order_id on public.fulfillment_orders(order_id);
create index if not exists idx_fulfillment_orders_supplier on public.fulfillment_orders(supplier);
create index if not exists idx_fulfillment_orders_supplier_order_id on public.fulfillment_orders(supplier_order_id);

alter table public.fulfillment_orders enable row level security;
-- No public policy: server-side service role owns fulfillment state.
