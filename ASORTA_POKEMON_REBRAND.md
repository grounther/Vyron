# ASORTA Pokemon / TCG rebrand

Deze versie zet de storefront om naar een Pokemon-first shop voor Trading Cards, Collectibles en Events.

## Belangrijkste wijzigingen

- Nieuwe hero-sectie met de aangeleverde ASORTA Trading Cards afbeelding.
- Nieuwe Pokemon categorieen:
  - Booster Packs
  - Elite Trainer Boxes
  - Collection Boxes
  - Singles
  - Accessoires
  - Markt Deals
- Navigatie, shop, footer, SEO metadata en standaard site-content omgezet naar Pokemon/TCG.
- Atlas product editor gebruikt nu standaard `booster-packs`, `Eigen voorraad` en SKU-placeholder `AS-PKM-BOOST-001`.
- PayPal checkout-flow uit de vorige fix is behouden.
- Mollie/iDEAL/Wero blijven later toe te voegen zodra de zakelijke setup rond is.

## Nieuwe afbeelding

De aangeleverde afbeelding staat op:

- `public/asorta-tcg-hero.jpeg`
- `public/brand/asorta-tcg-hero.jpeg`

## Let op

Bestaande producten in Supabase met oude categorieen blijven technisch bestaan. Nieuwe producten kunnen via Atlas direct in de nieuwe Pokemon categorieen worden gezet.
