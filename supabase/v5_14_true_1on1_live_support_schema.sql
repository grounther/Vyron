-- ASORTA v5.14 True 1-on-1 Live Support Chat
-- Run this once in Supabase SQL Editor after deploying the v5.5.9 code.
-- This migration is safe to run on top of older v5.13 support tables.

create extension if not exists pgcrypto;

create table if not exists public.support_conversations (
  id uuid primary key default gen_random_uuid(),
  public_token uuid default gen_random_uuid(),
  customer_name text,
  customer_email text,
  subject text,
  status text not null default 'open',
  source text default 'website',
  assigned_to text,
  last_message_at timestamptz default now(),
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.support_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.support_conversations(id) on delete cascade,
  sender_type text not null default 'customer',
  author_name text,
  body text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  ticket_number text unique,
  conversation_id uuid references public.support_conversations(id) on delete set null,
  name text,
  email text,
  subject text not null default 'Support request',
  message text,
  source text default 'website',
  status text not null default 'open',
  priority text not null default 'normal',
  page_url text,
  order_id text,
  customer_id uuid,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.support_conversation_archives (
  id uuid primary key default gen_random_uuid(),
  original_conversation_id uuid,
  public_token uuid,
  customer_name text,
  customer_email text,
  subject text,
  source text,
  status text,
  transcript jsonb not null default '[]'::jsonb,
  archived_by text,
  emailed_to_customer boolean not null default false,
  archived_at timestamptz not null default now()
);

alter table public.support_conversations add column if not exists public_token uuid default gen_random_uuid();
alter table public.support_conversations add column if not exists customer_name text;
alter table public.support_conversations add column if not exists customer_email text;
alter table public.support_conversations add column if not exists subject text;
alter table public.support_conversations add column if not exists status text default 'open';
alter table public.support_conversations add column if not exists source text default 'website';
alter table public.support_conversations add column if not exists assigned_to text;
alter table public.support_conversations add column if not exists last_message_at timestamptz default now();
alter table public.support_conversations add column if not exists metadata jsonb default '{}'::jsonb;
alter table public.support_conversations add column if not exists created_at timestamptz default now();
alter table public.support_conversations add column if not exists updated_at timestamptz default now();

alter table public.support_messages add column if not exists conversation_id uuid references public.support_conversations(id) on delete cascade;
alter table public.support_messages add column if not exists sender_type text default 'customer';
alter table public.support_messages add column if not exists author_name text;
alter table public.support_messages add column if not exists body text;
alter table public.support_messages add column if not exists is_read boolean not null default false;
alter table public.support_messages add column if not exists created_at timestamptz default now();

alter table public.support_tickets add column if not exists conversation_id uuid references public.support_conversations(id) on delete set null;
alter table public.support_tickets add column if not exists name text;
alter table public.support_tickets add column if not exists email text;
alter table public.support_tickets add column if not exists subject text default 'Support request';
alter table public.support_tickets add column if not exists message text;
alter table public.support_tickets add column if not exists source text default 'website';
alter table public.support_tickets add column if not exists status text default 'open';
alter table public.support_tickets add column if not exists priority text default 'normal';
alter table public.support_tickets add column if not exists metadata jsonb default '{}'::jsonb;
alter table public.support_tickets add column if not exists updated_at timestamptz default now();

do $$
begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'support_messages' and column_name = 'sender_name') then
    update public.support_messages set author_name = coalesce(author_name, sender_name) where author_name is null;
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'support_messages' and column_name = 'message') then
    update public.support_messages set body = coalesce(body, message) where body is null or body = '';
    alter table public.support_messages alter column message drop not null;
    alter table public.support_messages alter column message set default '';
  end if;
end $$;

update public.support_messages set sender_type = 'operator' where sender_type in ('agent', 'ai');
update public.support_messages set sender_type = 'customer' where sender_type is null or sender_type = '';
update public.support_messages set sender_type = 'system' where sender_type not in ('customer', 'operator', 'system');
update public.support_messages set body = '' where body is null;
update public.support_conversations set public_token = gen_random_uuid() where public_token is null;
update public.support_conversations set status = 'open' where status is null or status = 'new';
update public.support_conversations set last_message_at = coalesce(last_message_at, updated_at, created_at, now()) where last_message_at is null;
update public.support_conversations set updated_at = coalesce(updated_at, created_at, now()) where updated_at is null;
update public.support_tickets set status = 'open' where status is null or status = 'new';
update public.support_tickets set updated_at = coalesce(updated_at, created_at, now()) where updated_at is null;

alter table public.support_conversations alter column public_token set not null;
alter table public.support_conversations alter column status set default 'open';
alter table public.support_conversations alter column last_message_at set default now();
alter table public.support_conversations alter column updated_at set default now();
alter table public.support_messages alter column sender_type set default 'customer';
alter table public.support_messages alter column sender_type set not null;
alter table public.support_messages alter column body set default '';
alter table public.support_messages alter column body set not null;
alter table public.support_tickets alter column status set default 'open';
alter table public.support_tickets alter column subject set default 'Support request';
alter table public.support_tickets alter column priority set default 'normal';
alter table public.support_tickets alter column updated_at set default now();

do $$
declare
  c record;
begin
  for c in
    select conname
    from pg_constraint
    where conrelid = 'public.support_conversations'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%status%'
  loop
    execute format('alter table public.support_conversations drop constraint %I', c.conname);
  end loop;

  for c in
    select conname
    from pg_constraint
    where conrelid = 'public.support_messages'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%sender_type%'
  loop
    execute format('alter table public.support_messages drop constraint %I', c.conname);
  end loop;

  for c in
    select conname
    from pg_constraint
    where conrelid = 'public.support_tickets'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%status%'
  loop
    execute format('alter table public.support_tickets drop constraint %I', c.conname);
  end loop;
end $$;

alter table public.support_conversations
  add constraint support_conversations_status_check
  check (status in ('open', 'pending', 'answered', 'closed'));

alter table public.support_messages
  add constraint support_messages_sender_type_check
  check (sender_type in ('customer', 'operator', 'system'));

alter table public.support_tickets
  add constraint support_tickets_status_check
  check (status in ('open', 'pending', 'answered', 'closed'));

create unique index if not exists support_conversations_public_token_uidx on public.support_conversations(public_token);
create index if not exists support_conversations_last_message_idx on public.support_conversations(last_message_at desc);
create index if not exists support_conversations_email_idx on public.support_conversations(customer_email);
create index if not exists support_messages_conversation_created_idx on public.support_messages(conversation_id, created_at asc);
create index if not exists support_tickets_conversation_idx on public.support_tickets(conversation_id);
create index if not exists support_conversation_archives_archived_idx on public.support_conversation_archives(archived_at desc);
create index if not exists support_conversation_archives_email_idx on public.support_conversation_archives(customer_email);

alter table public.support_conversations enable row level security;
alter table public.support_messages enable row level security;
alter table public.support_tickets enable row level security;
alter table public.support_conversation_archives enable row level security;

drop policy if exists "Public can create support conversations" on public.support_conversations;
drop policy if exists "Public can create support tickets" on public.support_tickets;
drop policy if exists "Public can create support messages" on public.support_messages;
drop policy if exists "support_conversations_service_role" on public.support_conversations;
drop policy if exists "support_messages_service_role" on public.support_messages;
drop policy if exists "support_tickets_service_role" on public.support_tickets;
drop policy if exists "support_conversation_archives_service_role" on public.support_conversation_archives;

create policy "support_conversations_service_role"
  on public.support_conversations for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "support_messages_service_role"
  on public.support_messages for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "support_tickets_service_role"
  on public.support_tickets for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "support_conversation_archives_service_role"
  on public.support_conversation_archives for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

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
