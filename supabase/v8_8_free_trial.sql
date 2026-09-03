-- ASORTA Woningruil v8.8 — 30 dagen gratis ontdekken
-- Uitvoeren na v8_6_cash_listing_activation.sql.

-- Nieuwe accounts krijgen automatisch 30 dagen proefperiode. Bestaande accounts
-- krijgen bij deze introductie eveneens een volledige maand vanaf de migratie.
alter table public.profiles add column if not exists trial_started_at timestamptz;
alter table public.profiles add column if not exists trial_expires_at timestamptz;

alter table public.profiles alter column trial_started_at set default now();
alter table public.profiles alter column trial_expires_at set default (now() + interval '30 days');

update public.profiles
set trial_started_at=now(),trial_expires_at=now()+interval '30 days',updated_at=now()
where trial_started_at is null or trial_expires_at is null;

alter table public.profiles alter column trial_started_at set not null;
alter table public.profiles alter column trial_expires_at set not null;

alter table public.profiles drop constraint if exists profiles_trial_period_check;
alter table public.profiles add constraint profiles_trial_period_check
  check(trial_expires_at>trial_started_at);

create or replace function public.has_paid_search_access(p_user_id uuid)
returns boolean language sql stable security definer set search_path=public as $$
  select exists(
    select 1 from public.access_passes a
    where a.user_id=p_user_id and a.status='active' and a.expires_at>now()
  )
$$;

create or replace function public.has_trial_search_access(p_user_id uuid)
returns boolean language sql stable security definer set search_path=public as $$
  select exists(
    select 1 from public.profiles p
    where p.id=p_user_id and p.blocked_at is null
      and p.trial_started_at<=now() and p.trial_expires_at>now()
  )
$$;

create or replace function public.has_search_discovery_access(p_user_id uuid)
returns boolean language sql stable security definer set search_path=public as $$
  select public.has_paid_search_access(p_user_id) or public.has_trial_search_access(p_user_id)
$$;

-- Tijdens de proefperiode zijn de match en openbare woningdetails zichtbaar.
-- Een bestaand ruildossier blijft ook na het verlopen van een pas bereikbaar.
create or replace function public.can_access_match(p_match_id uuid,p_user_id uuid default auth.uid())
returns boolean language sql stable security definer set search_path=public as $$
  select exists(
    select 1 from public.matches m
    where m.id=p_match_id and p_user_id in(m.user_a_id,m.user_b_id)
      and (
        m.status in('swap_in_progress','completed') or
        public.has_search_discovery_access(p_user_id)
      )
  )
$$;

-- Chat/contact is uitsluitend betaald. Een al gestart ruildossier blijft
-- bereikbaar zodat een aflopende pas nooit een lopende ruil blokkeert.
create or replace function public.can_access_conversation(p_conversation_id uuid,p_user_id uuid default auth.uid())
returns boolean language sql stable security definer set search_path=public as $$
  select exists(
    select 1
    from public.conversations c
    join public.matches m on m.id=c.match_id
    where c.id=p_conversation_id
      and p_user_id in(m.user_a_id,m.user_b_id)
      and (m.status in('swap_in_progress','completed') or public.has_paid_search_access(p_user_id))
  )
$$;

create or replace view public.match_listings with (security_barrier=true) as
select m.id as match_id,l.id,l.user_id,l.property_type,l.province,l.municipality,l.city,l.district,
       l.monthly_rent,l.living_area_m2,l.rooms,l.bedrooms,l.has_garden,l.has_balcony,l.has_elevator,
       l.ground_floor,l.wheelchair_accessible,l.accessibility,l.description,l.available_from,
       h.name as provider_name
from public.matches m
join public.listings l on l.id in(m.listing_a_id,m.listing_b_id)
join public.housing_providers h on h.id=l.housing_provider_id
where auth.uid() in(m.user_a_id,m.user_b_id)
  and (m.status in('swap_in_progress','completed') or public.has_search_discovery_access(auth.uid()));

-- De proefgebruiker mag het bestaan van de chat niet uitlezen. Daardoor zijn
-- ook bestaande berichten en contactgegevens pas zichtbaar na betaling.
drop policy if exists "members read conversations" on public.conversations;
create policy "members read conversations" on public.conversations for select to authenticated
using(public.can_access_conversation(id));

-- Matching draait alleen voor gebruikers die nog in hun proefmaand zitten of
-- een geldige jaarpas hebben. Geen woningtype kiezen betekent alle typen.
create or replace function public.refresh_matches_for_user(p_user_id uuid)
returns integer language plpgsql security definer set search_path=public as $$
declare own_listing public.listings%rowtype; own_search public.search_profiles%rowtype; candidate record; new_match uuid; convo uuid; made integer:=0;
begin
  if not public.has_search_discovery_access(p_user_id) then return 0; end if;
  select * into own_listing from public.listings where user_id=p_user_id and status='active' limit 1;
  select * into own_search from public.search_profiles where user_id=p_user_id and status='active' limit 1;
  if own_listing.id is null or own_search.id is null then return 0; end if;
  for candidate in
    select l.*,sp.id as search_id
    from public.listings l join public.search_profiles sp on sp.user_id=l.user_id and sp.status='active'
    where l.status='active' and l.user_id<>p_user_id
      and public.has_search_discovery_access(l.user_id)
      and not exists(select 1 from public.blocks b where (b.blocker_id=p_user_id and b.blocked_id=l.user_id) or (b.blocker_id=l.user_id and b.blocked_id=p_user_id))
      and exists(select 1 from public.search_locations sl where sl.search_profile_id=own_search.id and (sl.city is null or lower(sl.city)=lower(l.city)))
      and (
        not exists(select 1 from public.search_property_types st where st.search_profile_id=own_search.id)
        or exists(select 1 from public.search_property_types st where st.search_profile_id=own_search.id and st.property_type=l.property_type)
      )
      and (own_search.max_rent is null or l.monthly_rent<=own_search.max_rent)
      and (own_search.min_rent is null or l.monthly_rent>=own_search.min_rent)
      and (own_search.min_rooms is null or l.rooms>=own_search.min_rooms)
      and (own_search.min_bedrooms is null or l.bedrooms>=own_search.min_bedrooms)
      and (own_search.min_living_area_m2 is null or l.living_area_m2>=own_search.min_living_area_m2)
      and (not own_search.garden_required or l.has_garden)
      and (not own_search.balcony_required or l.has_balcony)
      and (not own_search.elevator_required or l.has_elevator)
      and (not own_search.ground_floor_required or l.ground_floor)
      and (not own_search.wheelchair_required or l.wheelchair_accessible)
      and exists(select 1 from public.search_locations sl where sl.search_profile_id=sp.id and (sl.city is null or lower(sl.city)=lower(own_listing.city)))
      and (
        not exists(select 1 from public.search_property_types st where st.search_profile_id=sp.id)
        or exists(select 1 from public.search_property_types st where st.search_profile_id=sp.id and st.property_type=own_listing.property_type)
      )
      and (sp.max_rent is null or own_listing.monthly_rent<=sp.max_rent)
      and (sp.min_rent is null or own_listing.monthly_rent>=sp.min_rent)
      and (sp.min_rooms is null or own_listing.rooms>=sp.min_rooms)
      and (sp.min_bedrooms is null or own_listing.bedrooms>=sp.min_bedrooms)
      and (sp.min_living_area_m2 is null or own_listing.living_area_m2>=sp.min_living_area_m2)
      and (not sp.garden_required or own_listing.has_garden)
      and (not sp.balcony_required or own_listing.has_balcony)
      and (not sp.elevator_required or own_listing.has_elevator)
      and (not sp.ground_floor_required or own_listing.ground_floor)
      and (not sp.wheelchair_required or own_listing.wheelchair_accessible)
  loop
    insert into public.matches(listing_a_id,listing_b_id,user_a_id,user_b_id,score,reasons)
    values(
      case when own_listing.id<candidate.id then own_listing.id else candidate.id end,
      case when own_listing.id<candidate.id then candidate.id else own_listing.id end,
      case when own_listing.id<candidate.id then p_user_id else candidate.user_id end,
      case when own_listing.id<candidate.id then candidate.user_id else p_user_id end,
      90,
      jsonb_build_array('Woonplaats past over en weer','Woningtype past over en weer','Huur en kamers passen')
    ) on conflict(listing_a_id,listing_b_id) do nothing returning id into new_match;
    if new_match is not null then
      insert into public.match_decisions(match_id,user_id) values(new_match,p_user_id),(new_match,candidate.user_id);
      insert into public.conversations(match_id) values(new_match) returning id into convo;
      insert into public.conversation_members(conversation_id,user_id) values(convo,p_user_id),(convo,candidate.user_id);
      insert into public.notifications(user_id,type,title,body,href) values
        (p_user_id,'new_match','Nieuwe woningruil gevonden','Er is een wederzijdse match. Bekijk de woning; activeer je zoekpas om contact te leggen.', '/matches/'||new_match),
        (candidate.user_id,'new_match','Nieuwe woningruil gevonden','Er is een wederzijdse match. Bekijk de woning; activeer je zoekpas om contact te leggen.', '/matches/'||new_match);
      made:=made+1;
    end if;
    new_match:=null;
  end loop;
  return made;
end$$;

create or replace function public.trigger_refresh_matches_after_access()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if new.status='active' and new.expires_at>now() then
    perform public.refresh_matches_for_user(new.user_id);
  end if;
  return new;
end$$;

drop trigger if exists refresh_matches_after_access on public.access_passes;
create trigger refresh_matches_after_access
after insert or update of status,expires_at on public.access_passes
for each row execute function public.trigger_refresh_matches_after_access();

revoke all on function public.has_paid_search_access(uuid) from public,anon;
revoke all on function public.has_trial_search_access(uuid) from public,anon;
revoke all on function public.has_search_discovery_access(uuid) from public,anon;
grant execute on function public.has_paid_search_access(uuid) to authenticated,service_role;
grant execute on function public.has_trial_search_access(uuid) to authenticated,service_role;
grant execute on function public.has_search_discovery_access(uuid) to authenticated,service_role;

-- Activeer onmiddellijk eventuele matches voor bestaande accounts die bij de
-- introductie een proefmaand ontvangen.
do $$
declare r record;
begin
  for r in
    select distinct sp.user_id
    from public.search_profiles sp
    join public.listings l on l.user_id=sp.user_id
    where sp.status='active' and l.status='active'
  loop
    perform public.refresh_matches_for_user(r.user_id);
  end loop;
end$$;

insert into public.atlas_staff_audit_logs(action,actor_email,details)
values('free_search_trial_enabled','system',jsonb_build_object('version','8.8','days',30,'paid_interaction_required',true));
