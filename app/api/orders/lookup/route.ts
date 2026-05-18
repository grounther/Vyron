import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

type AnyRow = Record<string, any>

function normalizeEmail(value: unknown) {
  return String(value || '').trim().toLowerCase()
}

function normalizeOrder(value: unknown) {
  return String(value || '')
    .trim()
    .replace(/^order\s*/i, '')
    .replace(/^#/, '')
    .replace(/^SHOPIFY-/i, '')
    .replace(/^AS-/i, '')
    .replace(/[^a-zA-Z0-9_-]/g, '')
}

function number(value: unknown, fallback = 0) {
  const parsed = Number(value || 0)
  return Number.isFinite(parsed) ? parsed : fallback
}

function isPaid(status: unknown) {
  return ['paid', 'authorized', 'partially_paid', 'complete', 'completed'].includes(String(status || '').toLowerCase())
}

function isFulfilled(status: unknown) {
  return ['fulfilled', 'shipped', 'delivered', 'partially_fulfilled'].includes(String(status || '').toLowerCase())
}

function timeline(order: AnyRow) {
  const paid = isPaid(order.payment_status || order.shopify_financial_status)
  const fulfilled = isFulfilled(order.fulfillment_status || order.shopify_fulfillment_status)
  const tracking = Boolean(order.tracking_number || order.tracking_url || order.shopify_tracking_numbers?.length || order.shopify_tracking_urls?.length)

  return [
    { key: 'received', label: 'Bestelling ontvangen', description: 'Je bestelling is geregistreerd in ons systeem.', done: true },
    { key: 'paid', label: 'Betaling bevestigd', description: 'De betaling is ontvangen of geautoriseerd.', done: paid },
    { key: 'processing', label: 'In behandeling', description: 'Je bestelling wordt voorbereid voor verzending.', done: paid || fulfilled || tracking },
    { key: 'tracking', label: 'Tracking beschikbaar', description: 'Je ontvangt tracking zodra je pakket is aangemeld bij de vervoerder.', done: tracking },
  ]
}

export async function POST(request: Request) {
  const admin = createAdminClient()
  if (!admin) return NextResponse.json({ error: 'Orderstatus is tijdelijk niet beschikbaar.' }, { status: 503 })

  const body = await request.json().catch(() => ({}))
  const email = normalizeEmail(body.email)
  const orderNeedle = normalizeOrder(body.orderNumber)

  if (!email || !email.includes('@') || !orderNeedle) {
    return NextResponse.json({ error: 'Vul een geldig ordernummer en e-mailadres in.' }, { status: 400 })
  }

  const candidates = Array.from(new Set([
    orderNeedle,
    `#${orderNeedle}`,
    `SHOPIFY-${orderNeedle}`,
    `AS-${orderNeedle}`,
  ]))

  const { data: orders, error } = await admin
    .from('orders')
    .select('*')
    .eq('customer_email', email)
    .or(candidates.map((candidate) => `order_number.eq.${candidate},shopify_order_name.eq.${candidate},shopify_order_id.eq.${candidate}`).join(','))
    .order('created_at', { ascending: false })
    .limit(5)

  if (error) return NextResponse.json({ error: 'Orderstatus kon niet worden opgehaald.' }, { status: 500 })

  const order = (orders || []).find((row: AnyRow) => {
    const values = [row.order_number, row.shopify_order_name, row.shopify_order_id].map(normalizeOrder)
    return values.includes(orderNeedle)
  }) as AnyRow | undefined

  if (!order) {
    return NextResponse.json({ error: 'We konden geen bestelling vinden met deze combinatie van ordernummer en e-mailadres.' }, { status: 404 })
  }

  const { data: items } = await admin
    .from('order_items')
    .select('id, product_name, quantity, unit_price')
    .eq('order_id', order.id)
    .order('created_at', { ascending: true })

  const trackingNumber = order.tracking_number || order.shopify_tracking_numbers?.[0] || null
  const trackingUrl = order.tracking_url || order.shopify_tracking_urls?.[0] || null

  return NextResponse.json({
    order: {
      orderNumber: order.order_number || order.shopify_order_name || order.id,
      customerEmail: order.customer_email,
      paymentStatus: order.payment_status || order.shopify_financial_status || 'pending',
      fulfillmentStatus: order.fulfillment_status || order.shopify_fulfillment_status || 'processing',
      total: number(order.total),
      currency: order.currency || 'EUR',
      trackingNumber,
      trackingUrl,
      orderStatusUrl: order.shopify_order_status_url || null,
      createdAt: order.created_at || null,
      updatedAt: order.updated_at || null,
      items: (items || []).map((item: AnyRow) => ({
        id: item.id,
        productName: item.product_name || 'Product',
        quantity: number(item.quantity, 1),
        unitPrice: number(item.unit_price),
      })),
      timeline: timeline(order),
    },
  })
}
