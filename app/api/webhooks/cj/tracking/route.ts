import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

function authorized(request: Request) {
  const secret = process.env.CJ_WEBHOOK_SECRET
  if (!secret) return true
  return request.headers.get('x-cj-webhook-secret') === secret || request.headers.get('authorization') === `Bearer ${secret}`
}

export async function POST(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized CJ webhook.' }, { status: 401 })
  const admin = createAdminClient()
  if (!admin) return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY ontbreekt.' }, { status: 503 })

  try {
    const payload = await request.json().catch(() => ({}))
    const supplierOrderId = String(payload.orderId || payload.orderNumber || payload.cjOrderId || '').trim()
    const trackingNumber = String(payload.trackingNumber || payload.trackNumber || payload.logisticsTrackingNumber || '').trim()
    const trackingUrl = String(payload.trackingUrl || payload.trackUrl || '').trim()
    if (!supplierOrderId) return NextResponse.json({ error: 'Missing supplier order id.' }, { status: 400 })

    const { data } = await admin
      .from('fulfillment_orders')
      .update({
        status: trackingNumber ? 'shipped' : 'tracking_updated',
        tracking_number: trackingNumber || null,
        tracking_url: trackingUrl || null,
        raw: payload,
        updated_at: new Date().toISOString(),
      })
      .eq('supplier', 'cj')
      .eq('supplier_order_id', supplierOrderId)
      .select('order_id')

    if (data?.length) {
      await admin
        .from('orders')
        .update({ fulfillment_status: trackingNumber ? 'partially_or_fully_shipped' : 'tracking_updated', tracking_number: trackingNumber || null, tracking_url: trackingUrl || null, updated_at: new Date().toISOString() })
        .in('id', data.map((row: any) => row.order_id))
    }

    return NextResponse.json({ ok: true, matched: data?.length || 0 })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'CJ tracking webhook failed.' }, { status: 500 })
  }
}
