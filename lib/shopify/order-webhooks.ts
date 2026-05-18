import type { SupabaseClient } from '@supabase/supabase-js'
import { shopifyGidToLegacyId } from '@/lib/shopify/client'
import { sendOrderConfirmationEmail, sendTrackingUpdateEmail } from '@/lib/email/order-emails'

type ShopifyOrderPayload = Record<string, any>
type ProductCostRow = Record<string, any>

function number(value: unknown, fallback = 0) {
  const parsed = Number(value || 0)
  return Number.isFinite(parsed) ? parsed : fallback
}

function orderId(value: unknown) {
  return String(value || '').trim()
}

function fullName(address: any) {
  return [address?.first_name, address?.last_name].filter(Boolean).join(' ').trim()
}

function normalizeAddress(address: any) {
  if (!address) return {}
  return {
    name: fullName(address) || address.name || '',
    firstName: address.first_name || '',
    lastName: address.last_name || '',
    company: address.company || '',
    phone: address.phone || '',
    address1: address.address1 || '',
    address2: address.address2 || '',
    city: address.city || '',
    province: address.province || '',
    postalCode: address.zip || '',
    country: address.country || '',
    countryCode: address.country_code || '',
  }
}

function trackingFromOrder(payload: ShopifyOrderPayload) {
  const fulfillments = Array.isArray(payload.fulfillments) ? payload.fulfillments : []
  const numbers = new Set<string>()
  const urls = new Set<string>()

  for (const fulfillment of fulfillments) {
    if (fulfillment.tracking_number) numbers.add(String(fulfillment.tracking_number))
    if (fulfillment.tracking_url) urls.add(String(fulfillment.tracking_url))
    for (const info of fulfillment.tracking_info || []) {
      if (info?.number) numbers.add(String(info.number))
      if (info?.url) urls.add(String(info.url))
    }
  }

  return { numbers: Array.from(numbers), urls: Array.from(urls) }
}

function fulfillmentStatus(payload: ShopifyOrderPayload) {
  const raw = String(payload.fulfillment_status || '').toLowerCase()
  if (raw === 'fulfilled') return 'fulfilled'
  if (raw === 'partial') return 'partially_fulfilled'
  if (raw) return raw
  return 'processing'
}

function makeCostLookup(products: ProductCostRow[]) {
  const map = new Map<string, ProductCostRow>()

  for (const product of products) {
    const variantLegacy = String(product.shopify_variant_legacy_id || '').trim()
    const variantGid = String(product.shopify_variant_id || '').trim()
    const productLegacy = String(product.shopify_product_legacy_id || '').trim()
    const productGid = String(product.shopify_product_id || '').trim()

    if (variantLegacy) map.set(`variant:${variantLegacy}`, product)
    if (variantGid) map.set(`variant:${variantGid}`, product)
    if (variantGid) map.set(`variant:${shopifyGidToLegacyId(variantGid)}`, product)
    if (productLegacy) map.set(`product:${productLegacy}`, product)
    if (productGid) map.set(`product:${productGid}`, product)
    if (productGid) map.set(`product:${shopifyGidToLegacyId(productGid)}`, product)
  }

  return map
}

async function loadProductCostLookup(admin: SupabaseClient) {
  const { data } = await admin
    .from('products')
    .select('id,slug,name,estimated_cost,shopify_product_id,shopify_product_legacy_id,shopify_variant_id,shopify_variant_legacy_id')
    .limit(2000)

  return makeCostLookup((data || []) as ProductCostRow[])
}

function matchProduct(costs: Map<string, ProductCostRow>, line: any) {
  const variantId = String(line.variant_id || '').trim()
  const productId = String(line.product_id || '').trim()
  return costs.get(`variant:${variantId}`) || costs.get(`product:${productId}`) || null
}

export async function upsertShopifyOrderWebhook(admin: SupabaseClient, payload: ShopifyOrderPayload, topic = 'orders/update') {
  const id = orderId(payload.id)
  const name = String(payload.name || payload.order_number || id || '').trim()
  if (!id || !name) throw new Error('Shopify order webhook mist id/name.')

  const tracking = trackingFromOrder(payload)
  const email = String(payload.email || payload.contact_email || payload.customer?.email || '').toLowerCase()
  const subtotal = number(payload.subtotal_price)
  const shippingTotal = Array.isArray(payload.shipping_lines)
    ? payload.shipping_lines.reduce((sum: number, line: any) => sum + number(line.price), 0)
    : number(payload.total_shipping_price_set?.shop_money?.amount)
  const total = number(payload.total_price)
  const vatTotal = number(payload.total_tax)
  const financialStatus = String(payload.financial_status || 'pending')
  const orderStatus = fulfillmentStatus(payload)
  const costLookup = await loadProductCostLookup(admin)

  const lineItems = Array.isArray(payload.line_items) ? payload.line_items : []
  const orderEstimatedCost = lineItems.reduce((sum: number, line: any) => {
    const product = matchProduct(costLookup, line)
    return sum + number(product?.estimated_cost) * number(line.quantity, 1)
  }, 0)

  const orderRow = {
    order_number: `AS-${name.replace(/^#/, '')}`,
    customer_email: email || null,
    subtotal,
    shipping_total: shippingTotal,
    vat_total: vatTotal,
    total,
    estimated_cost: orderEstimatedCost,
    estimated_profit: total - orderEstimatedCost,
    payment_provider: 'shopify_paypal',
    payment_status: financialStatus,
    fulfillment_status: orderStatus,
    currency: payload.currency || 'EUR',
    shipping_address: normalizeAddress(payload.shipping_address),
    billing_address: normalizeAddress(payload.billing_address),
    tracking_number: tracking.numbers[0] || null,
    tracking_url: tracking.urls[0] || null,
    shopify_order_id: id,
    shopify_order_name: name,
    shopify_order_status_url: payload.order_status_url || null,
    shopify_financial_status: financialStatus,
    shopify_fulfillment_status: payload.fulfillment_status || null,
    shopify_tracking_numbers: tracking.numbers,
    shopify_tracking_urls: tracking.urls,
    shopify_raw: payload,
    raw: { source: 'shopify_webhook', topic },
    updated_at: new Date().toISOString(),
  }

  const existing = await admin.from('orders').select('id').eq('shopify_order_id', id).maybeSingle()
  if (existing.error) throw new Error(existing.error.message)

  let orderDbId = existing.data?.id
  if (orderDbId) {
    const { error } = await admin.from('orders').update(orderRow).eq('id', orderDbId)
    if (error) throw new Error(error.message)
  } else {
    const { data, error } = await admin.from('orders').insert(orderRow).select('id').single()
    if (error) throw new Error(error.message)
    orderDbId = data.id
  }

  if (orderDbId && lineItems.length) {
    await admin.from('order_items').delete().eq('order_id', orderDbId)
    const rows = lineItems.map((line: any) => {
      const product = matchProduct(costLookup, line)
      const quantity = number(line.quantity, 1)
      return {
        order_id: orderDbId,
        product_slug: String(product?.slug || line.product_id || line.sku || line.title || 'shopify-item'),
        product_name: String(product?.name || line.title || line.name || 'Shopify item'),
        quantity,
        unit_price: number(line.price),
        estimated_unit_cost: number(product?.estimated_cost),
        variant_sku: line.sku || '',
        supplier: 'dsers',
        supplier_product_id: String(line.product_id || ''),
        supplier_variant_id: String(line.variant_id || ''),
        supplier_sku: line.sku || '',
        shopify_line_item_id: String(line.id || ''),
        shopify_product_id: String(line.product_id || ''),
        shopify_variant_id: String(line.variant_id || ''),
        raw: line,
      }
    })
    if (rows.length) {
      const { error } = await admin.from('order_items').insert(rows)
      if (error) throw new Error(error.message)
    }
  }

  const { data: persistedItems } = orderDbId
    ? await admin.from('order_items').select('*').eq('order_id', orderDbId).order('created_at', { ascending: true })
    : { data: [] as any[] }

  const persistedOrder = { id: orderDbId, ...orderRow }

  if (['paid', 'authorized', 'partially_paid', 'complete', 'completed'].includes(financialStatus.toLowerCase())) {
    await sendOrderConfirmationEmail(admin, { order: persistedOrder, items: persistedItems || [] }).catch(() => undefined)
  }

  if (tracking.numbers.length || tracking.urls.length) {
    await sendTrackingUpdateEmail(admin, {
      order: persistedOrder,
      items: persistedItems || [],
      trackingNumber: tracking.numbers[0] || null,
      trackingUrl: tracking.urls[0] || null,
    }).catch(() => undefined)
  }

  await admin.from('integration_sync_logs').insert({
    provider: 'shopify',
    event: topic,
    status: 'success',
    message: `Order ${name} mirrored to ASORTA. Payment: ${financialStatus}. Status: ${orderStatus}.`,
    payload: { shopify_order_id: id, name, tracking, estimatedCost: orderEstimatedCost },
  }).then(() => undefined, () => undefined)

  return { orderId: orderDbId, shopifyOrderId: id, shopifyOrderName: name, tracking }
}

export async function updateShopifyFulfillmentWebhook(admin: SupabaseClient, payload: Record<string, any>, topic = 'fulfillments/update') {
  const shopifyOrderId = orderId(payload.order_id)
  if (!shopifyOrderId) throw new Error('Shopify fulfillment webhook mist order_id.')

  const trackingNumbers = [payload.tracking_number, ...(payload.tracking_numbers || [])].map(String).filter(Boolean)
  const trackingUrls = [payload.tracking_url, ...(payload.tracking_urls || [])].map(String).filter(Boolean)
  const status = trackingNumbers.length || trackingUrls.length ? 'fulfilled' : 'processing'

  const { error } = await admin
    .from('orders')
    .update({
      fulfillment_status: status,
      shopify_fulfillment_status: status,
      tracking_number: trackingNumbers[0] || null,
      tracking_url: trackingUrls[0] || null,
      shopify_tracking_numbers: trackingNumbers,
      shopify_tracking_urls: trackingUrls,
      updated_at: new Date().toISOString(),
    })
    .eq('shopify_order_id', shopifyOrderId)

  if (error) throw new Error(error.message)

  const { data: order } = await admin
    .from('orders')
    .select('*')
    .eq('shopify_order_id', shopifyOrderId)
    .maybeSingle()

  if (order && (trackingNumbers.length || trackingUrls.length)) {
    await sendTrackingUpdateEmail(admin, {
      order,
      trackingNumber: trackingNumbers[0] || null,
      trackingUrl: trackingUrls[0] || null,
    }).catch(() => undefined)
  }

  await admin.from('integration_sync_logs').insert({
    provider: 'shopify',
    event: topic,
    status: 'success',
    message: `Fulfillment update received for order ${shopifyOrderId}.`,
    payload: { shopify_order_id: shopifyOrderId, trackingNumbers, trackingUrls },
  }).then(() => undefined, () => undefined)

  return { shopifyOrderId, trackingNumbers, trackingUrls, status }
}
