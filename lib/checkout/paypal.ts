import type { SupabaseClient } from '@supabase/supabase-js'

type PayPalLink = { href: string; rel: string; method?: string }
type PayPalOrderResponse = {
  id: string
  status?: string
  links?: PayPalLink[]
  purchase_units?: Array<{ reference_id?: string; payments?: any }>
}

function paypalMode() {
  return (process.env.PAYPAL_MODE || process.env.NEXT_PUBLIC_PAYPAL_MODE || 'sandbox').toLowerCase() === 'live' ? 'live' : 'sandbox'
}

function paypalBaseUrl() {
  return paypalMode() === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com'
}

function getCredentials() {
  const clientId = process.env.PAYPAL_CLIENT_ID || ''
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET || ''
  if (!clientId || !clientSecret) throw new Error('PAYPAL_CLIENT_ID en PAYPAL_CLIENT_SECRET ontbreken.')
  return { clientId, clientSecret }
}

export function hasPayPalConfig() {
  return Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET)
}

export function getSiteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL || ''
  if (!configured) return 'http://localhost:3000'
  if (configured.startsWith('http://') || configured.startsWith('https://')) return configured.replace(/\/$/, '')
  return `https://${configured.replace(/\/$/, '')}`
}

async function getAccessToken() {
  const { clientId, clientSecret } = getCredentials()
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  const response = await fetch(`${paypalBaseUrl()}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
    cache: 'no-store',
  })

  const body = await response.json().catch(() => ({}))
  if (!response.ok || !body.access_token) {
    throw new Error(body?.error_description || body?.message || `PayPal OAuth failed: HTTP ${response.status}`)
  }

  return String(body.access_token)
}

function amount(value: unknown) {
  return Number(value || 0).toFixed(2)
}

function approvalUrl(order: PayPalOrderResponse) {
  const links = Array.isArray(order.links) ? order.links : []
  return (
    links.find((link) => String(link.rel).toLowerCase() === 'approve')?.href ||
    links.find((link) => String(link.rel).toLowerCase() === 'payer-action')?.href ||
    links.find((link) => String(link.rel).toLowerCase() === 'checkout')?.href ||
    ''
  )
}

function paypalLinksForDebug(order: PayPalOrderResponse) {
  return Array.isArray(order.links)
    ? order.links.map((link) => `${link.rel}:${link.href}`).join(' | ')
    : 'geen links ontvangen'
}

export async function createPayPalOrder(order: Record<string, any>, items: any[], shipping: Record<string, any>) {
  const accessToken = await getAccessToken()
  const siteUrl = getSiteUrl()
  const orderNumber = String(order.order_number || order.id)

  const returnUrl = `${siteUrl}/checkout/success?payment=paypal&order=${encodeURIComponent(orderNumber)}`
  const cancelUrl = `${siteUrl}/checkout?payment=cancelled&order=${encodeURIComponent(orderNumber)}`

  const response = await fetch(`${paypalBaseUrl()}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'PayPal-Request-Id': `asorta-${order.id}`,
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: orderNumber,
          description: `ASORTA order ${orderNumber}`,
          custom_id: String(order.id),
          invoice_id: orderNumber,
          amount: {
            currency_code: order.currency || 'EUR',
            value: amount(order.total),
            breakdown: {
              item_total: { currency_code: order.currency || 'EUR', value: amount(order.subtotal) },
              shipping: { currency_code: order.currency || 'EUR', value: amount(order.shipping_total) },
            },
          },
          items: items.map((item) => ({
            name: String(item.product_name || item.product_slug || 'ASORTA product').slice(0, 127),
            sku: String(item.variant_sku || item.supplier_sku || item.product_slug || '').slice(0, 127),
            quantity: String(item.quantity || 1),
            unit_amount: { currency_code: order.currency || 'EUR', value: amount(item.unit_price) },
            category: 'PHYSICAL_GOODS',
          })),
          shipping: {
            name: { full_name: String(shipping.name || '').slice(0, 300) },
            address: {
              address_line_1: String(shipping.address1 || '').slice(0, 300),
              address_line_2: String(shipping.address2 || '').slice(0, 300),
              admin_area_2: String(shipping.city || '').slice(0, 120),
              admin_area_1: String(shipping.province || '').slice(0, 300),
              postal_code: String(shipping.postalCode || '').slice(0, 60),
              country_code: String(shipping.countryCode || 'NL').slice(0, 2),
            },
          },
        },
      ],
      payment_source: {
        paypal: {
          experience_context: {
            payment_method_preference: 'IMMEDIATE_PAYMENT_REQUIRED',
            brand_name: 'ASORTA',
            locale: 'nl-NL',
            landing_page: 'LOGIN',
            shipping_preference: 'SET_PROVIDED_ADDRESS',
            user_action: 'PAY_NOW',
            return_url: returnUrl,
            cancel_url: cancelUrl,
          },
        },
      },
    }),
    cache: 'no-store',
  })

  const body = (await response.json().catch(() => ({}))) as PayPalOrderResponse & { message?: string; details?: any[] }
  if (!response.ok || !body.id) {
    const detail = body.details?.map((item: any) => item.description || item.issue).filter(Boolean).join(' ') || ''
    throw new Error(body.message || detail || `PayPal order aanmaken mislukt: HTTP ${response.status}`)
  }

  const url = approvalUrl(body)
  if (!url) {
    throw new Error(`PayPal gaf geen betaal-link terug. Ontvangen links: ${paypalLinksForDebug(body)}`)
  }

  return { id: body.id, status: body.status || 'CREATED', approvalUrl: url }
}

export async function capturePayPalOrder(admin: SupabaseClient, paypalOrderId: string, expectedOrderNumber?: string) {
  if (!paypalOrderId) throw new Error('PayPal order-id ontbreekt.')

  let query = admin.from('orders').select('*').eq('payment_id', paypalOrderId).limit(1)
  if (expectedOrderNumber) query = query.eq('order_number', expectedOrderNumber)

  const { data: existingOrders, error: lookupError } = await query
  if (lookupError) throw new Error(lookupError.message)

  const order = existingOrders?.[0]
  if (!order?.id) throw new Error('ASORTA order niet gevonden bij deze PayPal betaling.')
  if (String(order.payment_status || '').toLowerCase() === 'paid') return { order, status: 'already_paid' }

  const accessToken = await getAccessToken()
  const response = await fetch(`${paypalBaseUrl()}/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}/capture`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'PayPal-Request-Id': `asorta-capture-${order.id}`,
    },
    cache: 'no-store',
  })

  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    const details = Array.isArray(body?.details) ? body.details.map((item: any) => item.description || item.issue).filter(Boolean).join(' ') : ''
    throw new Error(body?.message || details || `PayPal capture mislukt: HTTP ${response.status}`)
  }

  const capture = body?.purchase_units?.[0]?.payments?.captures?.[0]
  const captureStatus = String(capture?.status || body?.status || '').toUpperCase()
  const paid = captureStatus === 'COMPLETED' || String(body?.status || '').toUpperCase() === 'COMPLETED'

  const { data: updated, error: updateError } = await admin
    .from('orders')
    .update({
      payment_status: paid ? 'paid' : captureStatus.toLowerCase() || 'open',
      payment_provider: 'paypal',
      supplier_order_id: capture?.id || null,
      fulfillment_status: paid ? 'pending' : 'pending_payment',
      raw: { ...(order.raw || {}), paypal_capture: body },
      updated_at: new Date().toISOString(),
    })
    .eq('id', order.id)
    .select('*')
    .single()

  if (updateError) throw new Error(updateError.message)
  await grantPackCreditForPaidOrder(admin, updated)

  return { order: updated, status: captureStatus || body?.status || 'captured' }
}

export async function grantPackCreditForPaidOrder(admin: SupabaseClient, order: Record<string, any>) {
  if (!order?.id || String(order.payment_status || '').toLowerCase() !== 'paid') return

  const email = String(order.customer_email || '').trim().toLowerCase()
  if (!email) return

  const { data: customer } = await admin
    .from('customers')
    .select('id,auth_user_id,email')
    .eq('email', email)
    .maybeSingle()

  if (!customer?.auth_user_id) return

  await admin
    .from('customer_pack_credits')
    .upsert({
      customer_id: customer.id,
      auth_user_id: customer.auth_user_id,
      customer_email: email,
      order_id: order.id,
      order_number: order.order_number,
      source: 'paypal_paid_order',
      status: 'available',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'order_id' })
    .then(() => undefined, () => undefined)
}
