-- ASORTA v5.21 Trust + SEO foundation content
-- Run in Supabase SQL Editor after site_content exists.

create extension if not exists pgcrypto;

create table if not exists public.site_content (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  value text,
  type text default 'text',
  updated_at timestamptz default now()
);

insert into public.site_content (key, value, type, updated_at) values
('about.title', 'Over ASORTA', 'text', now()),
('about.body', 'ASORTA is een Nederlandse webshop voor praktische smart utility producten, automotive accessoires, desk setup upgrades en everyday carry gear. We gebruiken onze eigen storefront voor de merkervaring en Shopify als betrouwbare checkout- en orderlaag.\n\nOnze collectie wordt samengesteld op bruikbaarheid, duidelijke productinformatie en een eerlijke checkoutflow. Producten worden via Shopify gesynchroniseerd naar ASORTA, zodat prijs, beschikbaarheid en checkout aansluiten op de producten die echt koopbaar zijn.\n\nBestellingen worden verwerkt via Shopify en DSers. Zodra tracking beschikbaar is, ontvangt de klant de verzendinformatie per e-mail.', 'textarea', now()),
('contact.text', 'Heb je een vraag over je bestelling, verzending, retour of productinformatie? Neem contact op met ASORTA Support. Vermeld bij ordervragen altijd je ordernummer en het e-mailadres waarmee je hebt besteld.', 'textarea', now()),
('faq.title', 'Veelgestelde vragen', 'text', now()),
('faq.items', 'Wat is ASORTA? | ASORTA is een webshop voor praktische smart utility producten, automotive accessoires, desk setup upgrades en everyday carry gear.\nHoe werkt betalen? | Op dit moment verloopt betaling via Shopify checkout met PayPal. Later kunnen iDEAL en Wero via Mollie worden toegevoegd zodra de zakelijke verificatie rond is.\nWaar komt mijn order vandaan? | Orders worden via Shopify verwerkt en door DSers/suppliers fulfilled. Je ontvangt tracking zodra de leverancier of het warehouse de zending heeft aangemaakt.\nWanneer ontvang ik tracking? | Tracking is meestal beschikbaar nadat de order is verwerkt en verzonden. Zodra tracking beschikbaar is, ontvang je een verzendbevestiging per e-mail.\nKan ik retourneren? | Ja, retouraanvragen worden beoordeeld volgens het retourbeleid. Neem contact op met support met je ordernummer en reden van retour.\nWaarom zie ik Shopify tijdens checkout? | ASORTA gebruikt een eigen storefront voor de winkelervaring en Shopify als veilige checkout- en orderlaag voor PayPal en DSers-fulfillment.', 'textarea', now()),
('shipping.title', 'Verzending & levering', 'text', now()),
('shipping.body', 'Na betaling ontvang je een orderbevestiging per e-mail. Je bestelling wordt daarna voorbereid en aangemeld voor verzending.\n\nNa betaling ontvang je een orderbevestiging. Zodra de order is verwerkt en tracking beschikbaar is, ontvang je een verzendbevestiging met trackinginformatie.\n\nOmdat producten supplier-based worden verzonden, kan tracking soms later beschikbaar komen dan bij lokale voorraad. We houden de productinformatie en checkout zo duidelijk mogelijk, zodat je weet wat je kunt verwachten.', 'textarea', now()),
('returns.title', 'Retourbeleid', 'text', now()),
('returns.body', 'Wil je een retour aanvragen? Neem contact op met ASORTA Support met je ordernummer, e-mailadres en reden van retour. We beoordelen je aanvraag en geven daarna de vervolgstappen.\n\nProducten moeten ongebruikt, compleet en waar mogelijk in originele verpakking worden geretourneerd. Beschadigde, gebruikte of onvolledige producten kunnen worden geweigerd of gedeeltelijk vergoed.\n\nVoor defecten of verkeerde leveringen vragen we foto’s of video’s, zodat we het probleem met de vervoerder of fulfillmentpartner kunnen oplossen.', 'textarea', now()),
('privacy.title', 'Privacybeleid', 'text', now()),
('privacy.body', 'ASORTA verwerkt klantgegevens voor bestellingen, klantenservice, analytics, checkout, betaling en verzending. Denk aan naam, e-mailadres, verzendadres, ordergegevens, betaalstatus en supportberichten.\n\nVoor analyse gebruiken we Google Analytics 4. Betaalgegevens worden verwerkt door de betaalprovider en niet als volledige betaalkaartgegevens door ASORTA opgeslagen.\n\nJe kunt contact opnemen met ASORTA Support voor vragen over je gegevens, correctie of verwijdering waar wettelijk mogelijk.', 'textarea', now()),
('terms.title', 'Algemene voorwaarden', 'text', now()),
('terms.body', 'Door een bestelling te plaatsen bij ASORTA ga je akkoord met deze voorwaarden. Productinformatie, prijzen en beschikbaarheid worden zo zorgvuldig mogelijk bijgehouden. Kennelijke fouten kunnen worden gecorrigeerd.\n\nBetaling verloopt via een beveiligde checkout. Na betaling wordt je bestelling verwerkt. Leveringstijden zijn indicatief en kunnen afwijken door leverancier, vervoerder, douane of drukte.\n\nVoor vragen, klachten, retouren of problemen met je bestelling neem je contact op met ASORTA Support. We zoeken altijd naar een redelijke oplossing binnen de geldende consumentenregels.', 'textarea', now())
on conflict (key) do update set
  value = excluded.value,
  type = excluded.type,
  updated_at = now();
