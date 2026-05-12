-- ASORTA v5.10 Action Manager
-- Run this in Supabase SQL Editor after v5.9.

create extension if not exists pgcrypto;

create table if not exists site_actions (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  subtitle text,
  body text,
  code text,
  discount_type text not null default 'percentage' check (discount_type in ('percentage','fixed','free_shipping','custom')),
  discount_value numeric(10,2),
  button_text text default 'Shop action',
  button_href text default '/shop',
  badge_text text default 'Action',
  placement text not null default 'homepage' check (placement in ('homepage','shop','product','global')),
  active boolean not null default false,
  starts_at timestamptz,
  ends_at timestamptz,
  applies_to_all boolean not null default true,
  product_slugs text[] not null default '{}',
  category_slugs text[] not null default '{}',
  priority int not null default 100,
  theme text not null default 'blue-red',
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

alter table site_actions enable row level security;

drop policy if exists "Public can read active site actions" on site_actions;
create policy "Public can read active site actions" on site_actions
for select using (
  active = true
  and (starts_at is null or starts_at <= now())
  and (ends_at is null or ends_at >= now())
);

create index if not exists site_actions_active_idx on site_actions(active, placement, priority);
create index if not exists site_actions_slug_idx on site_actions(slug);

insert into site_actions (
  slug,title,subtitle,body,code,discount_type,discount_value,button_text,button_href,badge_text,placement,active,applies_to_all,priority,theme
) values (
  'launch-offer-10','Launch offer','10% on every order','Vier de ASORTA launch met tijdelijke openingskorting op de volledige collectie. Gebruik de code bij checkout zodra betalingen live staan.','ASORTA10','percentage',10,'Shop launch offer','/shop','10% OFF','global',true,true,10,'blue-red'
)
on conflict (slug) do nothing;
