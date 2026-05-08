'use client'

import { useMemo, useState } from 'react'
import ProductCard from './ProductCard'
import { Product } from '@/lib/products'
import { Search } from 'lucide-react'

function score(p:Product,q:string){
  const s=q.toLowerCase()
  const fields=[p.name,p.category,p.badge,p.short,p.description,...p.features,...p.specs]
  return fields.reduce((total,f)=>total+(f.toLowerCase().includes(s)?1:0),0)
}

export default function SearchClient({products}:{products:Product[]}){
  const [query,setQuery]=useState('')
  const results=useMemo(()=>{
    const q=query.trim()
    if(!q) return products.slice(0,8)
    return products.map(p=>({p,score:score(p,q)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).map(x=>x.p)
  },[query,products])
  return <main className="mx-auto max-w-7xl px-5 py-12">
    <section className="card rounded-[2rem] p-8 md:p-12">
      <p className="kicker">Search</p><h1 className="mt-3 text-4xl font-black md:text-6xl">Find your utility.</h1><p className="mt-4 max-w-2xl text-white/55">Live product search voor de ASORTA launch catalog.</p>
      <label className="relative mt-8 block max-w-2xl"><Search className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-white/35"/><input autoFocus value={query} onChange={e=>setQuery(e.target.value)} placeholder="Try: car, desk, wallet, light, gaming..." className="h-14 w-full rounded-full border border-white/10 bg-black/45 pl-14 pr-5 text-base font-bold outline-none transition placeholder:text-white/28 focus:border-white/25"/></label>
    </section>
    <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{results.map(p=><ProductCard key={p.slug} p={p}/>)}</div>
  </main>
}
