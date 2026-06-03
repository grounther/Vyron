-- ASORTA v5.33 - Procedural ASORTA TCG card art + KvK contact info
-- No image files are stored in Supabase. The 240 digital cards render procedural artwork in the website from card metadata.

create table if not exists public.site_content (
  key text primary key,
  value text not null,
  type text default 'text',
  label text,
  page text,
  group_name text,
  updated_at timestamptz default now()
);

alter table public.site_content add column if not exists type text default 'text';
alter table public.site_content add column if not exists label text;
alter table public.site_content add column if not exists page text;
alter table public.site_content add column if not exists group_name text;
alter table public.site_content add column if not exists updated_at timestamptz default now();

insert into public.site_content (key, value, type, label, page, group_name, updated_at)
values
  ('contact.kvk.label', 'KvK-nummer', 'text', 'KvK card label', 'Contact page', 'Contact support blocks', now()),
  ('contact.kvk.value', '42075074', 'text', 'KvK number', 'Contact page', 'Contact support blocks', now())
on conflict (key) do update
set value = excluded.value,
    type = excluded.type,
    label = excluded.label,
    page = excluded.page,
    group_name = excluded.group_name,
    updated_at = now();
