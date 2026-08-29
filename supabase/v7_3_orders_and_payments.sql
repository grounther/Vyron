-- ASORTA Tickets v7.3 — orders, Mollie payments and QR admission codes
create table if not exists public.ticket_orders (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references auth.users(id) on delete restrict,
  event_id uuid not null references public.ticket_events(id) on delete restrict,
  ticket_type_id uuid not null references public.ticket_types(id) on delete restrict,
  quantity integer not null check (quantity between 1 and 10),
  subtotal numeric(12,2) not null check (subtotal >= 0),
  buyer_fee numeric(12,2) not null check (buyer_fee >= 0),
  total numeric(12,2) not null check (total >= 0),
  currency text not null default 'EUR',
  status text not null default 'pending' check (status in ('pending','processing','paid','failed','cancelled','expired','refunded')),
  mollie_payment_id text unique,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.tickets add column if not exists order_id uuid references public.ticket_orders(id) on delete restrict;
alter table public.tickets add column if not exists qr_code uuid not null default gen_random_uuid();
create unique index if not exists tickets_qr_code_key on public.tickets(qr_code);
create unique index if not exists tickets_order_position_key on public.tickets(order_id, token_hash) where order_id is not null;

alter table public.ticket_orders enable row level security;
drop policy if exists "buyers see own orders" on public.ticket_orders;
create policy "buyers see own orders" on public.ticket_orders for select to authenticated using (auth.uid()=buyer_id);
drop policy if exists "buyers create own orders" on public.ticket_orders;
create policy "buyers create own orders" on public.ticket_orders for insert to authenticated with check (auth.uid()=buyer_id and status='pending');

drop policy if exists "owners see own tickets" on public.tickets;
create policy "owners see own tickets" on public.tickets for select using (auth.uid()=owner_id);

create or replace function public.event_sold_count(event_uuid uuid)
returns bigint language sql stable security definer set search_path=public as $$
  select count(*) from tickets t join ticket_types tt on tt.id=t.ticket_type_id where tt.event_id=event_uuid and t.status not in ('cancelled','refunded')
$$;
