import type { SupabaseClient } from '@supabase/supabase-js'
import { cjFulfillmentProvider } from '@/lib/fulfillment/providers/cj'
import { dsersFulfillmentProvider } from '@/lib/fulfillment/providers/dsers'
import { manualFulfillmentProvider } from '@/lib/fulfillment/providers/manual'
import type { FulfillmentAddress, FulfillmentItem, SupplierKey, SupplierOrderPayload, SupplierOrderResult } from '@/lib/fulfillment/types'

const providers = {
  cj: cjFulfillmentProvider,
  dsers: dsersFulfillmentProvider,
  manual: manualFulfillmentProvider,
}

function normalizeSupplier(value: unknown): SupplierKey {
  const raw = String(value || '').toLowerCase()
  if (raw.includes('cj')) return 'cj'
  if (raw.includes('dser') || raw.includes('ali')) return 'dsers'
  return 'manual'
}

function groupBySupplier(items: FulfillmentItem[]) {
  return items.reduce<Record<SupplierKey, FulfillmentItem[]>>((groups, item) => {
    groups[item.supplier] ||= []
    groups[item.supplier].push(item)
    return groups
  }, { cj: [], dsers: [], manual: [] })
}

async function loadOrder(admin: SupabaseClient, orderId: string) {
  const { data: order, error } = await admin.from('orders').select('*').eq('id', orderId).maybeSingle()
  if (error) throw new Error(error.message)
  if (!order) throw new Error('Order niet gevonden.')

  const { data: items, error: itemsError } = await admin.from('order_items').select('*').eq('order_id', orderId)
  if (itemsError) throw new Error(itemsError.message)

  return { order: order as any, items: (items || []) as any[] }
}

function addressFromOrder(order: any): FulfillmentAddress {
  const shipping = order.shipping_address || order.raw?.shipping_address || {}
  return {
    name: shipping.name || [shipping.firstName, shipping.lastName].filter(Boolean).join(' '),
    firstName: shipping.firstName || shipping.first_name,
    lastName: shipping.lastName || shipping.last_name,
    email: order.customer_email,
    phone: shipping.phone,
    address1: shipping.address1 || shipping.street || '',
    address2: shipping.address2 || '',
    city: shipping.city || '',
    postalCode: shipping.postalCode || shipping.postal_code || shipping.zip || '',
    province: shipping.province || '',
    country: shipping.country || 'Netherlands',
    countryCode: shipping.countryCode || shipping.country_code || 'NL',
  }
}

function itemsFromRows(rows: any[]): FulfillmentItem[] {
  return rows.map((row) => ({
    productSlug: row.product_slug,
    productName: row.product_name,
    quantity: Number(row.quantity || 1),
    unitPrice: Number(row.unit_price || 0),
    supplier: normalizeSupplier(row.supplier || row.supplier_name),
    supplierProductId: row.supplier_product_id || row.cj_product_id || '',
    supplierVariantId: row.supplier_variant_id || row.cj_variant_id || '',
    supplierSku: row.supplier_sku || row.cj_sku || '',
    supplierShippingMethod: row.supplier_shipping_method || '',
    platformVariantSku: row.variant_sku || '',
    raw: row.raw || {},
  }))
}

async function submitSupplierGroup(admin: SupabaseClient, payload: SupplierOrderPayload): Promise<SupplierOrderResult> {
  const supplier = payload.items[0]?.supplier || 'manual'
  const provider = providers[supplier] || providers.manual
  const inserted = await admin
    .from('fulfillment_orders')
    .insert({
      order_id: payload.orderId,
      supplier,
      status: 'submitting',
      payload,
    })
    .select('id')
    .single()

  const recordId = inserted.data?.id
  const result = await provider.submitOrder(payload)

  if (recordId) {
    await admin
      .from('fulfillment_orders')
      .update({
        status: result.status,
        supplier_order_id: result.supplierOrderId || null,
        supplier_payment_id: result.supplierPaymentId || null,
        error_message: result.status === 'failed' ? result.message : null,
        raw: result.raw || {},
        updated_at: new Date().toISOString(),
      })
      .eq('id', recordId)
  }

  return result
}

export async function createFulfillmentForOrder(admin: SupabaseClient, orderId: string) {
  const { order, items: itemRows } = await loadOrder(admin, orderId)
  const items = itemsFromRows(itemRows)
  if (!items.length) throw new Error('Order heeft geen items.')

  const shippingAddress = addressFromOrder(order)
  const missingAddress = !shippingAddress.address1 || !shippingAddress.city || !shippingAddress.postalCode
  if (missingAddress) throw new Error('Shipping address is incompleet; fulfillment niet gestart.')

  const grouped = groupBySupplier(items)
  const results: SupplierOrderResult[] = []

  for (const [supplier, supplierItems] of Object.entries(grouped) as Array<[SupplierKey, FulfillmentItem[]]>) {
    if (!supplierItems.length) continue
    const payload: SupplierOrderPayload = {
      orderId: order.id,
      orderNumber: order.order_number,
      customerEmail: order.customer_email,
      shippingAddress,
      items: supplierItems,
      currency: order.currency || 'EUR',
      totalAmount: Number(order.total || 0),
    }
    results.push(await submitSupplierGroup(admin, payload))
  }

  const failed = results.some((result) => result.status === 'failed')
  const manual = results.some((result) => result.status === 'manual_required' || result.status === 'pending_bridge' || result.status === 'dry_run')
  const status = failed ? 'fulfillment_failed' : manual ? 'fulfillment_pending_review' : 'sent_to_supplier'

  await admin.from('orders').update({ fulfillment_status: status, updated_at: new Date().toISOString() }).eq('id', order.id)
  return { orderId: order.id, orderNumber: order.order_number, status, results }
}
