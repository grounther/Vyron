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

export async function updateOrderFulfillment(formData: FormData) {
  const { admin, user } = await assertAtlasPermission('orders', '/atlas/orders')
  const orderId = clean(formData.get('order_id'), 80)
  const fulfillmentStatus = clean(formData.get('fulfillment_status'), 80) || 'processing'
  const trackingNumber = clean(formData.get('tracking_number'), 180)
  const trackingUrl = clean(formData.get('tracking_url'), 500)
  const note = clean(formData.get('note'), 1000)

  try {
    if (!orderId) throw new Error('Order ontbreekt.')

    const { data: order, error: lookupError } = await admin
      .from('orders')
      .select('id,order_number,raw')
      .eq('id', orderId)
      .single()
    if (lookupError || !order?.id) throw new Error('Order niet gevonden.')

    const raw = order.raw && typeof order.raw === 'object' ? order.raw : {}
    const now = new Date().toISOString()
    const isCancelled = ['cancelled', 'canceled'].includes(fulfillmentStatus.toLowerCase())
    const { error } = await admin
      .from('orders')
      .update({
        fulfillment_status: fulfillmentStatus,
        tracking_number: trackingNumber || null,
        tracking_url: trackingUrl || null,
        raw: {
          ...raw,
          last_fulfillment_update_at: now,
          last_fulfillment_update_by: user.email,
          last_fulfillment_note: note || raw.last_fulfillment_note || null,
          cancelled_at: isCancelled ? raw.cancelled_at || now : raw.cancelled_at || null,
          cancelled_by: isCancelled ? user.email : raw.cancelled_by || null,
        },
        updated_at: now,
      })
      .eq('id', orderId)

    if (error) throw new Error(error.message)

    await logEvent(admin, {
      order_id: orderId,
      order_number: order.order_number,
      event_type: 'fulfillment_updated',
      source: 'atlas_orders',
      message: note || `Fulfillment status aangepast naar ${fulfillmentStatus}.`,
      actor_email: user.email,
      metadata: { fulfillmentStatus, trackingNumber, trackingUrl },
    })

    revalidatePath('/atlas')
    revalidatePath('/atlas/orders')
  } catch (error) {
    ordersRedirect({ error: error instanceof Error ? error.message : 'Order bijwerken mislukt.' })
  }

  ordersRedirect({ saved: '1' })
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
