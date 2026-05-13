import { createAdminClient } from '@/lib/supabase/admin'
import { supabase } from '@/lib/supabase'
import {
  byCategory as staticByCategory,
  categories,
  featured as staticFeatured,
  getProduct as staticGetProduct,
  products as staticProducts,
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
  const fallback = staticGetProduct(slug)
  const estimatedCost = asNumber(row.estimated_cost, fallback?.cost || 0)
  const hero = asString(row.hero_image, fallback?.hero || '/products/asorta-product-fallback.svg')
  const images = asStringArray(row.images, fallback?.images || (hero ? [hero] : []))
  const features = asStringArray(row.features, fallback?.features || [])
  const specs = asStringArray(row.specs, fallback?.specs || [])
  const tags = asStringArray(row.tags, fallback?.tags || [])
  const boxItems = asStringArray(row.box_items, fallback?.boxItems || [])
  const variants = asJsonArray<ProductVariant>(row.variants, fallback?.variants || [])
  const videos = asJsonArray<ProductVideo>(row.videos, fallback?.videos || [])

  const supplier: SupplierInfo | undefined = {
    name: asString(row.supplier_name, fallback?.supplier?.name || 'Supplier pending'),
    productUrl: asString(row.supplier_url, fallback?.supplier?.productUrl || ''),
    warehouse: asString(row.warehouse, fallback?.supplier?.warehouse || 'China'),
    estimatedProductCost: estimatedCost,
    estimatedShipping: asNumber(row.estimated_shipping, fallback?.supplier?.estimatedShipping || 0),
    landedCost: estimatedCost,
    status: (asString(row.supplier_status, fallback?.supplier?.status || 'testing') as SupplierInfo['status']) || 'testing',
    notes: asString(row.supplier_notes, fallback?.supplier?.notes || ''),
    productId: asString(row.cj_product_id, fallback?.supplier?.productId || ''),
    variantIds: asStringArray(row.cj_variant_ids, fallback?.supplier?.variantIds || []),
    variants: variants.map((v) => v.name),
    processingTime: asString(row.processing_time, fallback?.supplier?.processingTime || ''),
    deliveryTime: asString(row.delivery_time, fallback?.supplier?.deliveryTime || ''),
  }

  return {
    slug,
    name: asString(row.name, fallback?.name || 'Untitled product'),
    category: asString(row.category, fallback?.category || 'smart-utility'),
    price: asNumber(row.price, fallback?.price || 0),
    compareAt: row.compare_at == null ? fallback?.compareAt : asNumber(row.compare_at),
    cost: estimatedCost,
    hero,
    images: images.length ? images : [hero],
    videos,
    variants,
    boxItems,
    badge: asString(row.badge, fallback?.badge || 'New'),
    short: asString(row.short_description, fallback?.short || ''),
    description: asString(row.description, fallback?.description || ''),
    features,
    specs,
    tags,
    shippingInfo: asString(row.shipping_info, fallback?.shippingInfo || 'Estimated delivery with tracked shipping.'),
    contentIdeas: asStringArray(row.content_ideas, fallback?.contentIdeas || []),
    supplierNotes: asString(row.supplier_notes, fallback?.supplierNotes || ''),
    marginNote: asString(row.margin_note, fallback?.marginNote || ''),
    supplier,
  }
}

export async function getProducts(): Promise<Product[]> {
  const client = createAdminClient() || supabase
  if (!client) return staticProducts

  const { data, error } = await client
    .from('products')
    .select('*')
    .in('status', ['active', 'launch'])
    .order('created_at', { ascending: true })

  if (error || !data?.length) return staticProducts

  return data.map((row) => mapProductRow(row as ProductRow))
}

export async function getProduct(slug: string): Promise<Product | undefined> {
  const client = createAdminClient() || supabase
  if (!client) return staticGetProduct(slug)

  const { data, error } = await client.from('products').select('*').eq('slug', slug).in('status', ['active', 'launch']).maybeSingle()
  if (error || !data) return staticGetProduct(slug)
  return mapProductRow(data as ProductRow)
}

export async function byCategory(slug: string): Promise<Product[]> {
  const items = await getProducts()
  return items.filter((p) => p.category === slug)
}

export async function getFeaturedProducts(): Promise<Product[]> {
  const items = await getProducts()
  const preferred = items.filter((p) => ['Launch Pick', 'High Priority', 'Smart Car', 'Bestseller'].includes(p.badge) || Boolean(p.compareAt))
  return preferred.length ? preferred.slice(0, 4) : staticFeatured
}

export { categories, staticProducts }
