-- ASORTA v5.20 Atlas live order metrics
-- Optional but recommended after v5_18/v5_19.
-- Adds indexes for live Atlas KPI/order queries and backfills estimated order costs when Shopify variant IDs match products.

create index if not exists idx_orders_created_at_desc on public.orders(created_at desc);
create index if not exists idx_orders_payment_status on public.orders(payment_status);
create index if not exists idx_orders_fulfillment_status on public.orders(fulfillment_status);
create index if not exists idx_orders_shopify_financial_status on public.orders(shopify_financial_status);
create index if not exists idx_order_items_order_id on public.order_items(order_id);
create index if not exists idx_order_items_shopify_product_id on public.order_items(shopify_product_id);
create index if not exists idx_products_shopify_variant_legacy_id_metrics on public.products(shopify_variant_legacy_id);
create index if not exists idx_products_shopify_product_legacy_id_metrics on public.products(shopify_product_legacy_id);

-- Backfill item costs from Shopify-synced product costs where possible.
update public.order_items oi
set estimated_unit_cost = coalesce(p.estimated_cost, 0)
from public.products p
where coalesce(oi.estimated_unit_cost, 0) <= 0
  and p.estimated_cost is not null
  and p.estimated_cost > 0
  and (
    oi.shopify_variant_id = p.shopify_variant_legacy_id
    or oi.shopify_variant_id = p.shopify_variant_id
    or oi.shopify_product_id = p.shopify_product_legacy_id
    or oi.shopify_product_id = p.shopify_product_id
    or oi.product_slug = p.slug
  );

-- Backfill order-level estimated_cost and estimated_profit from order_items.
with item_totals as (
  select
    order_id,
    sum(coalesce(estimated_unit_cost, 0) * coalesce(quantity, 1)) as estimated_cost
  from public.order_items
  group by order_id
)
update public.orders o
set
  estimated_cost = coalesce(item_totals.estimated_cost, 0),
  estimated_profit = coalesce(o.total, 0) - coalesce(item_totals.estimated_cost, 0),
  updated_at = now()
from item_totals
where o.id = item_totals.order_id;
