-- ASORTA v5.12 Revenue & Customer System
-- Run this in Supabase SQL Editor after v5.9/v5.10/v5.11 schemas.

create extension if not exists pgcrypto;

create table if not exists public.cart_sessions (
  id uuid primary key default gen_random_uuid(),
  session_key text unique not null,
  customer_email text,
  customer_id uuid references public.customers(id) on delete set null,
  auth_user_id uuid references auth.users(id) on delete set null,
  items jsonb not null default '[]'::jsonb,
  subtotal numeric not null default 0,
  currency text not null default 'EUR',
  status text not null default 'active' check (status in ('active','checkout_started','recovered','converted','abandoned','expired')),
  source text default 'web_cart',
  recovery_stage int not null default 0,
  recovery_token text unique default encode(gen_random_bytes(24),'hex'),
  first_reminder_at timestamptz,
  second_reminder_at timestamptz,
  last_chance_at timestamptz,
  last_activity_at timestamptz not null default now(),
  converted_order_id uuid references public.orders(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cart_recovery_events (
  id uuid primary key default gen_random_uuid(),
  cart_session_id uuid not null references public.cart_sessions(id) on delete cascade,
  event_type text not null,
  email text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.customer_wishlists (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid references auth.users(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete cascade,
  product_slug text not null,
  created_at timestamptz not null default now(),
  unique(auth_user_id, product_slug)
);

create table if not exists public.customer_loyalty (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id) on delete cascade,
  auth_user_id uuid references auth.users(id) on delete cascade,
  points int not null default 0,
  lifetime_spend numeric not null default 0,
  tier text not null default 'bronze',
  updated_at timestamptz not null default now(),
  unique(auth_user_id)
);

create index if not exists cart_sessions_status_idx on public.cart_sessions(status);
create index if not exists cart_sessions_email_idx on public.cart_sessions(customer_email);
create index if not exists cart_sessions_activity_idx on public.cart_sessions(last_activity_at desc);
create index if not exists cart_recovery_events_cart_idx on public.cart_recovery_events(cart_session_id);

alter table public.cart_sessions enable row level security;
alter table public.cart_recovery_events enable row level security;
alter table public.customer_wishlists enable row level security;
alter table public.customer_loyalty enable row level security;

-- Public website may create/update anonymous cart sessions through API using anon key.
do $$ begin
  create policy "Public can upsert cart sessions" on public.cart_sessions
    for insert to public with check (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Public can update own cart by session key" on public.cart_sessions
    for update to public using (true) with check (true);
exception when duplicate_object then null; end $$;

-- Logged-in customers may read their own linked carts/wishlist/loyalty.
do $$ begin
  create policy "Users can read own cart sessions" on public.cart_sessions
    for select to authenticated using (auth.uid() = auth_user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Users can manage own wishlist" on public.customer_wishlists
    for all to authenticated using (auth.uid() = auth_user_id) with check (auth.uid() = auth_user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Users can read own loyalty" on public.customer_loyalty
    for select to authenticated using (auth.uid() = auth_user_id);
exception when duplicate_object then null; end $$;

-- Service role bypasses RLS; Atlas/API admin operations use service role.
