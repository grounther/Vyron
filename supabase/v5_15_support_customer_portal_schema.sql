-- ASORTA v5.15 Support Customer Portal
-- Run this once in Supabase SQL Editor after deploying the v5.6.0 support customer portal code.
-- Safe to run on top of v5.14 true 1-on-1 live support schema.

create extension if not exists pgcrypto;

alter table public.support_conversations add column if not exists priority text not null default 'normal';
alter table public.support_conversations add column if not exists customer_phone text;
alter table public.support_conversations add column if not exists linked_customer_id uuid references public.customers(id) on delete set null;
alter table public.support_conversations add column if not exists linked_order_id uuid references public.orders(id) on delete set null;
alter table public.support_conversations add column if not exists tags text[] not null default '{}';
alter table public.support_conversations add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.support_tickets add column if not exists customer_phone text;
alter table public.support_tickets add column if not exists page_url text;
alter table public.support_tickets add column if not exists order_id text;
alter table public.support_tickets add column if not exists customer_id uuid references public.customers(id) on delete set null;
alter table public.support_tickets add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.customers add column if not exists updated_at timestamptz default now();

create table if not exists public.support_customer_notes (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id) on delete set null,
  customer_email text,
  order_id uuid references public.orders(id) on delete set null,
  conversation_id uuid references public.support_conversations(id) on delete set null,
  note_type text not null default 'general',
  note text not null,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz default now()
);

alter table public.support_customer_notes enable row level security;

create index if not exists support_customer_notes_customer_idx on public.support_customer_notes(customer_id, created_at desc);
create index if not exists support_customer_notes_email_idx on public.support_customer_notes(lower(customer_email), created_at desc);
create index if not exists support_customer_notes_order_idx on public.support_customer_notes(order_id, created_at desc);
create index if not exists support_customer_notes_conversation_idx on public.support_customer_notes(conversation_id, created_at desc);

create index if not exists support_conversations_linked_customer_idx on public.support_conversations(linked_customer_id);
create index if not exists support_conversations_linked_order_idx on public.support_conversations(linked_order_id);
create index if not exists support_conversations_customer_phone_idx on public.support_conversations(customer_phone);
create index if not exists support_tickets_customer_idx on public.support_tickets(customer_id);
create index if not exists support_tickets_order_id_idx on public.support_tickets(order_id);
create index if not exists support_tickets_customer_phone_idx on public.support_tickets(customer_phone);
create index if not exists customers_phone_idx on public.customers(phone);
create index if not exists orders_tracking_number_idx on public.orders(tracking_number);
create index if not exists orders_cj_order_id_idx on public.orders(cj_order_id);
create index if not exists orders_customer_email_idx on public.orders(customer_email);
create index if not exists orders_customer_id_idx on public.orders(customer_id);

-- Keep old support rows connected to customer records where the e-mail already matches.
update public.support_conversations sc
set linked_customer_id = c.id,
    metadata = coalesce(sc.metadata, '{}'::jsonb) || jsonb_build_object(
      'matched_customer_id', c.id,
      'matched_customer_email', c.email,
      'auto_matched_at', now()
    )
from public.customers c
where sc.linked_customer_id is null
  and sc.customer_email is not null
  and c.email is not null
  and lower(sc.customer_email) = lower(c.email);

update public.support_tickets st
set customer_id = c.id
from public.customers c
where st.customer_id is null
  and st.email is not null
  and c.email is not null
  and lower(st.email) = lower(c.email);

-- Atlas uses the service role server-side. No public policies are added for customer notes.
-- Public visitors cannot read this table; the service role bypasses RLS for Atlas-only API routes.
