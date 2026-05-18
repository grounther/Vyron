-- ASORTA v5.24 Loyalty activation + Atlas management
-- Enables loyalty tiers, point mutation logs, automatic order awards, and manual support adjustments.

create extension if not exists pgcrypto;

create table if not exists public.loyalty_tiers (
  tier_key text primary key,
  name text not null,
  min_points int not null default 0,
  min_lifetime_spend numeric not null default 0,
  reward_label text,
  active boolean not null default true,
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.loyalty_tiers (tier_key, name, min_points, min_lifetime_spend, reward_label, active, position)
values
  ('bronze', 'Bronze', 0, 0, 'Startniveau', true, 10),
  ('silver', 'Silver', 250, 250, 'Extra member updates', true, 20),
  ('gold', 'Gold', 750, 750, 'Priority support + early access', true, 30),
  ('vip', 'VIP', 1500, 1500, 'VIP drops + hoogste memberstatus', true, 40)
on conflict (tier_key) do update set
  name = excluded.name,
  min_points = excluded.min_points,
  min_lifetime_spend = excluded.min_lifetime_spend,
  reward_label = excluded.reward_label,
  active = excluded.active,
  position = excluded.position,
  updated_at = now();

alter table public.customer_loyalty
  add column if not exists created_at timestamptz not null default now();

create unique index if not exists customer_loyalty_customer_unique_idx
  on public.customer_loyalty(customer_id)
  where customer_id is not null;

create unique index if not exists customer_loyalty_auth_unique_idx
  on public.customer_loyalty(auth_user_id)
  where auth_user_id is not null;

create table if not exists public.customer_loyalty_events (
  id uuid primary key default gen_random_uuid(),
  event_key text unique,
  customer_id uuid references public.customers(id) on delete set null,
  customer_email text,
  order_id uuid references public.orders(id) on delete set null,
  event_type text not null default 'manual_adjustment',
  delta_points int not null default 0,
  previous_points int,
  new_points int,
  tier_before text,
  tier_after text,
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_by text,
  created_at timestamptz not null default now()
);

create index if not exists customer_loyalty_events_customer_idx on public.customer_loyalty_events(customer_id, created_at desc);
create index if not exists customer_loyalty_events_order_idx on public.customer_loyalty_events(order_id);
create index if not exists customer_loyalty_events_email_idx on public.customer_loyalty_events(lower(customer_email));

alter table public.loyalty_tiers enable row level security;
alter table public.customer_loyalty_events enable row level security;

-- Customers can read their own loyalty event history when linked to auth user through customer_loyalty.
do $$ begin
  create policy "Users can read own loyalty events" on public.customer_loyalty_events
    for select to authenticated
    using (
      exists (
        select 1
        from public.customer_loyalty cl
        where cl.customer_id = customer_loyalty_events.customer_id
          and cl.auth_user_id = auth.uid()
      )
    );
exception when duplicate_object then null; end $$;

-- Public tier read is useful for customer account UI. Admin/service role still bypasses RLS.
do $$ begin
  create policy "Public can read active loyalty tiers" on public.loyalty_tiers
    for select to public
    using (active = true);
exception when duplicate_object then null; end $$;

-- Backfill loyalty for paid orders that already exist and have a customer/e-mail.
with paid_orders as (
  select
    o.id,
    o.customer_id,
    lower(o.customer_email) as customer_email,
    floor(coalesce(o.total, 0))::int as earned_points,
    coalesce(o.total, 0) as total_amount,
    coalesce(o.order_number, o.id::text) as order_number
  from public.orders o
  where coalesce(o.total, 0) > 0
    and lower(coalesce(o.payment_status, o.shopify_financial_status, '')) in ('paid', 'authorized', 'partially_paid')
), resolved as (
  select
    po.*,
    coalesce(po.customer_id, c.id) as resolved_customer_id
  from paid_orders po
  left join public.customers c on lower(c.email) = po.customer_email
), inserted_events as (
  insert into public.customer_loyalty_events (
    event_key,
    customer_id,
    customer_email,
    order_id,
    event_type,
    delta_points,
    previous_points,
    new_points,
    tier_before,
    tier_after,
    reason,
    created_by
  )
  select
    'order_award:' || r.id::text,
    r.resolved_customer_id,
    r.customer_email,
    r.id,
    'order_award_backfill',
    greatest(r.earned_points, 0),
    null,
    null,
    null,
    null,
    'Backfill loyalty punten voor betaalde order ' || r.order_number,
    'migration'
  from resolved r
  where r.resolved_customer_id is not null
    and r.earned_points > 0
  on conflict (event_key) do nothing
  returning customer_id
), totals as (
  select
    e.customer_id,
    sum(e.delta_points)::int as points
  from public.customer_loyalty_events e
  where e.customer_id is not null
  group by e.customer_id
), spend as (
  select
    coalesce(o.customer_id, c.id) as customer_id,
    sum(coalesce(o.total, 0)) as lifetime_spend
  from public.orders o
  left join public.customers c on lower(c.email) = lower(o.customer_email)
  where lower(coalesce(o.payment_status, o.shopify_financial_status, '')) in ('paid', 'authorized', 'partially_paid')
  group by coalesce(o.customer_id, c.id)
)
insert into public.customer_loyalty (customer_id, points, lifetime_spend, tier, updated_at)
select
  t.customer_id,
  greatest(t.points, 0),
  coalesce(s.lifetime_spend, 0),
  coalesce((
    select lt.tier_key
    from public.loyalty_tiers lt
    where lt.active = true
      and (greatest(t.points, 0) >= lt.min_points or coalesce(s.lifetime_spend, 0) >= lt.min_lifetime_spend)
    order by lt.position desc
    limit 1
  ), 'bronze'),
  now()
from totals t
left join spend s on s.customer_id = t.customer_id
where t.customer_id is not null
on conflict (customer_id) where customer_id is not null do update set
  points = excluded.points,
  lifetime_spend = greatest(public.customer_loyalty.lifetime_spend, excluded.lifetime_spend),
  tier = excluded.tier,
  updated_at = now();
