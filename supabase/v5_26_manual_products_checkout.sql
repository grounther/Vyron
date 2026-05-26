-- ASORTA/Vyron v5.26 manual products + owned inventory checkout
-- Run after v5_17+ if these columns are not present yet.

alter table public.products add column if not exists supplier text;
alter table public.products add column if not exists supplier_sku text;
alter table public.products add column if not exists supplier_product_id text;
alter table public.products add column if not exists supplier_variant_id text;
alter table public.products add column if not exists supplier_raw jsonb default '{}'::jsonb;

create index if not exists idx_products_supplier_manual on public.products(supplier);
create index if not exists idx_products_supplier_sku_manual on public.products(supplier_sku);

-- Public storefront reads active/launch products, including manual/eigen voorraad products.
drop policy if exists "Public can read active products" on public.products;
create policy "Public can read active products" on public.products
for select using (status in ('active','launch'));
