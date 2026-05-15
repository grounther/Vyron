-- ASORTA v5.18 Shopify PayPal checkout + DSers order bridge
-- Run after v5_17_shopify_multisupplier_schema.sql.
-- This keeps asorta.nl as the frontend while Shopify handles PayPal checkout and DSers order processing.

create extension if not exists pgcrypto;

-- Shopify variant IDs required for Shopify cart permalink checkout.
alter table public.products add column if not exists shopify_product_legacy_id text;
alter table public.products add column if not exists shopify_variant_legacy_id text;

create index if not exists idx_products_shopify_product_legacy_id on public.products(shopify_product_legacy_id);
create index if not exists idx_products_shopify_variant_legacy_id on public.products(shopify_variant_legacy_id);

-- Shopify/DSers mirrored orders.
alter table public.orders add column if not exists shopify_order_id text;
alter table public.orders add column if not exists shopify_order_name text;
alter table public.orders add column if not exists shopify_order_status_url text;
alter table public.orders add column if not exists shopify_financial_status text;
alter table public.orders add column if not exists shopify_fulfillment_status text;
alter table public.orders add column if not exists shopify_tracking_numbers text[] default '{}';
alter table public.orders add column if not exists shopify_tracking_urls text[] default '{}';
alter table public.orders add column if not exists shopify_raw jsonb default '{}'::jsonb;

create unique index if not exists idx_orders_shopify_order_id on public.orders(shopify_order_id) where shopify_order_id is not null;
create index if not exists idx_orders_shopify_order_name on public.orders(shopify_order_name);
create index if not exists idx_orders_shopify_financial_status on public.orders(shopify_financial_status);
create index if not exists idx_orders_shopify_fulfillment_status on public.orders(shopify_fulfillment_status);

-- Shopify line-item references for mirrored Shopify orders.
alter table public.order_items add column if not exists shopify_line_item_id text;
alter table public.order_items add column if not exists shopify_product_id text;
alter table public.order_items add column if not exists shopify_variant_id text;

create index if not exists idx_order_items_shopify_line_item_id on public.order_items(shopify_line_item_id);
create index if not exists idx_order_items_shopify_variant_id on public.order_items(shopify_variant_id);

-- Optional webhook event ledger for troubleshooting. The app also writes integration_sync_logs.
create table if not exists public.shopify_webhook_events (
  id uuid primary key default gen_random_uuid(),
  topic text not null,
  shopify_id text,
  status text not null default 'received',
  payload jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_shopify_webhook_events_topic on public.shopify_webhook_events(topic);
create index if not exists idx_shopify_webhook_events_shopify_id on public.shopify_webhook_events(shopify_id);
alter table public.shopify_webhook_events enable row level security;

-- Keep public products strict: no draft leakage.
drop policy if exists "Public can read active products" on public.products;
create policy "Public can read active products"
on public.products
for select
using (status in ('active','launch'));
