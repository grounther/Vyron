'use client'

import { useEffect, useMemo, useState } from 'react'
import ProductCard from './ProductCard'
import { categories, Product } from '@/lib/products'
import { getDictionary, normalizeLocale, type Locale } from '@/lib/i18n/config'
import { Search, SlidersHorizontal } from 'lucide-react'

function readLocale(): Locale {
  if (typeof document === 'undefined') return 'nl'
  const match = document.cookie.match(/(?:^|; )asorta_lang=([^;]+)/)
  return normalizeLocale(match ? decodeURIComponent(match[1]) : localStorage.getItem('asorta_lang'))
}

function matches(p:Product, q:string){
  const fields = [p.name, p.category, p.badge, p.short, p.description, ...(p.features || []), ...(p.specs || [])].filter((field): field is string => typeof field === 'string')
  return fields.join(' ').toLowerCase().includes(q.toLowerCase())
}

export default function ShopClient({products}:{products:Product[]}){
  const [query,setQuery]=useState('')
  const [category,setCategory]=useState('all')
  const [sort,setSort]=useState('featured')
  const [max,setMax]=useState('all')
  const [locale,setLocale]=useState<Locale>('nl')

  useEffect(() => {
    const update = (event?: Event) => setLocale(normalizeLocale((event as CustomEvent<Locale> | undefined)?.detail || readLocale()))
    update()
    window.addEventListener('asorta-language-change', update as EventListener)
    return () => window.removeEventListener('asorta-language-change', update as EventListener)
  }, [])

  const dict = getDictionary(locale)
  const filtered=useMemo(()=>{
    let list=products.filter(p=>category==='all'||p.category===category)
    if(query.trim()) list=list.filter(p=>matches(p,query.trim()))
    if(max!=='all') list=list.filter(p=>p.price<=Number(max))
    if(sort==='price-low') list=[...list].sort((a,b)=>a.price-b.price)
    if(sort==='price-high') list=[...list].sort((a,b)=>b.price-a.price)
    if(sort==='margin') list=[...list].sort((a,b)=>(b.price-(b.cost || 0))-(a.price-(a.cost || 0)))
    if(sort==='featured') list=[...list].sort((a,b)=>Number(Boolean(b.compareAt))-Number(Boolean(a.compareAt)))
    return list
  },[products,query,category,sort,max])

  return <section className="mt-6 sm:mt-8">
    <div className="card rounded-[1.45rem] p-3.5 sm:rounded-[1.8rem] sm:p-5">
      <div className="grid gap-3 lg:grid-cols-[1fr_220px_190px_170px]">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/35" size={18}/>
          <input value={query} onChange={e=>setQuery(e.target.value)} placeholder={dict.shop.searchPlaceholder} className="h-12 w-full rounded-2xl border border-white/10 bg-black/40 pl-11 pr-4 text-sm font-bold text-white outline-none transition placeholder:text-white/28 focus:border-white/25 sm:rounded-full"/>
        </label>
        <select value={category} onChange={e=>setCategory(e.target.value)} className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-sm font-black text-white outline-none focus:border-white/25 sm:rounded-full">
          <option value="all">{dict.shop.allCategories}</option>
          {categories.map(c=><option key={c.slug} value={c.slug}>{dict.categories[c.slug as keyof typeof dict.categories]?.name || c.name}</option>)}
        </select>
        <select value={sort} onChange={e=>setSort(e.target.value)} className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-sm font-black text-white outline-none focus:border-white/25 sm:rounded-full">
          <option value="featured">{dict.shop.featured}</option>
          <option value="price-low">{dict.shop.priceLow}</option>
          <option value="price-high">{dict.shop.priceHigh}</option>
          <option value="margin">{dict.shop.margin}</option>
        </select>
        <select value={max} onChange={e=>setMax(e.target.value)} className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-sm font-black text-white outline-none focus:border-white/25 sm:rounded-full">
          <option value="all">{dict.shop.allPrices}</option>
          <option value="35">{dict.shop.under}35</option>
          <option value="50">{dict.shop.under}50</option>
          <option value="75">{dict.shop.under}75</option>
        </select>
      </div>
      <div className="mt-4 flex items-center gap-2 text-xs font-black uppercase tracking-[.16em] text-white/35 sm:tracking-[.2em]"><SlidersHorizontal size={14}/> {filtered.length} {dict.shop.productsFound}</div>
    </div>
    {filtered.length ? <div className="mt-6 grid grid-cols-2 gap-3 sm:mt-8 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">{filtered.map(p=><ProductCard key={p.slug} p={p}/>)}</div> : <div className="card mt-8 rounded-[1.8rem] p-8 text-center"><h3 className="text-2xl font-black">{dict.shop.noProductsTitle}</h3><p className="mt-3 text-white/55">{dict.shop.noProductsText}</p></div>}
  </section>
}
