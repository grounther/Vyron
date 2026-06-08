-- ASORTA v5.38 - Sorkai support permissions + internal assist notes
-- Run after v5_37_atlas_staff_admin_panel.sql.

alter table if exists public.support_messages
  add column if not exists is_internal boolean not null default false;

alter table if exists public.support_messages
  add column if not exists internal_kind text;

create index if not exists support_messages_internal_idx
  on public.support_messages(conversation_id, is_internal, created_at asc);

-- Optional helper badge. The app can use this badge to allow a support lead to manage Sorkai settings
-- without giving full Atlas settings/admin access.
-- Example:
-- insert into atlas_staff_badges (staff_member_id, badge, active, granted_by)
-- select id, 'head_support', true, 'o.kelder.raalte@gmail.com'
-- from atlas_staff_members
-- where lower(email) = 'klantenservice@asorta.nl'
-- on conflict (staff_member_id, badge) do update set active = true, granted_by = excluded.granted_by, granted_at = now();

-- Keep existing support messages visible to customers by default.
update public.support_messages
set is_internal = false
where is_internal is null;
