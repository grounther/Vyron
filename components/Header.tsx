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
        <Link href="/cart" className="relative inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-black shadow-[0_10px_40px_rgba(255,255,255,.14)] ring-1 ring-white/30 transition hover:-translate-y-0.5 hover:bg-zinc-100 hover:shadow-[0_14px_48px_rgba(255,255,255,.18)]">
          <ShoppingCart size={18} strokeWidth={3} className="text-black"/> <span className="hidden sm:inline text-black">Cart</span>
          {count>0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#6f7d64] px-1 text-[11px] font-black text-white ring-2 ring-black shadow-[0_0_18px_rgba(111,125,100,.55)]">{count}</span>}
        </Link>
        <button onClick={()=>setOpen(v=>!v)} className="rounded-full border border-white/10 p-2.5 text-white/70 lg:hidden" aria-label="Menu">{open?<X size={18}/>:<Menu size={18}/>}</button>
      </div>
    </div>
    {open && <div className="border-t border-white/10 bg-black/85 px-4 py-4 shadow-[0_30px_100px_rgba(0,0,0,.7)] backdrop-blur-2xl lg:hidden">
      <nav className="mx-auto grid max-w-7xl gap-2">
        {links.map(([label,href])=><Link key={href} href={href} onClick={()=>setOpen(false)} className="rounded-2xl border border-white/10 bg-white/[.045] px-4 py-3 text-sm font-black text-white/78 transition hover:border-white/20 hover:bg-white/[.08] hover:text-white">{label}</Link>)}
      </nav>
    </div>}
  </header>
}
