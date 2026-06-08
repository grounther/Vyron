-- ASORTA v5.35 Sorkai offline support assistant
-- Adds Atlas-managed live/offline support settings and Sorkai audit logs.

create extension if not exists pgcrypto;

create table if not exists public.support_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.support_sorkai_logs (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.support_conversations(id) on delete set null,
  customer_email text,
  customer_message text,
  response_body text,
  intent text,
  confidence numeric,
  needs_human boolean not null default false,
  live_status text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.support_sorkai_logs enable row level security;
alter table public.support_settings enable row level security;

drop policy if exists "support_sorkai_logs_service_role" on public.support_sorkai_logs;
create policy "support_sorkai_logs_service_role"
  on public.support_sorkai_logs
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists "support_settings_service_role" on public.support_settings;
create policy "support_settings_service_role"
  on public.support_settings
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create index if not exists support_sorkai_logs_conversation_idx on public.support_sorkai_logs(conversation_id, created_at desc);
create index if not exists support_sorkai_logs_email_idx on public.support_sorkai_logs(lower(customer_email), created_at desc);
create index if not exists support_sorkai_logs_created_idx on public.support_sorkai_logs(created_at desc);
create index if not exists support_sorkai_logs_intent_idx on public.support_sorkai_logs(intent, created_at desc);

insert into public.support_settings (key, value, updated_at)
values
  ('sorkai_enabled', 'true', now()),
  ('live_support_status', 'offline', now()),
  ('sorkai_mode', 'assist', now())
on conflict (key) do nothing;

-- Mark conversations where Sorkai assisted, without changing historical messages.
update public.support_conversations
set metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object('sorkai_available', true)
where metadata is null or not (metadata ? 'sorkai_available');
