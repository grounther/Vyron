'use client'

import Link from 'next/link'
import ProductImage from './ProductImage'
import { useEffect, useState } from 'react'
import { Menu, Search, ShoppingCart, X, Trash2, Minus, Plus, ArrowRight } from 'lucide-react'

const links = [
  ['Shop','/shop'], ['Tactical','/category/tactical'], ['Automotive','/category/automotive'], ['Desk Setup','/category/desk-setup'], ['Gaming','/category/gaming'], ['Smart Utility','/category/smart-utility'], ['Account','/account']
]

type CartItem={slug:string;name:string;price:number;hero:string;qty:number}
const CART_KEY='asorta_cart'

function readCart():CartItem[]{
  if(typeof window==='undefined') return []
  try{return JSON.parse(localStorage.getItem(CART_KEY) || '[]')}catch{return []}
}
function cartCount(items:CartItem[]){return items.reduce((sum,item)=>sum + Number(item.qty || 0),0)}

export default function Header(){
  const [items,setItems] = useState<CartItem[]>([])
  const [menuOpen,setMenuOpen] = useState(false)
  const [cartOpen,setCartOpen] = useState(false)

  useEffect(()=>{
    const update=()=>setItems(readCart())
    update()
    window.addEventListener('asorta-cart', update)
    window.addEventListener('storage', update)
    return ()=>{
      window.removeEventListener('asorta-cart', update)
      window.removeEventListener('storage', update)
    }
  },[])

  const count=cartCount(items)

  return <>
    <header className="glass sticky top-0 z-50">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
        <Link href="/" className="group flex items-center gap-3" onClick={()=>setMenuOpen(false)}>
          <span className="font-black tracking-[.38em] text-white/90">ASORTA</span>
        </Link>
        <nav className="hidden items-center gap-7 text-sm font-bold text-white/60 lg:flex">
          {links.map(([label,href])=><Link key={href} href={href} className="transition hover:text-white">{label}</Link>)}
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/search" className="rounded-full border border-white/10 p-2.5 text-white/70 transition hover:bg-white/10" aria-label="Search"><Search size={18}/></Link>
          <button onClick={()=>setCartOpen(true)} className="relative inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-black shadow-[0_10px_40px_rgba(255,255,255,.14)] ring-1 ring-white/30 transition hover:-translate-y-0.5 hover:bg-zinc-100 hover:shadow-[0_14px_48px_rgba(255,255,255,.18)]" aria-label="Open cart">
            <ShoppingCart size={18} strokeWidth={3.4} className="text-zinc-950"/> <span className="hidden text-zinc-950 sm:inline">Cart</span>
            {count>0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#6f7d64] px-1 text-[11px] font-black text-white ring-2 ring-black shadow-[0_0_18px_rgba(111,125,100,.55)]">{count}</span>}
          </button>
          <button onClick={()=>setMenuOpen(v=>!v)} className="rounded-full border border-white/10 p-2.5 text-white/70 lg:hidden" aria-label="Menu">{menuOpen?<X size={18}/>:<Menu size={18}/>}</button>
        </div>
      </div>
      {menuOpen && <div className="border-t border-white/10 bg-black/85 px-4 py-4 shadow-[0_30px_100px_rgba(0,0,0,.7)] backdrop-blur-2xl lg:hidden">
        <nav className="mx-auto grid max-w-7xl gap-2">
          {links.map(([label,href])=><Link key={href} href={href} onClick={()=>setMenuOpen(false)} className="rounded-2xl border border-white/10 bg-white/[.045] px-4 py-3 text-sm font-black text-white/78 transition hover:border-white/20 hover:bg-white/[.08] hover:text-white">{label}</Link>)}
        </nav>
      </div>}
    </header>
    <CartDrawer open={cartOpen} setOpen={setCartOpen} items={items} setItems={setItems}/>
  </>
}

function CartDrawer({open,setOpen,items,setItems}:{open:boolean;setOpen:(v:boolean)=>void;items:CartItem[];setItems:(items:CartItem[])=>void}){
  function save(next:CartItem[]){setItems(next); localStorage.setItem(CART_KEY,JSON.stringify(next)); window.dispatchEvent(new Event('asorta-cart'))}
  const subtotal=items.reduce((s,i)=>s+i.price*i.qty,0)
  return <div className={`fixed inset-0 z-[90] ${open?'pointer-events-auto':'pointer-events-none'}`}>
    <div onClick={()=>setOpen(false)} className={`absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${open?'opacity-100':'opacity-0'}`}/>
    <aside className={`absolute right-0 top-0 h-full w-full max-w-md border-l border-white/10 bg-[#070707]/95 shadow-[0_0_100px_rgba(0,0,0,.8)] backdrop-blur-2xl transition-transform duration-300 ${open?'translate-x-0':'translate-x-full'}`}>
      <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
        <div><p className="text-xs font-black uppercase tracking-[.25em] text-white/40">ASORTA</p><h2 className="font-black">Cart</h2></div>
        <button onClick={()=>setOpen(false)} className="rounded-full border border-white/10 p-2 text-white/60 hover:bg-white/10 hover:text-white"><X size={18}/></button>
      </div>
      {!items.length ? <div className="p-5">
        <div className="card rounded-[1.6rem] p-6"><h3 className="text-2xl font-black">Your cart is empty.</h3><p className="mt-3 text-sm leading-6 text-white/55">Selecteer eerst een premium utility product.</p><Link onClick={()=>setOpen(false)} href="/shop" className="btn-primary mt-6 w-full">Shop products <ArrowRight size={18} className="ml-2"/></Link></div>
      </div> : <div className="flex h-[calc(100%-4rem)] flex-col">
        <div className="flex-1 overflow-y-auto p-5">
          <div className="grid gap-4">{items.map(item=><div key={item.slug} className="card grid grid-cols-[82px_1fr] gap-3 rounded-[1.4rem] p-3">
            <ProductImage src={item.hero} alt="" className="h-20 w-20 rounded-2xl object-cover"/>
            <div className="min-w-0"><h3 className="truncate font-black">{item.name}</h3><p className="mt-1 text-sm text-white/55">€{item.price.toFixed(2)}</p>
              <div className="mt-3 flex items-center gap-2"><button className="rounded-full border border-white/10 p-1 text-white/60 hover:bg-white/10" onClick={()=>save(items.map(i=>i.slug===item.slug?{...i,qty:Math.max(1,i.qty-1)}:i))}><Minus size={14}/></button><span className="min-w-6 text-center text-sm font-black">{item.qty}</span><button className="rounded-full border border-white/10 p-1 text-white/60 hover:bg-white/10" onClick={()=>save(items.map(i=>i.slug===item.slug?{...i,qty:i.qty+1}:i))}><Plus size={14}/></button><button className="ml-auto text-white/38 hover:text-white" onClick={()=>save(items.filter(i=>i.slug!==item.slug))}><Trash2 size={15}/></button></div>
            </div>
          </div>)}</div>
        </div>
        <div className="border-t border-white/10 p-5">
          <div className="flex justify-between text-sm text-white/58"><span>Subtotal</span><span>€{subtotal.toFixed(2)}</span></div>
          <div className="mt-3 flex justify-between text-sm text-white/58"><span>Shipping</span><span>Calculated at checkout</span></div>
          <div className="mt-5 flex justify-between border-t border-white/10 pt-5 text-xl font-black"><span>Total</span><span>€{subtotal.toFixed(2)}</span></div>
          <Link onClick={()=>setOpen(false)} href="/cart" className="btn-secondary mt-5 w-full">View cart</Link><Link onClick={()=>setOpen(false)} href="/checkout" className="btn-primary mt-3 w-full">Checkout</Link>
          <p className="mt-3 text-center text-xs text-white/38">Mollie/iDEAL/Wero checkout komt in de payment-fase.</p>
        </div>
      </div>}
    </aside>
  </div>
}
