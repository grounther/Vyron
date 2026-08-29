-- ASORTA Tickets v7.0 foundation
create extension if not exists pgcrypto;

create table if not exists public.ticket_organizers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  kvk_number text,
  status text not null default 'pending' check (status in ('pending','verified','suspended')),
  created_at timestamptz not null default now()
);

create table if not exists public.ticket_events (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid not null references public.ticket_organizers(id) on delete restrict,
  slug text not null unique,
  title text not null,
  category text not null,
  venue text not null,
  city text not null,
  starts_at timestamptz not null,
  status text not null default 'draft' check (status in ('draft','published','cancelled','completed')),
  resale_enabled boolean not null default true,
  resale_cap_percent numeric(5,2) not null default 20,
  created_at timestamptz not null default now()
);

create table if not exists public.ticket_types (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.ticket_events(id) on delete cascade,
  name text not null,
  face_value numeric(12,2) not null check (face_value >= 0),
  capacity integer not null check (capacity >= 0),
  sales_start timestamptz,
  sales_end timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  ticket_type_id uuid not null references public.ticket_types(id) on delete restrict,
  owner_id uuid not null references auth.users(id) on delete restrict,
  token_hash text not null unique,
  status text not null default 'valid' check (status in ('valid','listed','sold','scanned','cancelled','refunded')),
  issued_at timestamptz not null default now(),
  scanned_at timestamptz
);

create table if not exists public.ticket_listings (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null unique references public.tickets(id) on delete restrict,
  seller_id uuid not null references auth.users(id) on delete restrict,
  asking_price numeric(12,2) not null check (asking_price > 0),
  seller_fee_rate numeric(6,5) not null default 0.045,
  buyer_fee_rate numeric(6,5) not null default 0.085,
  status text not null default 'pending' check (status in ('pending','active','reserved','sold','withdrawn','rejected')),
  created_at timestamptz not null default now()
);

alter table public.ticket_organizers enable row level security;
alter table public.ticket_events enable row level security;
alter table public.ticket_types enable row level security;
alter table public.tickets enable row level security;
alter table public.ticket_listings enable row level security;

create policy "published events are public" on public.ticket_events for select using (status='published');
create policy "published ticket types are public" on public.ticket_types for select using (exists(select 1 from public.ticket_events e where e.id=event_id and e.status='published'));
create policy "active listings are public" on public.ticket_listings for select using (status='active');
create policy "owners see own tickets" on public.tickets for select using (auth.uid()=owner_id);
create policy "sellers manage own listings" on public.ticket_listings for all using (auth.uid()=seller_id) with check (auth.uid()=seller_id);
create policy "organizers manage own profile" on public.ticket_organizers for all using (auth.uid()=owner_id) with check (auth.uid()=owner_id);
