import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { capturePayPalOrder } from '@/lib/checkout/paypal'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const paypalOrderId = String(body.paypalOrderId || body.token || '').trim()
    const orderNumber = String(body.orderNumber || body.order || '').trim()
    const admin = createAdminClient()
    if (!admin) return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY ontbreekt.' }, { status: 503 })

    const result = await capturePayPalOrder(admin, paypalOrderId, orderNumber || undefined)
    return NextResponse.json({ ok: true, status: result.status, order: { id: result.order.id, orderNumber: result.order.order_number, paymentStatus: result.order.payment_status } })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'PayPal capture failed.' }, { status: 500 })
  }
}
