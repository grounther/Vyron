import type { SupabaseClient } from '@supabase/supabase-js'
import { products as staticProducts } from '@/lib/products'
import type { Product } from '@/lib/products'

type CheckoutItemInput = {
  slug: string
  qty: number
  variantSku?: string
  estimatedShipping?: number
}

type ShippingInput = {
  name: string
  email: string
  phone?: string
  address1: string
  address2?: string
  city: string
  postalCode: string
  province?: string
  country: string
  countryCode?: string
}

type ProductRow = Record<string, any>
type OrderRow = Record<string, any>
type OrderItemRow = Record<string, any>

function parseNumber(value: unknown, fallback = 0) {
  const parsed = typeof value === 'number' ? value : Number(String(value || '').replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : fallback
}

function normalizeItem(item: any): CheckoutItemInput | null {
  let slug = String(item?.slug || '').trim()
  const qty = Math.min(20, Math.max(1, Number(item?.qty || item?.quantity || 1)))
  let variantSku = String(item?.variantSku || item?.sku || item?.variant_sku || '').trim()

  // Older cart payloads stored variant lines as "product-slug__SKU". The checkout
  // must look up the product by the base slug and keep the SKU only as variant selector.
  if (slug.includes('__')) {
    const [baseSlug, encodedSku] = slug.split('__')
    slug = baseSlug.trim()
    if (!variantSku) variantSku = String(encodedSku || '').trim()
  }

  if (!slug) return null
  return { slug, qty, variantSku, estimatedShipping: parseNumber(item?.estimatedShipping || item?.estimated_shipping, 0) }
}

export function normalizeCheckoutItems(input: unknown) {
  if (!Array.isArray(input)) return []
  return input.map(normalizeItem).filter(Boolean) as CheckoutItemInput[]
}

export function normalizeShipping(input: any): ShippingInput {
  return {
    name: String(input?.name || '').trim(),
    email: String(input?.email || '').trim().toLowerCase(),
    phone: String(input?.phone || '').trim(),
    address1: String(input?.address1 || '').trim(),
    address2: String(input?.address2 || '').trim(),
    city: String(input?.city || '').trim(),
    postalCode: String(input?.postalCode || '').trim(),
    province: String(input?.province || '').trim(),
    country: String(input?.country || 'Netherlands').trim(),
    countryCode: String(input?.countryCode || 'NL').trim().toUpperCase(),
  }
}

function validateShipping(shipping: ShippingInput) {
  const missing = []
  if (!shipping.name) missing.push('name')
  if (!shipping.email || !shipping.email.includes('@')) missing.push('email')
  if (!shipping.address1) missing.push('address1')
  if (!shipping.city) missing.push('city')
  if (!shipping.postalCode) missing.push('postalCode')
  if (missing.length) throw new Error(`Checkout mist verplichte velden: ${missing.join(', ')}`)
}

async function loadProducts(admin: SupabaseClient, slugs: string[]): Promise<ProductRow[]> {
  const { data, error } = await admin
    .from('products')
    .select('*')
    .in('slug', slugs)
    .in('status', ['active', 'launch'])

  if (error || !data?.length) {
    return staticProducts.filter((product) => slugs.includes(product.slug)).map((product): ProductRow => ({
      slug: product.slug,
      name: product.name,
      price: product.price,
      estimated_cost: product.cost,
      supplier_name: product.supplier?.name,
      cj_product_id: product.supplier?.productId,
      cj_variant_id: product.variants?.[0]?.variantId,
      cj_sku: product.variants?.[0]?.sku,
      variants: product.variants || [],
    }))
  }

  return data as ProductRow[]
}

async function loadSupplierMapping(admin: SupabaseClient, slug: string, variantSku?: string) {
  let query = admin
    .from('product_supplier_mappings')
    .select('*')
    .eq('product_slug', slug)
    .eq('enabled', true)
    .order('is_primary', { ascending: false })
    .limit(1)

  if (variantSku) {
    query = query.or(`platform_variant_sku.eq.${variantSku},supplier_sku.eq.${variantSku}`)
  }

  const { data } = await query
  return data?.[0] as Record<string, any> | undefined
}

function variantFromProduct(product: ProductRow | Product, variantSku?: string) {
  const variants = Array.isArray((product as ProductRow).variants) ? (product as ProductRow).variants : []
  if (!variants.length) return undefined
  if (!variantSku) return variants[0]
  return variants.find((variant: any) => variant.sku === variantSku || variant.variantId === variantSku || variant.shopifyVariantId === variantSku) || variants[0]
}

function orderNumber() {
  const stamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14)
  const random = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `AS-${stamp}-${random}`
}

function orderRaw(order: OrderRow) {
  const raw = order?.raw
  return raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {}
}

async function safeOrderEvent(admin: SupabaseClient, row: Record<string, any>) {
  await admin.from('order_processing_events').insert(row).then(() => undefined, () => undefined)
}

async function ensureCustomerForCheckout(admin: SupabaseClient, shipping: ShippingInput, authUserId?: string) {
  const email = shipping.email.trim().toLowerCase()
  if (!email) return null

  const payload = {
    email,
    auth_user_id: authUserId || null,
    full_name: shipping.name || null,
    phone: shipping.phone || null,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await admin
    .from('customers')
    .upsert(payload, { onConflict: 'email' })
    .select('id,email,auth_user_id')
    .single()

  if (error || !data?.id) return null
  return data as Record<string, any>
}

export async function createOrderFromCheckout(admin: SupabaseClient, input: { items: unknown; shipping: unknown; source?: string; authUserId?: string }) {
  const items = normalizeCheckoutItems(input.items)
  if (!items.length) throw new Error('Cart is leeg.')

  const shipping = normalizeShipping(input.shipping)
  validateShipping(shipping)

  const customer = await ensureCustomerForCheckout(admin, shipping, input.authUserId)
  const slugs = Array.from(new Set(items.map((item) => item.slug)))
  const productRows = await loadProducts(admin, slugs)
  const productBySlug = new Map(productRows.map((product) => [product.slug, product]))

  const calculatedItems = []
  for (const item of items) {
    const product = productBySlug.get(item.slug)
    if (!product) throw new Error(`Product ${item.slug} is niet beschikbaar.`)

    const sellOnline = product.sell_online !== false
    const onlineStock = parseNumber(product.inventory_online, 0)
    if (!sellOnline) throw new Error(`${product.name || item.slug} is niet online verkoopbaar.`)
    if (onlineStock <= 0) throw new Error(`${product.name || item.slug} is online uitverkocht.`)
    if (onlineStock < item.qty) throw new Error(`${product.name || item.slug} heeft nog maar ${onlineStock} online op voorraad.`)

    const variant = variantFromProduct(product, item.variantSku)
    const mapping = await loadSupplierMapping(admin, item.slug, item.variantSku || variant?.sku)
    const unitPrice = parseNumber(variant?.price, parseNumber(product.price))
    const estimatedCost = parseNumber(mapping?.supplier_cost, parseNumber(product.estimated_cost))
    const supplier = mapping?.supplier || String(product.supplier || product.supplier_name || '').toLowerCase() || 'manual'

    calculatedItems.push({
      product_slug: item.slug,
      product_name: product.name,
      quantity: item.qty,
      unit_price: unitPrice,
      estimated_unit_cost: estimatedCost,
      variant_sku: item.variantSku || variant?.sku || '',
      supplier,
      supplier_product_id: mapping?.supplier_product_id || product.supplier_product_id || product.cj_product_id || '',
      supplier_variant_id: mapping?.supplier_variant_id || product.supplier_variant_id || product.cj_variant_id || variant?.variantId || '',
      supplier_sku: mapping?.supplier_sku || product.supplier_sku || product.cj_sku || variant?.sku || '',
      supplier_shipping_method: mapping?.supplier_shipping_method || '',
      shipping_unit_price: parseNumber(product.estimated_shipping, item.estimatedShipping || 0),
      cj_product_id: product.cj_product_id || mapping?.supplier_product_id || '',
      cj_variant_id: product.cj_variant_id || mapping?.supplier_variant_id || '',
      cj_sku: product.cj_sku || mapping?.supplier_sku || variant?.sku || '',
      raw: { variant, mapping },
    })
  }

  const subtotal = calculatedItems.reduce((sum, item) => sum + item.unit_price * item.quantity, 0)
  const shippingTotal = calculatedItems.reduce((sum, item) => sum + parseNumber(item.shipping_unit_price, 0) * item.quantity, 0)
  const vatTotal = 0
  const total = subtotal + shippingTotal + vatTotal
  const estimatedCost = calculatedItems.reduce((sum, item) => sum + item.estimated_unit_cost * item.quantity, 0)
  const estimatedProfit = total - estimatedCost

  const { data: order, error } = await admin
    .from('orders')
    .insert({
      order_number: orderNumber(),
      customer_id: customer?.id || null,
      customer_email: shipping.email,
      subtotal,
      shipping_total: shippingTotal,
      vat_total: vatTotal,
      total,
      estimated_cost: estimatedCost,
      estimated_profit: estimatedProfit,
      payment_provider: process.env.PAYMENT_PROVIDER || 'paypal',
      payment_status: 'pending',
      fulfillment_status: 'pending_payment',
      currency: 'EUR',
      shipping_address: shipping,
      billing_address: shipping,
      auth_user_id: input.authUserId || customer?.auth_user_id || null,
      raw: { source: input.source || 'site_checkout', checkout_created_at: new Date().toISOString() },
    })
    .select('*')
    .single()

  if (error) throw new Error(error.message)

  const rows = calculatedItems.map(({ shipping_unit_price, ...item }) => ({ ...item, order_id: order.id, raw: { ...(item.raw || {}), shipping_unit_price } }))
  const { error: itemError } = await admin.from('order_items').insert(rows)
  if (itemError) throw new Error(itemError.message)

  await safeOrderEvent(admin, {
    order_id: order.id,
    order_number: order.order_number,
    event_type: 'order_created',
    source: input.source || 'site_checkout',
    message: 'Order aangemaakt en wacht op betaling.',
    metadata: { subtotal, shippingTotal, total, itemCount: rows.length },
  })

  return { order: order as Record<string, any>, items: rows, shipping, subtotal, total }
}

async function loadOrderItems(admin: SupabaseClient, orderId: string): Promise<OrderItemRow[]> {
  const { data, error } = await admin.from('order_items').select('*').eq('order_id', orderId)
  if (error) return []
  return (data || []) as OrderItemRow[]
}

export async function decrementInventoryForPaidOrder(admin: SupabaseClient, order: OrderRow) {
  if (!order?.id) return { changed: false, items: [] as any[] }
  const raw = orderRaw(order)
  if (raw.inventory_decremented_at) return { changed: false, items: [] as any[] }

  const items = await loadOrderItems(admin, String(order.id))
  const adjustments: any[] = []

  for (const item of items) {
    const slug = String(item.product_slug || '').trim()
    const qty = Math.max(0, Number(item.quantity || 0))
    if (!slug || !qty) continue

    const { data: product } = await admin
      .from('products')
      .select('id,slug,name,inventory_online,inventory_market,inventory_total')
      .eq('slug', slug)
      .maybeSingle()

    if (!product?.id) continue

    const beforeOnline = Math.max(0, Number(product.inventory_online || 0))
    const beforeMarket = Math.max(0, Number(product.inventory_market || 0))
    const beforeTotal = Math.max(0, Number(product.inventory_total || 0))
    const afterOnline = Math.max(0, beforeOnline - qty)
    const afterTotal = Math.max(beforeMarket + afterOnline, Math.max(0, beforeTotal - qty))

    const { error } = await admin
      .from('products')
      .update({
        inventory_online: afterOnline,
        inventory_total: afterTotal,
        updated_at: new Date().toISOString(),
      })
      .eq('id', product.id)

    if (!error) {
      adjustments.push({ slug, product: product.name, qty, beforeOnline, afterOnline, beforeTotal, afterTotal })
    }
  }

  const updatedRaw = { ...raw, inventory_decremented_at: new Date().toISOString(), inventory_adjustments: adjustments }
  await admin.from('orders').update({ raw: updatedRaw, updated_at: new Date().toISOString() }).eq('id', order.id).then(() => undefined, () => undefined)

  await safeOrderEvent(admin, {
    order_id: order.id,
    order_number: order.order_number,
    event_type: 'inventory_decremented',
    source: 'payment_capture',
    message: adjustments.length ? 'Online voorraad afgetrokken na betaling.' : 'Geen voorraadregels gevonden om af te trekken.',
    metadata: { adjustments },
  })

  return { changed: true, items: adjustments }
}

export async function grantPackCreditForPaidOrder(admin: SupabaseClient, order: OrderRow) {
  if (!order?.id || String(order.payment_status || '').toLowerCase() !== 'paid') return { granted: false, credit: null as any }

  const email = String(order.customer_email || '').trim().toLowerCase()
  if (!email) return { granted: false, credit: null as any }

  const raw = orderRaw(order)
  if (raw.pack_credit_granted_at) return { granted: false, credit: null as any }

  const { data: customer } = await admin
    .from('customers')
    .select('id,auth_user_id,email')
    .eq('email', email)
    .maybeSingle()

  const { data: credit, error } = await admin
    .from('customer_pack_credits')
    .upsert({
      customer_id: customer?.id || order.customer_id || null,
      auth_user_id: customer?.auth_user_id || order.auth_user_id || null,
      customer_email: email,
      order_id: order.id,
      order_number: order.order_number,
      source: 'paypal_paid_order',
      status: 'available',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'order_id' })
    .select('id,customer_id,auth_user_id,customer_email,order_id,order_number,source,status')
    .maybeSingle()

  if (error || !credit?.id) return { granted: false, credit: null as any }

  await admin.from('customer_pack_events').insert({
    customer_id: credit.customer_id,
    auth_user_id: credit.auth_user_id,
    customer_email: credit.customer_email,
    credit_id: credit.id,
    order_id: order.id,
    event_type: 'grant',
    source: 'paypal_paid_order',
    quantity: 1,
    reason: order.order_number ? `Automatisch pakje voor betaalde order ${order.order_number}` : 'Automatisch pakje voor betaalde order',
    created_by: 'system',
  }).then(() => undefined, () => undefined)

  const updatedRaw = { ...raw, pack_credit_granted_at: new Date().toISOString(), pack_credit_id: credit.id }
  await admin.from('orders').update({ raw: updatedRaw, updated_at: new Date().toISOString() }).eq('id', order.id).then(() => undefined, () => undefined)

  await safeOrderEvent(admin, {
    order_id: order.id,
    order_number: order.order_number,
    event_type: 'pack_credit_granted',
    source: 'payment_capture',
    message: 'Virtueel minigame pakje toegekend na betaling.',
    metadata: { creditId: credit.id, customerEmail: email },
  })

  return { granted: true, credit }
}

export async function finalizePaidOrder(admin: SupabaseClient, order: OrderRow) {
  if (!order?.id || String(order.payment_status || '').toLowerCase() !== 'paid') return order

  await decrementInventoryForPaidOrder(admin, order)
  await grantPackCreditForPaidOrder(admin, order)

  const raw = orderRaw(order)
  const finalRaw = { ...raw, finalized_at: raw.finalized_at || new Date().toISOString() }
  const { data: updated } = await admin
    .from('orders')
    .update({
      fulfillment_status: ['pending_payment', 'open', ''].includes(String(order.fulfillment_status || '').toLowerCase()) ? 'processing' : order.fulfillment_status || 'processing',
      raw: finalRaw,
      updated_at: new Date().toISOString(),
    })
    .eq('id', order.id)
    .select('*')
    .maybeSingle()

  await safeOrderEvent(admin, {
    order_id: order.id,
    order_number: order.order_number,
    event_type: 'order_finalized',
    source: 'payment_capture',
    message: 'Betaalde order afgerond: voorraad, reward en status verwerkt.',
    metadata: { paymentStatus: order.payment_status },
  })

  return (updated || order) as OrderRow
}
