# ASORTA v5.6.0 — Support klantportaal

Deze update voegt een volledig werkend klantbeeld toe aan `/atlas/support`, naast de live 1-op-1 supportchat.

## Wat is toegevoegd

- Klantportaal direct naast de live supportchat.
- Zoeken op ordernummer, e-mailadres, klantnaam, telefoonnummer, trackingnummer, trackinglink, CJ order ID, klant-ID en order-ID.
- Automatische klantmatching vanuit het geselecteerde supportgesprek.
- Klantprofiel uit `customers`.
- Orderhistorie uit `orders` en `order_items`.
- Betaalstatus, fulfillmentstatus, trackingnummer, tracking URL en CJ order ID bewerken vanuit support.
- Supportgeschiedenis uit live gesprekken, tickets en gearchiveerde transcripts.
- Interne supportnotities per klant, order of gesprek.
- Commerce signalen uit cart recovery, wishlist en loyalty.
- Knoppen om een supportgesprek aan een klant of order te koppelen.
- Nieuwe Atlas-only API-routes:
  - `/api/atlas/support/customer-portal`
  - `/api/atlas/support/customer-portal/notes`

## Supabase installatie

Run na deployen in Supabase SQL Editor:

```text
supabase/v5_15_support_customer_portal_schema.sql
```

Als je de vorige live support SQL nog niet had uitgevoerd, run dan eerst:

```text
supabase/v5_14_true_1on1_live_support_schema.sql
supabase/v5_15_support_customer_portal_schema.sql
```

## Vereiste environment variables

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
RESEND_API_KEY
NEWSLETTER_FROM
```

Voor het klantportaal is vooral `SUPABASE_SERVICE_ROLE_KEY` nodig. Atlas leest klant-, order- en supportdata server-side via beveiligde API-routes. Publieke bezoekers krijgen geen directe toegang tot klanttabellen.

## Gebruik

Open:

```text
/atlas/support
```

Selecteer een supportgesprek. Rechts verschijnt het klantportaal automatisch. Je kunt ook handmatig zoeken op bijvoorbeeld:

```text
AS-1001
klant@email.nl
+31612345678
trackingnummer
CJ order ID
```

Gebruik `Koppel chat aan klant` of `Koppel order` om de juiste klant/order vast te leggen bij het gesprek. Gebruik `Bewerk order` om tracking of status direct vanuit de supportsectie te corrigeren.
