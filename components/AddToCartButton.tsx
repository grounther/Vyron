'use client'

import { useEffect, useState } from 'react'
import { Check, ShoppingBag } from 'lucide-react'

type CartProduct={slug:string;name:string;price:number;hero:string}

export default function AddToCartButton({product}:{product:CartProduct}){
  const [show,setShow]=useState(false)

  useEffect(()=>{
    if(!show) return
    const timer=setTimeout(()=>setShow(false),2300)
    return ()=>clearTimeout(timer)
  },[show])

  function add(){
    const key='vyron_cart'
    const current=JSON.parse(localStorage.getItem(key)||'[]')
    const found=current.find((i:any)=>i.slug===product.slug)
    if(found) found.qty+=1
    else current.push({...product,qty:1})
    localStorage.setItem(key,JSON.stringify(current))
    window.dispatchEvent(new CustomEvent('vyron-cart',{detail:{product}}))
    setShow(false)
    requestAnimationFrame(()=>setShow(true))
  }

  return <>
    <button onClick={add} className="btn-primary w-full py-4 text-base md:text-lg"><ShoppingBag size={20} className="mr-2"/> Add to Cart</button>
    <div className={`pointer-events-none fixed right-4 top-20 z-[80] w-[calc(100vw-2rem)] max-w-sm transition-all duration-500 ease-out ${show?'translate-x-0 opacity-100':'translate-x-[120%] opacity-0'}`}>
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/92 p-3 shadow-[0_30px_90px_rgba(0,0,0,.65)] backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <img src={product.hero} alt="" className="h-16 w-16 rounded-2xl object-cover"/>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[.18em] text-[#9eaa94]"><Check size={14}/> Added to cart</div>
            <p className="mt-1 truncate text-sm font-black text-white">{product.name}</p>
            <p className="text-xs text-white/50">Smoothly added to your VYRON cart.</p>
          </div>
          <div className="grid h-11 w-11 place-items-center rounded-full bg-white text-zinc-950"><ShoppingBag size={18}/></div>
        </div>
        <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/10"><div className="h-full w-full origin-left animate-[vyronToast_2.3s_linear_forwards] bg-[#5B6653]"/></div>
      </div>
    </div>
  </>
}
