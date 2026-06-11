-- ASORTA v5.42 - Automated bookkeeping export ledger
-- Run after v5_41_tcg_pack_paid_only_guard.sql.
-- Purpose: store one bookkeeping/export row per paid order, ready for Excel/CSV exports from Atlas.

begin;

create extension if not exists pgcrypto;

create table if not exists public.bookkeeping_entries (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  order_number text not null,
  entry_type text not null default 'sale',
  entry_status text not null default 'ready',
  booked_at timestamptz not null default now(),
  order_created_at timestamptz,
  payment_completed_at timestamptz,
  customer_email text,
  customer_name text,
  products_summary text,
  payment_provider text,
  payment_method text,
  currency text not null default 'EUR',
  subtotal numeric(12,2) not null default 0,
  shipping_total numeric(12,2) not null default 0,
  vat_total numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  estimated_cost numeric(12,2) not null default 0,
  payment_fee numeric(12,2) not null default 0,
  gross_profit numeric(12,2) not null default 0,
  margin_percent numeric(8,2) not null default 0,
  fulfillment_status text,
  payment_status text,
  tracking_number text,
  tracking_url text,
  external_payment_id text,
  source text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bookkeeping_entries_order_unique unique(order_id)
);

create index if not exists idx_bookkeeping_entries_booked_at
  on public.bookkeeping_entries(booked_at desc);

create index if not exists idx_bookkeeping_entries_order_number
  on public.bookkeeping_entries(order_number);

create index if not exists idx_bookkeeping_entries_customer_email
  on public.bookkeeping_entries(lower(customer_email));

create index if not exists idx_bookkeeping_entries_payment_method
  on public.bookkeeping_entries(payment_provider, payment_method);

alter table public.bookkeeping_entries enable row level security;

-- Boekhouding is intern. Atlas gebruikt server-side service-role code; publieke clients mogen niets lezen.
drop policy if exists "No public bookkeeping entries" on public.bookkeeping_entries;
create policy "No public bookkeeping entries" on public.bookkeeping_entries
for all using (false) with check (false);

-- Laat bestaande betaalde orders de volgende keer dat Atlas Boekhouding of een export wordt geopend
-- automatisch als volledige boekhoudregel synchroniseren, inclusief orderregels/producten.
insert into public.order_processing_events (order_id, order_number, event_type, source, message, metadata, created_at)
select o.id, o.order_number, 'bookkeeping_ready_for_sync', 'migration_v5_42', 'Order is klaar voor automatische boekhoudsync via Atlas.', '{}'::jsonb, now()
from public.orders o
where lower(coalesce(o.payment_status, '')) = 'paid'
  and not exists (
    select 1 from public.order_processing_events e
    where e.order_id = o.id and e.event_type = 'bookkeeping_ready_for_sync'
  );

commit;
