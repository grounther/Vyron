import type { SupabaseClient } from '@supabase/supabase-js'
import { products as staticProducts } from '@/lib/products'
import type { Product } from '@/lib/products'

type CheckoutItemInput = {
  slug: string
  qty: number
  variantSku?: string
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

function parseNumber(value: unknown, fallback = 0) {
  const parsed = typeof value === 'number' ? value : Number(String(value || '').replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : fallback
}

function normalizeItem(item: any): CheckoutItemInput | null {
  const slug = String(item?.slug || '').trim()
  const qty = Math.min(20, Math.max(1, Number(item?.qty || item?.quantity || 1)))
  const variantSku = String(item?.variantSku || item?.sku || item?.variant_sku || '').trim()
  if (!slug) return null
  return { slug, qty, variantSku }
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

export async function createOrderFromCheckout(admin: SupabaseClient, input: { items: unknown; shipping: unknown; source?: string }) {
  const items = normalizeCheckoutItems(input.items)
  if (!items.length) throw new Error('Cart is leeg.')

  const shipping = normalizeShipping(input.shipping)
  validateShipping(shipping)

  const slugs = Array.from(new Set(items.map((item) => item.slug)))
  const productRows = await loadProducts(admin, slugs)
  const productBySlug = new Map(productRows.map((product) => [product.slug, product]))

  const calculatedItems = []
  for (const item of items) {
    const product = productBySlug.get(item.slug)
    if (!product) throw new Error(`Product ${item.slug} is niet beschikbaar.`)
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
      cj_product_id: product.cj_product_id || mapping?.supplier_product_id || '',
      cj_variant_id: product.cj_variant_id || mapping?.supplier_variant_id || '',
      cj_sku: product.cj_sku || mapping?.supplier_sku || variant?.sku || '',
      raw: { variant, mapping },
    })
  }

  const subtotal = calculatedItems.reduce((sum, item) => sum + item.unit_price * item.quantity, 0)
  const shippingTotal = 0
  const vatTotal = 0
  const total = subtotal + shippingTotal + vatTotal
  const estimatedCost = calculatedItems.reduce((sum, item) => sum + item.estimated_unit_cost * item.quantity, 0)
  const estimatedProfit = total - estimatedCost

  const { data: order, error } = await admin
    .from('orders')
    .insert({
      order_number: orderNumber(),
      customer_email: shipping.email,
      subtotal,
      shipping_total: shippingTotal,
      vat_total: vatTotal,
      total,
      estimated_cost: estimatedCost,
      estimated_profit: estimatedProfit,
      payment_provider: process.env.PAYMENT_PROVIDER || 'mollie',
      payment_status: 'pending',
      fulfillment_status: 'pending_payment',
      currency: 'EUR',
      shipping_address: shipping,
      billing_address: shipping,
      raw: { source: input.source || 'site_checkout' },
    })
    .select('*')
    .single()

  if (error) throw new Error(error.message)

  const rows = calculatedItems.map((item) => ({ ...item, order_id: order.id }))
  const { error: itemError } = await admin.from('order_items').insert(rows)
  if (itemError) throw new Error(itemError.message)

  return { order: order as Record<string, any>, items: rows, shipping, subtotal, total }
}
