'use client'

import { useEffect, useState } from 'react'
import { Check, ShoppingCart } from 'lucide-react'
import ProductImage from './ProductImage'
import { trackAddToCart } from '@/lib/analytics-client'

type CartProduct = {
  slug: string
  name: string
  price: number
  hero: string
  variant?: string
  variantName?: string
  variantSku?: string
  sku?: string
  shopifyVariantId?: string
  shopifyVariantLegacyId?: string
}

function cartCount(items: any[]) {
  return items.reduce((sum, item) => sum + Number(item.qty || 0), 0)
}

function lineKey(item: Partial<CartProduct>) {
  return [item.slug, item.shopifyVariantId || item.shopifyVariantLegacyId || item.variantSku || item.sku || 'default'].join('::')
}

export default function AddToCartButton({ product }: { product: CartProduct }) {
  const [show, setShow] = useState(false)
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!show) return
    const timer = setTimeout(() => setShow(false), 2400)
    return () => clearTimeout(timer)
  }, [show])

  function add() {
    const key = 'asorta_cart'
    const current = JSON.parse(localStorage.getItem(key) || '[]')
    const productKey = lineKey(product)
    const found = current.find((item: any) => lineKey(item) === productKey)
    if (found) found.qty += 1
    else current.push({ ...product, lineKey: productKey, qty: 1 })
    localStorage.setItem(key, JSON.stringify(current))
    const total = cartCount(current)
    setCount(total)
    window.dispatchEvent(new CustomEvent('asorta-cart', { detail: { product, count: total } }))
    trackAddToCart({ item_id: product.shopifyVariantLegacyId || product.shopifyVariantId || product.slug, item_name: product.name, item_variant: product.variantName || product.variant, price: product.price, quantity: 1 })
    setShow(false)
    requestAnimationFrame(() => setShow(true))
  }

  return <>
    <button onClick={add} className="btn-primary w-full py-4 text-base md:text-lg"><ShoppingCart size={20} strokeWidth={2.8} className="mr-2" /> Add to Cart</button>
    <div className={`pointer-events-none fixed right-4 top-[5.2rem] z-[80] w-[calc(100vw-2rem)] max-w-md transition-all duration-500 ease-out ${show ? 'translate-x-0 opacity-100' : 'translate-x-[120%] opacity-0'}`}>
      <div className="relative overflow-hidden rounded-3xl border border-[#5B6653]/45 bg-zinc-950/94 p-3 shadow-[0_30px_90px_rgba(0,0,0,.72)] backdrop-blur-xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_50%,rgba(91,102,83,.22),transparent_42%)]" />
        <div className="relative flex items-center gap-3">
          <ProductImage src={product.hero} alt="" className="h-16 w-16 rounded-2xl object-cover" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[.18em] text-[#aab6a0]"><Check size={14} /> Added to cart</div>
            <p className="mt-1 truncate text-sm font-black text-white">{product.name}</p>
            <p className="text-xs text-white/50">{product.variantName || product.variant ? `Uitvoering: ${product.variantName || product.variant}` : 'Added to your ASORTA cart.'}</p>
          </div>
          <div className="relative grid h-12 w-12 place-items-center rounded-full bg-white text-zinc-950">
            <ShoppingCart size={20} strokeWidth={3} className="text-black" />
            {count > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#6f7d64] px-1 text-[11px] font-black text-white ring-2 ring-black shadow-[0_0_18px_rgba(111,125,100,.55)]">{count}</span>}
          </div>
        </div>
        <div className="relative mt-3 h-1 overflow-hidden rounded-full bg-white/10"><div className="h-full w-full origin-left animate-[asortaToast_2.4s_linear_forwards] bg-[#5B6653]" /></div>
      </div>
    </div>
  </>
}
