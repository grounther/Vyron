# Shopify input + CJ/DSers multi-supplier install

Deze build houdt je eigen site volledig intact:

```txt
Shopify = product input/backoffice
Supabase = product/order/supplier database
ASORTA/Vyron site = frontend + cart + checkout
Mollie = payment redirect/webhook
CJ/DSers = supplier fulfillment adapters
```

## 1. Supabase migration

Run in Supabase SQL Editor:

```txt
supabase/v5_17_shopify_multisupplier_schema.sql
```

Deze migration voegt toe:

- Shopify metadata op `products`
- `product_supplier_mappings`
- `integration_sync_logs`
- `fulfillment_orders`
- order/order_item velden voor eigen checkout en supplier routing
- security fix: publieke product reads zijn alleen `active` en `launch`, niet `draft`

## 2. Environment variables

Gebruik `.env.example` als basis. Zet echte secrets alleen lokaal/Vercel, nooit in ZIPs.

Minimaal voor Shopify sync:

```env
SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
SHOPIFY_ADMIN_ACCESS_TOKEN=your_admin_token_here
SHOPIFY_WEBHOOK_SECRET=...
SHOPIFY_API_VERSION=2026-04
```

Voor payment:

```env
MOLLIE_API_KEY=test_...
NEXT_PUBLIC_SITE_URL=https://jouwdomein.nl
```

Voor CJ:

```env
CJ_API_KEY=...
# of
CJ_ACCESS_TOKEN=...
CJ_FULFILLMENT_DRY_RUN=true
```

Voor DSers:

```env
DSERS_MODE=pending_bridge
# later: shopify_order_bridge of direct_api
DSERS_CREATE_SHOPIFY_ORDERS=false
```

## 3. Shopify metafields

Maak product metafields aan in Shopify voor supplier routing:

```txt
supplier.name = cj of dsers
supplier.product_id = supplier product id
supplier.variant_id = supplier variant id
supplier.sku = supplier SKU
supplier.cost = supplier cost
supplier.shipping_method = preferred shipping method
vyron.category = automotive / gaming / smart-utility / etc.
vyron.badge = Launch Pick / New / Bestseller
```

## 4. Atlas sync

Ga naar:

```txt
/atlas/integrations
```

Klik op **Sync Shopify**.

Dit haalt Shopify producten, varianten, media, tags en metafields naar Supabase.

## 5. Shopify webhooks

Maak HTTPS webhooks in Shopify naar:

```txt
https://jouwdomein.nl/api/webhooks/shopify/products
```

Topics:

```txt
products/create
products/update
products/delete
```

De endpoint valideert `X-Shopify-Hmac-SHA256` met `SHOPIFY_WEBHOOK_SECRET`.

## 6. Checkout

De `/checkout` pagina maakt nu server-side orders aan. Clientprijzen worden niet vertrouwd: de backend rekent opnieuw op basis van Supabase/productdata.

Als `MOLLIE_API_KEY` aanwezig is, maakt `/api/checkout` een Mollie payment en stuurt de klant door naar de Mollie checkout.

Mollie webhook:

```txt
https://jouwdomein.nl/api/webhooks/payment/mollie
```

Na `paid` triggert de webhook automatisch de fulfillment router.

## 7. Fulfillment routing

De router splitst één order per supplier:

```txt
CJ items -> CJ adapter
DSers items -> DSers adapter
onbekend -> manual adapter
```

CJ staat standaard in dry-run. Pas na testorders:

```env
CJ_FULFILLMENT_DRY_RUN=false
```

DSers staat standaard veilig op pending bridge. Activeer pas later:

```env
DSERS_MODE=shopify_order_bridge
DSERS_CREATE_SHOPIFY_ORDERS=true
```

of:

```env
DSERS_MODE=direct_api
DSERS_API_BASE_URL=...
DSERS_API_KEY=...
```

## 8. Testvolgorde

1. Run Supabase migration.
2. Zet Shopify env vars.
3. Start lokaal met `npm ci` en `npm run dev`.
4. Ga naar `/atlas/integrations`.
5. Sync 1-5 producten.
6. Controleer `/atlas/products`.
7. Test checkout met Mollie test key.
8. Laat CJ dry-run aan.
9. Controleer `orders`, `order_items`, `fulfillment_orders`.
10. Activeer CJ/DSers pas na testvalidatie.
