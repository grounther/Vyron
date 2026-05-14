import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyShopifyWebhook } from '@/lib/shopify/client'
import { syncShopifyProducts } from '@/lib/shopify/sync'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const rawBody = await request.text()
  const hmac = request.headers.get('x-shopify-hmac-sha256')
  const topic = request.headers.get('x-shopify-topic') || 'products/update'

  if (!verifyShopifyWebhook(rawBody, hmac)) {
    return NextResponse.json({ error: 'Invalid Shopify webhook HMAC.' }, { status: 401 })
  }

  const admin = createAdminClient()
  if (!admin) return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY ontbreekt.' }, { status: 503 })

  try {
    const payload = JSON.parse(rawBody)
    if (topic.includes('delete')) {
      const handle = payload.handle || payload.admin_graphql_api_id
      await admin
        .from('products')
        .update({ status: 'archived', shopify_status: 'DELETED', updated_at: new Date().toISOString() })
        .or(`shopify_product_id.eq.${payload.admin_graphql_api_id || payload.id},shopify_handle.eq.${handle}`)
      return NextResponse.json({ ok: true, archived: true })
    }

    const result = await syncShopifyProducts(admin, { productPayload: payload, source: 'webhook' })
    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    await admin.from('integration_sync_logs').insert({
      provider: 'shopify',
      event: topic,
      status: 'error',
      message: error instanceof Error ? error.message : 'Shopify webhook failed.',
      payload: { rawBody: rawBody.slice(0, 2000) },
    }).then(() => undefined, () => undefined)

    return NextResponse.json({ error: error instanceof Error ? error.message : 'Shopify webhook failed.' }, { status: 500 })
  }
}
