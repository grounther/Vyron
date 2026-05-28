-- ASORTA v5.27 Pokemon cleanup
-- Run this once in the Supabase SQL Editor after deploying the Pokemon-first site.
-- It removes/archives old utility/dropship catalog data and resets public copy to Pokemon/TCG.

begin;

-- 1) Make a backup of products that this cleanup will remove.
create table if not exists public.products_legacy_cleanup_backup as
select * from public.products where false;

insert into public.products_legacy_cleanup_backup
select p.*
from public.products p
where not exists (
  select 1
  from public.products_legacy_cleanup_backup b
  where b.id = p.id
)
and (
  coalesce(p.category, '') not in ('booster-packs', 'elite-trainer-boxes', 'collection-boxes', 'singles', 'accessories', 'market-deals')
  or coalesce(p.name, '') ilike any (array['%tactical%', '%automotive%', '%desk setup%', '%smart utility%', '%utility%', '%car dock%', '%car mount%', '%desk mat%', '%lightbar%', '%compressor%', '%pet hair%', '%rfid wallet%', '%sling bag%', '%carabiner%', '%massager%'])
  or coalesce(p.short_description, '') ilike any (array['%tactical%', '%automotive%', '%desk setup%', '%smart utility%', '%dropship%', '%dsers%', '%cj dropshipping%', '%aliexpress%'])
  or coalesce(p.description, '') ilike any (array['%tactical%', '%automotive%', '%desk setup%', '%smart utility%', '%dropship%', '%dsers%', '%cj dropshipping%', '%aliexpress%'])
  or coalesce(p.badge, '') ilike any (array['%shopify sync%', '%dsers%', '%cj import%', '%utility%'])
);

-- 2) Remove old supplier/import mapping data for products that are no longer part of the Pokemon catalog.
do $$
begin
  if to_regclass('public.product_supplier_mappings') is not null then
    delete from public.product_supplier_mappings m
    using public.products_legacy_cleanup_backup b
    where m.product_slug = b.slug;
  end if;

  if to_regclass('public.cj_product_mappings') is not null then
    delete from public.cj_product_mappings m
    using public.products_legacy_cleanup_backup b
    where m.product_slug = b.slug;
  end if;

  if to_regclass('public.cj_import_logs') is not null then
    truncate table public.cj_import_logs;
  end if;
end $$;

-- 3) Delete old non-Pokemon products from the active products table.
delete from public.products p
using public.products_legacy_cleanup_backup b
where p.id = b.id;

-- 4) Normalize remaining products to the Pokemon/eigen voorraad setup.
update public.products
set
  category = case
    when category in ('booster-packs', 'elite-trainer-boxes', 'collection-boxes', 'singles', 'accessories', 'market-deals') then category
    else 'booster-packs'
  end,
  supplier = 'manual',
  supplier_name = coalesce(nullif(supplier_name, ''), 'Eigen voorraad'),
  warehouse = coalesce(nullif(warehouse, ''), 'Eigen voorraad'),
  supplier_status = coalesce(nullif(supplier_status, ''), 'manual'),
  badge = case
    when badge is null or badge = '' or badge ilike any (array['%shopify%', '%dsers%', '%cj%', '%utility%']) then 'Eigen voorraad'
    else badge
  end,
  shipping_info = coalesce(nullif(shipping_info, ''), 'Eigen voorraad wordt zorgvuldig verpakt en verzonden zodra de betaling rond is.'),
  updated_at = now();

-- 5) Clear old CJ/DSers/Shopify payload fields on remaining manual products where those columns exist.
do $$
begin
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='products' and column_name='cj_pid') then
    update public.products set cj_pid = null;
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='products' and column_name='cj_product_sku') then
    update public.products set cj_product_sku = null;
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='products' and column_name='cj_source_url') then
    update public.products set cj_source_url = null;
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='products' and column_name='cj_product_id') then
    update public.products set cj_product_id = null;
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='products' and column_name='cj_variant_id') then
    update public.products set cj_variant_id = null;
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='products' and column_name='cj_sku') then
    update public.products set cj_sku = null;
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='products' and column_name='cj_variant_ids') then
    update public.products set cj_variant_ids = '{}';
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='products' and column_name='supplier_raw') then
    update public.products set supplier_raw = '{}'::jsonb;
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='products' and column_name='shopify_raw') then
    update public.products set shopify_raw = '{}'::jsonb;
  end if;
end $$;

-- 6) Reset customer-facing site content to Pokemon/TCG-first copy.
insert into public.site_content (key, value, type, updated_at) values
('homepage.hero.kicker', 'POKEMON TCG • SEALED • COLLECTIBLES • EVENTS', 'text', now()),
('homepage.hero.text', 'Asorta. Alles voor jouw verzameling.', 'textarea', now()),
('homepage.hero.primaryCta', 'Shop Pokemon', 'text', now()),
('homepage.hero.secondaryCta', 'Markt voorraad', 'text', now()),
('homepage.categories.kicker', 'Pokemon assortiment', 'text', now()),
('homepage.categories.title', 'Shop Pokemon per categorie', 'text', now()),
('homepage.featured.kicker', 'Uitgelicht', 'text', now()),
('homepage.featured.title', 'Populaire Pokemon picks', 'text', now()),
('homepage.catalog.kicker', 'Volledige voorraad', 'text', now()),
('homepage.catalog.title', 'Pokemon sealed, singles en collectibles.', 'text', now()),
('shop.kicker', 'ASORTA Pokemon Shop', 'text', now()),
('shop.title', 'Pokemon voorraad online', 'text', now()),
('shop.text', 'Bekijk de actuele Pokemon voorraad van ASORTA. Sealed producten, singles, accessoires en marktdeals uit eigen voorraad.', 'textarea', now()),
('category.kicker', 'Pokemon collectie', 'text', now()),
('category.empty', 'Nog geen Pokemon producten in deze categorie.', 'text', now()),
('about.body', 'ASORTA is een Nederlandse Pokemon TCG shop voor trading cards, collectibles, sealed producten en verkoop op markten, braderieen en events.

Onze collectie bestaat uit eigen voorraad: booster packs, Elite Trainer Boxes, collection boxes, singles, accessoires en marktdeals. We focussen op duidelijke productinformatie, betrouwbare voorraad en een veilige checkoutflow.

Na je bestelling ontvang je een orderbevestiging per e-mail. Zodra tracking beschikbaar is, ontvang je automatisch een verzendupdate.', 'textarea', now()),
('faq.items', 'Wat is ASORTA? | ASORTA is een Pokemon TCG shop voor trading cards, collectibles, sealed producten en markt/events verkoop.
Hoe werkt betalen? | Je rekent af via een beveiligde betaalomgeving. PayPal is nu beschikbaar; iDEAL, Mollie en Wero volgen later.
Hoe volg ik mijn bestelling? | Gebruik de pagina Order volgen met je ordernummer en het e-mailadres waarmee je hebt besteld.
Wanneer ontvang ik tracking? | Tracking is beschikbaar zodra je pakket is aangemeld voor verzending. Je ontvangt dan automatisch een verzendupdate per e-mail.
Kan ik retourneren? | Ja, retouraanvragen worden beoordeeld volgens het retourbeleid. Neem contact op met support met je ordernummer en reden van retour.
Waar kan ik terecht met vragen? | Neem contact op met ASORTA Support. Vermeld bij ordervragen altijd je ordernummer en e-mailadres.', 'textarea', now()),
('shipping.body', 'Na betaling ontvang je een orderbevestiging per e-mail. Je bestelling wordt daarna voorbereid en aangemeld voor verzending.

De verwachte levertijd kan per product en bestemming verschillen. Zodra tracking beschikbaar is, ontvang je automatisch een verzendbevestiging met trackinginformatie.

Heb je na je bestelling nog geen tracking ontvangen? Gebruik de pagina Order volgen of neem contact op met ASORTA Support met je ordernummer.', 'textarea', now()),
('returns.body', 'Wil je een retour aanvragen? Neem contact op met ASORTA Support met je ordernummer, e-mailadres en reden van retour. We beoordelen je aanvraag en geven daarna de vervolgstappen.

Producten moeten ongebruikt, compleet en waar mogelijk in originele verpakking worden geretourneerd. Beschadigde, gebruikte of onvolledige producten kunnen worden geweigerd of gedeeltelijk vergoed.

Voor defecten of verkeerde leveringen vragen we foto''s of video''s, zodat we het probleem zorgvuldig kunnen beoordelen.', 'textarea', now()),
('footer.brandText', 'Trading Cards • Collectibles • Events. Pokemon sealed producten, collectibles en eigen voorraad voor online verkoop en markten.', 'textarea', now()),
('footer.payments', 'PayPal beschikbaar
iDEAL / Mollie volgt later
Wero volgt later', 'textarea', now()),
('footer.copyright', '© 2026 ASORTA. Trading Cards • Collectibles • Events.', 'text', now()),
('site.shipping.message', 'Eigen voorraad wordt zorgvuldig verpakt en verzonden zodra de betaling rond is.', 'text', now())
on conflict (key) do update set
  value = excluded.value,
  type = excluded.type,
  updated_at = now();

-- 7) Remove only site_content rows that are obviously old utility/dropship copy and not part of the current editor defaults.
delete from public.site_content
where value ilike any (array['%premium utility%', '%smart utility%', '%automotive%', '%desk setup%', '%everyday carry%', '%dropshipping%', '%dsers%', '%cj dropshipping%', '%aliexpress%'])
and key not in (
  'homepage.hero.kicker','homepage.hero.text','homepage.hero.primaryCta','homepage.hero.secondaryCta',
  'homepage.categories.kicker','homepage.categories.title','homepage.featured.kicker','homepage.featured.title',
  'homepage.catalog.kicker','homepage.catalog.title','shop.kicker','shop.title','shop.text','category.kicker','category.empty',
  'about.body','faq.items','shipping.body','returns.body','footer.brandText','footer.payments','footer.copyright','site.shipping.message'
);

commit;

-- Rollback help, if needed:
-- insert into public.products select * from public.products_legacy_cleanup_backup on conflict (id) do nothing;
