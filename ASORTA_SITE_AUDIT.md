# ASORTA site/function audit - V5.6.2

Auditdatum: 2026-05-13

## Live check

De homepage van `asorta.nl` is extern bereikbaar en toont de hoofdstructuur: navigatie, categorieën, productblokken, cart-indicator, newsletter/insiders-sectie, trustblokken en supportwidget. Subroutes waren via de externe fetcher niet betrouwbaar te laden, maar de routebestanden zijn in de codebase aanwezig en gecontroleerd.

## Publieke routes

- `/` homepage: actief, sterke eerste indruk, maar checkout/tracking teksten melden terecht dat payments/fulfilment nog niet live zijn.
- `/shop`: catalogusroute aanwezig.
- `/category/[slug]`: categorieroutes aanwezig voor tactical, automotive, desk setup, gaming en smart utility.
- `/product/[slug]`: productdetailroute aanwezig.
- `/cart`: cart route aanwezig; checkout blijft de volgende blocker.
- `/checkout`: nog niet productie-klaar; moet Mollie/payment/orderflow krijgen.
- `/contact`, `/faq`, `/shipping`, `/returns`, `/privacy`, `/terms`: routes aanwezig; juridische/commerciële copy definitief maken voor advertenties.
- `/login`, `/register`, `/account`: accountbasis aanwezig.
- `/search`: route aanwezig en in V5.6.2 gekoppeld aan de live catalogus via `getProducts()`.

## Atlas routes

- `/atlas`: intern dashboard.
- `/atlas/products`: productbeheer + CJ import. V5.6.2 voegt URL auto-import en preview endpoint toe.
- `/atlas/support`: live support + klantportaal.
- `/atlas/newsletter`: newsletter/campaign basis.
- `/atlas/recovery`: cart recovery basis.
- `/atlas/pages`: contentbeheer.
- `/atlas/promotions`: promotiebeheer.

## Belangrijkste open punten

1. Checkout/payment: Mollie checkout, payment webhook, order creation en confirmation mail bouwen.
2. CJ fulfilment: betaalde orders automatisch of semi-automatisch naar CJ sturen.
3. Tracking: CJ webhook + polling backup + trackingmail + account/order timeline.
4. Search: in V5.6.2 gekoppeld aan Supabase/live catalogus; controleer na deploy dat actieve CJ-imports vindbaar zijn.
5. Cart recovery: recovery-link moet cart inhoud terugzetten.
6. Legal/compliance: privacy, terms, returns, shipping en productclaims definitief maken.
7. SEO: product metadata, structured data en sitemap uitbreiden zodra echte productcatalogus live staat.
8. Product QA: CJ imports altijd eerst archived/draft houden tot prijs, marge, CE/compliance, levertijd en retourrisico gecontroleerd zijn.

## Aanbevolen volgende release

V5.6.3 Mollie Checkout + Order Creation:

- checkoutformulier met klantgegevens en verzendadres;
- server-side draft order in Supabase;
- Mollie payment aanmaken;
- webhook `paid` verwerken;
- orderbevestigingsmail;
- order zichtbaar in Atlas support/klantportaal;
- daarna queue naar CJ fulfilment.


## V5.6.2 extra hardening

- Publieke catalogus toont alleen `active` en `launch` producten. CJ imports blijven dus verborgen zolang ze `draft` of `archived` zijn.
- `/search` gebruikt nu de live catalogus in plaats van alleen `lib/products`.
