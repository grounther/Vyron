-- ASORTA Atlas staff admin panel support
-- Run after v5_36_atlas_staff_permissions.sql.

create table if not exists atlas_staff_audit_logs (
  id uuid primary key default gen_random_uuid(),
  staff_member_id uuid references atlas_staff_members(id) on delete set null,
  action text not null,
  actor_email text,
  target_email text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_atlas_staff_audit_logs_staff on atlas_staff_audit_logs(staff_member_id);
create index if not exists idx_atlas_staff_audit_logs_actor on atlas_staff_audit_logs(lower(actor_email));
create index if not exists idx_atlas_staff_audit_logs_created on atlas_staff_audit_logs(created_at desc);

-- Make sure owner/admin accounts have permission to open /atlas/staff.
update admin_users
set
  can_settings = true,
  is_owner = case when lower(email) = 'o.kelder.raalte@gmail.com' then true else is_owner end,
  updated_at = now()
where active = true and (lower(email) = 'o.kelder.raalte@gmail.com' or lower(coalesce(role, '')) in ('owner', 'admin'));

-- Optional manual example if you ever need it outside Atlas:
-- with new_staff as (
--   insert into atlas_staff_members (email, display_name, role, active, status, created_by)
--   values ('lisa@asorta.nl', 'Lisa', 'support', true, 'active', 'o.kelder.raalte@gmail.com')
--   on conflict (email) do update set active = true, status = 'active', updated_at = now()
--   returning id, email
-- )
-- insert into atlas_staff_badges (staff_member_id, badge, active, granted_by)
-- select id, 'support', true, 'o.kelder.raalte@gmail.com' from new_staff
-- on conflict (staff_member_id, badge) do update set active = true, granted_by = excluded.granted_by, granted_at = now();
