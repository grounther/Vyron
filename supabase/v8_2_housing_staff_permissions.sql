-- ASORTA Woningruil v8.2 — schoon en taakgericht Atlas-rechtenmodel
-- Uitvoeren na v8_1_admin_operations.sql.

alter table public.admin_users add column if not exists can_housing boolean not null default false;
alter table public.admin_users add column if not exists can_providers boolean not null default false;
alter table public.admin_users add column if not exists can_payments boolean not null default false;
alter table public.admin_users add column if not exists can_reports boolean not null default false;
alter table public.admin_users add column if not exists can_swaps boolean not null default false;
alter table public.admin_users add column if not exists can_privacy boolean not null default false;

-- Owners/admins behouden volledige toegang tot de nieuwe woningruilonderdelen.
update public.admin_users set
  can_support=true,
  can_housing=true,
  can_providers=true,
  can_payments=true,
  can_reports=true,
  can_swaps=true,
  can_privacy=true,
  can_settings=true,
  updated_at=now()
where active=true and (is_owner=true or lower(coalesce(role,'')) in ('owner','admin'));

-- Zet oude staffrechten waar mogelijk om naar hun logische woningruiltaak.
insert into public.atlas_staff_badges(staff_member_id,badge,active,granted_by,granted_at)
select distinct b.staff_member_id,m.new_badge,true,'v8.2-migratie',now()
from public.atlas_staff_badges b
join (values
  ('head_support','support'),
  ('head_support','reports'),
  ('products','housing'),
  ('inventory','housing'),
  ('orders','payments'),
  ('pricing','payments'),
  ('integrations','payments')
) as m(old_badge,new_badge) on m.old_badge=b.badge
where b.active=true
on conflict(staff_member_id,badge) do update set
  active=true,granted_by=excluded.granted_by,granted_at=excluded.granted_at;

-- Het oude Admin-recht stond voor volledige gevoelige toegang. Bestaande
-- medewerkers met dat recht behouden daarom alle nieuwe woningruilrechten.
insert into public.atlas_staff_badges(staff_member_id,badge,active,granted_by,granted_at)
select b.staff_member_id,p.badge,true,'v8.2-migratie',now()
from public.atlas_staff_badges b
cross join (values
  ('support'),('housing'),('providers'),('payments'),
  ('reports'),('swaps'),('privacy'),('settings')
) as p(badge)
where b.badge='settings' and b.active=true
on conflict(staff_member_id,badge) do update set
  active=true,granted_by=excluded.granted_by,granted_at=excluded.granted_at;

-- Oude webshop-, ticket- en marketingrechten worden niet meer gebruikt.
update public.atlas_staff_badges set active=false
where badge in (
  'head_support','products','orders','pricing','inventory','pages',
  'promotions','newsletter','recovery','seo','integrations'
);

insert into public.atlas_staff_audit_logs(action,actor_email,details)
values('housing_permissions_migrated','system',jsonb_build_object(
  'version','8.2',
  'active_permissions',jsonb_build_array(
    'support','housing','providers','payments','reports','swaps','privacy','settings'
  )
));
