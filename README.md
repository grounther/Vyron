# ASORTA Tickets

Nederlands platform voor primaire ticketverkoop en veilige doorverkoop.

## Stack

- Next.js 16
- TypeScript en Tailwind CSS
- Supabase voor accounts, tickets en live support
- Mollie voor iDEAL en andere Nederlandse betaalmethoden
- Vercel deployment

## Lokaal starten

```bash
npm install
npm run dev
```

Voer de SQL-bestanden in `supabase/` op versienummer uit. Voor deze versie zijn ook `v7_2_organizer_portal.sql` en `v7_3_orders_and_payments.sql` nodig.

## Vercel-variabelen

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=https://asorta.nl
MOLLIE_API_KEY=test_...
```

Begin altijd met een Mollie test-key. Zet pas na een volledige proefbestelling een live-key in productie.
