-- ASORTA v5.11 Exclusive Drops + Email Automation
-- Run this in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text,
  source text default 'homepage_exclusive_drops',
  status text not null default 'subscribed' check (status in ('subscribed','unsubscribed','bounced')),
  confirmed boolean not null default true,
  tags text[] not null default array[]::text[],
  subscribed_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_email_sent timestamptz,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists newsletter_subscribers_status_idx on public.newsletter_subscribers(status);
create index if not exists newsletter_subscribers_tags_idx on public.newsletter_subscribers using gin(tags);
create index if not exists newsletter_subscribers_email_idx on public.newsletter_subscribers(email);

create table if not exists public.newsletter_campaigns (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  preview text,
  title text not null,
  body text not null,
  cta_label text,
  cta_url text,
  campaign_type text not null default 'exclusive_drop',
  target_tag text,
  status text not null default 'draft' check (status in ('draft','sent')),
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists newsletter_campaigns_status_idx on public.newsletter_campaigns(status);
create index if not exists newsletter_campaigns_type_idx on public.newsletter_campaigns(campaign_type);

alter table public.newsletter_subscribers enable row level security;
alter table public.newsletter_campaigns enable row level security;

-- Public visitors do not write directly to these tables. They subscribe through Next.js API route using service role.
-- Atlas admin actions also use the server-side service role after Supabase Auth + admin_users allowlist.

drop policy if exists "newsletter subscribers no public read" on public.newsletter_subscribers;
create policy "newsletter subscribers no public read"
  on public.newsletter_subscribers
  for select
  using (false);

drop policy if exists "newsletter subscribers no public insert" on public.newsletter_subscribers;
create policy "newsletter subscribers no public insert"
  on public.newsletter_subscribers
  for insert
  with check (false);

drop policy if exists "newsletter campaigns no public read" on public.newsletter_campaigns;
create policy "newsletter campaigns no public read"
  on public.newsletter_campaigns
  for select
  using (false);

drop policy if exists "newsletter campaigns no public insert" on public.newsletter_campaigns;
create policy "newsletter campaigns no public insert"
  on public.newsletter_campaigns
  for insert
  with check (false);
