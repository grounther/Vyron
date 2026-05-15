# ASORTA Shopify + DSers + PayPal checkout install

Deze patch zet ASORTA om naar de tijdelijke live-flow:

```txt
ASORTA frontend
-> Shopify cart/checkout URL
-> klant betaalt met PayPal in Shopify
-> Shopify order
-> DSers verwerkt de order
-> Shopify webhooks spiegelen order/tracking terug naar Supabase
```

Je eigen domein blijft dus naar Vercel/ASORTA wijzen. Shopify is product-input, PayPal checkout en DSers order bridge.

## 1. Supabase migrations

Run in deze volgorde in Supabase SQL Editor:

```txt
supabase/v5_17_shopify_multisupplier_schema.sql
supabase/v5_18_shopify_dsers_paypal_checkout.sql
```

Daarna opnieuw Shopify sync draaien via:

```txt
/atlas/integrations
```

De sync bewaart nu per variant:

```txt
shopifyVariantId
shopifyVariantLegacyId
```

Die legacy ID is nodig voor Shopify cart permalink checkout.

## 2. Environment variables

Zet lokaal en in Vercel minimaal:

```env
NEXT_PUBLIC_SITE_URL=https://asorta.nl
SITE_URL=https://asorta.nl

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

SHOPIFY_STORE_DOMAIN=wq1bsh-vx.myshopify.com
SHOPIFY_SHOP=wq1bsh-vx
SHOPIFY_API_VERSION=2026-04
SHOPIFY_CLIENT_ID=
SHOPIFY_CLIENT_SECRET=
SHOPIFY_WEBHOOK_SECRET=
CHECKOUT_PROVIDER=shopify
```

`SHOPIFY_ADMIN_ACCESS_TOKEN` mag leeg blijven als `SHOPIFY_CLIENT_ID` en `SHOPIFY_CLIENT_SECRET` zijn gezet. De Shopify client haalt dan zelf een tijdelijke token op via de client-credentials flow.

## 3. Shopify app scopes

Voor product sync en order/tracking webhooks zijn deze scopes handig:

```txt
read_products
read_inventory
read_orders
write_orders
read_fulfillments
```

Voor de huidige PayPal-checkout flow maakt ASORTA geen Shopify order via Admin API; Shopify checkout maakt de order zelf. DSers pakt die order op.

## 4. Shopify webhooks

Maak in Shopify app/webhooks deze HTTPS endpoints aan:

```txt
products/create  -> https://asorta.nl/api/webhooks/shopify/products
products/update  -> https://asorta.nl/api/webhooks/shopify/products
products/delete  -> https://asorta.nl/api/webhooks/shopify/products

orders/create    -> https://asorta.nl/api/webhooks/shopify/orders
orders/updated   -> https://asorta.nl/api/webhooks/shopify/orders
orders/paid      -> https://asorta.nl/api/webhooks/shopify/orders

fulfillments/create -> https://asorta.nl/api/webhooks/shopify/fulfillments
fulfillments/update -> https://asorta.nl/api/webhooks/shopify/fulfillments
```

Zet de webhook secret in:

```env
SHOPIFY_WEBHOOK_SECRET=
```

## 5. Checkout testen

1. Run Shopify sync in Atlas.
2. Open een gesynct product op ASORTA.
3. Voeg product toe aan cart.
4. Ga naar checkout.
5. De knop moet redirecten naar:

```txt
https://wq1bsh-vx.myshopify.com/cart/{variant_id}:{qty}
```

Daarna betaal je met PayPal via Shopify checkout.

## 6. DSers

DSers moet gekoppeld blijven aan je Shopify store. Producten/varianten moeten in DSers gemapped zijn. Zodra Shopify een betaalde order heeft, hoort DSers die Shopify order op te pakken.

## 7. Later met Mollie/iDEAL/Wero

Wanneer KVK/VAT/Mollie rond is, kan `CHECKOUT_PROVIDER` later terug naar eigen checkout. Dan wordt de flow:

```txt
ASORTA checkout
-> Mollie/iDEAL/Wero
-> backend maakt Shopify order mirror
-> DSers verwerkt Shopify order
```

Deze patch focust nu bewust op PayPal via Shopify checkout.
