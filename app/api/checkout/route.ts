import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createOrderFromCheckout } from '@/lib/checkout/orders'
import { createMolliePayment, hasMollieConfig } from '@/lib/checkout/mollie'
import { createShopifyCheckoutRedirect } from '@/lib/shopify/checkout'
import { canCreateManualShopifyDraftOrder, createManualShopifyDraftOrder } from '@/lib/shopify/manual-draft-order'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))

    if (body.provider === 'shopify' || (!body.provider && process.env.CHECKOUT_PROVIDER === 'shopify')) {
      const result = await createShopifyCheckoutRedirect({
        items: body.items,
        email: body.email || body.shipping?.email,
        discountCode: body.discountCode || body.discount_code || body.discount?.code,
        client: createAdminClient(),
      })
      return NextResponse.json({ ok: true, paymentProvider: 'shopify_paypal', checkoutUrl: result.checkoutUrl })
    }

    const admin = createAdminClient()
    if (!admin) return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY ontbreekt. Checkout is fail-closed.' }, { status: 503 })

    const result = await createOrderFromCheckout(admin, { items: body.items, shipping: body.shipping, source: 'site_checkout' })

    // Eigen voorraad gaat voorlopig via Shopify Draft Order invoice checkout, zodat
    // PayPal gebruikt kan worden zonder dat het product als Shopify/DSers variant
    // in de catalogus hoeft te bestaan. Mollie/iDEAL/Wero kan later alsnog worden
    // ingeschakeld door MOLLIE_API_KEY te zetten en deze providerkeuze aan te passen.
    if (canCreateManualShopifyDraftOrder()) {
      const draft = await createManualShopifyDraftOrder({
        order: result.order,
        items: result.items,
        shipping: result.shipping,
        discountCode: body.discountCode || body.discount_code || body.discount?.code,
      })

      await admin
        .from('orders')
        .update({
          payment_id: draft.id,
          payment_provider: 'shopify_paypal',
          payment_status: 'open',
          updated_at: new Date().toISOString(),
        })
        .eq('id', result.order.id)

      return NextResponse.json({
        ok: true,
        paymentProvider: 'shopify_paypal',
        checkoutUrl: draft.invoiceUrl,
        order: {
          id: result.order.id,
          orderNumber: result.order.order_number,
          total: result.order.total,
        },
      })
    }

    if (!hasMollieConfig()) {
      return NextResponse.json({
        ok: true,
        paymentProvider: 'manual',
        checkoutUrl: `/checkout/success?order=${encodeURIComponent(result.order.order_number)}&payment=manual`,
        message: 'Order aangemaakt. PayPal/Shopify draft checkout is nog niet geconfigureerd voor eigen voorraad.',
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
