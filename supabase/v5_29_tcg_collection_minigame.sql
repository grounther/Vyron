-- ASORTA v5.29 - TCG collection minigame
-- Run in Supabase SQL Editor after deploying the code.
-- This creates virtual pack credits and digital card collection tables.

create extension if not exists pgcrypto;

alter table public.customers add column if not exists updated_at timestamptz default now();
alter table public.orders add column if not exists auth_user_id uuid references auth.users(id) on delete set null;

create table if not exists public.customer_pack_credits (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id) on delete cascade,
  auth_user_id uuid references auth.users(id) on delete cascade,
  customer_email text,
  order_id uuid references public.orders(id) on delete set null,
  order_number text,
  source text not null default 'paid_order',
  status text not null default 'available' check (status in ('available','opened','void')),
  series_chosen text,
  opened_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists customer_pack_credits_order_unique_idx
  on public.customer_pack_credits(order_id)
  where order_id is not null;
create index if not exists customer_pack_credits_auth_status_idx on public.customer_pack_credits(auth_user_id, status, created_at);
create index if not exists customer_pack_credits_customer_idx on public.customer_pack_credits(customer_id, created_at desc);
create index if not exists customer_pack_credits_email_idx on public.customer_pack_credits(lower(customer_email), status);

create table if not exists public.customer_pack_openings (
  id uuid primary key default gen_random_uuid(),
  credit_id uuid references public.customer_pack_credits(id) on delete set null,
  customer_id uuid references public.customers(id) on delete cascade,
  auth_user_id uuid references auth.users(id) on delete cascade,
  customer_email text,
  series_key text not null,
  cards jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists customer_pack_openings_auth_idx on public.customer_pack_openings(auth_user_id, created_at desc);
create index if not exists customer_pack_openings_customer_idx on public.customer_pack_openings(customer_id, created_at desc);

create table if not exists public.customer_pack_opening_cards (
  id uuid primary key default gen_random_uuid(),
  credit_id uuid references public.customer_pack_credits(id) on delete set null,
  customer_id uuid references public.customers(id) on delete cascade,
  auth_user_id uuid references auth.users(id) on delete cascade,
  customer_email text,
  series_key text not null,
  card_id text not null,
  card_name text not null,
  rarity text not null,
  variant text not null,
  pack_slot integer not null,
  created_at timestamptz not null default now()
);

create index if not exists customer_pack_opening_cards_auth_idx on public.customer_pack_opening_cards(auth_user_id, created_at desc);
create index if not exists customer_pack_opening_cards_card_idx on public.customer_pack_opening_cards(card_id, rarity);

create table if not exists public.customer_card_collection (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id) on delete cascade,
  auth_user_id uuid references auth.users(id) on delete cascade,
  customer_email text,
  card_id text not null,
  series_key text not null,
  card_name text not null,
  card_number text,
  card_type text,
  rarity text not null,
  variant text not null default 'base',
  quantity integer not null default 1,
  first_pulled_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists customer_card_collection_auth_card_variant_idx
  on public.customer_card_collection(auth_user_id, card_id, variant);
create index if not exists customer_card_collection_auth_series_idx on public.customer_card_collection(auth_user_id, series_key, card_id);
create index if not exists customer_card_collection_customer_idx on public.customer_card_collection(customer_id, updated_at desc);

alter table public.customer_pack_credits enable row level security;
alter table public.customer_pack_openings enable row level security;
alter table public.customer_pack_opening_cards enable row level security;
alter table public.customer_card_collection enable row level security;

drop policy if exists "Users can read own pack credits" on public.customer_pack_credits;
create policy "Users can read own pack credits" on public.customer_pack_credits
for select using (auth.uid() = auth_user_id);

drop policy if exists "Users can read own pack openings" on public.customer_pack_openings;
create policy "Users can read own pack openings" on public.customer_pack_openings
for select using (auth.uid() = auth_user_id);

drop policy if exists "Users can read own opening cards" on public.customer_pack_opening_cards;
create policy "Users can read own opening cards" on public.customer_pack_opening_cards
for select using (auth.uid() = auth_user_id);

drop policy if exists "Users can read own card collection" on public.customer_card_collection;
create policy "Users can read own card collection" on public.customer_card_collection
for select using (auth.uid() = auth_user_id);

-- Optional backfill: grant one available virtual pack for already paid orders that have an email.
-- A pack is only granted once per order because of the unique order_id index.
insert into public.customer_pack_credits (customer_id, auth_user_id, customer_email, order_id, order_number, source, status)
select
  coalesce(o.customer_id, c.id) as customer_id,
  coalesce(o.auth_user_id, c.auth_user_id) as auth_user_id,
  lower(o.customer_email) as customer_email,
  o.id as order_id,
  o.order_number,
  'paid_order_backfill' as source,
  'available' as status
from public.orders o
left join public.customers c on lower(c.email) = lower(o.customer_email)
where o.customer_email is not null
  and o.payment_status = 'paid'
  and coalesce(o.auth_user_id, c.auth_user_id) is not null
on conflict (order_id) where order_id is not null do nothing;
