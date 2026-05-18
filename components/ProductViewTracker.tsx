'use client'

import { useEffect } from 'react'
import { trackViewItem } from '@/lib/analytics-client'
import type { Product } from '@/lib/products'

export default function ProductViewTracker({ product }: { product: Product }) {
  useEffect(() => {
    trackViewItem({
      item_id: product.shopifyVariantLegacyId || product.shopifyVariantId || product.slug,
      item_name: product.name,
      item_category: product.category,
      item_variant: product.variants?.[0]?.name,
      price: product.price,
      quantity: 1,
    })
  }, [product])

  return null
}
