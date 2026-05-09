# ASORTA Store

Premium ecommerce storefront for ASORTA — Just what you need.

## Run locally

```bash
npm install
npm run dev
```

## Notes

- v4.4 adds a separate internal Atlas login route: `/atlas-access`.
- Customer auth stays on `/login` and `/register`.
- Atlas remains protected by Supabase Auth + `admin_users` allowlist.
- Next.js middleware file has been replaced with `proxy.ts` to match the newer Next.js convention.
- Keep `.env.local` private and never commit Supabase service role keys or CJ API tokens.
