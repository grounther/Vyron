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

Voer de SQL-bestanden in `supabase/` op versienummer uit. Voor woningruil is `v8_0_housing_swap_foundation.sql` de nieuwe hoofdmigratie. De bestaande ticket-tabellen blijven voorlopig alleen als archief bestaan.

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
