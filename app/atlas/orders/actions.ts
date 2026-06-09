'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { assertAtlasPermission } from '@/lib/atlas-auth'
import { finalizePaidOrder } from '@/lib/checkout/orders'

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
  note?: string
  source?: string
}) {
  const { data: order, error: lookupError } = await admin
    .from('orders')
    .select('id,order_number,raw,tracking_number,tracking_url,fulfillment_status')
    .eq('id', input.orderId)
    .single()

  if (lookupError || !order?.id) throw new Error('Order niet gevonden.')

  const raw = order.raw && typeof order.raw === 'object' ? order.raw : {}
  const now = new Date().toISOString()
  const status = input.fulfillmentStatus || 'processing'
  const lower = status.toLowerCase()
  const isCancelled = ['cancelled', 'canceled'].includes(lower)
  const trackingNumber = input.trackingNumber || order.tracking_number || ''
  const trackingUrl = input.trackingUrl || order.tracking_url || ''

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
    event_type: 'fulfillment_updated',
    source: input.source || 'atlas_orders',
    message: input.note || `Fulfillment status aangepast naar ${statusLabel(status)}.`,
    actor_email: input.userEmail,
    metadata: { fulfillmentStatus: status, trackingNumber, trackingUrl, previousStatus: order.fulfillment_status },
  })
}

export async function updateOrderFulfillment(formData: FormData) {
  const { admin, user } = await assertAtlasPermission('orders', '/atlas/orders')
  const orderId = clean(formData.get('order_id'), 80)
  const fulfillmentStatus = clean(formData.get('fulfillment_status'), 80) || 'processing'
  const trackingNumber = clean(formData.get('tracking_number'), 180)
  const trackingUrl = clean(formData.get('tracking_url'), 500)
  const note = clean(formData.get('note'), 1000)

  try {
    if (!orderId) throw new Error('Order ontbreekt.')
    await saveFulfillmentUpdate(admin, {
      orderId,
      userEmail: user.email,
      fulfillmentStatus,
      trackingNumber,
      trackingUrl,
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
