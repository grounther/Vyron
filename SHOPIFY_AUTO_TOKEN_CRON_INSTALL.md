# Shopify auto-token + hourly sync

This patch removes the need to manually refresh `SHOPIFY_ADMIN_ACCESS_TOKEN`.

## Required Vercel environment variables

Set these in Vercel -> Project -> Settings -> Environment Variables:

```env
SHOPIFY_STORE_DOMAIN=wq1bsh-vx.myshopify.com
SHOPIFY_SHOP=wq1bsh-vx
SHOPIFY_CLIENT_ID=...
SHOPIFY_CLIENT_SECRET=...
SHOPIFY_API_VERSION=2026-04
CRON_SECRET=use-a-random-secret-of-at-least-16-characters
SHOPIFY_CRON_SYNC_LIMIT=50
```

`SHOPIFY_ADMIN_ACCESS_TOKEN` is no longer required. You can remove it from Vercel to avoid using an old expired token.

## Cron

`vercel.json` runs `/api/cron/shopify-sync` every hour.

The route requires `CRON_SECRET` in production. Vercel automatically sends this secret as an Authorization Bearer header when invoking cron jobs.

## Manual sync

Atlas -> Integrations -> Sync Shopify still works. It now automatically obtains a temporary Admin API access token from Shopify using `SHOPIFY_CLIENT_ID` and `SHOPIFY_CLIENT_SECRET`.
