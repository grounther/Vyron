-- ASORTA Tickets v7.2 — organizer portal
alter table public.ticket_organizers add column if not exists website text;
alter table public.ticket_organizers add column if not exists phone text;
alter table public.ticket_organizers add column if not exists description text;
alter table public.ticket_organizers add column if not exists rejection_reason text;
alter table public.ticket_organizers add column if not exists updated_at timestamptz not null default now();

alter table public.ticket_events add column if not exists description text;
alter table public.ticket_events add column if not exists doors_at timestamptz;
alter table public.ticket_events add column if not exists updated_at timestamptz not null default now();

create unique index if not exists ticket_organizers_owner_id_key on public.ticket_organizers(owner_id);

drop policy if exists "organizers see own events" on public.ticket_events;
create policy "organizers see own events" on public.ticket_events for select to authenticated
using (exists(select 1 from public.ticket_organizers o where o.id=organizer_id and o.owner_id=auth.uid()));

drop policy if exists "verified organizers create events" on public.ticket_events;
create policy "verified organizers create events" on public.ticket_events for insert to authenticated
with check (exists(select 1 from public.ticket_organizers o where o.id=organizer_id and o.owner_id=auth.uid() and o.status='verified'));

drop policy if exists "organizers update own events" on public.ticket_events;
create policy "organizers update own events" on public.ticket_events for update to authenticated
using (exists(select 1 from public.ticket_organizers o where o.id=organizer_id and o.owner_id=auth.uid() and o.status='verified'))
with check (exists(select 1 from public.ticket_organizers o where o.id=organizer_id and o.owner_id=auth.uid() and o.status='verified'));

drop policy if exists "organizers see own ticket types" on public.ticket_types;
create policy "organizers see own ticket types" on public.ticket_types for select to authenticated
using (exists(select 1 from public.ticket_events e join public.ticket_organizers o on o.id=e.organizer_id where e.id=event_id and o.owner_id=auth.uid()));

drop policy if exists "organizers create ticket types" on public.ticket_types;
create policy "organizers create ticket types" on public.ticket_types for insert to authenticated
with check (exists(select 1 from public.ticket_events e join public.ticket_organizers o on o.id=e.organizer_id where e.id=event_id and o.owner_id=auth.uid() and o.status='verified'));

drop policy if exists "organizers update ticket types" on public.ticket_types;
create policy "organizers update ticket types" on public.ticket_types for update to authenticated
using (exists(select 1 from public.ticket_events e join public.ticket_organizers o on o.id=e.organizer_id where e.id=event_id and o.owner_id=auth.uid() and o.status='verified'))
with check (exists(select 1 from public.ticket_events e join public.ticket_organizers o on o.id=e.organizer_id where e.id=event_id and o.owner_id=auth.uid() and o.status='verified'));

drop policy if exists "organizers delete ticket types" on public.ticket_types;
create policy "organizers delete ticket types" on public.ticket_types for delete to authenticated
using (exists(select 1 from public.ticket_events e join public.ticket_organizers o on o.id=e.organizer_id where e.id=event_id and o.owner_id=auth.uid() and o.status='verified'));
