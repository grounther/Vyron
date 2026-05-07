'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Menu, Search, ShoppingCart, X } from 'lucide-react'

const links = [
  ['Shop','/shop'], ['Tactical','/category/tactical'], ['Automotive','/category/automotive'], ['Desk Setup','/category/desk-setup'], ['Gaming','/category/gaming'], ['Smart Utility','/category/smart-utility']
]

function getCartCount(){
  if(typeof window==='undefined') return 0
  try{
    const items = JSON.parse(localStorage.getItem('vyron_cart') || '[]')
    return items.reduce((sum:number,item:any)=>sum + Number(item.qty || 0),0)
  }catch{ return 0 }
}

export default function Header(){
  const [count,setCount] = useState(0)
  const [open,setOpen] = useState(false)

  useEffect(()=>{
    const update=()=>setCount(getCartCount())
    update()
    window.addEventListener('vyron-cart', update)
    window.addEventListener('storage', update)
    return ()=>{
      window.removeEventListener('vyron-cart', update)
      window.removeEventListener('storage', update)
    }
  },[])

  return <header className="glass sticky top-0 z-50">
    <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
      <Link href="/" className="group flex items-center gap-3" onClick={()=>setOpen(false)}>
        <span className="font-black tracking-[.38em] text-white/90">VYRON</span>
      </Link>
      <nav className="hidden items-center gap-7 text-sm font-bold text-white/60 lg:flex">
        {links.map(([label,href])=><Link key={href} href={href} className="transition hover:text-white">{label}</Link>)}
      </nav>
      <div className="flex items-center gap-2">
        <Link href="/search" className="rounded-full border border-white/10 p-2.5 text-white/70 transition hover:bg-white/10" aria-label="Search"><Search size={18}/></Link>
        <Link href="/cart" className="relative inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-zinc-950 shadow-[0_10px_40px_rgba(255,255,255,.12)] transition hover:-translate-y-0.5 hover:bg-zinc-100">
          <ShoppingCart size={17}/> <span className="hidden sm:inline text-zinc-950">Cart</span>
          {count>0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#5B6653] px-1 text-[11px] font-black text-white ring-2 ring-black">{count}</span>}
        </Link>
        <button onClick={()=>setOpen(v=>!v)} className="rounded-full border border-white/10 p-2.5 text-white/70 lg:hidden" aria-label="Menu">{open?<X size={18}/>:<Menu size={18}/>}</button>
      </div>
    </div>
    {open && <div className="border-t border-white/10 bg-black/92 px-4 py-4 lg:hidden">
      <nav className="mx-auto grid max-w-7xl gap-2">
        {links.map(([label,href])=><Link key={href} href={href} onClick={()=>setOpen(false)} className="rounded-2xl border border-white/10 bg-white/[.035] px-4 py-3 text-sm font-black text-white/75">{label}</Link>)}
      </nav>
    </div>}
  </header>
}
