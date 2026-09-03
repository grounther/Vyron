-- ASORTA Woningruil v8.5 — contant betaalde zoekpassen
-- Uitvoeren na v8_4_national_housing_providers.sql.

-- Contante betalingen worden als volwaardige transacties bewaard. Mollie blijft
-- de standaard voor online betalingen.
alter table public.payments drop constraint if exists payments_provider_check;
alter table public.payments add constraint payments_provider_check
  check(provider in ('mollie','cash'));

alter table public.payments add column if not exists recorded_by text;
alter table public.payments add column if not exists payment_note text;

create or replace function public.activate_cash_search_pass(
  p_user_id uuid,
  p_actor_email text,
  p_target_email text,
  p_note text default null
)
returns table(
  payment_id uuid,
  pass_starts_at timestamptz,
  pass_expires_at timestamptz,
  was_extended boolean
)
language plpgsql
security definer
set search_path=public
as $$
declare
  current_pass public.access_passes%rowtype;
  new_payment_id uuid;
  result_starts_at timestamptz;
  result_expires_at timestamptz;
  result_extended boolean:=false;
  safe_actor text:=lower(left(btrim(coalesce(p_actor_email,'')),320));
  safe_target text:=lower(left(btrim(coalesce(p_target_email,'')),320));
  safe_note text:=nullif(left(btrim(coalesce(p_note,'')),500),'');
begin
  if p_user_id is null then raise exception 'Gebruiker ontbreekt.'; end if;
  if safe_actor='' then raise exception 'Beheerder ontbreekt.'; end if;

  -- Deze rijvergrendeling voorkomt twee gelijktijdige activeringen voor dezelfde gebruiker.
  perform 1 from public.profiles where id=p_user_id for update;
  if not found then raise exception 'Gebruiker niet gevonden.'; end if;
  if exists(select 1 from public.profiles where id=p_user_id and blocked_at is not null) then
    raise exception 'Deblokkeer dit account voordat je een zoekpas activeert.';
  end if;

  update public.access_passes
  set status='expired'
  where user_id=p_user_id and status='active' and expires_at<=now();

  select * into current_pass
  from public.access_passes
  where user_id=p_user_id and status='active' and expires_at>now()
  for update;

  insert into public.payments(
    user_id,purpose,listing_id,provider,provider_payment_id,amount,currency,
    status,paid_at,recorded_by,payment_note,created_at,updated_at
  ) values(
    p_user_id,'search_year',null,'cash',null,5.00,'EUR',
    'paid',now(),safe_actor,safe_note,now(),now()
  ) returning id into new_payment_id;

  if current_pass.id is not null then
    result_starts_at:=current_pass.starts_at;
    result_expires_at:=current_pass.expires_at + interval '365 days';
    result_extended:=true;
    update public.access_passes
    set payment_id=new_payment_id,expires_at=result_expires_at,status='active'
    where id=current_pass.id;
  else
    result_starts_at:=now();
    result_expires_at:=result_starts_at + interval '365 days';
    insert into public.access_passes(user_id,payment_id,starts_at,expires_at,status)
    values(p_user_id,new_payment_id,result_starts_at,result_expires_at,'active');
  end if;

  insert into public.notifications(user_id,type,title,body,href)
  values(
    p_user_id,
    'payment_success',
    case when result_extended then 'Zoekpas verlengd' else 'Zoekpas geactiveerd' end,
    case when result_extended
      then 'Je contante betaling is verwerkt. Je zoek- en matchtoegang is met één jaar verlengd.'
      else 'Je contante betaling is verwerkt. Je zoek- en matchtoegang is één jaar actief.'
    end,
    '/account'
  );

  insert into public.atlas_staff_audit_logs(action,actor_email,target_email,details)
  values(
    case when result_extended then 'cash_search_pass_extended' else 'cash_search_pass_activated' end,
    safe_actor,
    nullif(safe_target,''),
    jsonb_build_object(
      'user_id',p_user_id,
      'payment_id',new_payment_id,
      'amount',5.00,
      'currency','EUR',
      'provider','cash',
      'starts_at',result_starts_at,
      'expires_at',result_expires_at,
      'note',safe_note
    )
  );

  return query select new_payment_id,result_starts_at,result_expires_at,result_extended;
end$$;

revoke all on function public.activate_cash_search_pass(uuid,text,text,text) from public,anon,authenticated;
grant execute on function public.activate_cash_search_pass(uuid,text,text,text) to service_role;

insert into public.atlas_staff_audit_logs(action,actor_email,details)
values('cash_search_passes_enabled','system',jsonb_build_object('version','8.5'));
