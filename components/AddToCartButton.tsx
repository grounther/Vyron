'use client'

import { useEffect, useState } from 'react'
import { Check, ShoppingCart } from 'lucide-react'
import ProductImage from './ProductImage'

type CartProduct={slug:string;name:string;price:number;hero:string}

function cartCount(items:any[]){return items.reduce((sum,item)=>sum + Number(item.qty || 0),0)}

export default function AddToCartButton({product}:{product:CartProduct}){
  const [show,setShow]=useState(false)
  const [count,setCount]=useState(0)

  useEffect(()=>{
    if(!show) return
    const timer=setTimeout(()=>setShow(false),2400)
    return ()=>clearTimeout(timer)
  },[show])

  function add(){
    const key='vyron_cart'
    const current=JSON.parse(localStorage.getItem(key)||'[]')
    const found=current.find((i:any)=>i.slug===product.slug)
    if(found) found.qty+=1
    else current.push({...product,qty:1})
    localStorage.setItem(key,JSON.stringify(current))
    const total=cartCount(current)
    setCount(total)
    window.dispatchEvent(new CustomEvent('vyron-cart',{detail:{product,count:total}}))
    setShow(false)
    requestAnimationFrame(()=>setShow(true))
  }

  return <>
    <button onClick={add} className="btn-primary w-full py-4 text-base md:text-lg"><ShoppingCart size={20} className="mr-2"/> Add to Cart</button>
    <div className={`pointer-events-none fixed right-4 top-[5.2rem] z-[80] w-[calc(100vw-2rem)] max-w-md transition-all duration-500 ease-out ${show?'translate-x-0 opacity-100':'translate-x-[120%] opacity-0'}`}>
      <div className="relative overflow-hidden rounded-3xl border border-[#5B6653]/45 bg-zinc-950/94 p-3 shadow-[0_30px_90px_rgba(0,0,0,.72)] backdrop-blur-xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_50%,rgba(91,102,83,.22),transparent_42%)]" />
        <div className="relative flex items-center gap-3">
          <ProductImage src={product.hero} alt="" className="h-16 w-16 rounded-2xl object-cover"/>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[.18em] text-[#aab6a0]"><Check size={14}/> Added to cart</div>
            <p className="mt-1 truncate text-sm font-black text-white">{product.name}</p>
            <p className="text-xs text-white/50">Sliding straight into your VYRON cart.</p>
          </div>
          <div className="relative grid h-12 w-12 place-items-center rounded-full bg-white text-zinc-950">
            <ShoppingCart size={19}/>
            {count>0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#5B6653] px-1 text-[11px] font-black text-white ring-2 ring-black">{count}</span>}
          </div>
        </div>
        <div className="relative mt-3 h-1 overflow-hidden rounded-full bg-white/10"><div className="h-full w-full origin-left animate-[vyronToast_2.4s_linear_forwards] bg-[#5B6653]"/></div>
      </div>
    </div>
  </>
}
