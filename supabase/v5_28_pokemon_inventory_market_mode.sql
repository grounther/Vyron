-- ASORTA v5.28 Pokemon inventory + market mode
-- Run this after v5_27_pokemon_cleanup.sql.
-- Purpose: add owned-inventory fields for online stock, market stock and Hot Deals.

begin;

-- 1) Backup current products before structural cleanup/update.
create table if not exists products_v5_28_inventory_backup as
select * from products;

-- 2) Add Pokemon/owned-stock columns. Safe to re-run.
alter table products add column if not exists inventory_online integer not null default 0 check (inventory_online >= 0);
alter table products add column if not exists inventory_market integer not null default 0 check (inventory_market >= 0);
alter table products add column if not exists inventory_total integer not null default 0 check (inventory_total >= 0);
alter table products add column if not exists sell_online boolean not null default true;
alter table products add column if not exists sell_market boolean not null default false;
alter table products add column if not exists hot_deal boolean not null default false;
alter table products add column if not exists condition_label text not null default 'Sealed';
alter table products add column if not exists sealed_status text not null default 'Origineel sealed';

-- 3) Normalize remaining catalog rows to owned Pokemon inventory language.
update products
set
  supplier = 'manual',
  supplier_name = 'Eigen voorraad',
  warehouse = coalesce(nullif(warehouse, ''), 'Eigen voorraad'),
  supplier_status = coalesce(nullif(supplier_status, ''), 'manual'),
  condition_label = coalesce(nullif(condition_label, ''), 'Sealed'),
  sealed_status = coalesce(nullif(sealed_status, ''), 'Origineel sealed'),
  inventory_total = greatest(coalesce(inventory_total, 0), coalesce(inventory_online, 0) + coalesce(inventory_market, 0)),
  updated_at = now();

-- 4) Make obvious deal products show in Hot Deals.
update products
set hot_deal = true
where coalesce(compare_at, 0) > coalesce(price, 0)
   or coalesce(badge, '') ilike any (array['%hot deal%', '%market deal%', '%bestseller%', '%launch%']);

-- 5) Clean old utility/dropship/site copy from site_content without deleting your custom text.
insert into site_content (key, value, type, updated_at) values
('homepage.hero.kicker', 'POKEMON TCG • SEALED • COLLECTIBLES • EVENTS', 'text', now()),
('homepage.categories.kicker', 'Pokemon assortiment', 'text', now()),
('homepage.categories.title', 'Shop Pokemon per categorie', 'text', now()),
('homepage.featured.kicker', 'Hot Deals', 'text', now()),
('homepage.featured.title', 'Populaire Pokemon picks', 'text', now()),
('homepage.catalog.kicker', 'Volledige voorraad', 'text', now()),
('homepage.catalog.title', 'Pokemon sealed, singles en collectibles.', 'text', now()),
('shop.kicker', 'ASORTA Pokemon Shop', 'text', now()),
('shop.title', 'Pokemon sealed, singles en collectibles.', 'text', now()),
('shop.text', 'Bekijk de actuele Pokemon voorraad van ASORTA. Sealed producten, singles, accessoires en marktdeals uit eigen voorraad.', 'textarea', now()),
('category.kicker', 'Pokemon collectie', 'text', now()),
('category.empty', 'Nog geen Pokemon producten in deze categorie.', 'text', now()),
('footer.brandText', 'Trading Cards • Collectibles • Events. Pokemon sealed producten, collectibles en eigen voorraad voor online verkoop en markten.', 'textarea', now()),
('footer.payments', 'PayPal beschikbaar\niDEAL / Mollie volgt later\nWero volgt later', 'textarea', now())
on conflict (key) do update set
  value = excluded.value,
  type = excluded.type,
  updated_at = now();

-- Keep your custom hero text if it is already set. Only replace old long Pokemon/utility copy.
update site_content
set value = 'Asorta. Alles voor jouw verzameling.', updated_at = now()
where key = 'homepage.hero.text'
  and value ilike any (array['%premium utility%', '%smart utility%', '%automotive%', '%desk setup%', '%dropshipping%', '%marktdeals%online bestellen%']);

-- 6) Remove obvious old utility products again, but keep a backup from step 1.
delete from products p
where coalesce(p.category, '') in ('tactical', 'automotive', 'desk-setup', 'gaming', 'smart-utility')
  or coalesce(p.name, '') ilike any (array['%tactical%', '%automotive%', '%desk setup%', '%smart utility%', '%utility%', '%car dock%', '%car mount%', '%desk mat%', '%lightbar%', '%compressor%', '%pet hair%', '%rfid wallet%', '%sling bag%', '%carabiner%', '%massager%'])
  or coalesce(p.short_description, '') ilike any (array['%tactical%', '%automotive%', '%desk setup%', '%smart utility%', '%dropship%', '%dsers%', '%cj dropshipping%', '%aliexpress%'])
  or coalesce(p.description, '') ilike any (array['%tactical%', '%automotive%', '%desk setup%', '%smart utility%', '%dropship%', '%dsers%', '%cj dropshipping%', '%aliexpress%'])
  or coalesce(p.badge, '') ilike any (array['%shopify sync%', '%dsers%', '%cj import%', '%utility%']);

-- 7) Clear old supplier/CJ mapping logs when those tables exist. Tables remain available if you ever need them later.
do $$
begin
  if to_regclass('public.cj_product_mappings') is not null then
    execute 'truncate table public.cj_product_mappings restart identity cascade';
  end if;
  if to_regclass('public.cj_import_logs') is not null then
    execute 'truncate table public.cj_import_logs restart identity cascade';
  end if;
  if to_regclass('public.supplier_product_mappings') is not null then
    execute 'truncate table public.supplier_product_mappings restart identity cascade';
  end if;
end $$;

commit;

-- Optional rollback helper for products only:
-- truncate table products;
-- insert into products select * from products_v5_28_inventory_backup;
