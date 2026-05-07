import Link from 'next/link'
import { Product } from '@/lib/products'
import { ArrowUpRight } from 'lucide-react'

export default function ProductCard({p}:{p:Product}){
  return <Link href={`/product/${p.slug}`} className="card group relative block overflow-hidden rounded-[1.7rem] transition duration-300 hover:-translate-y-1 hover:border-white/25 hover:shadow-[0_30px_100px_rgba(91,102,83,.16)]">
    <div className="absolute left-4 top-4 z-10 rounded-full border border-white/10 bg-black/55 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white/70 backdrop-blur">{p.badge}</div>
    <div className="overflow-hidden bg-white/[.03]"><img src={p.hero} alt={p.name} className="product-img opacity-80 transition duration-700 group-hover:scale-110 group-hover:opacity-100"/></div>
    <div className="p-4 md:p-5">
      <div className="mb-3 text-[11px] font-black uppercase tracking-[.24em] text-white/35">{p.category.replace('-',' ')}</div>
      <h3 className="line-clamp-2 min-h-[3.1rem] text-base font-black leading-tight md:text-lg">{p.name}</h3>
      <p className="mt-2 line-clamp-2 min-h-[2.5rem] text-sm leading-5 text-white/55">{p.short}</p>
      <div className="mt-5 flex items-end justify-between gap-3">
        <div><span className="text-lg font-black md:text-xl">€{p.price.toFixed(2)}</span>{p.compareAt&&<span className="ml-2 text-xs text-white/35 line-through">€{p.compareAt.toFixed(2)}</span>}</div>
        <span className="grid h-10 w-10 place-items-center rounded-full bg-white text-black transition group-hover:rotate-45"><ArrowUpRight size={18}/></span>
      </div>
    </div>
  </Link>
}
