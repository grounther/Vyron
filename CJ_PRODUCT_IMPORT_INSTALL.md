# ASORTA V5.6.1 - CJ Product Importer

This update adds a server-side CJ product importer to Atlas Products.

## What it does

In `/atlas/products` you can now import a CJ product by SPU/Product SKU.

Default prefilled product:

```text
CJYD2836955
https://cjdropshipping.com/product/front-and-rear-dual-recording-dashcam-p-2604160248311602900.html
```

The importer fetches CJ product details through the CJ API and stores:

- CJ PID
- CJ SPU/product SKU
- CJ variant VID values
- CJ variant SKU values
- variant names
- variant images
- variant stock/inventory payload where available
- supplier URL
- CJ raw product payload for internal support/debugging
- CJ import log

Imported products are best kept as `archived` first. Edit price, description, compliance notes and shipping rules before setting a product to `active` or `launch`.

## Why not CJ Connect?

The CJ website "Connect" button is meant for CJ-supported connected stores, such as Shopify-style integrations. This custom shop should not depend on that UI flow. Atlas imports CJ product data server-side using your CJ API key and maps CJ variants into your Supabase catalog.

## Supabase migration

Run this file once in Supabase SQL Editor:

```text
supabase/v5_16_cj_product_importer_schema.sql
```

Run it after:

```text
supabase/v5_15_support_customer_portal_schema.sql
```

## Environment variables

Add this to Vercel/hosting and to local `.env.local`:

```text
CJ_API_KEY=your_cj_api_key_here
```

Optional fallback if you already manage tokens manually:

```text
CJ_ACCESS_TOKEN=your_current_cj_access_token_here
```

Recommended: use `CJ_API_KEY`. Keep both values server-side only. Do not prefix them with `NEXT_PUBLIC_`.

Existing required variables remain:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
RESEND_API_KEY
NEWSLETTER_FROM
```

## Local test

```powershell
npm install
npm run build
```

Then open:

```text
/atlas/products
```

Use the CJ Product Importer card at the top.

## Import flow

1. Enter CJ SPU/Product SKU, for example `CJYD2836955`.
2. Keep `Warehouse filter` on `CN` unless you specifically need US/EU stock.
3. Keep status on `archived` while validating the product.
4. Click `Importeren vanuit CJ`.
5. Open the imported product card.
6. Check images, variants, CJ SKU/VID values, price, product copy and compliance.
7. Set status to `active` only when the product is ready to sell.

## Notes for dashcams/electronics

Before publishing vehicle electronics, verify:

- CE/compliance claims
- power connection/cable expectations
- supported memory card requirements
- warranty/refund copy
- whether front/rear camera is included in the selected variant
- whether the variant matches the product photos

