'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react'
import type { Product } from '@/lib/products'
import ProductImage from './ProductImage'

type HotDealsCarouselProps = {
  products: Product[]
}

export default function HotDealsCarousel({ products }: HotDealsCarouselProps) {
  const items = useMemo(() => products.filter(Boolean).slice(0, 6), [products])
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (items.length <= 1) return
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % items.length)
    }, 4800)
    return () => window.clearInterval(timer)
  }, [items.length])

  useEffect(() => {
    if (!items.length) setIndex(0)
    if (index >= items.length && items.length) setIndex(0)
  }, [index, items.length])

  if (!items.length) {
    return (
      <div className="rounded-[2rem] border border-white/10 bg-black/30 p-6 backdrop-blur sm:p-8">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#7aa6b8] shadow-[0_0_16px_rgba(122,166,184,.7)]" />
          <p className="kicker">Hot Deals</p>
        </div>
        <h3 className="mt-3 text-2xl font-black text-white sm:text-3xl">Voeg je eerste deals toe</h3>
        <p className="mt-3 max-w-xl text-sm leading-7 text-white/60 sm:text-base">Zodra je actieve producten met afbeelding en prijs toevoegt, verschijnen ze hier automatisch als slideshow.</p>
      </div>
    )
  }

  const current = items[index]
  const showCompareAt = typeof current.compareAt === 'number' && current.compareAt > current.price
  const currentPrice = `€${current.price.toFixed(2)}`
  const compareAtPrice = showCompareAt ? `€${current.compareAt!.toFixed(2)}` : null

  return (
    <div className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,.05),rgba(255,255,255,.02))] p-4 shadow-[0_40px_100px_rgba(0,0,0,.35)] backdrop-blur sm:p-5">
      <div className="flex items-center justify-between gap-4 px-2 pb-4 pt-1 sm:px-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#f6d36c] shadow-[0_0_16px_rgba(246,211,108,.8)]" />
            <p className="kicker">Hot Deals</p>
          </div>
          <h3 className="mt-2 text-2xl font-black text-white sm:text-3xl">Direct uit voorraad</h3>
        </div>
        <div className="hidden items-center gap-2 sm:flex">
          <button
            type="button"
            aria-label="Vorige deal"
            onClick={() => setIndex((currentIndex) => (currentIndex - 1 + items.length) % items.length)}
            className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/[.04] text-white/65 transition hover:border-white/25 hover:bg-white/[.08] hover:text-white"
          >
            <ArrowLeft size={18} />
          </button>
          <button
            type="button"
            aria-label="Volgende deal"
            onClick={() => setIndex((currentIndex) => (currentIndex + 1) % items.length)}
            className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/[.04] text-white/65 transition hover:border-white/25 hover:bg-white/[.08] hover:text-white"
          >
            <ArrowRight size={18} />
          </button>
        </div>
      </div>

      <Link href={`/product/${current.slug}`} className="group block overflow-hidden rounded-[1.7rem] border border-white/10 bg-black/35 transition hover:-translate-y-1 hover:border-white/20">
        <div className="grid min-h-[420px] lg:grid-cols-[1.02fr_.98fr]">
          <div className="relative min-h-[240px] overflow-hidden bg-white/[.04]">
            <ProductImage src={current.hero} alt={current.name} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,.08),rgba(0,0,0,.34))]" />
            {current.badge ? <div className="absolute left-4 top-4 rounded-full border border-white/10 bg-black/55 px-3 py-1 text-[10px] font-black uppercase tracking-[.18em] text-white/70">{current.badge}</div> : null}
          </div>

          <div className="flex flex-col justify-between p-5 sm:p-6 lg:p-7">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[.22em] text-white/38">{current.category.replaceAll('-', ' ')}</div>
              <h4 className="mt-3 text-2xl font-black leading-tight text-white sm:text-3xl">{current.name}</h4>
              <p className="mt-3 line-clamp-4 text-sm leading-7 text-white/62 sm:text-base">{current.short || 'Beschikbaar uit eigen voorraad. Bekijk de deal voor details, prijs en beschikbaarheid.'}</p>
            </div>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-3xl font-black text-white">{currentPrice}</span>
                  {compareAtPrice ? <span className="text-base text-white/35 line-through">{compareAtPrice}</span> : null}
                </div>
                <p className="mt-2 text-xs uppercase tracking-[.18em] text-emerald-200/70">Eigen voorraad • snel leverbaar</p>
              </div>

              <div className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black text-black transition group-hover:translate-x-1">
                Bekijk deal <ArrowUpRight size={18} />
              </div>
            </div>
          </div>
        </div>
      </Link>

      {items.length > 1 ? (
        <div className="mt-4 flex items-center justify-between gap-4 px-2 sm:px-3">
          <div className="flex items-center gap-2">
            {items.map((item, dotIndex) => (
              <button
                key={item.slug}
                type="button"
                aria-label={`Ga naar deal ${dotIndex + 1}`}
                onClick={() => setIndex(dotIndex)}
                className={`h-2.5 rounded-full transition ${dotIndex === index ? 'w-8 bg-white' : 'w-2.5 bg-white/22 hover:bg-white/45'}`}
              />
            ))}
          </div>
          <div className="flex items-center gap-2 sm:hidden">
            <button
              type="button"
              aria-label="Vorige deal"
              onClick={() => setIndex((currentIndex) => (currentIndex - 1 + items.length) % items.length)}
              className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/[.04] text-white/65"
            >
              <ArrowLeft size={16} />
            </button>
            <button
              type="button"
              aria-label="Volgende deal"
              onClick={() => setIndex((currentIndex) => (currentIndex + 1) % items.length)}
              className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/[.04] text-white/65"
            >
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
