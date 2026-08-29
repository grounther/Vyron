-- ASORTA Tickets v7.7 — veilige doorverkoop
alter table public.ticket_listings add column if not exists reserved_until timestamptz;
alter table public.ticket_listings add column if not exists updated_at timestamptz not null default now();

create table if not exists public.ticket_resale_orders (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.ticket_listings(id) on delete restrict,
  ticket_id uuid not null references public.tickets(id) on delete restrict,
  buyer_id uuid not null references auth.users(id) on delete restrict,
  seller_id uuid not null references auth.users(id) on delete restrict,
  asking_price numeric(12,2) not null check (asking_price > 0),
  buyer_fee numeric(12,2) not null check (buyer_fee >= 0),
  seller_fee numeric(12,2) not null check (seller_fee >= 0),
  total numeric(12,2) not null check (total > 0),
  seller_payout numeric(12,2) not null check (seller_payout >= 0),
  currency text not null default 'EUR',
  status text not null default 'pending' check (status in ('pending','paid','failed','cancelled','expired','refunded')),
  payout_status text not null default 'pending' check (payout_status in ('pending','eligible','processing','paid','held','cancelled')),
  mollie_payment_id text unique,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.ticket_resale_orders enable row level security;
create policy "buyers see own resale orders" on public.ticket_resale_orders for select to authenticated using (auth.uid()=buyer_id);
create policy "sellers see own resale sales" on public.ticket_resale_orders for select to authenticated using (auth.uid()=seller_id);

drop policy if exists "active listings are public" on public.ticket_listings;
create policy "active listings are public" on public.ticket_listings for select using (status='active' or auth.uid()=seller_id);

create or replace function public.create_ticket_listing(p_ticket_id uuid,p_asking_price numeric)
returns uuid language plpgsql security definer set search_path=public as $$
declare v_owner uuid:=auth.uid();v_listing uuid;v_face numeric;v_cap numeric;v_status text;v_resale boolean;v_starts timestamptz;
begin
 if v_owner is null then raise exception 'Log eerst in.'; end if;
 select tt.face_value,e.resale_cap_percent,t.status,e.resale_enabled,e.starts_at into v_face,v_cap,v_status,v_resale,v_starts
 from tickets t join ticket_types tt on tt.id=t.ticket_type_id join ticket_events e on e.id=tt.event_id
 where t.id=p_ticket_id and t.owner_id=v_owner for update of t;
 if not found then raise exception 'Ticket niet gevonden.'; end if;
 if v_status<>'valid' then raise exception 'Dit ticket kan niet worden aangeboden.'; end if;
 if not v_resale then raise exception 'Doorverkoop is voor dit evenement uitgeschakeld.'; end if;
 if v_starts<=now() then raise exception 'Dit evenement is al begonnen.'; end if;
 if p_asking_price<=0 then raise exception 'Vul een geldige vraagprijs in.'; end if;
 if p_asking_price>round(v_face*(1+v_cap/100),2) then raise exception 'De vraagprijs is hoger dan toegestaan.'; end if;
 select id into v_listing from ticket_listings where ticket_id=p_ticket_id;
 if v_listing is null then
  insert into ticket_listings(ticket_id,seller_id,asking_price,seller_fee_rate,buyer_fee_rate,status,updated_at)
  values(p_ticket_id,v_owner,p_asking_price,.045,.085,'active',now()) returning id into v_listing;
 else
  update ticket_listings set seller_id=v_owner,asking_price=p_asking_price,seller_fee_rate=.045,buyer_fee_rate=.085,status='active',reserved_until=null,updated_at=now() where id=v_listing;
 end if;
 update tickets set status='listed' where id=p_ticket_id;
 return v_listing;
end$$;

create or replace function public.withdraw_ticket_listing(p_listing_id uuid)
returns void language plpgsql security definer set search_path=public as $$
declare v_ticket uuid;
begin
 select ticket_id into v_ticket from ticket_listings where id=p_listing_id and seller_id=auth.uid() and status='active' for update;
 if not found then raise exception 'Advertentie kan niet worden ingetrokken.'; end if;
 update ticket_listings set status='withdrawn',updated_at=now() where id=p_listing_id;
 update tickets set status='valid',qr_code=gen_random_uuid(),token_hash=encode(digest(gen_random_uuid()::text||clock_timestamp()::text,'sha256'),'hex') where id=v_ticket and owner_id=auth.uid() and status='listed';
end$$;

create or replace function public.reserve_resale_listing(p_listing_id uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_buyer uuid:=auth.uid();v_l ticket_listings%rowtype;v_ticket tickets%rowtype;v_face numeric;v_title text;v_type text;v_starts timestamptz;v_cap numeric;v_order uuid;v_buyer_fee numeric;v_seller_fee numeric;
begin
 if v_buyer is null then raise exception 'Log eerst in.'; end if;
 update ticket_listings set status='active',reserved_until=null,updated_at=now() where id=p_listing_id and status='reserved' and reserved_until<now();
 select * into v_l from ticket_listings where id=p_listing_id for update;
 if not found or v_l.status<>'active' then raise exception 'Dit ticket is niet meer beschikbaar.'; end if;
 if v_l.seller_id=v_buyer then raise exception 'Je kunt je eigen ticket niet kopen.'; end if;
 select * into v_ticket from tickets where id=v_l.ticket_id for update;
 if v_ticket.status<>'listed' or v_ticket.owner_id<>v_l.seller_id then raise exception 'Dit ticket is niet meer beschikbaar.'; end if;
 select tt.face_value,tt.name,e.title,e.starts_at,e.resale_cap_percent into v_face,v_type,v_title,v_starts,v_cap from ticket_types tt join ticket_events e on e.id=tt.event_id where tt.id=v_ticket.ticket_type_id;
 if v_starts<=now() then raise exception 'De verkoop voor dit evenement is gesloten.'; end if;
 if v_l.asking_price>round(v_face*(1+v_cap/100),2) then raise exception 'Deze advertentie overschrijdt de prijsgrens.'; end if;
 v_buyer_fee:=round(v_l.asking_price*v_l.buyer_fee_rate,2);v_seller_fee:=round(v_l.asking_price*v_l.seller_fee_rate,2);
 update ticket_listings set status='reserved',reserved_until=now()+interval '15 minutes',updated_at=now() where id=v_l.id;
 insert into ticket_resale_orders(listing_id,ticket_id,buyer_id,seller_id,asking_price,buyer_fee,seller_fee,total,seller_payout)
 values(v_l.id,v_l.ticket_id,v_buyer,v_l.seller_id,v_l.asking_price,v_buyer_fee,v_seller_fee,v_l.asking_price+v_buyer_fee,v_l.asking_price-v_seller_fee) returning id into v_order;
 return jsonb_build_object('order_id',v_order,'total',v_l.asking_price+v_buyer_fee,'asking_price',v_l.asking_price,'buyer_fee',v_buyer_fee,'event_title',v_title,'ticket_type',v_type);
end$$;

create or replace function public.finalize_resale_order(p_order_id uuid,p_payment_id text)
returns void language plpgsql security definer set search_path=public as $$
declare v_o ticket_resale_orders%rowtype;v_l ticket_listings%rowtype;
begin
 select * into v_o from ticket_resale_orders where id=p_order_id for update;
 if not found then raise exception 'Doorverkooporder niet gevonden.'; end if;
 if v_o.status='paid' then return; end if;
 if v_o.status<>'pending' or v_o.mollie_payment_id<>p_payment_id then raise exception 'Doorverkooporder is niet betaalbaar.'; end if;
 select * into v_l from ticket_listings where id=v_o.listing_id for update;
 if v_l.status<>'reserved' then raise exception 'Advertentie is niet gereserveerd.'; end if;
 update tickets set owner_id=v_o.buyer_id,qr_code=gen_random_uuid(),token_hash=encode(digest(gen_random_uuid()::text||clock_timestamp()::text,'sha256'),'hex'),status='valid',scanned_at=null where id=v_o.ticket_id and owner_id=v_o.seller_id and status='listed';
 if not found then raise exception 'Ticketoverdracht mislukt.'; end if;
 update ticket_listings set status='sold',reserved_until=null,updated_at=now() where id=v_o.listing_id;
 update ticket_resale_orders set status='paid',paid_at=now(),updated_at=now() where id=v_o.id;
end$$;

create or replace function public.release_resale_order(p_order_id uuid,p_status text)
returns void language plpgsql security definer set search_path=public as $$
declare v_listing uuid;
begin
 if p_status not in ('failed','cancelled','expired') then raise exception 'Ongeldige status.'; end if;
 update ticket_resale_orders set status=p_status,updated_at=now() where id=p_order_id and status='pending' returning listing_id into v_listing;
 if v_listing is not null then update ticket_listings set status='active',reserved_until=null,updated_at=now() where id=v_listing and status='reserved'; end if;
end$$;

revoke all on function public.finalize_resale_order(uuid,text) from public,anon,authenticated;
revoke all on function public.release_resale_order(uuid,text) from public,anon,authenticated;
grant execute on function public.finalize_resale_order(uuid,text) to service_role;
grant execute on function public.release_resale_order(uuid,text) to service_role;

create or replace function public.expire_resale_reservations()
returns void language plpgsql security definer set search_path=public as $$
begin
 update ticket_resale_orders o set status='expired',updated_at=now()
 where o.status='pending' and exists(select 1 from ticket_listings l where l.id=o.listing_id and l.status='reserved' and l.reserved_until<now());
 update ticket_listings set status='active',reserved_until=null,updated_at=now() where status='reserved' and reserved_until<now();
end$$;
revoke all on function public.expire_resale_reservations() from public,anon,authenticated;
grant execute on function public.expire_resale_reservations() to service_role;
