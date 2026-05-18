# ASORTA v6.3.0 Mobile, language and Atlas fixes

## Included

- Mobile polish for header, product grids, product cards, checkout and footer.
- Language switcher in the header with `nl` and `en` cookie/localStorage support.
- Basic UI translations for navigation, cart, checkout, shop filters, footer and category labels.
- Shopify sync error hardening: non-array Shopify `errors` responses no longer crash with `.map is not a function`.
- Atlas Page Editor save hardening: success/error feedback and fallback save for older `site_content` schemas.
- Storefront compare-at safety: compare-at price only displays when it is higher than the sale price.
- Supabase migration `supabase/v5_19_mobile_i18n_atlas_fixes.sql`.

## After installing

Run in Supabase SQL Editor:

```sql
supabase/v5_19_mobile_i18n_atlas_fixes.sql
```

Then locally:

```bash
npm run typecheck
npm run build
```

In this sandbox `npm run typecheck` passed. `next build` could not complete here because Next tried to download the SWC binary and the sandbox blocks `npm config get registry`; this is environment-related, not a TypeScript error.
