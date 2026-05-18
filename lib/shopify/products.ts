import { shopifyAdminGraphql, shopifyGidToLegacyId } from '@/lib/shopify/client'

type ShopifyImage = { url?: string; altText?: string | null }
type ShopifyMetafield = { namespace: string; key: string; value: string; type?: string }
type ShopifySelectedOption = { name: string; value: string }
type ShopifyVariantNode = {
  id: string
  legacyResourceId?: string | number | null
  title: string
  sku?: string | null
  price?: string | null
  compareAtPrice?: string | null
  inventoryQuantity?: number | null
  selectedOptions?: ShopifySelectedOption[]
  image?: ShopifyImage | null
}
type ShopifyProductNode = {
  id: string
  legacyResourceId?: string | number | null
  title: string
  handle: string
  description?: string | null
  descriptionHtml?: string | null
  vendor?: string | null
  productType?: string | null
  tags?: string[]
  status?: string
  totalInventory?: number | null
  onlineStoreUrl?: string | null
  seo?: { title?: string | null; description?: string | null } | null
  featuredImage?: ShopifyImage | null
  media?: { edges: Array<{ node: { image?: ShopifyImage | null } }> }
  metafields?: { edges: Array<{ node: ShopifyMetafield }> }
  variants?: { edges: Array<{ node: ShopifyVariantNode }> }
}

type ShopifyProductsQuery = {
  products: {
    edges: Array<{ cursor: string; node: ShopifyProductNode }>
    pageInfo: { hasNextPage: boolean; endCursor?: string | null }
  }
}

export type NormalizedShopifyProduct = ReturnType<typeof normalizeShopifyProduct>

const PRODUCTS_QUERY = `
  query AsortaProducts($first: Int!, $after: String) {
    products(first: $first, after: $after, sortKey: UPDATED_AT, reverse: true) {
      edges {
        cursor
        node {
          id
          legacyResourceId
          title
          handle
          description
          descriptionHtml
          vendor
          productType
          tags
          status
          totalInventory
          onlineStoreUrl
          seo { title description }
          featuredImage { url altText }
          media(first: 18) {
            edges {
              node {
                ... on MediaImage { image { url altText } }
              }
            }
          }
          metafields(first: 50) {
            edges { node { namespace key value type } }
          }
          variants(first: 100) {
            edges {
              node {
                id
                legacyResourceId
                title
                sku
                price
                compareAtPrice
                inventoryQuantity
                selectedOptions { name value }
                image { url altText }
              }
            }
          }
        }
      }
      pageInfo { hasNextPage endCursor }
    }
  }
`

function parseNumber(value: unknown, fallback = 0) {
  const number = typeof value === 'number' ? value : Number(String(value || '').replace(',', '.'))
  return Number.isFinite(number) ? number : fallback
}

function stripHtml(input: unknown) {
  if (typeof input !== 'string') return ''
  return input
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function unique(values: Array<string | undefined | null>) {
  return Array.from(new Set(values.map((value) => String(value || '').trim()).filter(Boolean)))
}

function metafieldMap(product: ShopifyProductNode) {
  const result: Record<string, string> = {}
  for (const edge of product.metafields?.edges || []) {
    const field = edge.node
    result[`${field.namespace}.${field.key}`] = field.value
    if (!result[field.key]) result[field.key] = field.value
  }
  return result
}

function categoryFor(product: ShopifyProductNode, fields: Record<string, string>) {
  const explicit = fields['asorta.category'] || fields['vyron.category'] || fields.category
  if (explicit) return slugify(explicit)
  const tagCategory = product.tags?.find((tag) => tag.toLowerCase().startsWith('category:'))?.split(':')[1]
  const type = product.productType || tagCategory
  return type ? slugify(type) : 'smart-utility'
}

function statusFor(product: ShopifyProductNode) {
  const status = String(product.status || '').toUpperCase()
  if (status === 'ACTIVE') return 'active'
  if (status === 'ARCHIVED') return 'archived'
  return 'draft'
}

function preferredSupplier(fields: Record<string, string>) {
  const raw = String(fields['supplier.name'] || fields.supplier || fields['asorta.supplier'] || fields['vyron.supplier'] || 'dsers').toLowerCase()
  if (raw.includes('cj')) return 'dsers'
  if (raw.includes('ali') || raw.includes('dser')) return 'dsers'
  return raw || 'dsers'
}

export function normalizeShopifyProduct(product: ShopifyProductNode) {
  const fields = metafieldMap(product)
  const variants = (product.variants?.edges || []).map(({ node }) => {
    const shopifyVariantId = node.id
    const shopifyVariantLegacyId = String(node.legacyResourceId || shopifyGidToLegacyId(node.id))
    return {
      name: node.title || 'Default',
      sku: node.sku || shopifyVariantLegacyId || node.id,
      variantId: shopifyVariantId,
      image: node.image?.url || product.featuredImage?.url || '/products/asorta-product-fallback.svg',
      stock: node.inventoryQuantity ?? undefined,
      shopifyVariantId,
      shopifyVariantLegacyId,
      options: node.selectedOptions || [],
      price: parseNumber(node.price),
      compareAtPrice: node.compareAtPrice ? parseNumber(node.compareAtPrice) : null,
    }
  })
  const firstVariant = variants[0]
  const mediaImages = (product.media?.edges || []).map((edge) => edge.node.image?.url)
  const images = unique([product.featuredImage?.url, ...mediaImages, ...variants.map((variant) => variant.image)])
  const description = stripHtml(product.descriptionHtml || product.description || '')
  const tags = product.tags || []
  const supplier = preferredSupplier(fields)
  const supplierProductId = fields['supplier.product_id'] || fields.supplier_product_id || fields.dsers_product_id || product.id || ''
  const supplierVariantId = fields['supplier.variant_id'] || fields.supplier_variant_id || fields.dsers_variant_id || firstVariant?.shopifyVariantId || ''
  const supplierSku = fields['supplier.sku'] || fields.supplier_sku || firstVariant?.sku || ''
  const supplierCost = parseNumber(fields['supplier.cost'] || fields.supplier_cost || fields.cost || 0)
  const price = parseNumber(firstVariant?.price, 0)
  const rawCompareAt = firstVariant?.compareAtPrice ? parseNumber(firstVariant.compareAtPrice) : 0
  const compareAt = rawCompareAt > price ? rawCompareAt : null

  return {
    slug: product.handle || slugify(product.title),
    name: product.title,
    category: categoryFor(product, fields),
    price,
    compare_at: compareAt,
    estimated_cost: supplierCost || null,
    supplier_name: 'DSers via Shopify',
    supplier_url: fields['supplier.url'] || fields.supplier_url || product.onlineStoreUrl || '',
    warehouse: fields['supplier.warehouse'] || fields.warehouse || 'DSers / AliExpress supplier',
    status: statusFor(product),
    hero_image: images[0] || '/products/asorta-product-fallback.svg',
    images,
    badge: fields['asorta.badge'] || fields['vyron.badge'] || fields.badge || 'Shopify Sync',
    short_description: product.seo?.description || description.slice(0, 180),
    description,
    features: tags.slice(0, 8).map((tag) => `Tag: ${tag}`),
    specs: unique([
      product.vendor ? `Vendor: ${product.vendor}` : '',
      product.productType ? `Type: ${product.productType}` : '',
      product.totalInventory != null ? `Inventory: ${product.totalInventory}` : '',
      `Order processing: tracked shipping updates`,
    ]),
    tags,
    box_items: fields['asorta.box_items'] || fields['vyron.box_items'] ? String(fields['asorta.box_items'] || fields['vyron.box_items']).split('\n').filter(Boolean) : ['Product as selected', 'Supplier packaging'],
    shipping_info: fields['asorta.shipping_info'] || fields['vyron.shipping_info'] || 'Veilige checkout. Na betaling ontvang je een orderbevestiging en tracking zodra verzending beschikbaar is.',
    content_ideas: [],
    supplier_notes: fields['supplier.notes'] || fields.notes || 'Internal sync note. Do not display supplier details publicly.',
    margin_note: supplierCost ? `Supplier cost from Shopify metafield: ${supplierCost}.` : 'Set supplier cost in Shopify metafields for accurate margin.',
    estimated_shipping: parseNumber(fields['supplier.shipping_cost'] || fields.shipping_cost || 0) || null,
    supplier_status: 'mapped',
    processing_time: fields['supplier.processing_time'] || '',
    delivery_time: fields['supplier.delivery_time'] || '',
    variants,
    videos: [],
    shopify_product_id: product.id,
    shopify_product_legacy_id: String(product.legacyResourceId || shopifyGidToLegacyId(product.id)),
    shopify_variant_id: firstVariant?.shopifyVariantId || '',
    shopify_variant_legacy_id: firstVariant?.shopifyVariantLegacyId || '',
    shopify_handle: product.handle,
    shopify_status: product.status || '',
    shopify_vendor: product.vendor || '',
    shopify_product_type: product.productType || '',
    shopify_tags: tags,
    shopify_raw: product,
    shopify_synced_at: new Date().toISOString(),
    supplier,
    supplier_product_id: supplierProductId,
    supplier_variant_id: supplierVariantId,
    supplier_sku: supplierSku,
    supplier_raw: { ...fields, route: 'dsers_via_shopify', shopifyProductId: product.id },
    updated_at: new Date().toISOString(),
  }
}

export async function fetchShopifyProducts(limit = 50) {
  const products: ShopifyProductNode[] = []
  let after: string | null = null
  const pageSize = Math.min(Math.max(limit, 1), 100)

  do {
    const data: ShopifyProductsQuery = await shopifyAdminGraphql<ShopifyProductsQuery>(PRODUCTS_QUERY, { first: pageSize, after })
    products.push(...data.products.edges.map((edge: { cursor: string; node: ShopifyProductNode }) => edge.node))
    after = data.products.pageInfo.hasNextPage ? data.products.pageInfo.endCursor || null : null
  } while (after && products.length < limit)

  return products.slice(0, limit).map((product) => normalizeShopifyProduct(product))
}
