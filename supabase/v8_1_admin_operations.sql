-- ASORTA Woningruil v8.1 — beheer, moderatie, refunds en privacy
-- Uitvoeren na v8_0_housing_swap_foundation.sql.

alter table public.profiles add column if not exists block_reason text;

alter table public.listing_photos add column if not exists moderation_status text;
alter table public.listing_photos add column if not exists moderation_note text;
alter table public.listing_photos add column if not exists reviewed_at timestamptz;
alter table public.listing_photos add column if not exists reviewed_by text;
update public.listing_photos set moderation_status='approved' where moderation_status is null;
alter table public.listing_photos alter column moderation_status set default 'pending';
alter table public.listing_photos alter column moderation_status set not null;
alter table public.listing_photos drop constraint if exists listing_photos_moderation_status_check;
alter table public.listing_photos add constraint listing_photos_moderation_status_check
  check(moderation_status in ('pending','approved','rejected'));
create index if not exists listing_photos_moderation on public.listing_photos(moderation_status,created_at desc);

-- Een huurder mag eigen foto's uploaden en verwijderen, maar nooit zelf de
-- moderatiestatus aanpassen. De service-role in Atlas kan dat wel.
drop policy if exists "own listing photos" on public.listing_photos;
drop policy if exists "read own listing photos" on public.listing_photos;
drop policy if exists "upload own pending listing photos" on public.listing_photos;
drop policy if exists "delete own listing photos" on public.listing_photos;
create policy "read own listing photos" on public.listing_photos for select to authenticated
  using(exists(select 1 from public.listings l where l.id=listing_id and l.user_id=auth.uid()));
create policy "upload own pending listing photos" on public.listing_photos for insert to authenticated
  with check(
    moderation_status='pending' and moderation_note is null and reviewed_at is null and reviewed_by is null
    and exists(select 1 from public.listings l where l.id=listing_id and l.user_id=auth.uid())
  );
create policy "delete own listing photos" on public.listing_photos for delete to authenticated
  using(exists(select 1 from public.listings l where l.id=listing_id and l.user_id=auth.uid()));

-- Ook bij rechtstreeks API-gebruik kan een gebruiker alleen een open voorstel indienen.
drop policy if exists "submit provider suggestion" on public.housing_provider_suggestions;
create policy "submit provider suggestion" on public.housing_provider_suggestions for insert to authenticated
  with check(auth.uid()=submitted_by and status='pending');

alter table public.payments add column if not exists provider_refund_id text;
alter table public.payments add column if not exists refund_status text;
alter table public.payments add column if not exists refund_requested_at timestamptz;
alter table public.payments add column if not exists refunded_at timestamptz;

create table if not exists public.privacy_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  request_type text not null check(request_type in ('export','deletion')),
  status text not null default 'open' check(status in ('open','reviewing','completed','rejected')),
  reason text,
  handled_by text,
  handled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists privacy_requests_status_created on public.privacy_requests(status,created_at desc);
create unique index if not exists privacy_requests_one_open
  on public.privacy_requests(user_id,request_type) where status in ('open','reviewing');
alter table public.privacy_requests enable row level security;
drop policy if exists "own privacy requests" on public.privacy_requests;
create policy "own privacy requests" on public.privacy_requests for select to authenticated using(auth.uid()=user_id);
drop policy if exists "create own privacy request" on public.privacy_requests;
create policy "create own privacy request" on public.privacy_requests for insert to authenticated with check(auth.uid()=user_id and status='open');

create or replace function public.apply_housing_refund(p_payment_id uuid,p_provider_refund_id text)
returns void language plpgsql security definer set search_path=public as $$
declare p public.payments%rowtype;
begin
  select * into p from public.payments where id=p_payment_id for update;
  if not found then raise exception 'Betaling niet gevonden.'; end if;
  if p.status='refunded' then return; end if;
  if p.status<>'paid' then raise exception 'Alleen betaalde transacties kunnen worden terugbetaald.'; end if;

  update public.payments set
    status='refunded',provider_refund_id=p_provider_refund_id,refund_status='refunded',
    refunded_at=now(),updated_at=now()
  where id=p.id;

  if p.purpose='search_year' then
    update public.access_passes set status='refunded'
    where payment_id=p.id and status='active';
  else
    update public.listings set status='paused',updated_at=now()
    where id=p.listing_id and status='active';
  end if;

  insert into public.notifications(user_id,type,title,body,href)
  values(p.user_id,'payment_success','Betaling terugbetaald',
    'Je betaling is terugbetaald. De bijbehorende toegang is beëindigd.','/account');
end$$;

create or replace function public.set_user_platform_block(p_user_id uuid,p_blocked boolean,p_reason text default null)
returns void language plpgsql security definer set search_path=public as $$
begin
  if not exists(select 1 from public.profiles where id=p_user_id) then
    raise exception 'Gebruiker niet gevonden.';
  end if;

  if p_blocked then
    update public.profiles set blocked_at=now(),block_reason=nullif(left(coalesce(p_reason,''),500),''),updated_at=now()
    where id=p_user_id;
    update public.listings set blocked_at=now(),status=case when status='active' then 'paused' else status end,updated_at=now()
    where user_id=p_user_id and status<>'swapped';
    update public.search_profiles set status='paused',updated_at=now() where user_id=p_user_id and status='active';
  else
    update public.profiles set blocked_at=null,block_reason=null,updated_at=now() where id=p_user_id;
    update public.listings set blocked_at=null,updated_at=now() where user_id=p_user_id;
  end if;
end$$;

create or replace function public.block_match_user(p_match_id uuid)
returns void language plpgsql security definer set search_path=public as $$
declare u uuid:=auth.uid(); m public.matches%rowtype; other_user uuid;
begin
  select * into m from public.matches where id=p_match_id and u in(user_a_id,user_b_id) for update;
  if not found then raise exception 'Match niet gevonden.'; end if;
  other_user:=case when u=m.user_a_id then m.user_b_id else m.user_a_id end;
  insert into public.blocks(blocker_id,blocked_id) values(u,other_user) on conflict do nothing;
  update public.matches set status='declined',updated_at=now() where id=m.id and status in('active','temporarily_unavailable');
  update public.conversations set status='closed' where match_id=m.id;
end$$;

revoke all on function public.apply_housing_refund(uuid,text) from public,anon,authenticated;
revoke all on function public.set_user_platform_block(uuid,boolean,text) from public,anon,authenticated;
revoke all on function public.block_match_user(uuid) from public,anon;
grant execute on function public.apply_housing_refund(uuid,text) to service_role;
grant execute on function public.set_user_platform_block(uuid,boolean,text) to service_role;
grant execute on function public.block_match_user(uuid) to authenticated;
