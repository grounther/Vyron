import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getMolliePayment } from '@/lib/checkout/mollie'
import { createFulfillmentForOrder } from '@/lib/fulfillment/router'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const admin = createAdminClient()
  if (!admin) return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY ontbreekt.' }, { status: 503 })

  try {
    const formData = await request.formData().catch(() => null)
    const paymentId = String(formData?.get('id') || '').trim()
    if (!paymentId) return NextResponse.json({ error: 'Missing Mollie payment id.' }, { status: 400 })

    const payment = await getMolliePayment(paymentId)
    const orderId = payment.metadata?.order_id
    if (!orderId) return NextResponse.json({ error: 'Payment metadata mist order_id.' }, { status: 400 })

    const paid = payment.status === 'paid' || payment.status === 'authorized'
    await admin
      .from('orders')
      .update({ payment_status: payment.status, payment_id: payment.id, updated_at: new Date().toISOString() })
      .eq('id', orderId)

    let fulfillment = null
    if (paid) {
      fulfillment = await createFulfillmentForOrder(admin, orderId)
    }

    return NextResponse.json({ ok: true, paymentStatus: payment.status, fulfillment })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Mollie webhook failed.' }, { status: 500 })
  }
}
