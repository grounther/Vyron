import type { SupabaseClient } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { getShopifyConfig, shopifyGidToLegacyId } from '@/lib/shopify/client'
import { products as staticProducts } from '@/lib/products'

type CheckoutCartItem = {
  slug: string
  qty: number
  variantSku?: string
  shopifyVariantId?: string
  shopifyVariantLegacyId?: string
}

type ProductRow = Record<string, any>

function normalizeQty(value: unknown) {
  const qty = Math.floor(Number(value || 1))
  return Math.min(20, Math.max(1, Number.isFinite(qty) ? qty : 1))
}

function normalizeItem(item: any): CheckoutCartItem | null {
  const slug = String(item?.slug || '').trim()
  if (!slug) return null
  return {
    slug,
    qty: normalizeQty(item?.qty || item?.quantity),
    variantSku: String(item?.variantSku || item?.sku || item?.variant_sku || '').trim(),
    shopifyVariantId: String(item?.shopifyVariantId || item?.shopify_variant_id || '').trim(),
    shopifyVariantLegacyId: String(item?.shopifyVariantLegacyId || item?.shopify_variant_legacy_id || '').trim(),
  }
}

function normalizeItems(input: unknown) {
  if (!Array.isArray(input)) return []
  return input.map(normalizeItem).filter(Boolean) as CheckoutCartItem[]
}

function parseJsonArray<T>(value: unknown, fallback: T[] = []) {
  if (Array.isArray(value)) return value as T[]
  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? (parsed as T[]) : fallback
    } catch {
      return fallback
    }
  }
  return fallback
}

async function loadProducts(client: SupabaseClient | null, slugs: string[]) {
  if (!client) {
    return staticProducts.filter((product) => slugs.includes(product.slug)).map((product): ProductRow => ({
      slug: product.slug,
      name: product.name,
      status: 'active',
      price: product.price,
      variants: product.variants || [],
    }))
  }

  const { data, error } = await client
    .from('products')
    .select('slug,name,status,price,shopify_product_id,shopify_variant_id,shopify_variant_legacy_id,variants')
    .in('slug', slugs)
    .in('status', ['active', 'launch'])

  if (error) throw new Error(error.message)
  return (data || []) as ProductRow[]
}

function findVariant(row: ProductRow, item: CheckoutCartItem) {
  const variants = parseJsonArray<Record<string, any>>(row.variants, [])
  if (!variants.length) return undefined

  return variants.find((variant) => {
    const candidates = [
      variant.sku,
      variant.variantId,
      variant.shopifyVariantId,
      variant.shopifyVariantLegacyId,
    ].map((value) => String(value || '').trim()).filter(Boolean)

    return [item.variantSku, item.shopifyVariantId, item.shopifyVariantLegacyId]
      .map((value) => String(value || '').trim())
      .filter(Boolean)
      .some((value) => candidates.includes(value))
  }) || variants[0]
}

function variantLegacyId(row: ProductRow, item: CheckoutCartItem) {
  if (item.shopifyVariantLegacyId) return item.shopifyVariantLegacyId
  if (item.shopifyVariantId) return shopifyGidToLegacyId(item.shopifyVariantId)

  const variant = findVariant(row, item)
  const fromVariant = variant?.shopifyVariantLegacyId || shopifyGidToLegacyId(variant?.shopifyVariantId || variant?.variantId)
  const fromProduct = row.shopify_variant_legacy_id || shopifyGidToLegacyId(row.shopify_variant_id)

  return String(fromVariant || fromProduct || '').trim()
}

function mergeLines(lines: Array<{ variantId: string; quantity: number }>) {
  const merged = new Map<string, number>()
  for (const line of lines) {
    merged.set(line.variantId, (merged.get(line.variantId) || 0) + line.quantity)
  }
  return Array.from(merged.entries()).map(([variantId, quantity]) => ({ variantId, quantity }))
}

function buildCheckoutUrl(lines: Array<{ variantId: string; quantity: number }>, email?: string) {
  const { checkoutDomain } = getShopifyConfig()
  if (!checkoutDomain) throw new Error('SHOPIFY_STORE_DOMAIN ontbreekt.')

  const path = lines.map((line) => `${encodeURIComponent(line.variantId)}:${line.quantity}`).join(',')
  const url = new URL(`https://${checkoutDomain}/cart/${path}`)
  url.searchParams.set('utm_source', 'asorta')
  url.searchParams.set('utm_medium', 'custom_frontend')
  url.searchParams.set('utm_campaign', 'paypal_shopify_checkout')
  url.searchParams.set('attributes[asorta_source]', 'custom_frontend')
  url.searchParams.set('attributes[fulfillment]', 'dsers')
  if (email && email.includes('@')) url.searchParams.set('checkout[email]', email)
  return url.toString()
}

export async function createShopifyCheckoutRedirect(input: { items: unknown; email?: string; client?: SupabaseClient | null }) {
  const items = normalizeItems(input.items)
  if (!items.length) throw new Error('Cart is leeg.')

  const slugs = Array.from(new Set(items.map((item) => item.slug)))
  const rows = await loadProducts(input.client ?? supabase, slugs)
  const rowBySlug = new Map(rows.map((row) => [String(row.slug), row]))

  const lines = [] as Array<{ variantId: string; quantity: number }>
  const missing = [] as string[]

  for (const item of items) {
    const row = rowBySlug.get(item.slug)
    if (!row) {
      missing.push(`${item.slug}: product niet gevonden of niet actief`)
      continue
    }

    const id = variantLegacyId(row, item)
    if (!id) {
      missing.push(`${item.slug}: Shopify variant ID ontbreekt. Run Shopify sync opnieuw en controleer of productvarianten uit Shopify komen.`)
      continue
    }

    lines.push({ variantId: id, quantity: item.qty })
  }

  if (missing.length) {
    throw new Error(`Checkout kan niet starten: ${missing.join('; ')}`)
  }

  const mergedLines = mergeLines(lines)
  return {
    checkoutUrl: buildCheckoutUrl(mergedLines, input.email),
    lineCount: mergedLines.length,
    itemCount: mergedLines.reduce((sum, line) => sum + line.quantity, 0),
  }
}
