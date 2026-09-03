-- ASORTA Woningruil v8.3 — zoekprofielopslag en gebruikersbeheer
-- Uitvoeren na v8_2_housing_staff_permissions.sql.

alter table public.admin_users add column if not exists can_users boolean not null default false;
update public.admin_users set can_users=true,updated_at=now()
where active=true and (is_owner=true or lower(coalesce(role,'')) in ('owner','admin'));

-- Medewerkers die al het gevoelige instellingenrecht hadden, behouden de
-- volledige woningruiltoegang die v8.2 hun heeft toegekend.
insert into public.atlas_staff_badges(staff_member_id,badge,active,granted_by,granted_at)
select distinct staff_member_id,'users',true,'v8.3-migratie',now()
from public.atlas_staff_badges
where badge='settings' and active=true
on conflict(staff_member_id,badge) do update set
  active=true,granted_by=excluded.granted_by,granted_at=excluded.granted_at;

-- Geen woningtype kiezen betekent voortaan: alle woningtypen zijn toegestaan.
create or replace function public.refresh_matches_for_user(p_user_id uuid)
returns integer language plpgsql security definer set search_path=public as $$
declare own_listing public.listings%rowtype; own_search public.search_profiles%rowtype; candidate record; new_match uuid; convo uuid; made integer:=0;
begin
  select * into own_listing from public.listings where user_id=p_user_id and status='active' limit 1;
  select * into own_search from public.search_profiles where user_id=p_user_id and status='active' limit 1;
  if own_listing.id is null or own_search.id is null then return 0; end if;
  for candidate in
    select l.*,sp.id as search_id
    from public.listings l join public.search_profiles sp on sp.user_id=l.user_id and sp.status='active'
    where l.status='active' and l.user_id<>p_user_id
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
        (p_user_id,'new_match','Nieuwe woningruil gevonden','Er is een wederzijdse match voor jouw woning.', '/matches/'||new_match),
        (candidate.user_id,'new_match','Nieuwe woningruil gevonden','Er is een wederzijdse match voor jouw woning.', '/matches/'||new_match);
      made:=made+1;
    end if;
    new_match:=null;
  end loop;
  return made;
end$$;

-- Eén transactie voorkomt dat een profiel half wordt opgeslagen wanneer één
-- van de locaties of woningtypen niet kan worden verwerkt.
create or replace function public.save_search_profile(
  p_locations text[],
  p_property_types text[],
  p_min_rent numeric,
  p_max_rent numeric,
  p_min_rooms integer,
  p_min_bedrooms integer,
  p_min_living_area_m2 integer,
  p_garden_required boolean,
  p_balcony_required boolean,
  p_elevator_required boolean,
  p_ground_floor_required boolean,
  p_wheelchair_required boolean,
  p_notes text
)
returns uuid language plpgsql security definer set search_path=public as $$
declare
  u uuid:=auth.uid();
  profile_id uuid;
  location_count integer;
begin
  if u is null then raise exception 'Log opnieuw in om je zoekprofiel op te slaan.'; end if;
  if exists(select 1 from public.profiles where id=u and blocked_at is not null) then
    raise exception 'Dit account is geblokkeerd. Neem contact op met ASORTA.';
  end if;

  select count(distinct lower(btrim(value))) into location_count
  from unnest(coalesce(p_locations,'{}'::text[])) as locations(value)
  where char_length(btrim(value)) between 2 and 100;
  if location_count=0 then raise exception 'Kies minimaal één gewenste plaats.'; end if;
  if p_max_rent is not null and p_min_rent is not null and p_max_rent<p_min_rent then
    raise exception 'De maximale huur kan niet lager zijn dan de minimale huur.';
  end if;
  if exists(
    select 1 from unnest(coalesce(p_property_types,'{}'::text[])) as property_types(value)
    where value not in ('apartment','house','maisonette','studio','senior','other')
  ) then raise exception 'Er is een ongeldig woningtype gekozen.'; end if;

  insert into public.search_profiles(
    user_id,status,min_rent,max_rent,min_rooms,min_bedrooms,min_living_area_m2,
    garden_required,balcony_required,elevator_required,ground_floor_required,
    wheelchair_required,notes,updated_at
  ) values(
    u,'draft',p_min_rent,p_max_rent,p_min_rooms,p_min_bedrooms,p_min_living_area_m2,
    coalesce(p_garden_required,false),coalesce(p_balcony_required,false),
    coalesce(p_elevator_required,false),coalesce(p_ground_floor_required,false),
    coalesce(p_wheelchair_required,false),nullif(left(btrim(coalesce(p_notes,'')),1000),''),now()
  )
  on conflict(user_id) do update set
    status='draft',min_rent=excluded.min_rent,max_rent=excluded.max_rent,
    min_rooms=excluded.min_rooms,min_bedrooms=excluded.min_bedrooms,
    min_living_area_m2=excluded.min_living_area_m2,
    garden_required=excluded.garden_required,balcony_required=excluded.balcony_required,
    elevator_required=excluded.elevator_required,ground_floor_required=excluded.ground_floor_required,
    wheelchair_required=excluded.wheelchair_required,notes=excluded.notes,updated_at=now()
  returning id into profile_id;

  delete from public.search_locations where search_profile_id=profile_id;
  delete from public.search_property_types where search_profile_id=profile_id;

  insert into public.search_locations(search_profile_id,city)
  select profile_id,min(btrim(value))
  from unnest(coalesce(p_locations,'{}'::text[])) as locations(value)
  where char_length(btrim(value)) between 2 and 100
  group by lower(btrim(value))
  limit 12;

  insert into public.search_property_types(search_profile_id,property_type)
  select profile_id,property_type
  from (
    select distinct btrim(value) as property_type
    from unnest(coalesce(p_property_types,'{}'::text[])) as property_types(value)
  ) selected
  where property_type in ('apartment','house','maisonette','studio','senior','other');

  update public.search_profiles set status='active',updated_at=now() where id=profile_id;
  return profile_id;
end$$;

revoke all on function public.save_search_profile(text[],text[],numeric,numeric,integer,integer,integer,boolean,boolean,boolean,boolean,boolean,text) from public,anon;
grant execute on function public.save_search_profile(text[],text[],numeric,numeric,integer,integer,integer,boolean,boolean,boolean,boolean,boolean,text) to authenticated;

insert into public.atlas_staff_audit_logs(action,actor_email,details)
values('search_profile_and_users_enabled','system',jsonb_build_object('version','8.3'));
