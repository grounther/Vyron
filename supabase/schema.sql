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
