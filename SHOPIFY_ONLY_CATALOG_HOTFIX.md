# ASORTA Shopify-only catalog hotfix

This hotfix removes the old hardcoded product fallback from the customer-visible catalog.

Before this hotfix, `lib/catalog.ts` returned `lib/products.ts` static products whenever Supabase had no active rows. That meant old products could still show up even after clearing the `products` table.

After this hotfix:

- Only Supabase rows with `status in ('active','launch')` are shown.
- Rows must have both `shopify_product_id` and `shopify_variant_legacy_id`.
- If Supabase is empty, the shop/category/search pages return no products instead of old hardcoded products.
- Old hardcoded product routes are no longer generated via `generateStaticParams`.
- Sitemap product URLs come from Shopify-synced Supabase rows only.

After installing, redeploy/restart and run Shopify sync from `/atlas/integrations`.
