-- ASORTA v5.31 - Atlas support controls for TCG/minigame pack credits
-- Run in Supabase SQL Editor after deploying this code.
-- Adds an audit log for every pack grant/open/manual correction and makes pack credits easier to trace in support.

create extension if not exists pgcrypto;

alter table public.customer_pack_credits add column if not exists updated_at timestamptz not null default now();
create index if not exists customer_pack_credits_support_customer_idx on public.customer_pack_credits(customer_id, created_at desc);
create index if not exists customer_pack_credits_support_email_idx on public.customer_pack_credits(lower(customer_email), created_at desc);
create index if not exists customer_pack_credits_support_order_idx on public.customer_pack_credits(order_id, created_at desc);

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

create index if not exists customer_pack_events_customer_idx on public.customer_pack_events(customer_id, created_at desc);
create index if not exists customer_pack_events_auth_idx on public.customer_pack_events(auth_user_id, created_at desc);
create index if not exists customer_pack_events_email_idx on public.customer_pack_events(lower(customer_email), created_at desc);
create index if not exists customer_pack_events_credit_idx on public.customer_pack_events(credit_id, created_at desc);
create index if not exists customer_pack_events_order_idx on public.customer_pack_events(order_id, created_at desc);

alter table public.customer_pack_events enable row level security;

drop policy if exists "Users can read own pack events" on public.customer_pack_events;
create policy "Users can read own pack events" on public.customer_pack_events
for select using (auth.uid() = auth_user_id);

-- Backfill audit rows for existing credits so support has a complete baseline.
insert into public.customer_pack_events (
  customer_id,
  auth_user_id,
  customer_email,
  credit_id,
  order_id,
  event_type,
  source,
  series_key,
  quantity,
  reason,
  created_by,
  created_at
)
select
  c.customer_id,
  c.auth_user_id,
  c.customer_email,
  c.id,
  c.order_id,
  case when c.status = 'opened' then 'opened' when c.status = 'void' then 'void' else 'grant' end,
  c.source,
  c.series_chosen,
  1,
  case
    when c.status = 'opened' then 'Backfill: bestaand geopend pakje'
    when c.status = 'void' then 'Backfill: bestaand void pakje'
    else 'Backfill: bestaand beschikbaar pakje'
  end,
  'system_backfill',
  coalesce(c.opened_at, c.created_at, now())
from public.customer_pack_credits c
where not exists (
  select 1 from public.customer_pack_events e
  where e.credit_id = c.id
    and e.event_type = case when c.status = 'opened' then 'opened' when c.status = 'void' then 'void' else 'grant' end
);
