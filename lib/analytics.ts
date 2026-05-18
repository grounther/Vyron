import type { Product } from '@/lib/products'

export type AnalyticsItem = {
  item_id: string
  item_name: string
  item_category?: string
  item_variant?: string
  price?: number
  quantity?: number
}

export function productToAnalyticsItem(product: Product, quantity = 1): AnalyticsItem {
  return {
    item_id: product.shopifyVariantLegacyId || product.shopifyVariantId || product.slug,
    item_name: product.name,
    item_category: product.category,
    item_variant: product.variants?.[0]?.name,
    price: Number(product.price || 0),
    quantity,
  }
}
