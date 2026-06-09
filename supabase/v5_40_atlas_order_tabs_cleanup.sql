-- ASORTA Atlas order category tabs + cancelled-order cleanup support.
-- Run after v5_39_checkout_order_finalization.sql.

alter table public.orders add column if not exists updated_at timestamptz default now();

create index if not exists idx_orders_fulfillment_updated_at
  on public.orders (fulfillment_status, updated_at desc);

create table if not exists public.order_cleanup_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  source text,
  deleted_count integer not null default 0,
  cutoff_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_order_cleanup_events_created_at
  on public.order_cleanup_events (created_at desc);

-- Optional immediate cleanup for already-cancelled orders older than 24 hours.
-- The app and Vercel cron will continue doing this automatically after deployment.
delete from public.orders
where lower(coalesce(fulfillment_status, '')) in ('cancelled', 'canceled')
  and coalesce(updated_at, created_at, now()) < now() - interval '24 hours';
