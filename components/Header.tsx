'use client'

import Link from 'next/link'
import ProductImage from './ProductImage'
import LanguageSwitcher from './LanguageSwitcher'
import { getDictionary, normalizeLocale, type Locale } from '@/lib/i18n/config'
import { useEffect, useMemo, useState } from 'react'
import { Menu, Search, ShoppingCart, X, Trash2, Minus, Plus, ArrowRight, UserRound } from 'lucide-react'

type CartItem={slug:string;name:string;price:number;hero:string;qty:number;variant?:string;sku?:string}
const CART_KEY='asorta_cart'

function readCart():CartItem[]{
  if(typeof window==='undefined') return []
  try{return JSON.parse(localStorage.getItem(CART_KEY) || '[]')}catch{return []}
}
function cartCount(items:CartItem[]){return items.reduce((sum,item)=>sum + Number(item.qty || 0),0)}
function readLocale(): Locale {
  if (typeof document === 'undefined') return 'nl'
  const match = document.cookie.match(/(?:^|; )asorta_lang=([^;]+)/)
  return normalizeLocale(match ? decodeURIComponent(match[1]) : localStorage.getItem('asorta_lang'))
}

export default function Header(){
  const [items,setItems] = useState<CartItem[]>([])
  const [menuOpen,setMenuOpen] = useState(false)
  const [cartOpen,setCartOpen] = useState(false)
  const [locale,setLocale] = useState<Locale>('nl')

  useEffect(()=>{
    const update=()=>setItems(readCart())
    const updateLang=(event?: Event)=>setLocale(normalizeLocale((event as CustomEvent<Locale> | undefined)?.detail || readLocale()))
    update()
    updateLang()
    window.addEventListener('asorta-cart', update)
    window.addEventListener('storage', update)
    window.addEventListener('asorta-language-change', updateLang as EventListener)
    return ()=>{
      window.removeEventListener('asorta-cart', update)
      window.removeEventListener('storage', update)
      window.removeEventListener('asorta-language-change', updateLang as EventListener)
    }
  },[])

  const dict = getDictionary(locale)
  const links = useMemo(() => [
    [dict.nav.shop, '/shop'],
    [dict.nav.tactical, '/category/tactical'],
    [dict.nav.automotive, '/category/automotive'],
    [dict.nav.desk, '/category/desk-setup'],
    [dict.nav.gaming, '/category/gaming'],
    [dict.nav.smartUtility, '/category/smart-utility'],
    [dict.nav.account, '/account'],
  ] as const, [dict])
  const count=cartCount(items)

  return <>
    <header className="glass sticky top-0 z-50">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-3 sm:px-4 md:px-6">
        <Link href="/" className="group flex min-w-0 items-center" onClick={()=>setMenuOpen(false)} aria-label="ASORTA home">
          <img src="/asorta-logo-header-metal.png" alt="ASORTA" className="asorta-header-logo transition group-hover:scale-[1.025]"/>
        </Link>
        <nav className="hidden items-center gap-5 text-sm font-bold text-white/60 xl:flex">
          {links.map(([label,href])=><Link key={href} href={href} className="transition hover:text-white">{label}</Link>)}
        </nav>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <div className="hidden lg:block"><LanguageSwitcher compact /></div>
          <Link href="/search" className="rounded-full border border-white/10 p-2.5 text-white/70 transition hover:bg-white/10" aria-label={dict.nav.search}><Search size={18}/></Link>
          <Link href="/account" className="hidden rounded-full border border-white/10 p-2.5 text-white/70 transition hover:bg-white/10 hover:text-white sm:inline-flex" aria-label={dict.nav.account}><UserRound size={18}/></Link>
          <button onClick={()=>setCartOpen(true)} className="relative inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-sm font-black text-black shadow-[0_10px_40px_rgba(255,255,255,.14)] ring-1 ring-white/30 transition hover:-translate-y-0.5 hover:bg-zinc-100 hover:shadow-[0_14px_48px_rgba(255,255,255,.18)] sm:px-4" aria-label={dict.nav.cart}>
            <ShoppingCart size={18} strokeWidth={3.4} className="text-zinc-950"/> <span className="hidden text-zinc-950 sm:inline">{dict.nav.cart}</span>
            {count>0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#6f7d64] px-1 text-[11px] font-black text-white ring-2 ring-black shadow-[0_0_18px_rgba(111,125,100,.55)]">{count}</span>}
          </button>
          <button onClick={()=>setMenuOpen(v=>!v)} className="rounded-full border border-white/10 p-2.5 text-white/70 xl:hidden" aria-label={dict.nav.menu}>{menuOpen?<X size={18}/>:<Menu size={18}/>}</button>
        </div>
      </div>
      {menuOpen && <div className="border-t border-white/10 bg-black/90 px-4 py-4 shadow-[0_30px_100px_rgba(0,0,0,.7)] backdrop-blur-2xl xl:hidden">
        <nav className="mx-auto grid max-w-7xl gap-2">
          <div className="mb-2 flex items-center justify-between rounded-2xl border border-white/10 bg-white/[.045] px-4 py-3">
            <span className="text-xs font-black uppercase tracking-[.20em] text-white/42">{dict.language}</span>
            <LanguageSwitcher compact />
          </div>
          {links.map(([label,href])=><Link key={href} href={href} onClick={()=>setMenuOpen(false)} className="rounded-2xl border border-white/10 bg-white/[.045] px-4 py-3 text-sm font-black text-white/78 transition hover:border-white/20 hover:bg-white/[.08] hover:text-white">{label}</Link>)}
        </nav>
      </div>}
    </header>
    <CartDrawer open={cartOpen} setOpen={setCartOpen} items={items} setItems={setItems} dict={dict}/>
  </>
}

function CartDrawer({open,setOpen,items,setItems,dict}:{open:boolean;setOpen:(v:boolean)=>void;items:CartItem[];setItems:(items:CartItem[])=>void;dict:ReturnType<typeof getDictionary>}){
  function save(next:CartItem[]){setItems(next); localStorage.setItem(CART_KEY,JSON.stringify(next)); window.dispatchEvent(new Event('asorta-cart'))}
  const subtotal=items.reduce((s,i)=>s+i.price*i.qty,0)
  return <div className={`fixed inset-0 z-[90] ${open?'pointer-events-auto':'pointer-events-none'}`}>
    <div onClick={()=>setOpen(false)} className={`absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${open?'opacity-100':'opacity-0'}`}/>
    <aside className={`absolute right-0 top-0 h-full w-full max-w-md border-l border-white/10 bg-[#070707]/95 shadow-[0_0_100px_rgba(0,0,0,.8)] backdrop-blur-2xl transition-transform duration-300 ${open?'translate-x-0':'translate-x-full'}`}>
      <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
        <div><p className="text-xs font-black uppercase tracking-[.25em] text-white/40">ASORTA</p><h2 className="font-black">{dict.cart.title}</h2></div>
        <button onClick={()=>setOpen(false)} className="rounded-full border border-white/10 p-2 text-white/60 hover:bg-white/10 hover:text-white"><X size={18}/></button>
      </div>
      {!items.length ? <div className="p-4 sm:p-5">
        <div className="card rounded-[1.6rem] p-5 sm:p-6"><h3 className="text-2xl font-black">{dict.cart.emptyTitle}</h3><p className="mt-3 text-sm leading-6 text-white/55">{dict.cart.emptyText}</p><Link onClick={()=>setOpen(false)} href="/shop" className="btn-primary mt-6 w-full">{dict.cart.shopProducts} <ArrowRight size={18} className="ml-2"/></Link></div>
      </div> : <div className="flex h-[calc(100%-4rem)] flex-col">
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          <div className="grid gap-3 sm:gap-4">{items.map(item=><div key={item.slug} className="card grid grid-cols-[72px_1fr] gap-3 rounded-[1.4rem] p-3 sm:grid-cols-[82px_1fr]">
            <ProductImage src={item.hero} alt="" className="h-[72px] w-[72px] rounded-2xl object-cover sm:h-20 sm:w-20"/>
            <div className="min-w-0"><h3 className="truncate font-black">{item.name}</h3><p className="mt-1 text-sm text-white/55">€{item.price.toFixed(2)}</p>{item.variant && <p className="mt-1 text-xs text-white/38">{dict.cart.variant}: {item.variant}</p>}
              <div className="mt-3 flex items-center gap-2"><button className="rounded-full border border-white/10 p-1 text-white/60 hover:bg-white/10" onClick={()=>save(items.map(i=>i.slug===item.slug?{...i,qty:Math.max(1,i.qty-1)}:i))}><Minus size={14}/></button><span className="min-w-6 text-center text-sm font-black">{item.qty}</span><button className="rounded-full border border-white/10 p-1 text-white/60 hover:bg-white/10" onClick={()=>save(items.map(i=>i.slug===item.slug?{...i,qty:i.qty+1}:i))}><Plus size={14}/></button><button className="ml-auto text-white/38 hover:text-white" onClick={()=>save(items.filter(i=>i.slug!==item.slug))}><Trash2 size={15}/></button></div>
            </div>
          </div>)}</div>
        </div>
        <div className="border-t border-white/10 p-4 sm:p-5">
          <div className="flex justify-between text-sm text-white/58"><span>{dict.cart.subtotal}</span><span>€{subtotal.toFixed(2)}</span></div>
          <div className="mt-3 flex justify-between text-sm text-white/58"><span>{dict.cart.shipping}</span><span>{dict.cart.shippingCalculated}</span></div>
          <div className="mt-5 flex justify-between border-t border-white/10 pt-5 text-xl font-black"><span>{dict.cart.total}</span><span>€{subtotal.toFixed(2)}</span></div>
          <Link onClick={()=>setOpen(false)} href="/cart" className="btn-secondary mt-5 w-full">{dict.cart.viewCart}</Link><Link onClick={()=>setOpen(false)} href="/checkout" className="btn-primary mt-3 w-full">{dict.cart.checkout}</Link>
          <p className="mt-3 text-center text-xs text-white/38">{dict.cart.checkoutNote}</p>
        </div>
      </div>}
    </aside>
  </div>
}
