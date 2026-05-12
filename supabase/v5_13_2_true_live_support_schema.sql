-- ASORTA v5.13.2 True Live Support + Chat Archive
-- Run after v5.13.1.

create extension if not exists pgcrypto;

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

alter table public.support_conversation_archives enable row level security;

drop policy if exists "support_conversation_archives_service_role" on public.support_conversation_archives;
create policy "support_conversation_archives_service_role"
  on public.support_conversation_archives
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create index if not exists support_conversation_archives_archived_idx
  on public.support_conversation_archives(archived_at desc);

create index if not exists support_conversation_archives_email_idx
  on public.support_conversation_archives(customer_email);

-- Keep realtime tables enabled. The customer UI uses API polling for privacy-safe realtime behavior.
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
