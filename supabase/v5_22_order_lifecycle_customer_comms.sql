-- ASORTA v5.22 Order lifecycle + customer communication
-- Adds idempotent transactional email logging and cleans customer-facing trust content.

create extension if not exists pgcrypto;

create table if not exists public.email_events (
  id uuid primary key default gen_random_uuid(),
  event_key text unique not null,
  event_type text not null,
  order_id uuid references public.orders(id) on delete set null,
  order_number text,
  recipient text not null,
  status text not null default 'pending',
  payload jsonb default '{}'::jsonb,
  provider_response jsonb default '{}'::jsonb,
  sent_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.email_events enable row level security;

create index if not exists idx_email_events_order_id on public.email_events(order_id);
create index if not exists idx_email_events_event_type on public.email_events(event_type);
create index if not exists idx_email_events_recipient on public.email_events(recipient);

create index if not exists idx_orders_customer_email_order_number on public.orders(customer_email, order_number);
create index if not exists idx_orders_customer_email_shopify_name on public.orders(customer_email, shopify_order_name);

insert into public.site_content (key, value, type, updated_at) values
('about.body', 'ASORTA is een Nederlandse webshop voor praktische smart utility producten, automotive accessoires, desk setup upgrades en everyday carry gear.\n\nOnze collectie wordt samengesteld op bruikbaarheid, duidelijke productinformatie en een veilige checkoutflow. We selecteren producten op praktische waarde, uitstraling en geschiktheid voor dagelijks gebruik.\n\nNa je bestelling ontvang je een orderbevestiging per e-mail. Zodra tracking beschikbaar is, ontvang je automatisch een verzendupdate.', 'textarea', now()),
('faq.items', 'Wat is ASORTA? | ASORTA is een webshop voor praktische smart utility producten, automotive accessoires, desk setup upgrades en everyday carry gear.\nHoe werkt betalen? | Je rekent af via een beveiligde betaalomgeving. Beschikbare betaalmethodes kunnen per moment verschillen.\nWanneer ontvang ik tracking? | Tracking is beschikbaar zodra je pakket is aangemeld voor verzending. Je ontvangt dan automatisch een verzendupdate per e-mail.\nHoe volg ik mijn bestelling? | Gebruik de pagina Order volgen met je ordernummer en het e-mailadres waarmee je hebt besteld.\nKan ik retourneren? | Ja, retouraanvragen worden beoordeeld volgens het retourbeleid. Neem contact op met support met je ordernummer en reden van retour.\nWaar kan ik terecht met vragen? | Neem contact op met ASORTA Support. Vermeld bij ordervragen altijd je ordernummer en e-mailadres.', 'textarea', now()),
('shipping.body', 'Na betaling ontvang je een orderbevestiging per e-mail. Je bestelling wordt daarna voorbereid en aangemeld voor verzending.\n\nDe verwachte levertijd kan per product en bestemming verschillen. Zodra tracking beschikbaar is, ontvang je automatisch een verzendbevestiging met trackinginformatie.\n\nHeb je na je bestelling nog geen tracking ontvangen? Gebruik de pagina Order volgen of neem contact op met ASORTA Support met je ordernummer.', 'textarea', now()),
('privacy.body', 'ASORTA verwerkt klantgegevens voor bestellingen, klantenservice, analytics, betaling en verzending. Denk aan naam, e-mailadres, verzendadres, ordergegevens, betaalstatus en supportberichten.\n\nVoor analyse gebruiken we Google Analytics 4. Betaalgegevens worden verwerkt door de betaalprovider en niet als volledige betaalkaartgegevens door ASORTA opgeslagen.\n\nJe kunt contact opnemen met ASORTA Support voor vragen over je gegevens, correctie of verwijdering waar wettelijk mogelijk.', 'textarea', now()),
('terms.body', 'Door een bestelling te plaatsen bij ASORTA ga je akkoord met deze voorwaarden. Productinformatie, prijzen en beschikbaarheid worden zo zorgvuldig mogelijk bijgehouden. Kennelijke fouten kunnen worden gecorrigeerd.\n\nBetaling verloopt via een beveiligde checkout. Na betaling wordt je bestelling verwerkt en ontvang je tracking zodra die beschikbaar is. Leveringstijden zijn indicatief en kunnen afwijken door vervoerder, douane of drukte.\n\nVoor vragen, klachten, retouren of problemen met je bestelling neem je contact op met ASORTA Support. We zoeken altijd naar een redelijke oplossing binnen de geldende consumentenregels.', 'textarea', now())
on conflict (key) do update set
  value = excluded.value,
  type = excluded.type,
  updated_at = now();
