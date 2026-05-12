-- ASORTA Supabase starter schema v4.2
-- Run this in Supabase SQL Editor.
-- Keep SUPABASE_SERVICE_ROLE_KEY private. Never expose it in frontend code.

create extension if not exists pgcrypto;

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  category text not null,
  price numeric(10,2) not null,
  compare_at numeric(10,2),
  estimated_cost numeric(10,2),
  supplier_name text,
  supplier_url text,
  cj_product_id text,
  cj_variant_id text,
  cj_sku text,
  cj_variant_ids text[],
  warehouse text default 'China',
  status text default 'draft',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid references auth.users(id) on delete set null,
  email text unique,
  full_name text,
  phone text,
  created_at timestamptz default now()
);

create table if not exists admin_users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  role text not null default 'admin',
  active boolean not null default true,
  created_at timestamptz default now()
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null,
  customer_id uuid references customers(id),
  auth_user_id uuid references auth.users(id) on delete set null,
  customer_email text,
  subtotal numeric(10,2) not null default 0,
  shipping_total numeric(10,2) not null default 0,
  vat_total numeric(10,2) not null default 0,
  total numeric(10,2) not null default 0,
  estimated_cost numeric(10,2) not null default 0,
  estimated_profit numeric(10,2) not null default 0,
  payment_provider text,
  payment_status text default 'pending',
  fulfillment_status text default 'pending',
  cj_order_id text,
  tracking_number text,
  tracking_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  product_slug text not null,
  product_name text not null,
  quantity integer not null default 1,
  unit_price numeric(10,2) not null,
  estimated_unit_cost numeric(10,2) not null default 0,
  cj_product_id text,
  cj_variant_id text,
  cj_sku text,
  created_at timestamptz default now()
);

alter table products enable row level security;
alter table customers enable row level security;
alter table admin_users enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;

-- Public read for live products later.
drop policy if exists "Public can read active products" on products;
create policy "Public can read active products" on products
for select using (status in ('active','launch','draft'));

-- Customers can read their own customer row.
drop policy if exists "Users can read own customer profile" on customers;
create policy "Users can read own customer profile" on customers
for select using (auth.uid() = auth_user_id);

-- Admin allowlist table is checked server-side via service role.
-- Insert your own admin email after running this schema:
-- insert into admin_users (email, role, active) values ('your@email.com', 'owner', true)
-- on conflict (email) do update set active = true, role = excluded.role;

-- ASORTA v5.1 content foundation
create table if not exists site_content (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  value text,
  type text default 'text',
  updated_at timestamptz default now()
);

alter table site_content enable row level security;

drop policy if exists "Public can read site content" on site_content;
create policy "Public can read site content" on site_content
for select using (true);

-- ASORTA v5.4 support tickets foundation
create table if not exists support_tickets (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text not null,
  subject text,
  message text not null,
  source text default 'website',
  status text default 'new',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table support_tickets enable row level security;

-- Support tickets are inserted server-side with the service role.
-- Admin viewing/editing will be added to Atlas in a later build.

-- ASORTA v5.5.1 promotions foundation
create table if not exists promotions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text,
  description text,
  code text,
  discount_percent numeric(5,2),
  placement text default 'homepage_hero',
  active boolean not null default false,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table promotions enable row level security;

drop policy if exists "Public can read active promotions" on promotions;
create policy "Public can read active promotions" on promotions
for select using (active = true);

insert into promotions (title, subtitle, description, code, discount_percent, placement, active)
values ('Openingsactie: 10% korting', 'Op de gehele bestelling', 'Tijdelijke launchactie voor de eerste ASORTA klanten.', 'ASORTA10', 10, 'homepage_hero', true)
on conflict do nothing;
-- ASORTA v5.9 editor expansion
-- Run this in Supabase SQL Editor before using the full Atlas Product Editor.

create extension if not exists pgcrypto;

alter table products add column if not exists hero_image text;
alter table products add column if not exists images text[] default '{}';
alter table products add column if not exists badge text default 'New';
alter table products add column if not exists short_description text;
alter table products add column if not exists description text;
alter table products add column if not exists features text[] default '{}';
alter table products add column if not exists specs text[] default '{}';
alter table products add column if not exists tags text[] default '{}';
alter table products add column if not exists box_items text[] default '{}';
alter table products add column if not exists shipping_info text;
alter table products add column if not exists content_ideas text[] default '{}';
alter table products add column if not exists supplier_notes text;
alter table products add column if not exists margin_note text;
alter table products add column if not exists estimated_shipping numeric(10,2);
alter table products add column if not exists supplier_status text default 'testing';
alter table products add column if not exists processing_time text;
alter table products add column if not exists delivery_time text;
alter table products add column if not exists variants jsonb default '[]'::jsonb;
alter table products add column if not exists videos jsonb default '[]'::jsonb;

create table if not exists site_pages (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  body text,
  seo_title text,
  seo_description text,
  status text not null default 'published',
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

alter table site_pages enable row level security;

drop policy if exists "Public can read published site pages" on site_pages;
create policy "Public can read published site pages" on site_pages
for select using (status = 'published');

-- Storage bucket recommendation:
-- Create a public bucket named: product-images
-- Atlas uploads through service role, public frontend reads via public URL.
