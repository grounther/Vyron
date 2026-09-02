-- ASORTA Woningruil v8.0
-- Nieuwe productbasis naast het gearchiveerde ticketmodel.
create extension if not exists pgcrypto;

create sequence if not exists public.ruiler_number_seq start 1;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  user_number bigint not null unique default nextval('public.ruiler_number_seq'),
  system_username text not null unique,
  custom_display_name text,
  display_name_mode text not null default 'system' check (display_name_mode in ('system','custom')),
  phone text,
  onboarding_completed boolean not null default false,
  blocked_at timestamptz,
  last_active_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (custom_display_name is null or (char_length(custom_display_name) between 3 and 30 and custom_display_name !~* '(^ruiler#|@|https?://|www\.|asorta|support|admin|woningcorporatie|geverifieerd|✓)'))
);

create or replace function public.create_profile_for_user()
returns trigger language plpgsql security definer set search_path=public as $$
declare n bigint;
begin
  n := nextval('public.ruiler_number_seq');
  insert into public.profiles(id,user_number,system_username)
  values(new.id,n,'Ruiler#' || lpad(n::text,5,'0'))
  on conflict(id) do nothing;
  return new;
end$$;

drop trigger if exists create_profile_after_signup on auth.users;
create trigger create_profile_after_signup after insert on auth.users
for each row execute function public.create_profile_for_user();

do $$
declare r record; n bigint;
begin
  for r in select u.id from auth.users u left join public.profiles p on p.id=u.id where p.id is null loop
    n := nextval('public.ruiler_number_seq');
    insert into public.profiles(id,user_number,system_username) values(r.id,n,'Ruiler#' || lpad(n::text,5,'0'));
  end loop;
end$$;

create table if not exists public.housing_providers (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  provider_type text not null default 'housing_corporation' check (provider_type in ('housing_corporation','private_landlord','municipality','other')),
  website_url text,
  contact_email text,
  contact_phone text,
  swap_info_url text,
  swap_application_url text,
  swap_instructions text,
  street text,
  house_number text,
  postcode text,
  city text,
  source_url text,
  last_verified_at timestamptz,
  verified boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.housing_providers(name,provider_type,verified) values
  ('SallandWonen','housing_corporation',false),
  ('Woonbedrijf ieder1','housing_corporation',false),
  ('deltaWonen','housing_corporation',false),
  ('Portaal','housing_corporation',false),
  ('Ymere','housing_corporation',false),
  ('Eigen Haard','housing_corporation',false),
  ('De Woonplaats','housing_corporation',false),
  ('Woonstad Rotterdam','housing_corporation',false),
  ('Andere verhuurder','other',false)
on conflict(name) do nothing;

create table if not exists public.housing_provider_suggestions (
  id uuid primary key default gen_random_uuid(),
  submitted_by uuid not null references auth.users(id) on delete cascade,
  name text not null,
  website_url text,
  contact_details text,
  status text not null default 'pending' check(status in ('pending','approved','rejected')),
  created_at timestamptz not null default now()
);

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  housing_provider_id uuid not null references public.housing_providers(id) on delete restrict,
  status text not null default 'draft' check(status in ('draft','pending_payment','active','paused','reserved','swapped','removed','rejected')),
  property_type text not null check(property_type in ('apartment','house','maisonette','studio','senior','other')),
  province text not null,
  municipality text not null,
  city text not null,
  district text,
  postcode4 text not null check(postcode4 ~ '^[1-9][0-9]{3}$'),
  street text not null,
  house_number text not null,
  monthly_rent numeric(10,2) not null check(monthly_rent > 0),
  service_costs numeric(10,2) not null default 0 check(service_costs >= 0),
  living_area_m2 integer check(living_area_m2 between 10 and 1000),
  rooms integer not null check(rooms between 1 and 30),
  bedrooms integer check(bedrooms between 0 and 20),
  floor integer,
  has_garden boolean not null default false,
  has_balcony boolean not null default false,
  has_elevator boolean not null default false,
  ground_floor boolean not null default false,
  wheelchair_accessible boolean not null default false,
  accessibility text,
  household_size integer check(household_size between 1 and 20),
  description text not null check(char_length(description) between 30 and 3000),
  available_from date,
  activated_at timestamptz,
  last_confirmed_at timestamptz,
  confirmation_due_at timestamptz,
  blocked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists listings_one_live_per_user on public.listings(user_id) where status in ('draft','pending_payment','active','paused','reserved');
create index if not exists listings_public_search on public.listings(status,province,city,property_type,monthly_rent,rooms);

create table if not exists public.listing_photos (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  storage_path text not null unique,
  position integer not null default 0 check(position between 0 and 20),
  alt_text text,
  created_at timestamptz not null default now()
);
create index if not exists listing_photos_listing on public.listing_photos(listing_id,position);

create table if not exists public.search_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  status text not null default 'active' check(status in ('draft','active','paused')),
  min_rent numeric(10,2) check(min_rent >= 0),
  max_rent numeric(10,2) check(max_rent >= 0),
  min_rooms integer check(min_rooms between 1 and 30),
  min_bedrooms integer check(min_bedrooms between 0 and 20),
  min_living_area_m2 integer check(min_living_area_m2 between 10 and 1000),
  garden_required boolean not null default false,
  balcony_required boolean not null default false,
  elevator_required boolean not null default false,
  ground_floor_required boolean not null default false,
  wheelchair_required boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check(max_rent is null or min_rent is null or max_rent >= min_rent)
);

create table if not exists public.search_locations (
  id uuid primary key default gen_random_uuid(),
  search_profile_id uuid not null references public.search_profiles(id) on delete cascade,
  province text,
  municipality text,
  city text,
  district text,
  created_at timestamptz not null default now(),
  check(province is not null or municipality is not null or city is not null or district is not null)
);

create table if not exists public.search_property_types (
  search_profile_id uuid not null references public.search_profiles(id) on delete cascade,
  property_type text not null check(property_type in ('apartment','house','maisonette','studio','senior','other')),
  primary key(search_profile_id,property_type)
);

create table if not exists public.access_passes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  payment_id uuid,
  starts_at timestamptz not null,
  expires_at timestamptz not null,
  status text not null default 'active' check(status in ('active','expired','refunded')),
  created_at timestamptz not null default now(),
  check(expires_at > starts_at)
);
create unique index if not exists access_passes_one_active on public.access_passes(user_id) where status='active';

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  purpose text not null check(purpose in ('search_year','listing_activation')),
  listing_id uuid references public.listings(id) on delete restrict,
  provider text not null default 'mollie' check(provider='mollie'),
  provider_payment_id text unique,
  amount numeric(10,2) not null check(amount > 0),
  currency char(3) not null default 'EUR',
  status text not null default 'open' check(status in ('open','pending','paid','failed','expired','canceled','refunded')),
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check((purpose='listing_activation' and listing_id is not null) or (purpose='search_year' and listing_id is null))
);
alter table public.access_passes drop constraint if exists access_passes_payment_id_fkey;
alter table public.access_passes add constraint access_passes_payment_id_fkey foreign key(payment_id) references public.payments(id) on delete restrict;

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check(type in ('new_match','new_message','listing_expiring','membership_expiring','listing_paused','payment_success','swap_update')),
  title text not null,
  body text not null,
  href text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_created on public.notifications(user_id,created_at desc);

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  listing_a_id uuid not null references public.listings(id) on delete restrict,
  listing_b_id uuid not null references public.listings(id) on delete restrict,
  user_a_id uuid not null references auth.users(id) on delete restrict,
  user_b_id uuid not null references auth.users(id) on delete restrict,
  status text not null default 'active' check(status in ('active','declined','temporarily_unavailable','swap_in_progress','cancelled','completed')),
  score integer not null default 0 check(score between 0 and 100),
  reasons jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check(listing_a_id <> listing_b_id and user_a_id <> user_b_id),
  unique(listing_a_id,listing_b_id)
);
create index if not exists matches_user_a on public.matches(user_a_id,status,created_at desc);
create index if not exists matches_user_b on public.matches(user_b_id,status,created_at desc);

create table if not exists public.match_decisions (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  decision text not null default 'pending' check(decision in ('pending','yes','no')),
  decided_at timestamptz,
  updated_at timestamptz not null default now(),
  unique(match_id,user_id)
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null unique references public.matches(id) on delete cascade,
  status text not null default 'active' check(status in ('active','closed','archived')),
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.conversation_members (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  share_real_name boolean not null default false,
  share_email boolean not null default false,
  share_phone boolean not null default false,
  joined_at timestamptz not null default now(),
  primary key(conversation_id,user_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null check(char_length(body) between 1 and 2000),
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists messages_conversation_created on public.messages(conversation_id,created_at);

create table if not exists public.swap_cases (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null unique references public.matches(id) on delete restrict,
  listing_a_id uuid not null references public.listings(id) on delete restrict,
  listing_b_id uuid not null references public.listings(id) on delete restrict,
  user_a_id uuid not null references auth.users(id) on delete restrict,
  user_b_id uuid not null references auth.users(id) on delete restrict,
  provider_a_id uuid not null references public.housing_providers(id) on delete restrict,
  provider_b_id uuid not null references public.housing_providers(id) on delete restrict,
  status text not null default 'started' check(status in ('started','contacting_landlords','application_submitted','awaiting_decision','approved','rejected','cancelled','completed')),
  completed_by_a_at timestamptz,
  completed_by_b_at timestamptz,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.swap_provider_status (
  id uuid primary key default gen_random_uuid(),
  swap_case_id uuid not null references public.swap_cases(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  provider_id uuid not null references public.housing_providers(id) on delete restrict,
  status text not null default 'not_started' check(status in ('not_started','contacted','submitted','pending','approved','rejected')),
  updated_at timestamptz not null default now(),
  unique(swap_case_id,user_id)
);

create table if not exists public.user_residences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  source_listing_id uuid not null references public.listings(id) on delete restrict,
  housing_provider_id uuid not null references public.housing_providers(id) on delete restrict,
  property_type text not null,
  province text not null,
  municipality text not null,
  city text not null,
  district text,
  postcode4 text not null,
  street text not null,
  house_number text not null,
  monthly_rent numeric(10,2) not null,
  rooms integer not null,
  bedrooms integer,
  has_garden boolean not null,
  has_balcony boolean not null,
  has_elevator boolean not null,
  ground_floor boolean not null,
  acquired_via_swap_case_id uuid references public.swap_cases(id) on delete restrict,
  active boolean not null default true,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index if not exists residences_one_active_per_user on public.user_residences(user_id) where active;

create table if not exists public.blocks (
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(blocker_id,blocked_id),
  check(blocker_id <> blocked_id)
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reported_user_id uuid references auth.users(id) on delete set null,
  listing_id uuid references public.listings(id) on delete set null,
  conversation_id uuid references public.conversations(id) on delete set null,
  reason text not null,
  details text,
  status text not null default 'open' check(status in ('open','reviewing','resolved','dismissed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.legal_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  document_type text not null check(document_type in ('terms','privacy','immediate_service','marketing')),
  document_version text not null,
  accepted boolean not null,
  accepted_at timestamptz not null default now(),
  ip_hash text,
  unique(user_id,document_type,document_version)
);

-- Alleen velden die veilig openbaar mogen zijn.
create or replace view public.public_listings with (security_barrier=true) as
select l.id,l.property_type,l.province,l.municipality,l.city,l.district,l.monthly_rent,
       l.living_area_m2,l.rooms,l.bedrooms,l.has_garden,l.has_balcony,l.has_elevator,
       l.ground_floor,l.wheelchair_accessible,l.accessibility,l.description,l.available_from,
       l.created_at,h.name as provider_name
from public.listings l
join public.housing_providers h on h.id=l.housing_provider_id
where l.status='active' and l.blocked_at is null;

create or replace view public.public_profiles with (security_barrier=true) as
select id,system_username,
       case when display_name_mode='custom' and custom_display_name is not null then custom_display_name else system_username end as display_name
from public.profiles
where blocked_at is null;

create or replace view public.match_listings with (security_barrier=true) as
select m.id as match_id,l.id,l.user_id,l.property_type,l.province,l.municipality,l.city,l.district,
       l.monthly_rent,l.living_area_m2,l.rooms,l.bedrooms,l.has_garden,l.has_balcony,l.has_elevator,
       l.ground_floor,l.wheelchair_accessible,l.accessibility,l.description,l.available_from,
       h.name as provider_name
from public.matches m
join public.listings l on l.id in(m.listing_a_id,m.listing_b_id)
join public.housing_providers h on h.id=l.housing_provider_id
where auth.uid() in(m.user_a_id,m.user_b_id)
  and (m.status in('swap_in_progress','completed') or exists(select 1 from public.access_passes a where a.user_id=auth.uid() and a.status='active' and a.expires_at>now()));

-- Helperfuncties voorkomen recursieve RLS-policies.
create or replace function public.is_match_participant(p_match_id uuid,p_user_id uuid default auth.uid())
returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.matches m where m.id=p_match_id and p_user_id in (m.user_a_id,m.user_b_id))
$$;

create or replace function public.is_conversation_member(p_conversation_id uuid,p_user_id uuid default auth.uid())
returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.conversation_members cm where cm.conversation_id=p_conversation_id and cm.user_id=p_user_id)
$$;

create or replace function public.can_access_match(p_match_id uuid,p_user_id uuid default auth.uid())
returns boolean language sql stable security definer set search_path=public as $$
  select exists(
    select 1 from public.matches m
    where m.id=p_match_id and p_user_id in(m.user_a_id,m.user_b_id)
      and (
        m.status in('swap_in_progress','completed') or
        exists(select 1 from public.access_passes a where a.user_id=p_user_id and a.status='active' and a.expires_at>now())
      )
  )
$$;

create or replace function public.can_access_conversation(p_conversation_id uuid,p_user_id uuid default auth.uid())
returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.conversations c where c.id=p_conversation_id and public.can_access_match(c.match_id,p_user_id))
$$;

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
      -- De kandidaatwoning past bij de zoekwensen van de huidige gebruiker.
      and exists(select 1 from public.search_locations sl where sl.search_profile_id=own_search.id and (sl.city is null or lower(sl.city)=lower(l.city)))
      and exists(select 1 from public.search_property_types st where st.search_profile_id=own_search.id and st.property_type=l.property_type)
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
      -- De eigen woning past óók bij de zoekwensen van de kandidaat.
      and exists(select 1 from public.search_locations sl where sl.search_profile_id=sp.id and (sl.city is null or lower(sl.city)=lower(own_listing.city)))
      and exists(select 1 from public.search_property_types st where st.search_profile_id=sp.id and st.property_type=own_listing.property_type)
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

create or replace function public.trigger_refresh_matches()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if new.status='active' then perform public.refresh_matches_for_user(new.user_id); end if;
  return new;
end$$;

drop trigger if exists refresh_matches_after_listing on public.listings;
create trigger refresh_matches_after_listing after insert or update of status,updated_at on public.listings
for each row when(new.status='active') execute function public.trigger_refresh_matches();
drop trigger if exists refresh_matches_after_search on public.search_profiles;
create trigger refresh_matches_after_search after insert or update of status,updated_at on public.search_profiles
for each row when(new.status='active') execute function public.trigger_refresh_matches();

alter table public.profiles enable row level security;
alter table public.housing_providers enable row level security;
alter table public.housing_provider_suggestions enable row level security;
alter table public.listings enable row level security;
alter table public.listing_photos enable row level security;
alter table public.search_profiles enable row level security;
alter table public.search_locations enable row level security;
alter table public.search_property_types enable row level security;
alter table public.access_passes enable row level security;
alter table public.payments enable row level security;
alter table public.notifications enable row level security;
alter table public.matches enable row level security;
alter table public.match_decisions enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;
alter table public.swap_cases enable row level security;
alter table public.swap_provider_status enable row level security;
alter table public.user_residences enable row level security;
alter table public.blocks enable row level security;
alter table public.reports enable row level security;
alter table public.legal_consents enable row level security;

create policy "profile owner reads" on public.profiles for select to authenticated using(auth.uid()=id);
create policy "profile owner updates" on public.profiles for update to authenticated using(auth.uid()=id) with check(auth.uid()=id);
create policy "active providers public" on public.housing_providers for select using(active=true);
create policy "submit provider suggestion" on public.housing_provider_suggestions for insert to authenticated with check(auth.uid()=submitted_by);
create policy "own provider suggestions" on public.housing_provider_suggestions for select to authenticated using(auth.uid()=submitted_by);
create policy "own listings" on public.listings for select to authenticated using(auth.uid()=user_id);
create policy "create own listing" on public.listings for insert to authenticated with check(auth.uid()=user_id and status in ('draft','pending_payment'));
create policy "update own listing" on public.listings for update to authenticated using(auth.uid()=user_id) with check(auth.uid()=user_id and status in ('draft','pending_payment','paused','removed'));
create policy "remove own listing" on public.listings for delete to authenticated using(auth.uid()=user_id and status in ('draft','pending_payment','paused'));
create policy "own listing photos" on public.listing_photos for all to authenticated using(exists(select 1 from public.listings l where l.id=listing_id and l.user_id=auth.uid())) with check(exists(select 1 from public.listings l where l.id=listing_id and l.user_id=auth.uid()));
create policy "own search profile" on public.search_profiles for all to authenticated using(auth.uid()=user_id) with check(auth.uid()=user_id);
create policy "own search locations" on public.search_locations for all to authenticated using(exists(select 1 from public.search_profiles s where s.id=search_profile_id and s.user_id=auth.uid())) with check(exists(select 1 from public.search_profiles s where s.id=search_profile_id and s.user_id=auth.uid()));
create policy "own search property types" on public.search_property_types for all to authenticated using(exists(select 1 from public.search_profiles s where s.id=search_profile_id and s.user_id=auth.uid())) with check(exists(select 1 from public.search_profiles s where s.id=search_profile_id and s.user_id=auth.uid()));
create policy "own access passes" on public.access_passes for select to authenticated using(auth.uid()=user_id);
create policy "own payments" on public.payments for select to authenticated using(auth.uid()=user_id);
create policy "own notifications" on public.notifications for select to authenticated using(auth.uid()=user_id);
create policy "mark own notifications" on public.notifications for update to authenticated using(auth.uid()=user_id) with check(auth.uid()=user_id);
create policy "match participants read" on public.matches for select to authenticated using(public.can_access_match(id));
create policy "match participants decisions" on public.match_decisions for select to authenticated using(public.can_access_match(match_id));
create policy "members read conversations" on public.conversations for select to authenticated using(public.can_access_match(match_id));
create policy "members read membership" on public.conversation_members for select to authenticated using(public.can_access_conversation(conversation_id));
create policy "members update own sharing" on public.conversation_members for update to authenticated using(auth.uid()=user_id and public.can_access_conversation(conversation_id)) with check(auth.uid()=user_id);
create policy "members read messages" on public.messages for select to authenticated using(public.can_access_conversation(conversation_id));
create policy "members send messages" on public.messages for insert to authenticated with check(auth.uid()=sender_id and public.can_access_conversation(conversation_id));
create policy "swap participants read" on public.swap_cases for select to authenticated using(auth.uid() in (user_a_id,user_b_id));
create policy "swap participants provider status" on public.swap_provider_status for select to authenticated using(exists(select 1 from public.swap_cases s where s.id=swap_case_id and auth.uid() in (s.user_a_id,s.user_b_id)));
create policy "update own provider status" on public.swap_provider_status for update to authenticated using(auth.uid()=user_id) with check(auth.uid()=user_id);
create policy "own residences" on public.user_residences for select to authenticated using(auth.uid()=user_id);
create policy "own blocks" on public.blocks for all to authenticated using(auth.uid()=blocker_id) with check(auth.uid()=blocker_id);
create policy "create reports" on public.reports for insert to authenticated with check(auth.uid()=reporter_id);
create policy "own reports" on public.reports for select to authenticated using(auth.uid()=reporter_id);
create policy "own legal consents" on public.legal_consents for select to authenticated using(auth.uid()=user_id);
create policy "record own legal consent" on public.legal_consents for insert to authenticated with check(auth.uid()=user_id);

-- Bescherm vaste profielidentiteit tegen directe API-wijzigingen.
revoke update on public.profiles from authenticated;
grant update(custom_display_name,display_name_mode,phone,onboarding_completed,last_active_at,updated_at) on public.profiles to authenticated;

grant select on public.public_listings to anon,authenticated;
grant select on public.public_profiles to authenticated;
grant select on public.match_listings to authenticated;
revoke insert,update,delete on public.public_listings from anon,authenticated;
revoke insert,update,delete on public.public_profiles from anon,authenticated;
revoke insert,update,delete on public.match_listings from anon,authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('listing-photos','listing-photos',false,10485760,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=false,file_size_limit=10485760,allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists "listing owners upload photos" on storage.objects;
create policy "listing owners upload photos" on storage.objects for insert to authenticated
with check(bucket_id='listing-photos' and (storage.foldername(name))[1]=auth.uid()::text);
drop policy if exists "listing owners view photos" on storage.objects;
create policy "listing owners view photos" on storage.objects for select to authenticated
using(bucket_id='listing-photos' and (storage.foldername(name))[1]=auth.uid()::text);
drop policy if exists "listing owners delete photos" on storage.objects;
create policy "listing owners delete photos" on storage.objects for delete to authenticated
using(bucket_id='listing-photos' and (storage.foldername(name))[1]=auth.uid()::text);

create or replace function public.set_match_decision(p_match_id uuid,p_decision text)
returns uuid language plpgsql security definer set search_path=public as $$
declare u uuid:=auth.uid(); m public.matches%rowtype; yes_count integer; c_id uuid; s_id uuid;
begin
  if u is null or p_decision not in ('yes','no') then raise exception 'Ongeldige keuze.'; end if;
  select * into m from public.matches where id=p_match_id and u in(user_a_id,user_b_id)
    and exists(select 1 from public.access_passes a where a.user_id=u and a.status='active' and a.expires_at>now()) for update;
  if not found or m.status not in ('active','temporarily_unavailable') then raise exception 'Deze match is niet beschikbaar.'; end if;
  insert into public.match_decisions(match_id,user_id,decision,decided_at,updated_at)
  values(p_match_id,u,p_decision,now(),now())
  on conflict(match_id,user_id) do update set decision=excluded.decision,decided_at=excluded.decided_at,updated_at=now();
  if p_decision='no' then
    update public.matches set status='declined',updated_at=now() where id=p_match_id;
    update public.conversations set status='closed' where match_id=p_match_id;
    return null;
  end if;
  select count(*) into yes_count from public.match_decisions where match_id=p_match_id and decision='yes';
  if yes_count=2 then
    update public.matches set status='swap_in_progress',updated_at=now() where id=p_match_id;
    update public.listings set status='reserved',updated_at=now() where id in(m.listing_a_id,m.listing_b_id) and status='active';
    update public.matches set status='temporarily_unavailable',updated_at=now()
      where id<>p_match_id and status='active' and (listing_a_id in(m.listing_a_id,m.listing_b_id) or listing_b_id in(m.listing_a_id,m.listing_b_id));
    insert into public.swap_cases(match_id,listing_a_id,listing_b_id,user_a_id,user_b_id,provider_a_id,provider_b_id)
      select m.id,m.listing_a_id,m.listing_b_id,m.user_a_id,m.user_b_id,a.housing_provider_id,b.housing_provider_id
      from public.listings a,public.listings b where a.id=m.listing_a_id and b.id=m.listing_b_id
      on conflict(match_id) do update set updated_at=now() returning id into s_id;
    insert into public.swap_provider_status(swap_case_id,user_id,provider_id)
      select s_id,m.user_a_id,l.housing_provider_id from public.listings l where l.id=m.listing_a_id
      union all select s_id,m.user_b_id,l.housing_provider_id from public.listings l where l.id=m.listing_b_id
      on conflict(swap_case_id,user_id) do nothing;
  end if;
  return s_id;
end$$;

create or replace function public.cancel_swap_case(p_swap_case_id uuid)
returns void language plpgsql security definer set search_path=public as $$
declare u uuid:=auth.uid(); s public.swap_cases%rowtype;
begin
  select * into s from public.swap_cases where id=p_swap_case_id and u in(user_a_id,user_b_id) for update;
  if not found or s.status in('completed','cancelled','rejected') then raise exception 'Dit ruilproces kan niet worden gestopt.'; end if;
  update public.swap_cases set status='cancelled',cancelled_at=now(),updated_at=now() where id=s.id;
  update public.matches set status='cancelled',updated_at=now() where id=s.match_id;
  update public.listings set status='active',last_confirmed_at=coalesce(last_confirmed_at,now()),updated_at=now() where id in(s.listing_a_id,s.listing_b_id) and status='reserved';
  update public.matches set status='active',updated_at=now() where status='temporarily_unavailable' and (listing_a_id in(s.listing_a_id,s.listing_b_id) or listing_b_id in(s.listing_a_id,s.listing_b_id));
  insert into public.notifications(user_id,type,title,body,href) values
    (case when u=s.user_a_id then s.user_b_id else s.user_a_id end,'swap_update','Woningruil gestopt','De andere woningruiler heeft de ruil gestopt. Je woning doet automatisch weer mee met matching.','/matches');
end$$;

create or replace function public.sync_swap_case_status()
returns trigger language plpgsql security definer set search_path=public as $$
declare s public.swap_cases%rowtype; approved_count integer; active_count integer; rejected_count integer;
begin
  select * into s from public.swap_cases where id=new.swap_case_id for update;
  select count(*) filter(where status='approved'),count(*) filter(where status in('submitted','pending','approved')),count(*) filter(where status='rejected')
    into approved_count,active_count,rejected_count from public.swap_provider_status where swap_case_id=s.id;
  if rejected_count>0 and s.status not in('rejected','cancelled','completed') then
    update public.swap_cases set status='rejected',updated_at=now() where id=s.id;
    update public.matches set status='cancelled',updated_at=now() where id=s.match_id;
    update public.listings set status='active',last_confirmed_at=now(),confirmation_due_at=now()+interval '90 days',updated_at=now() where id in(s.listing_a_id,s.listing_b_id) and status='reserved';
    update public.matches set status='active',updated_at=now() where status='temporarily_unavailable' and (listing_a_id in(s.listing_a_id,s.listing_b_id) or listing_b_id in(s.listing_a_id,s.listing_b_id));
    insert into public.notifications(user_id,type,title,body,href) values
      (s.user_a_id,'swap_update','Woningruil niet goedgekeurd','Eén van de verhuurders heeft de woningruil afgewezen. Je woning doet weer mee met matching.','/matches'),
      (s.user_b_id,'swap_update','Woningruil niet goedgekeurd','Eén van de verhuurders heeft de woningruil afgewezen. Je woning doet weer mee met matching.','/matches');
  elsif approved_count=2 and s.status<>'approved' then
    update public.swap_cases set status='approved',updated_at=now() where id=s.id;
    insert into public.notifications(user_id,type,title,body,href) values
      (s.user_a_id,'swap_update','Beide verhuurders akkoord','Jullie kunnen de woningruil afronden zodra de verhuizing werkelijk is voltooid.','/matches/'||s.match_id),
      (s.user_b_id,'swap_update','Beide verhuurders akkoord','Jullie kunnen de woningruil afronden zodra de verhuizing werkelijk is voltooid.','/matches/'||s.match_id);
  elsif active_count=2 and s.status not in('awaiting_decision','approved') then
    update public.swap_cases set status='awaiting_decision',updated_at=now() where id=s.id;
  elsif new.status='contacted' and s.status='started' then
    update public.swap_cases set status='contacting_landlords',updated_at=now() where id=s.id;
  end if;
  return new;
end$$;

drop trigger if exists sync_swap_after_provider_progress on public.swap_provider_status;
create trigger sync_swap_after_provider_progress after insert or update of status on public.swap_provider_status
for each row execute function public.sync_swap_case_status();

create or replace function public.confirm_listing_available(p_listing_id uuid)
returns void language plpgsql security definer set search_path=public as $$
declare u uuid:=auth.uid(); owner_id uuid;
begin
  update public.listings set status='active',last_confirmed_at=now(),confirmation_due_at=now()+interval '90 days',updated_at=now()
    where id=p_listing_id and user_id=u and status in('active','paused') returning user_id into owner_id;
  if owner_id is null then raise exception 'Deze woning kan niet worden bevestigd.'; end if;
end$$;

create or replace function public.run_daily_maintenance()
returns jsonb language plpgsql security definer set search_path=public as $$
declare paused_count integer; expired_count integer;
begin
  insert into public.notifications(user_id,type,title,body,href)
  select l.user_id,'listing_expiring','Is je woning nog beschikbaar?','Bevestig vóór de controledatum dat je woning nog beschikbaar is.','/account'
  from public.listings l where l.status='active' and l.confirmation_due_at between now() and now()+interval '7 days'
    and not exists(select 1 from public.notifications n where n.user_id=l.user_id and n.type='listing_expiring' and n.created_at>now()-interval '30 days');
  insert into public.notifications(user_id,type,title,body,href)
  select a.user_id,'membership_expiring','Je zoektoegang verloopt over 30 dagen','Verleng opnieuw voor één jaar wanneer je wilt. Er is geen automatische verlenging.','/pricing'
  from public.access_passes a where a.status='active' and a.expires_at between now()+interval '29 days' and now()+interval '31 days'
    and not exists(select 1 from public.notifications n where n.user_id=a.user_id and n.type='membership_expiring' and n.title like '%30 dagen%' and n.created_at>now()-interval '60 days');
  insert into public.notifications(user_id,type,title,body,href)
  select a.user_id,'membership_expiring','Je zoektoegang verloopt over 7 dagen','Je kunt straks opnieuw één jaar activeren voor €5.','/pricing'
  from public.access_passes a where a.status='active' and a.expires_at between now()+interval '6 days' and now()+interval '8 days'
    and not exists(select 1 from public.notifications n where n.user_id=a.user_id and n.type='membership_expiring' and n.title like '%7 dagen%' and n.created_at>now()-interval '30 days');
  with paused as (
    update public.listings set status='paused',updated_at=now() where status='active' and confirmation_due_at<=now() returning user_id
  ) insert into public.notifications(user_id,type,title,body,href)
    select user_id,'listing_paused','Je woning is gepauzeerd','Bevestig dat je woning nog beschikbaar is om opnieuw mee te doen met matching.','/account' from paused;
  get diagnostics paused_count=row_count;
  update public.access_passes set status='expired' where status='active' and expires_at<=now();
  get diagnostics expired_count=row_count;
  return jsonb_build_object('paused_listings',paused_count,'expired_passes',expired_count);
end$$;

create or replace function public.confirm_swap_completion(p_swap_case_id uuid)
returns boolean language plpgsql security definer set search_path=public as $$
declare u uuid:=auth.uid(); s public.swap_cases%rowtype; a public.listings%rowtype; b public.listings%rowtype;
begin
  select * into s from public.swap_cases where id=p_swap_case_id and u in(user_a_id,user_b_id) for update;
  if not found or s.status not in('approved','awaiting_decision') then raise exception 'De ruil kan nog niet als voltooid worden bevestigd.'; end if;
  if u=s.user_a_id then update public.swap_cases set completed_by_a_at=coalesce(completed_by_a_at,now()),updated_at=now() where id=s.id;
  else update public.swap_cases set completed_by_b_at=coalesce(completed_by_b_at,now()),updated_at=now() where id=s.id; end if;
  select * into s from public.swap_cases where id=s.id;
  if s.completed_by_a_at is null or s.completed_by_b_at is null then return false; end if;
  select * into a from public.listings where id=s.listing_a_id;
  select * into b from public.listings where id=s.listing_b_id;
  update public.user_residences set active=false,ended_at=now() where user_id in(s.user_a_id,s.user_b_id) and active;
  insert into public.user_residences(user_id,source_listing_id,housing_provider_id,property_type,province,municipality,city,district,postcode4,street,house_number,monthly_rent,rooms,bedrooms,has_garden,has_balcony,has_elevator,ground_floor,acquired_via_swap_case_id)
  values
    (s.user_a_id,b.id,b.housing_provider_id,b.property_type,b.province,b.municipality,b.city,b.district,b.postcode4,b.street,b.house_number,b.monthly_rent,b.rooms,b.bedrooms,b.has_garden,b.has_balcony,b.has_elevator,b.ground_floor,s.id),
    (s.user_b_id,a.id,a.housing_provider_id,a.property_type,a.province,a.municipality,a.city,a.district,a.postcode4,a.street,a.house_number,a.monthly_rent,a.rooms,a.bedrooms,a.has_garden,a.has_balcony,a.has_elevator,a.ground_floor,s.id);
  update public.swap_cases set status='completed',completed_at=now(),updated_at=now() where id=s.id;
  update public.matches set status='completed',updated_at=now() where id=s.match_id;
  update public.listings set status='swapped',updated_at=now() where id in(s.listing_a_id,s.listing_b_id);
  update public.search_profiles set status='paused',updated_at=now() where user_id in(s.user_a_id,s.user_b_id);
  update public.conversations set status='archived' where match_id=s.match_id;
  insert into public.notifications(user_id,type,title,body,href) values
    (s.user_a_id,'swap_update','Woningruil voltooid','Je nieuwe woning is aan je Asorta-profiel gekoppeld.','/account'),
    (s.user_b_id,'swap_update','Woningruil voltooid','Je nieuwe woning is aan je Asorta-profiel gekoppeld.','/account');
  return true;
end$$;

revoke all on function public.set_match_decision(uuid,text) from public,anon;
revoke all on function public.cancel_swap_case(uuid) from public,anon;
revoke all on function public.confirm_swap_completion(uuid) from public,anon;
revoke all on function public.confirm_listing_available(uuid) from public,anon;
revoke all on function public.run_daily_maintenance() from public,anon,authenticated;
revoke all on function public.refresh_matches_for_user(uuid) from public,anon,authenticated;
grant execute on function public.set_match_decision(uuid,text) to authenticated;
grant execute on function public.cancel_swap_case(uuid) to authenticated;
grant execute on function public.confirm_swap_completion(uuid) to authenticated;
grant execute on function public.confirm_listing_available(uuid) to authenticated;
grant execute on function public.run_daily_maintenance() to service_role;

do $$ begin
  begin alter publication supabase_realtime add table public.messages; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.notifications; exception when duplicate_object then null; end;
end $$;
