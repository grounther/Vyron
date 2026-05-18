import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { hasShopifyAdminConfig } from '@/lib/shopify/client'
import { syncShopifyProducts } from '@/lib/shopify/sync'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET?.trim()
  if (!secret) return process.env.NODE_ENV !== 'production'
  return request.headers.get('authorization') === `Bearer ${secret}`
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized cron request. Set CRON_SECRET in Vercel.' }, { status: 401 })
  }

  if (!hasShopifyAdminConfig()) {
    return NextResponse.json({ error: 'Shopify env vars ontbreken: zet SHOPIFY_STORE_DOMAIN plus SHOPIFY_CLIENT_ID en SHOPIFY_CLIENT_SECRET.' }, { status: 400 })
  }

  const admin = createAdminClient()
  if (!admin) {
    return NextResponse.json({ error: 'Supabase admin client ontbreekt.' }, { status: 500 })
  }

  const limit = Math.min(Math.max(Number(process.env.SHOPIFY_CRON_SYNC_LIMIT || 50), 1), 200)

  try {
    const result = await syncShopifyProducts(admin, { limit, source: 'manual' })
    await admin.from('integration_sync_logs').insert({
      provider: 'shopify',
      event: 'cron',
      status: 'success',
      message: `Hourly Shopify auto-sync completed: ${result.imported} products, ${result.mapped} mappings.`,
      payload: result,
    }).then(() => undefined, () => undefined)

    return NextResponse.json({ ok: true, source: 'cron', ...result })
  } catch (error) {
    await admin.from('integration_sync_logs').insert({
      provider: 'shopify',
      event: 'cron',
      status: 'error',
      message: error instanceof Error ? error.message : 'Shopify cron sync failed.',
    }).then(() => undefined, () => undefined)

    return NextResponse.json({ error: error instanceof Error ? error.message : 'Shopify cron sync failed.' }, { status: 500 })
  }
}
