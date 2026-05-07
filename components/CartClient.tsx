'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Lock, Trash2 } from 'lucide-react'

type Item={slug:string;name:string;price:number;hero:string;qty:number}
export default function CartClient(){
  const [items,setItems]=useState<Item[]>([])
  useEffect(()=>{setItems(JSON.parse(localStorage.getItem('vyron_cart')||'[]'))},[])
  function save(next:Item[]){setItems(next); localStorage.setItem('vyron_cart',JSON.stringify(next)); window.dispatchEvent(new Event('vyron-cart'))}
  const subtotal=items.reduce((s,i)=>s+i.price*i.qty,0)
  if(!items.length)return <div className="card rounded-[2rem] p-8 md:p-12"><p className="kicker">Cart</p><h1 className="mt-3 text-4xl font-black md:text-6xl">Your cart is empty.</h1><p className="mt-4 text-white/60">Kies eerst een premium utility product uit de catalogus.</p><Link href="/shop" className="btn-primary mt-7">Shop products</Link></div>
  return <div className="grid gap-8 lg:grid-cols-[1fr_390px]">
    <div className="grid gap-4">{items.map(item=><div key={item.slug} className="card grid grid-cols-[92px_1fr] gap-4 rounded-[1.6rem] p-4 md:grid-cols-[120px_1fr]"><img src={item.hero} className="h-24 w-24 rounded-2xl object-cover md:h-32 md:w-32" alt=""/><div><h3 className="font-black md:text-xl">{item.name}</h3><p className="mt-1 text-white/55">€{item.price.toFixed(2)}</p><div className="mt-4 flex flex-wrap items-center gap-3"><button className="rounded-full border border-white/10 px-3 py-1" onClick={()=>save(items.map(i=>i.slug===item.slug?{...i,qty:Math.max(1,i.qty-1)}:i))}>-</button><span className="min-w-6 text-center font-black">{item.qty}</span><button className="rounded-full border border-white/10 px-3 py-1" onClick={()=>save(items.map(i=>i.slug===item.slug?{...i,qty:i.qty+1}:i))}>+</button><button className="ml-auto inline-flex items-center gap-2 text-sm text-white/45 hover:text-white" onClick={()=>save(items.filter(i=>i.slug!==item.slug))}><Trash2 size={15}/> Remove</button></div></div></div>)}</div>
    <aside className="card h-fit rounded-[1.8rem] p-6 lg:sticky lg:top-24"><p className="kicker">Checkout</p><h2 className="mt-2 text-2xl font-black">Order Summary</h2><div className="mt-6 flex justify-between text-white/65"><span>Subtotal</span><span>€{subtotal.toFixed(2)}</span></div><div className="mt-3 flex justify-between text-white/65"><span>Shipping</span><span>Calculated later</span></div><div className="mt-6 flex justify-between border-t border-white/10 pt-6 text-xl font-black"><span>Total</span><span>€{subtotal.toFixed(2)}</span></div><button className="btn-primary mt-6 w-full">Checkout soon</button><p className="mt-4 flex gap-2 text-xs leading-5 text-white/45"><Lock size={15}/> Volgende fase: Mollie checkout met iDEAL | Wero, PayPal, Cards, Apple Pay en Google Pay.</p></aside>
  </div>
}
