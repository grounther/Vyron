import type { SupabaseClient } from '@supabase/supabase-js'
import { finalizePaidOrder } from '@/lib/checkout/orders'

type MolliePaymentResponse = {
  id: string
  status: string
  method?: string | null
  amount?: { currency?: string; value?: string }
  metadata?: Record<string, string>
  _links?: { checkout?: { href?: string } }
}

type MollieMethod = 'ideal' | 'wero' | 'bancontact' | 'creditcard'

function siteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL || ''
  if (!configured) return 'http://localhost:3000'
  if (configured.startsWith('http://') || configured.startsWith('https://')) return configured.replace(/\/$/, '')
  return `https://${configured.replace(/\/$/, '')}`
}

function normalizeMethod(method: unknown): MollieMethod {
  const value = String(method || 'ideal').trim().toLowerCase()
  if (value === 'wero' || value === 'bancontact' || value === 'creditcard') return value
  return 'ideal'
}

function mollieStatusToOrderStatus(status: string) {
  const normalized = String(status || '').toLowerCase()
  if (normalized === 'paid' || normalized === 'authorized') return 'paid'
  if (normalized === 'canceled' || normalized === 'cancelled') return 'cancelled'
  if (normalized === 'expired' || normalized === 'failed') return normalized
  return normalized || 'open'
}

export function hasMollieConfig() {
  return Boolean(process.env.MOLLIE_API_KEY)
}

export async function createMolliePayment(order: Record<string, any>, method: unknown = 'ideal') {
  const apiKey = process.env.MOLLIE_API_KEY
  if (!apiKey) throw new Error('MOLLIE_API_KEY ontbreekt.')

  const baseUrl = siteUrl()
  const orderNumber = String(order.order_number || order.id)
  const mollieMethod = normalizeMethod(method)
  const response = await fetch('https://api.mollie.com/v2/payments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      amount: {
        currency: order.currency || 'EUR',
        value: Number(order.total || 0).toFixed(2),
      },
      method: mollieMethod,
      description: `ASORTA order ${orderNumber}`,
      redirectUrl: `${baseUrl}/checkout/success?payment=mollie&order=${encodeURIComponent(orderNumber)}`,
      webhookUrl: `${baseUrl}/api/webhooks/payment/mollie`,
      metadata: {
        order_id: String(order.id),
        order_number: orderNumber,
        method: mollieMethod,
      },
    }),
    cache: 'no-store',
  })

  const body = (await response.json().catch(() => ({}))) as MolliePaymentResponse & { detail?: string; title?: string; field?: string }
  if (!response.ok || !body.id) {
    throw new Error(`Mollie betaling aanmaken mislukt: ${body.detail || body.title || body.field || response.status}`)
  }

  return body
}

export async function getMolliePayment(paymentId: string) {
  const apiKey = process.env.MOLLIE_API_KEY
  if (!apiKey) throw new Error('MOLLIE_API_KEY ontbreekt.')

  const response = await fetch(`https://api.mollie.com/v2/payments/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
    cache: 'no-store',
  })
  const body = (await response.json().catch(() => ({}))) as MolliePaymentResponse & { detail?: string; title?: string }
  if (!response.ok || !body.id) throw new Error(body.detail || body.title || `Mollie betaling ophalen mislukt: HTTP ${response.status}`)
  return body
}

export async function processMolliePayment(admin: SupabaseClient, paymentId: string) {
  if (!paymentId) throw new Error('Mollie payment id ontbreekt.')

  const payment = await getMolliePayment(paymentId)
  const orderId = String(payment.metadata?.order_id || '').trim()
  const orderNumber = String(payment.metadata?.order_number || '').trim()
  if (!orderId && !orderNumber) throw new Error('Mollie metadata mist order_id/order_number.')

  let query = admin.from('orders').select('*').limit(1)
  if (orderId) query = query.eq('id', orderId)
  else query = query.eq('order_number', orderNumber)

  const { data: orders, error: lookupError } = await query
  if (lookupError) throw new Error(lookupError.message)

  const order = orders?.[0]
  if (!order?.id) throw new Error('ASORTA order niet gevonden bij deze Mollie betaling.')

  const orderPaymentStatus = mollieStatusToOrderStatus(payment.status)
  const isPaid = orderPaymentStatus === 'paid'
  const currentRaw = order.raw && typeof order.raw === 'object' && !Array.isArray(order.raw) ? order.raw : {}

  const { data: updated, error: updateError } = await admin
    .from('orders')
    .update({
      payment_status: orderPaymentStatus,
      payment_provider: 'mollie',
      payment_id: payment.id,
      supplier_order_id: payment.id,
      fulfillment_status: isPaid && ['pending_payment', 'open', ''].includes(String(order.fulfillment_status || '').toLowerCase()) ? 'pending' : order.fulfillment_status,
      raw: { ...currentRaw, mollie_payment: payment, mollie_status_checked_at: new Date().toISOString() },
      updated_at: new Date().toISOString(),
    })
    .eq('id', order.id)
    .select('*')
    .single()

  if (updateError) throw new Error(updateError.message)

  const finalized = isPaid ? await finalizePaidOrder(admin, updated) : updated
  return { payment, order: finalized, paid: isPaid, status: orderPaymentStatus }
}
