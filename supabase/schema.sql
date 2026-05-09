-- ASORTA Supabase starter schema
-- Run this later in Supabase SQL editor when we connect the real backend.

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
  warehouse text default 'China',
  status text default 'draft',
  created_at timestamptz default now()
);

create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  full_name text,
  phone text,
  created_at timestamptz default now()
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null,
  customer_id uuid references customers(id),
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
  created_at timestamptz default now()
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
