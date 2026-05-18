'use client'

import Link from 'next/link'
import { Product } from '@/lib/products'
import { ArrowUpRight } from 'lucide-react'
import ProductImage from './ProductImage'
import { trackSelectItem } from '@/lib/analytics-client'

export default function ProductCard({p}:{p:Product}){
  const showCompareAt = typeof p.compareAt === 'number' && p.compareAt > p.price
  return <Link href={`/product/${p.slug}`} onClick={() => trackSelectItem({ item_id: p.shopifyVariantLegacyId || p.shopifyVariantId || p.slug, item_name: p.name, item_category: p.category, price: p.price, quantity: 1 })} className="card group relative block h-full overflow-hidden rounded-[1.35rem] transition duration-300 hover:-translate-y-1 hover:border-white/25 hover:shadow-[0_30px_100px_rgba(91,102,83,.16)] sm:rounded-[1.7rem]">
    {p.badge && <div className="absolute left-3 top-3 z-10 rounded-full border border-white/10 bg-black/55 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-white/70 backdrop-blur sm:left-4 sm:top-4 sm:px-3 sm:text-[10px]">{p.badge}</div>}
    <div className="overflow-hidden bg-white/[.03]"><ProductImage src={p.hero} alt={p.name} className="product-img opacity-90 transition duration-700 group-hover:scale-110 group-hover:opacity-100"/></div>
    <div className="p-3.5 sm:p-4 md:p-5">
      <div className="mb-2 text-[10px] font-black uppercase tracking-[.20em] text-white/35 sm:mb-3 sm:text-[11px] sm:tracking-[.24em]">{p.category.replace('-',' ')}</div>
      <h3 className="line-clamp-2 min-h-[2.65rem] text-[15px] font-black leading-tight sm:min-h-[3.1rem] sm:text-base md:text-lg">{p.name}</h3>
      <p className="mt-2 line-clamp-2 min-h-[2.35rem] text-xs leading-5 text-white/55 sm:text-sm">{p.short}</p>
      <div className="mt-4 flex items-end justify-between gap-2 sm:mt-5 sm:gap-3">
        <div className="min-w-0"><span className="text-lg font-black md:text-xl">€{p.price.toFixed(2)}</span>{showCompareAt&&<span className="ml-2 text-xs text-white/35 line-through">€{p.compareAt!.toFixed(2)}</span>}</div>
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-black transition group-hover:rotate-45 sm:h-10 sm:w-10"><ArrowUpRight size={18}/></span>
      </div>
    </div>
  </Link>
}
