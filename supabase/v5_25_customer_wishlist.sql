-- ASORTA v5.25 Customer wishlist activation
-- Run this after the customer/account schema migrations.

create extension if not exists pgcrypto;

create table if not exists public.customer_wishlists (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid references auth.users(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete cascade,
  product_slug text not null,
  created_at timestamptz not null default now(),
  unique(auth_user_id, product_slug)
);

alter table public.customer_wishlists
  add column if not exists product_slug text;

alter table public.customer_wishlists
  add column if not exists created_at timestamptz not null default now();

create index if not exists customer_wishlists_auth_user_idx on public.customer_wishlists(auth_user_id, created_at desc);
create index if not exists customer_wishlists_customer_idx on public.customer_wishlists(customer_id, created_at desc);
create index if not exists customer_wishlists_product_slug_idx on public.customer_wishlists(product_slug);

alter table public.customer_wishlists enable row level security;

do $$ begin
  create policy "Users can manage own wishlist" on public.customer_wishlists
    for all to authenticated
    using (auth.uid() = auth_user_id)
    with check (auth.uid() = auth_user_id);
exception when duplicate_object then null; end $$;
