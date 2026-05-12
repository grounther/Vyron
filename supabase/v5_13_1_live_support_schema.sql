-- ASORTA v5.13.1 Live Support + Contact Page
-- Run this after v5.13 if the support tables do not exist yet.

create extension if not exists pgcrypto;

create table if not exists public.support_conversations (
  id uuid primary key default gen_random_uuid(),
  public_token uuid not null default gen_random_uuid() unique,
  customer_name text,
  customer_email text,
  subject text,
  source text default 'website',
  status text not null default 'open' check (status in ('open','pending','answered','closed')),
  assigned_to text,
  last_message_at timestamptz default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.support_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.support_conversations(id) on delete cascade,
  sender_type text not null check (sender_type in ('customer','operator','system')),
  author_name text,
  body text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.support_conversations(id) on delete set null,
  name text,
  email text,
  subject text,
  message text,
  source text default 'website',
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.support_conversations add column if not exists public_token uuid default gen_random_uuid();
alter table public.support_conversations add column if not exists customer_name text;
alter table public.support_conversations add column if not exists customer_email text;
alter table public.support_conversations add column if not exists subject text;
alter table public.support_conversations add column if not exists source text default 'website';
alter table public.support_conversations add column if not exists status text default 'open';
alter table public.support_conversations add column if not exists assigned_to text;
alter table public.support_conversations add column if not exists last_message_at timestamptz default now();
alter table public.support_conversations add column if not exists created_at timestamptz default now();
alter table public.support_conversations add column if not exists updated_at timestamptz default now();

alter table public.support_tickets add column if not exists conversation_id uuid references public.support_conversations(id) on delete set null;
alter table public.support_tickets add column if not exists updated_at timestamptz default now();

create index if not exists support_conversations_last_message_idx on public.support_conversations(last_message_at desc);
create index if not exists support_messages_conversation_created_idx on public.support_messages(conversation_id, created_at asc);
create index if not exists support_tickets_conversation_idx on public.support_tickets(conversation_id);

alter table public.support_conversations enable row level security;
alter table public.support_messages enable row level security;
alter table public.support_tickets enable row level security;

-- Public users do not get direct table access. The website talks through Next.js API routes with the service role key.
drop policy if exists "support_conversations_service_role" on public.support_conversations;
create policy "support_conversations_service_role" on public.support_conversations for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

drop policy if exists "support_messages_service_role" on public.support_messages;
create policy "support_messages_service_role" on public.support_messages for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

drop policy if exists "support_tickets_service_role" on public.support_tickets;
create policy "support_tickets_service_role" on public.support_tickets for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

-- Realtime publication, safe if already added.
do $$
begin
  begin
    alter publication supabase_realtime add table public.support_conversations;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.support_messages;
  exception when duplicate_object then null;
  end;
end $$;
