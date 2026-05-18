import { createAdminClient } from '@/lib/supabase/admin'
import { supabase } from '@/lib/supabase'
import {
  categories,
  type Product,
  type ProductVariant,
  type ProductVideo,
  type SupplierInfo,
} from '@/lib/products'

type ProductRow = Record<string, unknown>

function asNumber(value: unknown, fallback = 0) {
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : fallback
}

function asString(value: unknown, fallback = '') {
  return typeof value === 'string' && value.trim() ? value : fallback
}

function asStringArray(value: unknown, fallback: string[] = []) {
  if (Array.isArray(value)) return value.map(String).filter(Boolean)
  if (typeof value === 'string') {
    return value
      .split('\n')
      .map((v) => v.trim())
      .filter(Boolean)
  }
  return fallback
}

function asJsonArray<T>(value: unknown, fallback: T[] = []) {
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

function mapProductRow(row: ProductRow): Product {
  const slug = asString(row.slug)
  const hero = asString(row.hero_image, '/products/asorta-product-fallback.svg')
  const images = asStringArray(row.images, hero ? [hero] : ['/products/asorta-product-fallback.svg'])
  const features = asStringArray(row.features, [])
  const specs = asStringArray(row.specs, [])
  const tags = asStringArray(row.tags, [])
  const boxItems = asStringArray(row.box_items, [])
  const variants = asJsonArray<ProductVariant>(row.variants, [])
  const videos = asJsonArray<ProductVideo>(row.videos, [])
  const estimatedCost = asNumber(row.estimated_cost, 0)
  const price = asNumber(row.price, 0)
  const rawCompareAt = row.compare_at == null ? undefined : asNumber(row.compare_at)
  const compareAt = typeof rawCompareAt === 'number' && rawCompareAt > price ? rawCompareAt : undefined

  function sanitizeBadge(value: string) {
    const lower = value.toLowerCase()
    if (!value || lower.includes('shopify') || lower.includes('dsers') || lower.includes('cj')) return 'New Arrival'
    return value
  }

  function sanitizePublicText(value: string, fallback = '') {
    const lower = value.toLowerCase()
    if (!value || lower.includes('shopify') || lower.includes('dsers') || lower.includes('cj dropshipping')) return fallback
    return value
  }

  function sanitizePublicList(values: string[]) {
    return values.filter((value) => {
      const lower = value.toLowerCase()
      return !lower.includes('shopify') && !lower.includes('dsers') && !lower.includes('cj dropshipping')
    })
  }

  const supplier: SupplierInfo = {
    name: asString(row.supplier_name, 'ASORTA fulfillment'),
    productUrl: asString(row.supplier_url, ''),
    warehouse: asString(row.warehouse, 'Tracked delivery'),
    estimatedProductCost: estimatedCost,
    estimatedShipping: asNumber(row.estimated_shipping, 0),
    landedCost: estimatedCost,
    status: (asString(row.supplier_status, 'approved') as SupplierInfo['status']) || 'approved',
    notes: asString(row.supplier_notes, ''),
    productId: asString(row.shopify_product_id, asString(row.supplier_product_id, '')),
    variantIds: [asString(row.shopify_variant_id, ''), asString(row.shopify_variant_legacy_id, '')].filter(Boolean),
    variants: variants.map((v) => v.name),
    processingTime: asString(row.processing_time, ''),
    deliveryTime: asString(row.delivery_time, ''),
  }

  return {
    slug,
    name: asString(row.name, 'Untitled Shopify product'),
    category: asString(row.category, 'smart-utility'),
    price,
    compareAt,
    cost: estimatedCost,
    hero,
    images: images.length ? images : [hero],
    videos,
    variants,
    boxItems,
    badge: sanitizeBadge(asString(row.badge, 'New Arrival')),
    short: sanitizePublicText(asString(row.short_description, ''), ''),
    description: sanitizePublicText(asString(row.description, ''), ''),
    features: sanitizePublicList(features),
    specs: sanitizePublicList(specs),
    tags,
    shippingInfo: sanitizePublicText(asString(row.shipping_info, ''), 'Je ontvangt tracking zodra je pakket is aangemeld voor verzending.'),
    contentIdeas: asStringArray(row.content_ideas, []),
    supplierNotes: sanitizePublicText(asString(row.supplier_notes, ''), 'Neem contact op met support als je vragen hebt over dit product of je bestelling.'),
    marginNote: asString(row.margin_note, ''),
    supplier,
    shopifyProductId: asString(row.shopify_product_id, ''),
    shopifyVariantId: asString(row.shopify_variant_id, ''),
    shopifyVariantLegacyId: asString(row.shopify_variant_legacy_id, ''),
  }
}

function productQuery(client: any) {
  return client
    .from('products')
    .select('*')
    .in('status', ['active', 'launch'])
    .not('shopify_product_id', 'is', null)
    .not('shopify_variant_legacy_id', 'is', null)
}

export async function getProducts(): Promise<Product[]> {
  const client = createAdminClient() || supabase
  if (!client) return []

  const { data, error } = await productQuery(client).order('created_at', { ascending: true })

  if (error || !data?.length) return []

  return (data as ProductRow[]).map((row: ProductRow) => mapProductRow(row))
}

export async function getProduct(slug: string): Promise<Product | undefined> {
  const client = createAdminClient() || supabase
  if (!client) return undefined

  const { data, error } = await productQuery(client).eq('slug', slug).maybeSingle()

  if (error || !data) return undefined

  return mapProductRow(data as ProductRow)
}

export async function byCategory(slug: string): Promise<Product[]> {
  const items = await getProducts()
  return items.filter((p) => p.category === slug)
}

export async function getFeaturedProducts(): Promise<Product[]> {
  const items = await getProducts()
  const preferred = items.filter((p) => (typeof p.badge === 'string' && ['Launch Pick', 'High Priority', 'Smart Car', 'Bestseller', 'Shopify Sync'].includes(p.badge)) || (typeof p.compareAt === 'number' && p.compareAt > p.price))
  return preferred.length ? preferred.slice(0, 4) : items.slice(0, 4)
}

// Intentionally do not expose old hardcoded products as catalog data.
// Shopify/Supabase is the only source of truth for customer-visible products.
export const staticProducts: Product[] = []
export { categories }
