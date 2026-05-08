'use client'

import { useMemo, useState } from 'react'
import ProductCard from './ProductCard'
import { categories, Product } from '@/lib/products'
import { Search, SlidersHorizontal } from 'lucide-react'

function matches(p:Product, q:string){
  const haystack=[p.name,p.category,p.badge,p.short,p.description,...p.features,...p.specs].join(' ').toLowerCase()
  return haystack.includes(q.toLowerCase())
}

export default function ShopClient({products}:{products:Product[]}){
  const [query,setQuery]=useState('')
  const [category,setCategory]=useState('all')
  const [sort,setSort]=useState('featured')
  const [max,setMax]=useState('all')

  const filtered=useMemo(()=>{
    let list=products.filter(p=>category==='all'||p.category===category)
    if(query.trim()) list=list.filter(p=>matches(p,query.trim()))
    if(max!=='all') list=list.filter(p=>p.price<=Number(max))
    if(sort==='price-low') list=[...list].sort((a,b)=>a.price-b.price)
    if(sort==='price-high') list=[...list].sort((a,b)=>b.price-a.price)
    if(sort==='margin') list=[...list].sort((a,b)=>(b.price-b.cost)-(a.price-a.cost))
    if(sort==='featured') list=[...list].sort((a,b)=>Number(Boolean(b.compareAt))-Number(Boolean(a.compareAt)))
    return list
  },[products,query,category,sort,max])

  return <section className="mt-8">
    <div className="card rounded-[1.8rem] p-4 md:p-5">
      <div className="grid gap-3 lg:grid-cols-[1fr_220px_190px_170px]">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/35" size={18}/>
          <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search ASORTA products..." className="h-12 w-full rounded-full border border-white/10 bg-black/40 pl-11 pr-4 text-sm font-bold text-white outline-none transition placeholder:text-white/28 focus:border-white/25"/>
        </label>
        <select value={category} onChange={e=>setCategory(e.target.value)} className="h-12 rounded-full border border-white/10 bg-black/40 px-4 text-sm font-black text-white outline-none focus:border-white/25">
          <option value="all">All categories</option>
          {categories.map(c=><option key={c.slug} value={c.slug}>{c.name}</option>)}
        </select>
        <select value={sort} onChange={e=>setSort(e.target.value)} className="h-12 rounded-full border border-white/10 bg-black/40 px-4 text-sm font-black text-white outline-none focus:border-white/25">
          <option value="featured">Featured</option>
          <option value="price-low">Price low-high</option>
          <option value="price-high">Price high-low</option>
          <option value="margin">Margin potential</option>
        </select>
        <select value={max} onChange={e=>setMax(e.target.value)} className="h-12 rounded-full border border-white/10 bg-black/40 px-4 text-sm font-black text-white outline-none focus:border-white/25">
          <option value="all">All prices</option>
          <option value="35">Under €35</option>
          <option value="50">Under €50</option>
          <option value="75">Under €75</option>
        </select>
      </div>
      <div className="mt-4 flex items-center gap-2 text-xs font-black uppercase tracking-[.2em] text-white/35"><SlidersHorizontal size={14}/> {filtered.length} products found</div>
    </div>
    {filtered.length ? <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{filtered.map(p=><ProductCard key={p.slug} p={p}/>)}</div> : <div className="card mt-8 rounded-[1.8rem] p-8 text-center"><h3 className="text-2xl font-black">No products found.</h3><p className="mt-3 text-white/55">Try another category, keyword or price filter.</p></div>}
  </section>
}
