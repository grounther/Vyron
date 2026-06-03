import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createOrderFromCheckout } from '@/lib/checkout/orders'
import { createMolliePayment, hasMollieConfig } from '@/lib/checkout/mollie'
import { createPayPalOrder, hasPayPalConfig } from '@/lib/checkout/paypal'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const admin = createAdminClient()
    if (!admin) return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY ontbreekt. Checkout is fail-closed.' }, { status: 503 })

    let authUserId = ''
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      authUserId = user?.id || ''
    } catch {
      authUserId = ''
    }

    const provider = String(body.provider || process.env.CHECKOUT_PROVIDER || process.env.PAYMENT_PROVIDER || 'paypal').toLowerCase()

    if (!((provider === 'mollie' || provider === 'ideal' || provider === 'wero') && hasMollieConfig()) && !hasPayPalConfig()) {
      return NextResponse.json({
        error: 'PayPal is nog niet geconfigureerd. Voeg PAYPAL_CLIENT_ID en PAYPAL_CLIENT_SECRET toe in Vercel Environment Variables.',
      }, { status: 503 })
    }

    const result = await createOrderFromCheckout(admin, {
      items: body.items,
      shipping: body.shipping,
      source: 'site_checkout',
      authUserId,
    })

    if (authUserId) {
      await admin.from('orders').update({ auth_user_id: authUserId, updated_at: new Date().toISOString() }).eq('id', result.order.id)
    }

    if ((provider === 'mollie' || provider === 'ideal' || provider === 'wero') && hasMollieConfig()) {
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
    }

    const paypal = await createPayPalOrder(result.order, result.items, result.shipping)
    await admin
      .from('orders')
      .update({
        payment_id: paypal.id,
        payment_provider: 'paypal',
        payment_status: 'open',
        fulfillment_status: 'pending_payment',
        updated_at: new Date().toISOString(),
      })
      .eq('id', result.order.id)

    return NextResponse.json({
      ok: true,
      paymentProvider: 'paypal',
      checkoutUrl: paypal.approvalUrl,
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
