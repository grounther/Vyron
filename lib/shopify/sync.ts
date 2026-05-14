import { revalidatePath } from 'next/cache'
import type { SupabaseClient } from '@supabase/supabase-js'
import { fetchShopifyProducts, normalizeShopifyProduct } from '@/lib/shopify/products'


function normalizeWebhookPayload(payload: any) {
  if (!payload || !payload.admin_graphql_api_id) return payload
  const tags = Array.isArray(payload.tags) ? payload.tags : String(payload.tags || '').split(',').map((tag) => tag.trim()).filter(Boolean)
  return {
    id: payload.admin_graphql_api_id || `gid://shopify/Product/${payload.id}`,
    title: payload.title,
    handle: payload.handle,
    description: payload.body_html || payload.description,
    descriptionHtml: payload.body_html || payload.description,
    vendor: payload.vendor,
    productType: payload.product_type,
    tags,
    status: String(payload.status || '').toUpperCase(),
    totalInventory: null,
    onlineStoreUrl: '',
    seo: { title: payload.title, description: '' },
    featuredImage: payload.image?.src ? { url: payload.image.src, altText: payload.image.alt } : null,
    media: { edges: (payload.images || []).map((image: any) => ({ node: { image: { url: image.src, altText: image.alt } } })) },
    metafields: { edges: [] },
    variants: { edges: (payload.variants || []).map((variant: any) => ({ node: {
      id: variant.admin_graphql_api_id || `gid://shopify/ProductVariant/${variant.id}`,
      title: variant.title,
      sku: variant.sku,
      price: variant.price,
      compareAtPrice: variant.compare_at_price,
      inventoryQuantity: variant.inventory_quantity,
      selectedOptions: [],
      image: null,
    } })) },
  }
}

type SyncOptions = {
  limit?: number
  productPayload?: unknown
  source?: 'manual' | 'webhook'
}

function mapSupplierName(value: unknown) {
  const normalized = String(value || '').trim().toLowerCase()
  if (normalized.includes('cj')) return 'cj'
  if (normalized.includes('dser')) return 'dsers'
  if (normalized.includes('aliexpress')) return 'dsers'
  return normalized
}

function variantMappings(row: Record<string, any>, productId?: string) {
  const supplier = mapSupplierName(row.supplier)
  if (!supplier) return []
  const variants = Array.isArray(row.variants) ? row.variants : []
  return variants.map((variant: Record<string, any>, index: number) => ({
    product_id: productId || null,
    product_slug: row.slug,
    platform: 'shopify',
    platform_product_id: row.shopify_product_id,
    platform_variant_id: variant.shopifyVariantId || variant.variantId || row.shopify_variant_id || '',
    platform_variant_sku: variant.sku || row.supplier_sku || '',
    platform_variant_name: variant.name || `Variant ${index + 1}`,
    supplier,
    supplier_product_id: row.supplier_product_id || '',
    supplier_variant_id: row.supplier_variant_id || variant.supplierVariantId || '',
    supplier_sku: row.supplier_sku || variant.sku || '',
    supplier_cost: row.estimated_cost || null,
    supplier_shipping_method: row.supplier_raw?.['supplier.shipping_method'] || row.supplier_raw?.shipping_method || '',
    supplier_raw: row.supplier_raw || {},
    is_primary: index === 0,
    enabled: true,
    updated_at: new Date().toISOString(),
  }))
}

export async function upsertNormalizedShopifyProducts(admin: SupabaseClient, rows: Array<Record<string, any>>) {
  if (!rows.length) return { imported: 0, updated: 0, mapped: 0, slugs: [] as string[] }

  const { data, error } = await admin
    .from('products')
    .upsert(rows, { onConflict: 'slug' })
    .select('id, slug')

  if (error) throw new Error(error.message)

  const idBySlug = new Map((data || []).map((row: any) => [row.slug, row.id]))
  const mappings = rows.flatMap((row) => variantMappings(row, idBySlug.get(row.slug)))

  if (mappings.length) {
    const { error: mappingError } = await admin
      .from('product_supplier_mappings')
      .upsert(mappings, { onConflict: 'product_slug,platform_variant_id,supplier' })
    if (mappingError) throw new Error(mappingError.message)
  }

  const slugs = rows.map((row) => row.slug)
  revalidatePath('/')
  revalidatePath('/shop')
  revalidatePath('/sitemap.xml')
  slugs.slice(0, 20).forEach((slug) => revalidatePath(`/product/${slug}`))

  return { imported: rows.length, updated: rows.length, mapped: mappings.length, slugs }
}

export async function syncShopifyProducts(admin: SupabaseClient, options: SyncOptions = {}) {
  const rows = options.productPayload
    ? [normalizeShopifyProduct(normalizeWebhookPayload(options.productPayload))]
    : await fetchShopifyProducts(options.limit || 50)

  const result = await upsertNormalizedShopifyProducts(admin, rows)

  await admin.from('integration_sync_logs').insert({
    provider: 'shopify',
    event: options.source || 'manual',
    status: 'success',
    message: `Shopify sync imported/updated ${result.imported} products and ${result.mapped} supplier mappings.`,
    payload: { slugs: result.slugs },
  }).then(() => undefined, () => undefined)

  return result
}
