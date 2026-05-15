import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyShopifyWebhook } from '@/lib/shopify/client'
import { upsertShopifyOrderWebhook } from '@/lib/shopify/order-webhooks'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const rawBody = await request.text()
  const hmac = request.headers.get('x-shopify-hmac-sha256')
  const topic = request.headers.get('x-shopify-topic') || 'orders/update'

  if (!verifyShopifyWebhook(rawBody, hmac)) {
    return NextResponse.json({ error: 'Invalid Shopify webhook HMAC.' }, { status: 401 })
  }

  const admin = createAdminClient()
  if (!admin) return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY ontbreekt.' }, { status: 503 })

  try {
    const payload = JSON.parse(rawBody)
    const result = await upsertShopifyOrderWebhook(admin, payload, topic)
    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    await admin.from('integration_sync_logs').insert({
      provider: 'shopify',
      event: topic,
      status: 'error',
      message: error instanceof Error ? error.message : 'Shopify order webhook failed.',
      payload: { rawBody: rawBody.slice(0, 2000) },
    }).then(() => undefined, () => undefined)

    return NextResponse.json({ error: error instanceof Error ? error.message : 'Shopify order webhook failed.' }, { status: 500 })
  }
}
