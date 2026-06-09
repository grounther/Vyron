import type { SupabaseClient } from '@supabase/supabase-js'

type CleanupOptions = {
  source?: string
  olderThanHours?: number
}

export async function cleanupCancelledOrders(admin: SupabaseClient, options: CleanupOptions = {}) {
  const olderThanHours = Math.max(1, Number(options.olderThanHours || 24))
  const cutoff = new Date(Date.now() - olderThanHours * 60 * 60 * 1000).toISOString()

  const { data, error } = await admin
    .from('orders')
    .delete()
    .in('fulfillment_status', ['cancelled', 'canceled'])
    .lt('updated_at', cutoff)
    .select('id,order_number,customer_email,updated_at')

  if (error) {
    return { ok: false, deleted: 0, cutoff, error: error.message, orders: [] as any[] }
  }

  const deletedOrders = data || []
  if (deletedOrders.length) {
    await admin.from('order_cleanup_events').insert({
      event_type: 'cancelled_orders_deleted',
      source: options.source || 'system',
      deleted_count: deletedOrders.length,
      cutoff_at: cutoff,
      metadata: { orders: deletedOrders.map((order: any) => ({ id: order.id, order_number: order.order_number, customer_email: order.customer_email, updated_at: order.updated_at })) },
    }).then(() => undefined, () => undefined)
  }

  return { ok: true, deleted: deletedOrders.length, cutoff, orders: deletedOrders }
}
