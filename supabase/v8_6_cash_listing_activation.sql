-- ASORTA Woningruil v8.6 — contante woningactivering
-- Uitvoeren na v8_5_cash_search_passes.sql.

create or replace function public.activate_cash_listing(
  p_listing_id uuid,
  p_actor_email text,
  p_target_email text,
  p_note text default null
)
returns table(
  payment_id uuid,
  listing_id uuid,
  user_id uuid,
  activated_at timestamptz,
  confirmation_due_at timestamptz
)
language plpgsql
security definer
set search_path=public
as $$
declare
  target_listing public.listings%rowtype;
  new_payment_id uuid;
  activation_time timestamptz:=now();
  due_time timestamptz:=activation_time + interval '90 days';
  safe_actor text:=lower(left(btrim(coalesce(p_actor_email,'')),320));
  safe_target text:=lower(left(btrim(coalesce(p_target_email,'')),320));
  safe_note text:=nullif(left(btrim(coalesce(p_note,'')),500),'');
begin
  if p_listing_id is null then raise exception 'Woning ontbreekt.'; end if;
  if safe_actor='' then raise exception 'Beheerder ontbreekt.'; end if;

  select * into target_listing
  from public.listings
  where id=p_listing_id
  for update;

  if not found then raise exception 'Woning niet gevonden.'; end if;
  if target_listing.status not in ('draft','pending_payment') then
    raise exception 'Alleen een woning die op betaling wacht kan voor €2 worden geactiveerd.';
  end if;
  if exists(select 1 from public.profiles where id=target_listing.user_id and blocked_at is not null) then
    raise exception 'Deblokkeer dit account voordat je de woning activeert.';
  end if;

  insert into public.payments(
    user_id,purpose,listing_id,provider,provider_payment_id,amount,currency,
    status,paid_at,recorded_by,payment_note,created_at,updated_at
  ) values(
    target_listing.user_id,'listing_activation',target_listing.id,'cash',null,2.00,'EUR',
    'paid',activation_time,safe_actor,safe_note,activation_time,activation_time
  ) returning id into new_payment_id;

  update public.listings set
    status='active',
    activated_at=activation_time,
    last_confirmed_at=activation_time,
    confirmation_due_at=due_time,
    updated_at=activation_time
  where id=target_listing.id;

  insert into public.notifications(user_id,type,title,body,href)
  values(
    target_listing.user_id,
    'payment_success',
    'Woning geactiveerd',
    'Je contante betaling is verwerkt. Je woning staat actief en doet nu mee met matching.',
    '/account'
  );

  insert into public.atlas_staff_audit_logs(action,actor_email,target_email,details)
  values(
    'cash_listing_activated',
    safe_actor,
    nullif(safe_target,''),
    jsonb_build_object(
      'user_id',target_listing.user_id,
      'listing_id',target_listing.id,
      'payment_id',new_payment_id,
      'amount',2.00,
      'currency','EUR',
      'provider','cash',
      'activated_at',activation_time,
      'confirmation_due_at',due_time,
      'note',safe_note
    )
  );

  return query select new_payment_id,target_listing.id,target_listing.user_id,activation_time,due_time;
end$$;

revoke all on function public.activate_cash_listing(uuid,text,text,text) from public,anon,authenticated;
grant execute on function public.activate_cash_listing(uuid,text,text,text) to service_role;

insert into public.atlas_staff_audit_logs(action,actor_email,details)
values('cash_listing_activation_enabled','system',jsonb_build_object('version','8.6'));
