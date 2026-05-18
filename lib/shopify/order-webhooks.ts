import type { SupabaseClient } from '@supabase/supabase-js'

type ShopifyOrderPayload = Record<string, any>
type ProductRow = Record<string, any>

function number(value: unknown, fallback = 0) {
  const parsed = Number(value || 0)
  return Number.isFinite(parsed) ? parsed : fallback
}

function text(value: unknown, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function legacyId(value: unknown) {
  const raw = String(value || '').trim()
  if (!raw) return ''
  const match = raw.match(/(\d+)(?:\?.*)?$/)
  return match?.[1] || raw
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
  return 'pending_dsers'
}

function buildProductMaps(products: ProductRow[]) {
  const byVariant = new Map<string, ProductRow>()
  const byProduct = new Map<string, ProductRow>()
  const bySku = new Map<string, ProductRow>()
  const byName = new Map<string, ProductRow>()

  for (const product of products) {
    const variantKeys = [product.shopify_variant_legacy_id, product.shopify_variant_id, legacyId(product.shopify_variant_id)].map((value) => text(value)).filter(Boolean)
    const productKeys = [product.shopify_product_legacy_id, product.shopify_product_id, legacyId(product.shopify_product_id)].map((value) => text(value)).filter(Boolean)
    for (const key of variantKeys) byVariant.set(key, product)
    for (const key of productKeys) byProduct.set(key, product)
    const sku = text(product.supplier_sku).toLowerCase()
    if (sku) bySku.set(sku, product)
    const name = text(product.name).toLowerCase()
    if (name) byName.set(name, product)
  }

  return { byVariant, byProduct, bySku, byName }
}

async function loadProductsForOrder(admin: SupabaseClient) {
  const { data, error } = await admin
    .from('products')
    .select('id,name,slug,price,estimated_cost,supplier_sku,shopify_product_id,shopify_product_legacy_id,shopify_variant_id,shopify_variant_legacy_id')
    .not('shopify_product_id', 'is', null)
    .limit(2000)

  if (error) return [] as ProductRow[]
  return (data || []) as ProductRow[]
}

function findProductForLine(line: any, maps: ReturnType<typeof buildProductMaps>) {
  const variantId = text(line.variant_id)
  const productId = text(line.product_id)
  const sku = text(line.sku).toLowerCase()
  const title = text(line.title || line.name).toLowerCase()

  return (
    maps.byVariant.get(variantId) ||
    maps.byVariant.get(legacyId(variantId)) ||
    maps.byProduct.get(productId) ||
    maps.byProduct.get(legacyId(productId)) ||
    maps.bySku.get(sku) ||
    maps.byName.get(title) ||
    null
  )
}

export async function upsertShopifyOrderWebhook(admin: SupabaseClient, payload: ShopifyOrderPayload, topic = 'orders/update') {
  const id = orderId(payload.id)
  const name = String(payload.name || payload.order_number || id || '').trim()
  if (!id || !name) throw new Error('Shopify order webhook mist id/name.')

  const products = await loadProductsForOrder(admin)
  const productMaps = buildProductMaps(products)
  const lineItems = Array.isArray(payload.line_items) ? payload.line_items : []
  const calculatedLines = lineItems.map((line: any) => {
    const product = findProductForLine(line, productMaps)
    const quantity = number(line.quantity, 1)
    const unitPrice = number(line.price)
    const estimatedUnitCost = number(product?.estimated_cost)

    return { line, product, quantity, unitPrice, estimatedUnitCost }
  })

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
  const estimatedCost = calculatedLines.reduce((sum, line) => sum + line.estimatedUnitCost * line.quantity, 0)
  const estimatedProfit = total - estimatedCost

  const orderRow = {
    order_number: `SHOPIFY-${name.replace(/^#/, '')}`,
    customer_email: email || null,
    subtotal,
    shipping_total: shippingTotal,
    vat_total: vatTotal,
    total,
    estimated_cost: estimatedCost,
    estimated_profit: estimatedProfit,
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
    raw: { source: 'shopify_webhook', topic, estimated_cost_source: 'products.estimated_cost' },
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

  if (orderDbId) {
    await admin.from('order_items').delete().eq('order_id', orderDbId)
    const rows = calculatedLines.map(({ line, product, quantity, unitPrice, estimatedUnitCost }) => ({
      order_id: orderDbId,
      product_slug: text(product?.slug, String(line.product_id || line.sku || line.title || 'shopify-item')),
      product_name: String(line.title || line.name || product?.name || 'Shopify item'),
      quantity,
      unit_price: unitPrice,
      estimated_unit_cost: estimatedUnitCost,
      variant_sku: line.sku || '',
      supplier: 'dsers',
      supplier_product_id: String(line.product_id || ''),
      supplier_variant_id: String(line.variant_id || ''),
      supplier_sku: line.sku || '',
      shopify_line_item_id: String(line.id || ''),
      shopify_product_id: String(line.product_id || ''),
      shopify_variant_id: String(line.variant_id || ''),
      raw: { ...line, matched_product_id: product?.id || null },
    }))
    if (rows.length) {
      const { error } = await admin.from('order_items').insert(rows)
      if (error) throw new Error(error.message)
    }
  }

  await admin.from('integration_sync_logs').insert({
    provider: 'shopify',
    event: topic,
    status: 'success',
    message: `Shopify order ${name} mirrored to ASORTA. Payment: ${financialStatus}. Fulfillment: ${orderStatus}. Est. profit: €${estimatedProfit.toFixed(2)}.`,
    payload: { shopify_order_id: id, name, tracking, estimated_cost: estimatedCost, estimated_profit: estimatedProfit },
  }).then(() => undefined, () => undefined)

  return { orderId: orderDbId, shopifyOrderId: id, shopifyOrderName: name, tracking, estimatedCost, estimatedProfit }
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

  await admin.from('integration_sync_logs').insert({
    provider: 'shopify',
    event: topic,
    status: 'success',
    message: `Shopify fulfillment update received for order ${shopifyOrderId}.`,
    payload: { shopify_order_id: shopifyOrderId, trackingNumbers, trackingUrls },
  }).then(() => undefined, () => undefined)

  return { shopifyOrderId, trackingNumbers, trackingUrls, status }
}
