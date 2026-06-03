-- ASORTA v5.30 - Direct PayPal checkout foundation
-- Run after v5_29_tcg_collection_minigame.sql.
-- This keeps checkout independent from Shopify Draft Orders.

alter table public.orders add column if not exists auth_user_id uuid references auth.users(id) on delete set null;
alter table public.orders add column if not exists payment_id text;
alter table public.orders add column if not exists payment_provider text default 'paypal';
alter table public.orders add column if not exists payment_status text default 'pending';
alter table public.orders add column if not exists fulfillment_status text default 'pending_payment';
alter table public.orders add column if not exists supplier_order_id text;
alter table public.orders add column if not exists raw jsonb default '{}'::jsonb;
alter table public.orders add column if not exists updated_at timestamptz default now();

create index if not exists orders_payment_provider_idx on public.orders(payment_provider);
create index if not exists orders_payment_id_idx on public.orders(payment_id);
create index if not exists orders_auth_user_idx on public.orders(auth_user_id);
create index if not exists orders_payment_status_idx on public.orders(payment_status);

-- Make existing non-Shopify/manual pending orders explicit for Atlas filtering.
update public.orders
set payment_provider = coalesce(nullif(payment_provider, ''), 'paypal'),
    fulfillment_status = coalesce(nullif(fulfillment_status, ''), 'pending_payment'),
    updated_at = now()
where payment_provider is null or payment_provider in ('shopify_paypal', 'manual', 'site');

-- Optional: existing paid PayPal orders can still grant one pack credit after login via v5_29 sync.
