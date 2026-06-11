-- ASORTA v5.43 - Internal phone notifications for paid orders
-- Run after v5_42_bookkeeping_export_ledger.sql.
-- Purpose: idempotent audit log for Telegram/Pushover/e-mail order alerts sent after paid-order finalization.

begin;

create extension if not exists pgcrypto;

create table if not exists public.order_notification_events (
  id uuid primary key default gen_random_uuid(),
  event_key text not null unique,
  event_type text not null default 'new_paid_order',
  order_id uuid references public.orders(id) on delete cascade,
  order_number text,
  channels jsonb not null default '[]'::jsonb,
  status text not null default 'pending',
  payload jsonb not null default '{}'::jsonb,
  provider_response jsonb not null default '{}'::jsonb,
  error text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_order_notification_events_order_id
  on public.order_notification_events(order_id, created_at desc);

create index if not exists idx_order_notification_events_order_number
  on public.order_notification_events(order_number);

create index if not exists idx_order_notification_events_status
  on public.order_notification_events(status, created_at desc);

alter table public.order_notification_events enable row level security;

-- Interne meldingen kunnen provider responses en chat/user ids bevatten; alleen service-role server code mag erbij.
drop policy if exists "No public order notification events" on public.order_notification_events;
create policy "No public order notification events" on public.order_notification_events
for all using (false) with check (false);

insert into public.order_processing_events (order_id, order_number, event_type, source, message, metadata, created_at)
select o.id, o.order_number, 'order_phone_notifications_ready', 'migration_v5_43', 'Order is klaar voor interne telefoonmelding bij betaalde orderfinalisatie.', '{}'::jsonb, now()
from public.orders o
where lower(coalesce(o.payment_status, '')) = 'paid'
  and not exists (
    select 1 from public.order_processing_events e
    where e.order_id = o.id and e.event_type = 'order_phone_notifications_ready'
  );

commit;
