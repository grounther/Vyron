'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Heart, Trash2 } from 'lucide-react'
import ProductImage from './ProductImage'

type WishlistProduct = {
  slug: string
  name: string
  category?: string
  price?: number
  compare_at?: number | null
  hero_image?: string | null
  short_description?: string | null
  status?: string | null
}

type WishlistItem = {
  id: string
  productSlug: string
  createdAt?: string
  product: WishlistProduct | null
}

export default function AccountWishlistClient({ initialItems }: { initialItems: WishlistItem[] }) {
  const [items, setItems] = useState(initialItems)
  const [loadingSlug, setLoadingSlug] = useState<string | null>(null)

  async function remove(productSlug: string) {
    setLoadingSlug(productSlug)
    try {
      const response = await fetch('/api/account/wishlist', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productSlug, action: 'remove' }),
      })

      const data = await response.json().catch(() => null)
      if (response.ok && data?.ok) {
        setItems((current) => current.filter((item) => item.productSlug !== productSlug))
      }
    } finally {
      setLoadingSlug(null)
    }
  }

  if (!items.length) {
    return <div className="rounded-2xl border border-white/10 bg-white/[.03] p-5 text-sm text-white/55">
      Je wishlist is nog leeg. Bewaar producten waar je later naar wilt terugkijken.
    </div>
  }

  return <div className="grid gap-3 md:grid-cols-2">
    {items.map((item) => {
      const product = item.product
      const href = product ? `/product/${product.slug}` : '/shop'
      const title = product?.name || item.productSlug
      const image = product?.hero_image || '/products/asorta-product-fallback.svg'
      const price = typeof product?.price === 'number' ? product.price : Number(product?.price || 0)

      return <div key={item.id} className="rounded-2xl border border-white/10 bg-white/[.035] p-3">
        <div className="flex gap-3">
          <Link href={href} className="shrink-0 overflow-hidden rounded-2xl">
            <ProductImage src={image} alt={title} className="h-20 w-20 object-cover" />
          </Link>
          <div className="min-w-0 flex-1">
            <Link href={href} className="line-clamp-2 font-black text-white hover:text-[#dbe9d4]">{title}</Link>
            {product?.category && <p className="mt-1 text-[11px] font-black uppercase tracking-[.18em] text-white/35">{product.category.replace('-', ' ')}</p>}
            {price > 0 && <p className="mt-2 text-sm font-black text-white/75">€{price.toFixed(2)}</p>}
          </div>
          <button
            type="button"
            onClick={() => remove(item.productSlug)}
            disabled={loadingSlug === item.productSlug}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/10 text-white/45 transition hover:border-red-300/40 hover:bg-red-400/10 hover:text-red-100 disabled:opacity-50"
            aria-label={`Remove ${title} from wishlist`}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    })}
  </div>
}
