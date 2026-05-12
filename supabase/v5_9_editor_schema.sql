-- ASORTA v5.9 editor expansion
-- Run this in Supabase SQL Editor before using the full Atlas Product Editor.

create extension if not exists pgcrypto;

alter table products add column if not exists hero_image text;
alter table products add column if not exists images text[] default '{}';
alter table products add column if not exists badge text default 'New';
alter table products add column if not exists short_description text;
alter table products add column if not exists description text;
alter table products add column if not exists features text[] default '{}';
alter table products add column if not exists specs text[] default '{}';
alter table products add column if not exists tags text[] default '{}';
alter table products add column if not exists box_items text[] default '{}';
alter table products add column if not exists shipping_info text;
alter table products add column if not exists content_ideas text[] default '{}';
alter table products add column if not exists supplier_notes text;
alter table products add column if not exists margin_note text;
alter table products add column if not exists estimated_shipping numeric(10,2);
alter table products add column if not exists supplier_status text default 'testing';
alter table products add column if not exists processing_time text;
alter table products add column if not exists delivery_time text;
alter table products add column if not exists variants jsonb default '[]'::jsonb;
alter table products add column if not exists videos jsonb default '[]'::jsonb;

create table if not exists site_pages (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  body text,
  seo_title text,
  seo_description text,
  status text not null default 'published',
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

alter table site_pages enable row level security;

drop policy if exists "Public can read published site pages" on site_pages;
create policy "Public can read published site pages" on site_pages
for select using (status = 'published');

-- Storage bucket recommendation:
-- Create a public bucket named: product-images
-- Atlas uploads through service role, public frontend reads via public URL.
