# ASORTA Store v4.1

ASORTA — Just what you need.

## Included in v4.1

- Real ASORTA launch product integration
- Product pricing incl. estimated VAT-aware retail positioning
- Supplier metadata fields for CJ Dropshipping
- `/account` customer portal foundation
- `/login` customer login placeholder
- `/checkout` guest/account checkout foundation
- `/atlas` internal ASORTA control panel foundation
- Supabase client prep
- Supabase SQL starter schema
- CJ API client prep
- `.env.example` for Vercel environment variables

## Run locally

```bash
npm install
npm run dev
```

## Push live

```bash
git add .
git commit -m "Upgrade ASORTA to v4.1"
git push
```

## Supabase next steps

1. Create a Supabase project.
2. Copy the SQL from `supabase/schema.sql` into the Supabase SQL editor.
3. Add these variables in Vercel:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

## CJ next steps

Do not expose CJ tokens in frontend code.
Add CJ credentials only in Vercel Environment Variables later:

```env
CJ_ACCESS_TOKEN=
CJ_REFRESH_TOKEN=
CJ_APP_KEY=
```

Real CJ order creation must only happen after payment success.
