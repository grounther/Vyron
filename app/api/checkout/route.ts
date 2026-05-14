import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createOrderFromCheckout } from '@/lib/checkout/orders'
import { createMolliePayment, hasMollieConfig } from '@/lib/checkout/mollie'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const admin = createAdminClient()
    if (!admin) return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY ontbreekt. Checkout is fail-closed.' }, { status: 503 })

    const body = await request.json().catch(() => ({}))
    const result = await createOrderFromCheckout(admin, { items: body.items, shipping: body.shipping, source: 'site_checkout' })

    if (!hasMollieConfig()) {
      return NextResponse.json({
        ok: true,
        paymentProvider: 'manual',
        message: 'Order aangemaakt. MOLLIE_API_KEY ontbreekt, dus er is nog geen betaalredirect gemaakt.',
        order: {
          id: result.order.id,
          orderNumber: result.order.order_number,
          total: result.order.total,
        },
      })
    }

    const payment = await createMolliePayment(result.order)
    await admin
      .from('orders')
      .update({ payment_id: payment.id, payment_provider: 'mollie', payment_status: payment.status || 'open', updated_at: new Date().toISOString() })
      .eq('id', result.order.id)

    return NextResponse.json({
      ok: true,
      paymentProvider: 'mollie',
      checkoutUrl: payment._links?.checkout?.href || null,
      order: {
        id: result.order.id,
        orderNumber: result.order.order_number,
        total: result.order.total,
      },
    })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Checkout failed.' }, { status: 500 })
  }
}
