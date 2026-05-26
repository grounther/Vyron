# Manual inventory PayPal checkout fix

Deze patch zorgt dat eigen voorraad-producten niet meer afhankelijk zijn van Mollie.

## Wat is aangepast

- Eigen voorraad orders worden eerst intern opgeslagen in Supabase.
- Daarna wordt via Shopify Admin een Draft Order met custom line items aangemaakt.
- De klant wordt doorgestuurd naar de Shopify invoice checkout-link, waar PayPal beschikbaar is als Shopify PayPal actief is.
- Verzendkosten uit `shipping_total` worden als custom shipping line meegestuurd naar Shopify.
- De checkout toont niet meer ten onrechte `Je checkout is leeg` na het aanmaken van een order.

## Vereiste Vercel env-vars

Deze moeten al aanwezig zijn voor je Shopify/PayPal-flow:

```txt
SHOPIFY_STORE_DOMAIN=wq1bsh-vx.myshopify.com
SHOPIFY_SHOP=wq1bsh-vx
SHOPIFY_CLIENT_ID=...
SHOPIFY_CLIENT_SECRET=...
SHOPIFY_API_VERSION=2026-04
```

Of als fallback:

```txt
SHOPIFY_ADMIN_ACCESS_TOKEN=...
```

De Shopify app/token heeft hiervoor `write_draft_orders` nodig.

## Later Mollie/iDEAL/Wero

Mollie blijft in de code aanwezig, maar eigen voorraad gebruikt nu eerst Shopify Draft Order PayPal checkout. Zodra Mollie actief is kan de providerkeuze in `app/api/checkout/route.ts` worden omgedraaid.
