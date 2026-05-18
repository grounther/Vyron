-- v5.23 Full Page Editor schema/support
-- Adds metadata columns used by Atlas Page Editor. Safe to run multiple times.

create table if not exists site_content (
  key text primary key,
  value text not null,
  type text default 'text',
  label text,
  page text,
  group_name text,
  updated_at timestamptz default now()
);

alter table site_content add column if not exists type text default 'text';
alter table site_content add column if not exists label text;
alter table site_content add column if not exists page text;
alter table site_content add column if not exists group_name text;
alter table site_content add column if not exists updated_at timestamptz default now();

create index if not exists site_content_page_idx on site_content(page);
create index if not exists site_content_group_name_idx on site_content(group_name);

-- Keep RLS on if it was enabled, but never expose writes to public clients.
alter table site_content enable row level security;

drop policy if exists "Public can read site content" on site_content;
create policy "Public can read site content"
on site_content
for select
using (true);

-- Remove internal fulfillment/platform wording from customer-facing product copy.
update products
set
  shipping_info = 'Veilige checkout. Na betaling ontvang je een orderbevestiging en tracking zodra verzending beschikbaar is.',
  updated_at = now()
where shipping_info ilike '%shopify%'
   or shipping_info ilike '%dsers%';
