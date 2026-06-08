-- ASORTA Atlas staff permissions
-- Run in Supabase SQL Editor after the previous migrations.

create table if not exists atlas_staff_members (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid,
  email text not null unique,
  display_name text,
  role text not null default 'staff',
  active boolean not null default true,
  status text not null default 'active',
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists atlas_staff_badges (
  id uuid primary key default gen_random_uuid(),
  staff_member_id uuid not null references atlas_staff_members(id) on delete cascade,
  badge text not null,
  active boolean not null default true,
  granted_by text,
  granted_at timestamptz not null default now(),
  unique(staff_member_id, badge)
);

create index if not exists idx_atlas_staff_members_email on atlas_staff_members(lower(email));
create index if not exists idx_atlas_staff_badges_staff on atlas_staff_badges(staff_member_id);
create index if not exists idx_atlas_staff_badges_badge on atlas_staff_badges(badge) where active = true;

alter table admin_users add column if not exists display_name text;
alter table admin_users add column if not exists is_owner boolean not null default false;
alter table admin_users add column if not exists can_support boolean not null default false;
alter table admin_users add column if not exists can_products boolean not null default false;
alter table admin_users add column if not exists can_orders boolean not null default false;
alter table admin_users add column if not exists can_pricing boolean not null default false;
alter table admin_users add column if not exists can_inventory boolean not null default false;
alter table admin_users add column if not exists can_pages boolean not null default false;
alter table admin_users add column if not exists can_promotions boolean not null default false;
alter table admin_users add column if not exists can_newsletter boolean not null default false;
alter table admin_users add column if not exists can_recovery boolean not null default false;
alter table admin_users add column if not exists can_seo boolean not null default false;
alter table admin_users add column if not exists can_integrations boolean not null default false;
alter table admin_users add column if not exists can_settings boolean not null default false;
alter table admin_users add column if not exists updated_at timestamptz not null default now();

-- Existing owner/admin rows keep full access.
update admin_users
set
  is_owner = case when lower(email) = 'o.kelder.raalte@gmail.com' or lower(coalesce(role, '')) = 'owner' then true else is_owner end,
  can_support = true,
  can_products = true,
  can_orders = true,
  can_pricing = true,
  can_inventory = true,
  can_pages = true,
  can_promotions = true,
  can_newsletter = true,
  can_recovery = true,
  can_seo = true,
  can_integrations = true,
  can_settings = true,
  updated_at = now()
where active = true and lower(coalesce(role, 'admin')) in ('owner', 'admin');

-- Your owner account uses this e-mail in admin_users.
insert into admin_users (
  email,
  role,
  active,
  display_name,
  is_owner,
  can_support,
  can_products,
  can_orders,
  can_pricing,
  can_inventory,
  can_pages,
  can_promotions,
  can_newsletter,
  can_recovery,
  can_seo,
  can_integrations,
  can_settings
)
values (
  'o.kelder.raalte@gmail.com',
  'owner',
  true,
  'Oscar',
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true
)
on conflict (email) do update set
  role = 'owner',
  active = true,
  display_name = coalesce(admin_users.display_name, excluded.display_name),
  is_owner = true,
  can_support = true,
  can_products = true,
  can_orders = true,
  can_pricing = true,
  can_inventory = true,
  can_pages = true,
  can_promotions = true,
  can_newsletter = true,
  can_recovery = true,
  can_seo = true,
  can_integrations = true,
  can_settings = true,
  updated_at = now();

-- Helper examples. Replace the e-mail before running if you want to create a support-only staff member.
-- with new_staff as (
--   insert into atlas_staff_members (email, display_name, role, active, created_by)
--   values ('naam@asorta.nl', null, 'support', true, 'o.kelder.raalte@gmail.com')
--   on conflict (email) do update set active = true, status = 'active', role = 'support', updated_at = now()
--   returning id
-- )
-- insert into atlas_staff_badges (staff_member_id, badge, active, granted_by)
-- select id, 'support', true, 'o.kelder.raalte@gmail.com' from new_staff
-- on conflict (staff_member_id, badge) do update set active = true, granted_by = excluded.granted_by, granted_at = now();

-- Optional audit view for quick checks in Supabase.
create or replace view atlas_staff_access_view as
select
  m.id,
  m.email,
  coalesce(nullif(m.display_name, ''), initcap(replace(split_part(m.email, '@', 1), '.', ' '))) as display_name,
  m.role,
  m.active,
  array_remove(array_agg(case when b.active then b.badge else null end), null) as badges,
  m.created_at,
  m.updated_at
from atlas_staff_members m
left join atlas_staff_badges b on b.staff_member_id = m.id
group by m.id;
