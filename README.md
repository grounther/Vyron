# VYRON — Plug & Play Vercel Store

Premium Next.js starter voor VYRON: Engineered for Modern Utility.

## Wat zit erin
- Next.js + Tailwind
- Premium VYRON homepage
- 20 samengestelde producten
- Categoriepagina's
- Productpagina's met info, features, specs, supplier notes, margin notes en content ideeën
- Cart placeholder
- Mollie checkout placeholder

## Installeren
```bash
npm install
npm run dev
```

## Deploy op Vercel
1. Upload deze map naar GitHub
2. Import project in Vercel
3. Framework: Next.js
4. Deploy

## Payments
Aanbevolen PSP voor NL/EU: Mollie.
Waarom: iDEAL | Wero, PayPal, kaarten, Apple Pay, Google Pay, Bancontact, Klarna en meer via één integratie.

Later toevoegen in `.env.local`:
```bash
MOLLIE_API_KEY=live_xxxxxxxxx
NEXT_PUBLIC_SITE_URL=https://jouwdomein.nl
```

## Belangrijk
De productprijzen en supplier notes zijn startstrategie. Voor livegang moeten we per product nog echte leveranciers kiezen, levertijd controleren, testbestelling doen en marktprijs finaliseren.
