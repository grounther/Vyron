-- ASORTA v5.20 Atlas live order metrics
-- Keeps Atlas KPI/order overview tied to live Shopify/PayPal mirrored orders.

create extension if not exists pgcrypto;

alter table public.orders add column if not exists shopify_order_id text;
alter table public.orders add column if not exists shopify_order_name text;
alter table public.orders add column if not exists shopify_order_status_url text;
alter table public.orders add column if not exists shopify_financial_status text;
alter table public.orders add column if not exists shopify_fulfillment_status text;
alter table public.orders add column if not exists shopify_tracking_numbers text[] default '{}';
alter table public.orders add column if not exists shopify_tracking_urls text[] default '{}';
alter table public.orders add column if not exists shopify_raw jsonb default '{}'::jsonb;
alter table public.orders add column if not exists raw jsonb default '{}'::jsonb;

alter table public.order_items add column if not exists shopify_line_item_id text;
alter table public.order_items add column if not exists shopify_product_id text;
alter table public.order_items add column if not exists shopify_variant_id text;
alter table public.order_items add column if not exists supplier text;
alter table public.order_items add column if not exists supplier_sku text;
alter table public.order_items add column if not exists raw jsonb default '{}'::jsonb;

alter table public.products add column if not exists shopify_product_legacy_id text;
alter table public.products add column if not exists shopify_variant_legacy_id text;

create unique index if not exists idx_orders_shopify_order_id on public.orders(shopify_order_id) where shopify_order_id is not null;
create index if not exists idx_orders_created_at on public.orders(created_at desc);
create index if not exists idx_orders_payment_status on public.orders(payment_status);
create index if not exists idx_orders_shopify_financial_status on public.orders(shopify_financial_status);
create index if not exists idx_order_items_order_id on public.order_items(order_id);
create index if not exists idx_order_items_shopify_variant_id on public.order_items(shopify_variant_id);
create index if not exists idx_products_shopify_variant_legacy_id on public.products(shopify_variant_legacy_id);
create index if not exists idx_products_shopify_product_legacy_id on public.products(shopify_product_legacy_id);

-- Backfill item costs from Shopify-linked products where possible.
update public.order_items oi
set estimated_unit_cost = coalesce(nullif(oi.estimated_unit_cost, 0), p.estimated_cost, 0)
from public.products p
where coalesce(oi.estimated_unit_cost, 0) = 0
  and (
    p.shopify_variant_legacy_id = oi.shopify_variant_id
    or p.shopify_variant_id = oi.shopify_variant_id
    or p.shopify_product_legacy_id = oi.shopify_product_id
    or p.shopify_product_id = oi.shopify_product_id
  );

-- Backfill order estimated costs/profit from order_items.
with item_totals as (
  select
    order_id,
    coalesce(sum(coalesce(quantity, 1) * coalesce(estimated_unit_cost, 0)), 0) as estimated_cost
  from public.order_items
  group by order_id
)
update public.orders o
set
  estimated_cost = item_totals.estimated_cost,
  estimated_profit = coalesce(o.total, 0) - item_totals.estimated_cost,
  updated_at = now()
from item_totals
where o.id = item_totals.order_id
  and coalesce(o.estimated_cost, 0) = 0;
