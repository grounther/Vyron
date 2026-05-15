/**
 * Legacy static product catalog disabled.
 *
 * ASORTA now uses Shopify as the only source for buyable storefront products.
 * Products shown on the public site must come from Shopify sync -> Supabase.
 */

export type Category = {
  slug: string
  name: string
  text: string
  short?: string
  description?: string
  image?: string
}

export type ProductVideo = {
  src: string
  poster?: string
  label?: string
  title?: string
}

export type ProductVariant = {
  name: string
  sku: string
  variantId?: string
  price?: number
  image: string
  stock?: number
  options?: Record<string, string>
  shopifyVariantId?: string
  shopifyVariantLegacyId?: string
}

export type SupplierInfo = {
  name?: string
  productUrl?: string
  warehouse?: string
  estimatedProductCost?: number
  estimatedShipping?: number
  landedCost?: number
  status?: string
  notes?: string
  productId?: string
  variantIds?: string[]
  variants?: string[]
  processingTime?: string
  deliveryTime?: string
}

export type Product = {
  slug: string
  name: string
  category: string
  price: number
  compareAt?: number | null
  cost: number
  hero: string
  images: string[]
  videos: ProductVideo[]
  badge?: string
  short?: string
  description?: string
  features: string[]
  specs: string[]
  boxItems: string[]
  tags: string[]
  shippingInfo?: string
  contentIdeas: string[]
  supplierNotes?: string
  marginNote?: string
  supplier?: SupplierInfo
  variants: ProductVariant[]
  shopifyProductId?: string
  shopifyVariantId?: string
  shopifyVariantLegacyId?: string
  shopifyHandle?: string
  status?: string
}

export const categories: Category[] = [
  {
    slug: 'smart-utility',
    name: 'Smart Utility',
    text: 'Practical smart tools and everyday tech upgrades.',
    short: 'Practical smart tools and everyday tech upgrades.',
    description: 'Useful smart products synced from Shopify for the ASORTA storefront.',
  },
  {
    slug: 'automotive',
    name: 'Automotive',
    text: 'Car accessories and practical driving upgrades.',
    short: 'Car accessories and practical driving upgrades.',
  },
  {
    slug: 'desk-setup',
    name: 'Desk Setup',
    text: 'Clean workspace and productivity products.',
    short: 'Clean workspace and productivity products.',
  },
  {
    slug: 'tactical',
    name: 'Tactical',
    text: 'Utility gear and practical carry accessories.',
    short: 'Utility gear and practical carry accessories.',
  },
  {
    slug: 'outdoor',
    name: 'Outdoor',
    text: 'Portable gear for travel and outdoor use.',
    short: 'Portable gear for travel and outdoor use.',
  },
  {
    slug: 'gaming',
    name: 'Gaming',
    text: 'Gaming and creator setup accessories.',
    short: 'Gaming and creator setup accessories.',
  },
]

export function getCategory(slug: string): Category | undefined {
  return categories.find((category) => category.slug === slug)
}

/**
 * Keep this empty. Do not add static storefront products here.
 * Shopify sync -> Supabase is the only product source.
 */
export const products: Product[] = []

export default products
