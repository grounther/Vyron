'use client'

import { useMemo, useState } from 'react'
import { Play, Check } from 'lucide-react'
import ProductImage from './ProductImage'
import AddToCartButton from './AddToCartButton'
import type { Product, ProductVariant } from '@/lib/products'

type Media = {
  type: 'image' | 'video'
  src: string
  poster?: string
  label?: string
}

export default function ProductMediaGallery({ product }: { product: Product }) {
  const variants = product.variants || []
  const [selectedVariantName, setSelectedVariantName] = useState(variants[0]?.name || '')

  const selectedVariant: ProductVariant | undefined = variants.find(v => v.name === selectedVariantName) || variants[0]

  const media = useMemo<Media[]>(() => {
    const variantMedia = variants.map(v => ({ type: 'image' as const, src: v.image, label: v.name }))
    const imageMedia = (product.images || [product.hero]).map((src, index) => ({ type: 'image' as const, src, label: index === 0 ? 'Main' : `View ${index + 1}` }))
    const videoMedia = (product.videos || []).map(video => ({ type: 'video' as const, src: video.src, poster: video.poster || selectedVariant?.image || product.hero, label: video.label || 'Video' }))
    const seen = new Set<string>()
    return [...variantMedia, ...imageMedia, ...videoMedia].filter(item => {
      const key = `${item.type}:${item.src}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }, [product.hero, product.images, product.videos, variants, selectedVariant?.image])

  const [selectedMedia, setSelectedMedia] = useState<Media>(() => ({ type: 'image', src: selectedVariant?.image || product.hero, label: selectedVariant?.name || 'Main' }))

  function onVariantChange(name: string) {
    setSelectedVariantName(name)
    const variant = variants.find(v => v.name === name)
    if (variant) setSelectedMedia({ type: 'image', src: variant.image, label: variant.name })
  }

  const cartImage = selectedMedia.type === 'image' ? selectedMedia.src : (selectedMedia.poster || selectedVariant?.image || product.hero)
  const cartName = selectedVariant ? `${product.name} - ${selectedVariant.name}` : product.name
  const cartSlug = selectedVariant ? `${product.slug}__${selectedVariant.sku}` : product.slug

  return <div className="grid gap-8 lg:grid-cols-[1.05fr_.95fr] lg:items-start">
    <div className="space-y-4">
      <div className="card overflow-hidden rounded-[2rem] p-3">
        {selectedMedia.type === 'video' ? (
          <video key={selectedMedia.src} controls playsInline poster={selectedMedia.poster} className="product-detail-img rounded-[1.5rem] bg-black object-contain">
            <source src={selectedMedia.src} type="video/mp4" />
          </video>
        ) : (
          <ProductImage src={selectedMedia.src} alt={product.name} className="product-detail-img rounded-[1.5rem] opacity-95" />
        )}
      </div>

      <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
        {media.map((item, i) => {
          const active = item.src === selectedMedia.src && item.type === selectedMedia.type
          return <button key={`${item.type}-${item.src}-${i}`} type="button" onClick={() => setSelectedMedia(item)} className={`group relative overflow-hidden rounded-2xl border p-1.5 transition duration-200 hover:-translate-y-[2px] hover:scale-[1.025] hover:shadow-[0_0_0_2px_rgba(183,200,173,.42),0_18px_48px_rgba(91,102,83,.18)] ${active ? 'border-[#b7c8ad] bg-[#b7c8ad]/10 shadow-[0_0_0_2px_rgba(183,200,173,.22)]' : 'border-white/10 bg-white/[.035]'}`} aria-label={`Show ${item.label || item.type}`}>
            {item.type === 'video' ? <>
              <ProductImage src={item.poster || product.hero} alt="Product video" className="h-20 w-full rounded-xl object-cover opacity-70 md:h-24" />
              <span className="absolute inset-0 grid place-items-center bg-black/25"><span className="grid h-9 w-9 place-items-center rounded-full bg-white text-black shadow-xl"><Play size={18} fill="currentColor" /></span></span>
            </> : <ProductImage src={item.src} alt={item.label || product.name} className="h-20 w-full rounded-xl object-cover opacity-80 transition group-hover:opacity-100 md:h-24" />}
          </button>
        })}
      </div>
    </div>

    <aside className="lg:sticky lg:top-24">
      <div className="card rounded-[2rem] p-6 md:p-8">
        <div className="mb-4 inline-flex rounded-full border border-white/10 bg-white/[.05] px-3 py-1 text-[11px] font-black uppercase tracking-wider text-white/60">{product.badge && !/shopify|dsers|cj/i.test(product.badge) ? product.badge : 'New Arrival'}</div>
        <h1 className="text-balance text-3xl font-black tracking-tight md:text-5xl">{product.name}</h1>
        <p className="mt-4 text-lg leading-8 text-white/58">{product.short}</p>

        {variants.length > 0 && <div className="mt-6">
          <label className="text-xs font-black uppercase tracking-[.22em] text-white/40">Uitvoering</label>
          <select value={selectedVariantName} onChange={e => onVariantChange(e.target.value)} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/70 px-4 py-3 text-sm font-black text-white outline-none transition focus:border-[#b7c8ad]">
            {variants.map(v => <option key={v.sku} value={v.name}>{v.name}</option>)}
          </select>
          {selectedVariant && <div className="mt-3 grid gap-2 rounded-2xl border border-white/10 bg-white/[.035] p-4 text-xs text-white/55">
            <div className="flex items-center gap-2"><Check size={14} className="text-[#b7c8ad]"/> SKU: {selectedVariant.sku}</div>
            {typeof selectedVariant.stock === 'number' && <div>Beschikbaar</div>}
          </div>}
        </div>}

        <div className="mt-6 flex items-end gap-3"><span className="text-4xl font-black">€{product.price.toFixed(2)}</span>{typeof product.compareAt === 'number' && product.compareAt > product.price && <span className="pb-1 text-white/35 line-through">€{product.compareAt.toFixed(2)}</span>}</div>
        <div className="mt-7"><AddToCartButton product={{slug:cartSlug,name:cartName,price:product.price,hero:cartImage,variant:selectedVariant?.name,sku:selectedVariant?.sku}} /></div>
        <div className="mt-6 grid gap-3 text-sm text-white/62">
          <div className="rounded-2xl border border-white/10 bg-white/[.035] p-4">Secure checkout ready</div>
          <div className="rounded-2xl border border-white/10 bg-white/[.035] p-4">Tracked shipping</div>
          <div className="rounded-2xl border border-white/10 bg-white/[.035] p-4">Support available</div>
        </div>
      </div>
    </aside>
  </div>
}
