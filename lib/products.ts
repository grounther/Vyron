/**
 * Legacy static product catalog disabled.
 *
 * ASORTA uses a synced product database as the source for buyable storefront products.
 * Do not add legacy static storefront products here.
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
  estimatedShipping?: number
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
  inventoryOnline?: number
  inventoryMarket?: number
  inventoryTotal?: number
  sellOnline?: boolean
  sellMarket?: boolean
  hotDeal?: boolean
  conditionLabel?: string
  sealedStatus?: string
  cardmarketUrl?: string
  marketValue?: number
  marketSource?: string
  autoPricingEnabled?: boolean
  minMarginPercent?: number
  minPrice?: number
  priceLocked?: boolean
  pricingStatus?: string
  suggestedPrice?: number
}


export const categories: Category[] = [
  {
    slug: 'booster-packs',
    name: 'Booster Packs',
    text: 'Losse Pokemon booster packs uit eigen voorraad.',
    short: 'Losse boosters en sealed packs.',
    description: 'Pokemon booster packs voor verzamelaars, spelers en marktdeals.',
  },
  {
    slug: 'elite-trainer-boxes',
    name: 'Elite Trainer Boxes',
    text: "ETB\'s, trainer kits en premium sealed boxen.",
    short: "ETB\'s en sealed boxen.",
  },
  {
    slug: 'collection-boxes',
    name: 'Collection Boxes',
    text: 'Pokemon collection boxes, tins en gift sets.',
    short: 'Boxes, tins en gift sets.',
  },
  {
    slug: 'singles',
    name: 'Singles',
    text: 'Losse kaarten, hits en binderwaardige kaarten.',
    short: 'Losse kaarten en hits.',
  },
  {
    slug: 'accessories',
    name: 'Accessoires',
    text: 'Sleeves, binders, toploaders en bescherming voor je collectie.',
    short: 'Bescherming en opslag.',
  },
  {
    slug: 'market-deals',
    name: 'Markt Deals',
    text: 'Bundles, acties en producten die ook meegaan naar markten en braderieen.',
    short: 'Bundles en event deals.',
  },
]

export function getCategory(slug: string): Category | undefined {
  return categories.find((category) => category.slug === slug)
}

/**
 * Keep this empty. Do not add static storefront products here.
 * The synced database is the only storefront product source.
 */
export const products: Product[] = []

export default products
