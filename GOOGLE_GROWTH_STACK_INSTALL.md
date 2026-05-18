# ASORTA Google Growth Stack v6.4.0

This patch adds the technical foundation for Google visibility and measurement.

## Added

- GA4 global tag support via `NEXT_PUBLIC_GA_MEASUREMENT_ID`
- GA4 ecommerce events:
  - `view_item`
  - `select_item`
  - `add_to_cart`
  - `begin_checkout`
  - `asorta_shopify_checkout_redirect`
- Product JSON-LD on product pages
- Organization + Website JSON-LD sitewide
- Improved product metadata / Open Graph / Twitter metadata
- Google Merchant Center XML feed:
  - `/api/google/merchant-feed`
  - `/api/google/products.xml`
- Improved sitemap priority/change frequency
- Robots allowlist for Merchant feed and admin/API disallows
- Vercel Hobby-safe daily Shopify cron schedule

## Required environment variables

Set these in Vercel and locally where needed:

```env
NEXT_PUBLIC_SITE_URL=https://asorta.nl
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=your_google_search_console_verification_token
```

`NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` is optional, but useful for Search Console HTML tag verification.

## Google setup checklist

1. Create a GA4 property and copy the Measurement ID into `NEXT_PUBLIC_GA_MEASUREMENT_ID`.
2. Verify `asorta.nl` in Google Search Console.
3. Submit `https://asorta.nl/sitemap.xml` in Search Console.
4. Create/claim ASORTA in Google Merchant Center.
5. Add the feed URL: `https://asorta.nl/api/google/products.xml`.
6. Confirm products have images, prices, descriptions and Shopify variant IDs.

## Notes

Google Analytics measures behavior; it does not by itself improve rankings. Organic visibility requires Search Console, indexable pages, structured product data, a clean feed, useful product copy, fast pages and authority. To appear above competitors quickly, use Google Merchant Center + Shopping/Performance Max/Search Ads.
