'use client'

import { useMemo, useState } from 'react'
import { Lock, ShieldCheck, ShoppingCart, Star, Truck } from 'lucide-react'
import AddToCartButton from './AddToCartButton'
import ProductImage from './ProductImage'
import type { Product, ProductVariant } from '@/lib/products'

export default function ProductPurchasePanel({ product }: { product: Product }) {
  const variants = product.variants || []
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(variants[0])
  const gallery = useMemo(() => {
    const base = product.images?.length ? product.images : [product.hero]
    const variantImage = selectedVariant?.image
    return variantImage ? [variantImage, ...base.filter((img) => img !== variantImage)] : base
  }, [product, selectedVariant])
  const [activeImage, setActiveImage] = useState(gallery[0] || product.hero)

  function selectVariant(sku: string) {
    const next = variants.find((v) => v.sku === sku)
    setSelectedVariant(next)
    if (next?.image) setActiveImage(next.image)
  }

  const cartProduct = {
    slug: product.slug,
    name: product.name,
    price: product.price,
    hero: activeImage || product.hero,
    variantName: selectedVariant?.name,
    variantSku: selectedVariant?.sku,
  }

  return <section className="grid gap-8 lg:grid-cols-[1.05fr_.95fr] lg:items-start">
    <div className="space-y-4">
      <div className="card overflow-hidden rounded-[2rem] p-3">
        <ProductImage src={activeImage || product.hero} alt={product.name} className="product-detail-img rounded-[1.5rem] opacity-95" />
      </div>
      <div className="grid grid-cols-4 gap-3 md:grid-cols-5">
        {gallery.slice(0,10).map((img,i)=><button key={`${img}-${i}`} onClick={()=>setActiveImage(img)} className={`card overflow-hidden rounded-2xl p-1 transition hover:border-white/25 ${activeImage===img?'border-white/35 ring-2 ring-white/20':'border-white/10'}`}>
          <ProductImage src={img} alt={`${product.name} view ${i+1}`} className="h-20 w-full rounded-xl object-cover opacity-80 md:h-24" />
        </button>)}
      </div>
    </div>
    <aside className="lg:sticky lg:top-24">
      <div className="card rounded-[2rem] p-6 md:p-8">
        <div className="mb-4 inline-flex rounded-full border border-white/10 bg-white/[.05] px-3 py-1 text-[11px] font-black uppercase tracking-wider text-white/60">{product.badge}</div>
        <h1 className="text-balance text-3xl font-black tracking-tight md:text-5xl">{product.name}</h1>
        <p className="mt-4 text-lg leading-8 text-white/58">{product.short}</p>
        <div className="mt-6 flex items-end gap-3"><span className="text-4xl font-black">€{product.price.toFixed(2)}</span>{product.compareAt&&<span className="pb-1 text-white/35 line-through">€{product.compareAt.toFixed(2)}</span>}</div>
        <div className="mt-5 flex items-center gap-2 text-sm text-white/55"><Star size={16} className="fill-white/80"/> Launch product • premium utility selection</div>

        {variants.length > 0 && <div className="mt-7">
          <label className="mb-2 block text-xs font-black uppercase tracking-[.25em] text-white/40">Uitvoering</label>
          <select value={selectedVariant?.sku || ''} onChange={(e)=>selectVariant(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/55 px-4 py-3 font-black text-white outline-none focus:border-white/30">
            {variants.map(v=><option key={v.sku} value={v.sku}>{v.name}</option>)}
          </select>
          <div className="mt-3 rounded-2xl border border-white/10 bg-white/[.035] p-3 text-xs leading-5 text-white/50">
            <strong className="text-white/75">SKU:</strong> {selectedVariant?.sku || 'Pending'}
            {typeof selectedVariant?.stock === 'number' && <><br/><strong className="text-white/75">Factory stock:</strong> ± {selectedVariant.stock.toLocaleString('nl-NL')}</>}
          </div>
        </div>}

        <div className="mt-7"><AddToCartButton product={cartProduct} /></div>
        <div className="mt-6 grid gap-3 text-sm text-white/62">
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[.035] p-4"><Lock size={18}/> Secure checkout ready</div>
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[.035] p-4"><Truck size={18}/> {product.shippingInfo}</div>
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[.035] p-4"><ShieldCheck size={18}/> Premium ASORTA supplier mapping</div>
        </div>
      </div>
    </aside>
  </section>
}
