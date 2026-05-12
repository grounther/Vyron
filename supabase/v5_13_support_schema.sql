-- ASORTA v5.13 Live Support & Customer Service System
-- Run this once in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.support_conversations (
  id uuid primary key default gen_random_uuid(),
  customer_name text,
  customer_email text not null,
  status text not null default 'open' check (status in ('open','pending','answered','closed')),
  source text default 'website',
  assigned_to text,
  last_message_at timestamptz default now(),
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  ticket_number text unique,
  conversation_id uuid references public.support_conversations(id) on delete set null,
  name text,
  email text not null,
  subject text not null default 'Support request',
  message text not null,
  source text default 'website',
  status text not null default 'new' check (status in ('new','open','pending','answered','closed')),
  priority text not null default 'normal' check (priority in ('low','normal','high','urgent')),
  page_url text,
  order_id text,
  customer_id uuid,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.support_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.support_conversations(id) on delete cascade,
  ticket_id uuid references public.support_tickets(id) on delete cascade,
  sender_type text not null default 'customer' check (sender_type in ('customer','agent','system','ai')),
  sender_name text,
  sender_email text,
  message text not null,
  attachments jsonb default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.support_quick_replies (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text default 'general',
  body text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.support_events (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  payload jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists support_tickets_status_idx on public.support_tickets(status);
create index if not exists support_tickets_email_idx on public.support_tickets(email);
create index if not exists support_tickets_created_idx on public.support_tickets(created_at desc);
create index if not exists support_conversations_email_idx on public.support_conversations(customer_email);
create index if not exists support_messages_conversation_idx on public.support_messages(conversation_id, created_at desc);

alter table public.support_conversations enable row level security;
alter table public.support_tickets enable row level security;
alter table public.support_messages enable row level security;
alter table public.support_quick_replies enable row level security;
alter table public.support_events enable row level security;

-- Public insert is intentionally allowed for the website support widget.
do $$ begin
  create policy "Public can create support conversations" on public.support_conversations
    for insert to anon, authenticated with check (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Public can create support tickets" on public.support_tickets
    for insert to anon, authenticated with check (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Public can create support messages" on public.support_messages
    for insert to anon, authenticated with check (true);
exception when duplicate_object then null; end $$;

-- Admin reads/writes are handled server-side through SUPABASE_SERVICE_ROLE_KEY in Atlas.

insert into public.support_quick_replies (title, category, body)
values
  ('Verzendtijd', 'shipping', 'Bedankt voor je bericht. De verwachte levertijd staat op de productpagina en in je orderbevestiging. We kijken je order graag even na als je je ordernummer meestuurt.'),
  ('Retour aanmelden', 'returns', 'Bedankt voor je bericht. Je kunt je retour aanmelden via onze retourvoorwaarden. Stuur ons je ordernummer en reden van retour, dan helpen we je verder.'),
  ('Productadvies', 'product', 'Bedankt voor je bericht. Vertel ons waarvoor je het product wilt gebruiken, dan adviseren we je graag de beste ASORTA optie.')
on conflict do nothing;
