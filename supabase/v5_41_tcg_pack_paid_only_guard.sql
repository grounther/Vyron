-- ASORTA v5.41 - TCG pack paid-only guard
-- Run once in Supabase SQL Editor after deploying this fix.
-- This voids available minigame pack credits that were accidentally created for unpaid/cancelled/open orders.
-- Opened packs are not changed automatically, because reversing already opened cards needs a manual support decision.

with voided as (
  update public.customer_pack_credits c
  set status = 'void', updated_at = now()
  from public.orders o
  where c.order_id = o.id
    and c.status = 'available'
    and lower(coalesce(o.payment_status, '')) <> 'paid'
  returning
    c.id,
    c.customer_id,
    c.auth_user_id,
    c.customer_email,
    c.order_id,
    c.order_number
)
insert into public.customer_pack_events (
  customer_id,
  auth_user_id,
  customer_email,
  credit_id,
  order_id,
  event_type,
  source,
  quantity,
  reason,
  created_by
)
select
  v.customer_id,
  v.auth_user_id,
  v.customer_email,
  v.id,
  v.order_id,
  'void',
  'payment_guard',
  1,
  case
    when v.order_number is not null then 'Pakje ingetrokken omdat order ' || v.order_number || ' niet betaald is.'
    else 'Pakje ingetrokken omdat de gekoppelde order niet betaald is.'
  end,
  'system'
from voided v
where not exists (
  select 1
  from public.customer_pack_events e
  where e.credit_id = v.id
    and e.event_type = 'void'
    and e.source = 'payment_guard'
);
