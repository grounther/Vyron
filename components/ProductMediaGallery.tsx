
'use client'

import { useMemo, useState } from 'react'
import { Play, Star, Lock, Truck, ShieldCheck } from 'lucide-react'
import ProductImage from './ProductImage'
import AddToCartButton from './AddToCartButton'
import type { Product, ProductMedia, ProductVariant } from '@/lib/products'

function allMedia(product: Product, variant?: ProductVariant): ProductMedia[] {
  const base = product.media?.length ? product.media : [{ type:'image' as const, src: product.hero, alt: product.name }]
  if (!variant) return base
  const variantMedia = { type:'image' as const, src: variant.image, alt: `${product.name} ${variant.name}`, variantName: variant.name }
  const filtered = base.filter(m => m.src !== variant.image)
  return [variantMedia, ...filtered]
}

export default function ProductMediaGallery({ product }: { product: Product }) {
  const variants = product.variants || []
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(variants[0])
  const mediaList = useMemo(() => allMedia(product, selectedVariant), [product, selectedVariant])
  const [selectedMedia, setSelectedMedia] = useState<ProductMedia>(mediaList[0])

  function handleVariantChange(value: string) {
    const next = variants.find(v => v.name === value)
    setSelectedVariant(next)
    if (next) setSelectedMedia({ type:'image', src: next.image, alt: `${product.name} ${next.name}`, variantName: next.name })
  }

  function currentImage() {
    if (selectedMedia.type === 'image') return selectedMedia.src
    return selectedMedia.thumb || product.hero
  }

  const cartProduct = {
    slug: product.slug,
    name: product.name,
    price: selectedVariant?.price || product.price,
    hero: currentImage(),
    variantName: selectedVariant?.name,
    sku: selectedVariant?.sku,
  }

  return <section className="grid gap-8 lg:grid-cols-[1.05fr_.95fr] lg:items-start">
    <div className="space-y-4">
      <div className="card overflow-hidden rounded-[2rem] p-3">
        {selectedMedia.type === 'video' ? <video key={selectedMedia.src} src={selectedMedia.src} controls playsInline className="product-detail-img rounded-[1.5rem] bg-black object-contain" /> : <ProductImage src={selectedMedia.src} alt={selectedMedia.alt || product.name} className="product-detail-img rounded-[1.5rem] bg-white/5 object-contain opacity-95"/>}
      </div>
      <div className="grid grid-cols-4 gap-3 sm:grid-cols-5 lg:grid-cols-5">
        {mediaList.map((m,i)=>{
          const active = selectedMedia.src === m.src
          return <button key={`${m.src}-${i}`} type="button" onClick={()=>setSelectedMedia(m)} className={`media-thumb relative overflow-hidden rounded-2xl border p-1 transition duration-200 ${active?'border-[#b7c8ad] shadow-[0_0_0_2px_rgba(183,200,173,.32),0_16px_45px_rgba(91,102,83,.25)]':'border-white/10 hover:border-[#b7c8ad]/60'}`}>
            <ProductImage src={m.thumb || m.src} alt={m.alt || product.name} className="h-20 w-full rounded-xl bg-white/5 object-cover opacity-90 md:h-24"/>
            {m.type === 'video' && <span className="absolute inset-0 grid place-items-center bg-black/30"><span className="grid h-10 w-10 place-items-center rounded-full bg-white text-black shadow-lg"><Play size={18} fill="black"/></span></span>}
          </button>
        })}
      </div>
    </div>
    <aside className="lg:sticky lg:top-24">
      <div className="card rounded-[2rem] p-6 md:p-8">
        <div className="mb-4 inline-flex rounded-full border border-white/10 bg-white/[.05] px-3 py-1 text-[11px] font-black uppercase tracking-wider text-white/60">{product.badge}</div>
        <h1 className="text-balance text-3xl font-black tracking-tight md:text-5xl">{product.name}</h1>
        <p className="mt-4 text-lg leading-8 text-white/58">{product.short}</p>
        <div className="mt-6 flex items-end gap-3"><span className="text-4xl font-black">€{(selectedVariant?.price || product.price).toFixed(2)}</span>{product.compareAt&&<span className="pb-1 text-white/35 line-through">€{product.compareAt.toFixed(2)}</span>}</div>
        <div className="mt-5 flex items-center gap-2 text-sm text-white/55"><Star size={16} className="fill-white/80"/> Launch product • premium utility selection</div>
        {variants.length > 0 && <div className="mt-7">
          <label className="kicker">Uitvoering</label>
          <select value={selectedVariant?.name} onChange={(e)=>handleVariantChange(e.target.value)} className="mt-3 w-full rounded-2xl border border-white/15 bg-black/45 px-4 py-4 font-black text-white outline-none focus:border-[#b7c8ad]">
            {variants.map(v => <option key={v.sku} value={v.name}>{v.name}</option>)}
          </select>
          {selectedVariant && <div className="mt-3 rounded-2xl border border-white/10 bg-white/[.035] p-4 text-xs leading-5 text-white/55">
            <strong className="text-white">SKU:</strong> {selectedVariant.sku}<br/>
            <strong className="text-white">Factory stock:</strong> ± {(selectedVariant.factoryStock || 0).toLocaleString('nl-NL')}
          </div>}
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
