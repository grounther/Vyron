import { NextResponse } from 'next/server'
import { requireAtlasAdminApi } from '@/lib/server/atlas-api'
import { hasShopifyAdminConfig } from '@/lib/shopify/client'
import { syncShopifyProducts } from '@/lib/shopify/sync'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const auth = await requireAtlasAdminApi()
  if (!auth.ok) return auth.response

  if (!hasShopifyAdminConfig()) {
    return NextResponse.json({ error: 'Shopify env vars ontbreken: SHOPIFY_STORE_DOMAIN en SHOPIFY_ADMIN_ACCESS_TOKEN.' }, { status: 400 })
  }

  try {
    const body = await request.json().catch(() => ({}))
    const limit = Math.min(Math.max(Number(body.limit || 50), 1), 200)
    const result = await syncShopifyProducts(auth.admin, { limit, source: 'manual' })
    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    await auth.admin.from('integration_sync_logs').insert({
      provider: 'shopify',
      event: 'manual',
      status: 'error',
      message: error instanceof Error ? error.message : 'Shopify sync failed.',
    }).then(() => undefined, () => undefined)

    return NextResponse.json({ error: error instanceof Error ? error.message : 'Shopify sync failed.' }, { status: 500 })
  }
}
