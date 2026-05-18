'use client'

import { useEffect, useMemo, useState } from 'react'
import { Lock, Play, ShieldCheck, ShoppingCart, Star, Truck } from 'lucide-react'
import AddToCartButton from './AddToCartButton'
import ProductImage from './ProductImage'
import type { Product, ProductVariant } from '@/lib/products'

type MediaItem = {
  type: 'image' | 'video'
  src: string
  poster?: string
  title: string
}

export default function ProductPurchasePanel({ product }: { product: Product }) {
  const variants = product.variants || []
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(variants[0])

  const gallery = useMemo<MediaItem[]>(() => {
    const base = product.images?.length ? product.images : [product.hero]
    const variantImage = selectedVariant?.image
    const orderedImages = variantImage ? [variantImage, ...base.filter((img) => img !== variantImage)] : base

    const imageMedia = orderedImages.map((img, index) => ({
      type: 'image' as const,
      src: img,
      title: index === 0 && selectedVariant ? `${product.name} - ${selectedVariant.name}` : `${product.name} view ${index + 1}`,
    }))

    const videoMedia = (product.videos || []).map((video) => ({
      type: 'video' as const,
      src: video.src,
      poster: video.poster || selectedVariant?.image || product.hero,
      title: video.title || video.label || "Product video",
    }))

    // Put videos early in the gallery so they are always visible, but keep
    // the selected variant image as the first/main media.
    return [
      ...imageMedia.slice(0, 3),
      ...videoMedia,
      ...imageMedia.slice(3),
    ]
  }, [product, selectedVariant])

  const [activeMedia, setActiveMedia] = useState<MediaItem>(gallery[0] || { type: 'image', src: product.hero, title: product.name })

  useEffect(() => {
    setActiveMedia(gallery[0] || { type: 'image', src: product.hero, title: product.name })
  }, [gallery, product.hero, product.name])

  function selectVariant(sku: string) {
    const next = variants.find((v) => v.sku === sku)
    setSelectedVariant(next)
    if (next?.image) {
      setActiveMedia({ type: 'image', src: next.image, title: `${product.name} ${next.name}` })
    }
  }

  const cartProduct = {
    slug: product.slug,
    name: product.name,
    price: selectedVariant?.price || product.price,
    hero: activeMedia.type === 'image' ? activeMedia.src : product.hero,
    variantName: selectedVariant?.name,
    variantSku: selectedVariant?.sku,
    shopifyVariantId: selectedVariant?.shopifyVariantId,
    shopifyVariantLegacyId: selectedVariant?.shopifyVariantLegacyId,
  }

  return <section className="grid gap-8 lg:grid-cols-[1.05fr_.95fr] lg:items-start">
    <div className="space-y-4">
      <div className="card overflow-hidden rounded-[2rem] p-3">
        {activeMedia.type === 'video' ? (
          <video
            key={activeMedia.src}
            src={activeMedia.src}
            poster={activeMedia.poster}
            controls
            playsInline
            preload="metadata"
            className="product-detail-img rounded-[1.5rem] bg-black object-cover opacity-95"
          />
        ) : (
          <ProductImage src={activeMedia.src || product.hero} alt={product.name} className="product-detail-img rounded-[1.5rem] opacity-95" />
        )}
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 md:grid md:grid-cols-5 md:overflow-visible">
        {gallery.map((media,i)=>{
          const active = activeMedia.src === media.src && activeMedia.type === media.type
          const thumb = media.type === 'video' ? (media.poster || product.hero) : media.src
          return <button
            key={`${media.type}-${media.src}-${i}`}
            onClick={()=>setActiveMedia(media)}
            className={`card relative min-w-24 overflow-hidden rounded-2xl p-1 transition duration-200 focus:outline-none hover:-translate-y-[2px] hover:scale-[1.025] hover:border-white/25 hover:shadow-[0_0_26px_rgba(183,200,173,.16)] ${active?'border-[#b7c8ad]/70 ring-2 ring-[#b7c8ad]/35 shadow-[0_0_24px_rgba(183,200,173,.12)]':'border-white/10'}`}
            aria-label={media.type === 'video' ? `Play ${media.title}` : `Show ${media.title}`}
          >
            <ProductImage src={thumb} alt={media.title} className="h-20 w-full rounded-xl object-cover opacity-80 md:h-24" />
            {media.type === 'video' && <span className="absolute inset-1 grid place-items-center rounded-xl bg-black/35">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-white text-black shadow-[0_12px_30px_rgba(0,0,0,.45)]"><Play size={18} className="ml-0.5 fill-black" /></span>
            </span>}
          </button>
        })}
      </div>
    </div>
    <aside className="lg:sticky lg:top-24">
      <div className="card rounded-[2rem] p-6 md:p-8">
        <div className="mb-4 inline-flex rounded-full border border-white/10 bg-white/[.05] px-3 py-1 text-[11px] font-black uppercase tracking-wider text-white/60">{product.badge && !/shopify|dsers|cj/i.test(product.badge) ? product.badge : 'New Arrival'}</div>
        <h1 className="text-balance text-3xl font-black tracking-tight md:text-5xl">{product.name}</h1>
        <p className="mt-4 text-lg leading-8 text-white/58">{product.short}</p>
        <div className="mt-6 flex items-end gap-3"><span className="text-4xl font-black">€{product.price.toFixed(2)}</span>{typeof product.compareAt === 'number' && product.compareAt > product.price && <span className="pb-1 text-white/35 line-through">€{product.compareAt.toFixed(2)}</span>}</div>
        <div className="mt-5 flex items-center gap-2 text-sm text-white/55"><Star size={16} className="fill-white/80"/> Launch product • premium utility selection</div>

        {variants.length > 0 && <div className="mt-7">
          <label className="mb-2 block text-xs font-black uppercase tracking-[.25em] text-white/40">Uitvoering</label>
          <select value={selectedVariant?.sku || ''} onChange={(e)=>selectVariant(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/55 px-4 py-3 font-black text-white outline-none focus:border-white/30">
            {variants.map(v=><option key={v.sku} value={v.sku}>{v.name}</option>)}
          </select>
          <div className="mt-3 rounded-2xl border border-white/10 bg-white/[.035] p-3 text-xs leading-5 text-white/50">
            <strong className="text-white/75">SKU:</strong> {selectedVariant?.sku || 'Pending'}
            {typeof selectedVariant?.stock === 'number' && <><br/><strong className="text-white/75">Beschikbaarheid:</strong> Op voorraad</>}
          </div>
        </div>}

        <div className="mt-7"><AddToCartButton product={cartProduct} /></div>
        <div className="mt-6 grid gap-3 text-sm text-white/62">
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[.035] p-4"><Lock size={18}/> Veilige checkout</div>
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[.035] p-4"><Truck size={18}/> {product.shippingInfo}</div>
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[.035] p-4"><ShieldCheck size={18}/> Support bij vragen over je bestelling</div>
        </div>
      </div>
    </aside>
  </section>
}
