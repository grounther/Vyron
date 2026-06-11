'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { assertAtlasPermission } from '@/lib/atlas-auth'
import { finalizePaidOrder } from '@/lib/checkout/orders'
import { buildTrackingUrl, cleanTrackingNumber, customerTrackingEmailBody, normalizeShippingCarrier, shippingCarrierLabel } from '@/lib/checkout/shipping'
import { campaignEmailHtml, sendResendEmail } from '@/lib/newsletter'

function clean(value: FormDataEntryValue | null, limit = 500) {
  return typeof value === 'string' ? value.trim().slice(0, limit) : ''
}

function ordersRedirect(params: Record<string, string>) {
  const search = new URLSearchParams(params)
  redirect(`/atlas/orders?${search.toString()}`)
}

async function logEvent(admin: any, row: Record<string, any>) {
  await admin.from('order_processing_events').insert(row).then(() => undefined, () => undefined)
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    pending_payment: 'Wacht op betaling',
    processing: 'In verwerking',
    packed: 'Ingepakt',
    shipped: 'Verzonden',
    delivered: 'Afgeleverd',
    cancelled: 'Geannuleerd',
  }
  return labels[status] || status
}

async function saveFulfillmentUpdate(admin: any, input: {
  orderId: string
  userEmail?: string | null
  fulfillmentStatus: string
  trackingNumber?: string
  trackingUrl?: string
  shippingCarrier?: string
  notifyCustomer?: boolean
  shipmentBooked?: boolean
  pickingStarted?: boolean
  note?: string
  source?: string
}) {
  const { data: order, error: lookupError } = await admin
    .from('orders')
    .select('id,order_number,customer_email,raw,shipping_address,tracking_number,tracking_url,fulfillment_status')
    .eq('id', input.orderId)
    .single()

  if (lookupError || !order?.id) throw new Error('Order niet gevonden.')

  const raw = order.raw && typeof order.raw === 'object' ? order.raw : {}
  const now = new Date().toISOString()
  const status = input.fulfillmentStatus || 'processing'
  const lower = status.toLowerCase()
  const isCancelled = ['cancelled', 'canceled'].includes(lower)
  const carrier = normalizeShippingCarrier(input.shippingCarrier || raw.shipping_carrier || 'postnl')
  const trackingNumber = cleanTrackingNumber(input.trackingNumber || order.tracking_number || '')
  const trackingUrl = input.trackingUrl || order.tracking_url || buildTrackingUrl({ carrier, trackingNumber, order }) || ''
  const shipmentBookedAt = (input.shipmentBooked || Boolean(trackingNumber && lower === 'packed')) ? raw.shipment_booked_at || now : raw.shipment_booked_at || null
  const pickingStartedAt = input.pickingStarted ? raw.picking_started_at || now : raw.picking_started_at || null

  const { error } = await admin
    .from('orders')
    .update({
      fulfillment_status: status,
      tracking_number: trackingNumber || null,
      tracking_url: trackingUrl || null,
      raw: {
        ...raw,
        last_fulfillment_update_at: now,
        last_fulfillment_update_by: input.userEmail || null,
        last_fulfillment_note: input.note || raw.last_fulfillment_note || null,
        shipping_carrier: carrier,
        shipping_carrier_label: shippingCarrierLabel(carrier),
        picking_started_at: pickingStartedAt,
        picking_started_by: pickingStartedAt ? input.userEmail || raw.picking_started_by || null : raw.picking_started_by || null,
        shipment_booked_at: shipmentBookedAt,
        shipment_booked_by: shipmentBookedAt ? input.userEmail || raw.shipment_booked_by || null : raw.shipment_booked_by || null,
        packed_at: lower === 'packed' ? raw.packed_at || now : raw.packed_at || null,
        packed_by: lower === 'packed' ? input.userEmail || null : raw.packed_by || null,
        shipped_at: lower === 'shipped' ? raw.shipped_at || now : raw.shipped_at || null,
        shipped_by: lower === 'shipped' ? input.userEmail || null : raw.shipped_by || null,
        delivered_at: lower === 'delivered' ? raw.delivered_at || now : raw.delivered_at || null,
        delivered_by: lower === 'delivered' ? input.userEmail || null : raw.delivered_by || null,
        cancelled_at: isCancelled ? raw.cancelled_at || now : raw.cancelled_at || null,
        cancelled_by: isCancelled ? input.userEmail || null : raw.cancelled_by || null,
      },
      updated_at: now,
    })
    .eq('id', input.orderId)

  if (error) throw new Error(error.message)

  await logEvent(admin, {
    order_id: input.orderId,
    order_number: order.order_number,
    event_type: input.pickingStarted ? 'order_picking_started' : input.shipmentBooked ? 'shipment_booked' : lower === 'shipped' ? 'shipment_shipped' : 'fulfillment_updated',
    source: input.source || 'atlas_orders',
    message: input.note || `Fulfillment status aangepast naar ${statusLabel(status)}.`,
    actor_email: input.userEmail,
    metadata: { fulfillmentStatus: status, trackingNumber, trackingUrl, carrier, previousStatus: order.fulfillment_status, notifyCustomer: Boolean(input.notifyCustomer), shipmentBooked: Boolean(input.shipmentBooked), pickingStarted: Boolean(input.pickingStarted) },
  })

  if (lower === 'shipped' && input.notifyCustomer && order.customer_email && trackingNumber) {
    const body = customerTrackingEmailBody({
      orderNumber: order.order_number || input.orderId,
      carrier,
      trackingNumber,
      trackingUrl,
    })
    const emailResult = await sendResendEmail({
      to: order.customer_email,
      subject: `Je ASORTA bestelling is verzonden: ${order.order_number || input.orderId}`,
      html: campaignEmailHtml({
        eyebrow: 'ASORTA verzending',
        title: 'Je pakket is onderweg',
        body,
        ctaLabel: trackingUrl ? 'Bekijk tracking' : null,
        ctaUrl: trackingUrl || null,
      }),
      replyTo: 'klantenservice@asorta.nl',
      from: process.env.SUPPORT_FROM || process.env.NEWSLETTER_FROM || 'ASORTA Support <info@asorta.nl>',
    })

    await logEvent(admin, {
      order_id: input.orderId,
      order_number: order.order_number,
      event_type: emailResult.error ? 'tracking_email_failed' : emailResult.skipped ? 'tracking_email_skipped' : 'tracking_email_sent',
      source: 'atlas_orders_email',
      message: emailResult.error || emailResult.skipped ? `Trackingmail niet verzonden: ${emailResult.error || 'RESEND_API_KEY ontbreekt'}.` : 'Trackingmail naar klant verzonden.',
      actor_email: input.userEmail,
      metadata: { to: order.customer_email, carrier, trackingNumber, trackingUrl, result: emailResult },
    })
  }
}

export async function updateOrderFulfillment(formData: FormData) {
  const { admin, user } = await assertAtlasPermission('orders', '/atlas/orders')
  const orderId = clean(formData.get('order_id'), 80)
  const fulfillmentStatus = clean(formData.get('fulfillment_status'), 80) || 'processing'
  const trackingNumber = clean(formData.get('tracking_number'), 180)
  const trackingUrl = clean(formData.get('tracking_url'), 500)
  const shippingCarrier = clean(formData.get('shipping_carrier'), 80)
  const notifyCustomer = clean(formData.get('notify_customer'), 10) === '1'
  const shipmentBooked = clean(formData.get('shipment_booked'), 10) === '1'
  const pickingStarted = clean(formData.get('picking_started'), 10) === '1'
  const note = clean(formData.get('note'), 1000)

  try {
    if (!orderId) throw new Error('Order ontbreekt.')
    await saveFulfillmentUpdate(admin, {
      orderId,
      userEmail: user.email,
      fulfillmentStatus,
      trackingNumber,
      trackingUrl,
      shippingCarrier,
      notifyCustomer,
      shipmentBooked,
      pickingStarted,
      note,
      source: 'atlas_orders_form',
    })

    revalidatePath('/atlas')
    revalidatePath('/atlas/orders')
  } catch (error) {
    ordersRedirect({ error: error instanceof Error ? error.message : 'Order bijwerken mislukt.' })
  }

  ordersRedirect({ saved: '1' })
}

export async function quickOrderWorkflowAction(formData: FormData) {
  const { admin, user } = await assertAtlasPermission('orders', '/atlas/orders')
  const orderId = clean(formData.get('order_id'), 80)
  const fulfillmentStatus = clean(formData.get('fulfillment_status'), 80)
  const trackingNumber = clean(formData.get('tracking_number'), 180)
  const trackingUrl = clean(formData.get('tracking_url'), 500)
  const shippingCarrier = clean(formData.get('shipping_carrier'), 80)
  const notifyCustomer = clean(formData.get('notify_customer'), 10) === '1'
  const shipmentBooked = clean(formData.get('shipment_booked'), 10) === '1'
  const pickingStarted = clean(formData.get('picking_started'), 10) === '1'
  const note = clean(formData.get('note'), 1000)

  try {
    if (!orderId) throw new Error('Order ontbreekt.')
    if (!fulfillmentStatus) throw new Error('Nieuwe status ontbreekt.')

    await saveFulfillmentUpdate(admin, {
      orderId,
      userEmail: user.email,
      fulfillmentStatus,
      trackingNumber,
      trackingUrl,
      shippingCarrier,
      notifyCustomer,
      shipmentBooked,
      pickingStarted,
      note: note || `Snelle workflowactie: ${statusLabel(fulfillmentStatus)}.`,
      source: 'atlas_orders_quick_action',
    })

    revalidatePath('/atlas')
    revalidatePath('/atlas/orders')
  } catch (error) {
    ordersRedirect({ error: error instanceof Error ? error.message : 'Workflowactie mislukt.' })
  }

  ordersRedirect({ saved: '1' })
}

export async function checkPaymentAndFinalizeAction(formData: FormData) {
  const { admin, user } = await assertAtlasPermission('orders', '/atlas/orders')
  const orderId = clean(formData.get('order_id'), 80)

  try {
    if (!orderId) throw new Error('Order ontbreekt.')
    const { data: order, error } = await admin.from('orders').select('*').eq('id', orderId).single()
    if (error || !order?.id) throw new Error('Order niet gevonden.')

    if (String(order.payment_status || '').toLowerCase() === 'paid') {
      await finalizePaidOrder(admin, order)
      await logEvent(admin, {
        order_id: order.id,
        order_number: order.order_number,
        event_type: 'payment_rechecked_paid',
        source: 'atlas_orders',
        message: 'Betaling opnieuw gecontroleerd: order staat op betaald en is verwerkt.',
        actor_email: user.email,
        metadata: {},
      })
    } else {
      await logEvent(admin, {
        order_id: order.id,
        order_number: order.order_number,
        event_type: 'payment_rechecked_pending',
        source: 'atlas_orders',
        message: 'Betaling opnieuw gecontroleerd: order staat nog niet op betaald.',
        actor_email: user.email,
        metadata: { paymentStatus: order.payment_status },
      })
    }

    revalidatePath('/atlas')
    revalidatePath('/atlas/orders')
  } catch (error) {
    ordersRedirect({ error: error instanceof Error ? error.message : 'Betaling controleren mislukt.' })
  }

  ordersRedirect({ finalized: '1' })
}

export async function finalizePaidOrderAction(formData: FormData) {
  const { admin, user } = await assertAtlasPermission('orders', '/atlas/orders')
  const orderId = clean(formData.get('order_id'), 80)

  try {
    if (!orderId) throw new Error('Order ontbreekt.')
    const { data: order, error } = await admin.from('orders').select('*').eq('id', orderId).single()
    if (error || !order?.id) throw new Error('Order niet gevonden.')
    if (String(order.payment_status || '').toLowerCase() !== 'paid') throw new Error('Alleen betaalde orders kunnen worden afgerond.')

    await finalizePaidOrder(admin, order)
    await logEvent(admin, {
      order_id: order.id,
      order_number: order.order_number,
      event_type: 'manual_finalize_requested',
      source: 'atlas_orders',
      message: 'Medewerker heeft orderfinalisatie handmatig opnieuw uitgevoerd.',
      actor_email: user.email,
      metadata: {},
    })

    revalidatePath('/atlas')
    revalidatePath('/atlas/orders')
  } catch (error) {
    ordersRedirect({ error: error instanceof Error ? error.message : 'Order afronden mislukt.' })
  }

  ordersRedirect({ finalized: '1' })
}
