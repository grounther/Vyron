# ASORTA Woningruil

Nederlands platform voor huurders die veilig en gericht van woning willen ruilen.

## Stack

- Next.js 16
- TypeScript en Tailwind CSS
- Supabase voor accounts, woningen, matches, chat en live support
- Mollie voor iDEAL en andere Nederlandse betaalmethoden
- Vercel deployment

## Lokaal starten

```bash
npm install
npm run dev
```

Voer de SQL-bestanden in `supabase/` op versienummer uit. Voor woningruil voer je eerst `v8_0_housing_swap_foundation.sql` uit, daarna `v8_1_admin_operations.sql`, `v8_2_housing_staff_permissions.sql` en vervolgens `v8_3_search_profile_and_users.sql`. De bestaande ticket-tabellen blijven voorlopig alleen als archief bestaan.

Versie 8.1 voegt Atlas-beheer toe voor fotomoderatie, rapportages, blokkades, Mollie-refunds, privacyverzoeken, corporatievoorstellen en auditlogging. Nieuwe woningfoto's zijn pas openbaar nadat een bevoegde beheerder ze heeft goedgekeurd.

Versie 8.2 vervangt de oude webshop- en ticketrechten door acht taakgerichte woningruilrechten. Oude Atlas-beheerpagina's worden niet meer aangeboden en bestaande medewerkers worden door de migratie veilig overgezet.

Versie 8.3 repareert het opslaan van optionele zoekwensen, slaat het volledige zoekprofiel atomair op en gebruikt PDOK voor plaatsnaamsuggesties. Atlas krijgt daarnaast apart gebruikersbeheer met profielwijzigingen, zoekprofielstatus, blokkades en auditlogging.

## Vercel-variabelen

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=https://asorta.nl
MOLLIE_API_KEY=test_...
RESEND_API_KEY=
NEWSLETTER_FROM=ASORTA <info@asorta.nl>
CRON_SECRET=
```

Begin altijd met een Mollie test-key. Zet pas na een volledige proefbestelling een live-key in productie.

`CRON_SECRET` beschermt de dagelijkse controle van verlopen zoekpassen en woningen die opnieuw bevestigd moeten worden.
