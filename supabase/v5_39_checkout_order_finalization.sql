-- ASORTA v5.39 - Checkout/order finalization
-- Run after v5_38_sorkai_support_permissions_and_internal_assist.sql.
-- Purpose: make PayPal paid orders finalize consistently: order logs, inventory decrement flags, pack rewards and Atlas order management.

begin;

alter table public.orders add column if not exists raw jsonb default '{}'::jsonb;
alter table public.orders add column if not exists currency text default 'EUR';
alter table public.orders add column if not exists supplier_order_id text;
alter table public.orders add column if not exists shipping_address jsonb default '{}'::jsonb;
alter table public.orders add column if not exists billing_address jsonb default '{}'::jsonb;
alter table public.orders add column if not exists auth_user_id uuid references auth.users(id) on delete set null;
alter table public.orders add column if not exists customer_id uuid references public.customers(id) on delete set null;

alter table public.customers add column if not exists updated_at timestamptz default now();
alter table public.products add column if not exists inventory_online integer not null default 0 check (inventory_online >= 0);
alter table public.products add column if not exists inventory_market integer not null default 0 check (inventory_market >= 0);
alter table public.products add column if not exists inventory_total integer not null default 0 check (inventory_total >= 0);
alter table public.products add column if not exists sell_online boolean not null default true;

create table if not exists public.order_processing_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade,
  order_number text,
  event_type text not null,
  source text,
  message text,
  actor_email text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists order_processing_events_order_idx on public.order_processing_events(order_id, created_at desc);
create index if not exists order_processing_events_type_idx on public.order_processing_events(event_type, created_at desc);

alter table public.order_processing_events enable row level security;

-- Atlas reads/writes this table only through service-role server code. Customers should not read internal order logs.
drop policy if exists "No public order processing events" on public.order_processing_events;
create policy "No public order processing events" on public.order_processing_events
for select using (false);

-- Ensure pack audit tables exist for paid-order rewards even if older migrations were skipped.
create table if not exists public.customer_pack_events (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id) on delete set null,
  auth_user_id uuid references auth.users(id) on delete set null,
  customer_email text,
  credit_id uuid references public.customer_pack_credits(id) on delete set null,
  order_id uuid references public.orders(id) on delete set null,
  event_type text not null,
  source text,
  series_key text,
  quantity integer not null default 1,
  reason text,
  created_by text,
  created_at timestamptz not null default now()
);

create index if not exists customer_pack_events_order_idx on public.customer_pack_events(order_id, created_at desc);
create index if not exists customer_pack_events_email_idx on public.customer_pack_events(lower(customer_email), created_at desc);

alter table public.customer_pack_events enable row level security;

drop policy if exists "Users can read own pack events" on public.customer_pack_events;
create policy "Users can read own pack events" on public.customer_pack_events
for select using (auth.uid() = auth_user_id);

-- Backfill order logs for already-paid orders so Atlas has a baseline.
insert into public.order_processing_events (order_id, order_number, event_type, source, message, metadata, created_at)
select o.id, o.order_number, 'paid_order_baseline', 'migration_v5_39', 'Bestaande betaalde order bij migratie gevonden.', '{}'::jsonb, coalesce(o.updated_at, o.created_at, now())
from public.orders o
where lower(coalesce(o.payment_status, '')) = 'paid'
  and not exists (
    select 1 from public.order_processing_events e
    where e.order_id = o.id and e.event_type = 'paid_order_baseline'
  );

commit;
