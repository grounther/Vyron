'use client'
import Link from 'next/link'
import { useState } from 'react'
import { Home, Menu, Search, UserRound, X } from 'lucide-react'

const links=[['Woningen','/homes'],['Zoekprofiel','/search-profile'],['Matches','/matches'],['Zo werkt het','/about'],['Tarieven','/pricing']] as const

export default function Header(){
  const[open,setOpen]=useState(false)
  return <header className="glass sticky top-0 z-50">
    <div className="mx-auto flex h-17 max-w-7xl items-center justify-between gap-4 px-4 sm:px-5">
      <Link href="/" className="flex items-center gap-3" onClick={()=>setOpen(false)} aria-label="ASORTA Woningruil home">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#b8ff5a] text-black shadow-[0_0_35px_rgba(184,255,90,.2)]"><Home size={21} strokeWidth={2.6}/></span>
        <span><strong className="block tracking-[.18em]">ASORTA</strong><span className="block text-[10px] font-black uppercase tracking-[.28em] text-white/42">Woningruil</span></span>
      </Link>
      <nav className="hidden items-center gap-6 text-sm font-bold text-white/62 lg:flex">{links.map(([label,href])=><Link key={href} href={href} className="transition hover:text-white">{label}</Link>)}</nav>
      <div className="flex items-center gap-2">
        <Link href="/homes" aria-label="Woningen zoeken" className="rounded-full border border-white/10 p-2.5 text-white/70 transition hover:bg-white/10 hover:text-white"><Search size={18}/></Link>
        <Link href="/account" className="hidden items-center gap-2 rounded-full border border-white/12 px-4 py-2.5 text-sm font-black text-white/80 transition hover:bg-white/10 sm:flex"><UserRound size={17}/> Mijn Asorta</Link>
        <Link href="/place-home" className="hidden rounded-full bg-[#b8ff5a] px-5 py-2.5 text-sm font-black text-black transition hover:-translate-y-0.5 hover:bg-[#c8ff7e] md:inline-flex">Woning plaatsen</Link>
        <button onClick={()=>setOpen(v=>!v)} className="rounded-full border border-white/10 p-2.5 text-white/70 lg:hidden" aria-label="Menu">{open?<X size={18}/>:<Menu size={18}/>}</button>
      </div>
    </div>
    {open&&<nav className="border-t border-white/10 bg-black/92 px-4 py-4 backdrop-blur-2xl lg:hidden"><div className="mx-auto grid max-w-7xl gap-2">{links.map(([label,href])=><Link key={href} href={href} onClick={()=>setOpen(false)} className="rounded-2xl border border-white/10 bg-white/[.04] px-4 py-3.5 text-sm font-black">{label}</Link>)}<Link href="/place-home" onClick={()=>setOpen(false)} className="rounded-2xl bg-[#b8ff5a] px-4 py-3.5 text-sm font-black text-black">Woning plaatsen</Link><Link href="/account" onClick={()=>setOpen(false)} className="rounded-2xl border border-white/10 bg-white/[.04] px-4 py-3.5 text-sm font-black">Mijn Asorta</Link></div></nav>}
  </header>
}
