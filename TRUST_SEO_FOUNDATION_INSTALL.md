# ASORTA v6.4.1 Trust + SEO Foundation

Adds:
- `/about`
- `/track-order`
- `/atlas/seo`
- richer trust/legal default content
- footer links to trust pages
- sitemap entries for About and Track Order
- Supabase migration `supabase/v5_21_trust_seo_foundation.sql`

After install:
1. Run `npm run typecheck`
2. Run `npm run build`
3. Run the Supabase migration in SQL Editor
4. Open `/atlas/seo`
5. Resubmit `https://asorta.nl/sitemap.xml` in Search Console after deploy
