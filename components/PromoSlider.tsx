
'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Tag } from 'lucide-react'

const slides = [
  {kicker:'Launch Deal',title:'Launch picks now live.',text:'Ontdek de eerste ASORTA utility producten met tracked shipping en premium productpagina’s.',href:'/shop',cta:'Shop launch picks'},
  {kicker:'Automotive Focus',title:'Upgrade your daily drive.',text:'DriveCharge en AmbientDrive brengen clean utility en sfeer naar je interieur.',href:'/category/automotive',cta:'View automotive'},
  {kicker:'Atlas Ready',title:'Built to scale.',text:'Promo slides worden straks via Atlas beheerd zodat acties live aangepast kunnen worden.',href:'/atlas-access',cta:'Atlas access'}
]
export default function PromoSlider(){
  const [i,setI]=useState(0)
  useEffect(()=>{const t=setInterval(()=>setI(v=>(v+1)%slides.length),5200);return()=>clearInterval(t)},[])
  const s=slides[i]
  return <div className="card relative overflow-hidden rounded-[2.2rem] p-3 shadow-2xl">
    <div className="relative h-[330px] rounded-[1.7rem] bg-[radial-gradient(circle_at_65%_20%,rgba(183,200,173,.28),transparent_36%),linear-gradient(135deg,#111,#050505_58%,#11180f)] md:h-[540px]">
      <div className="absolute inset-0 opacity-[.08] bg-[linear-gradient(90deg,white_1px,transparent_1px),linear-gradient(180deg,white_1px,transparent_1px)] bg-[size:48px_48px]" />
      <img src="/brand/asorta-icon.png" alt="ASORTA" className="absolute left-1/2 top-1/2 h-36 w-36 -translate-x-1/2 -translate-y-1/2 object-contain opacity-80 md:h-56 md:w-56" />
      <div className="absolute bottom-6 left-6 right-6 rounded-3xl border border-white/10 bg-black/58 p-5 backdrop-blur-xl">
        <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[.28em] text-[#b7c8ad]"><Tag size={14}/>{s.kicker}</p>
        <h3 className="mt-2 text-2xl font-black">{s.title}</h3>
        <p className="mt-2 text-sm leading-6 text-white/55">{s.text}</p>
        <Link href={s.href} className="mt-4 inline-flex items-center gap-2 text-sm font-black text-white/75 hover:text-white">{s.cta}<ArrowRight size={16}/></Link>
      </div>
      <div className="absolute right-7 top-7 flex gap-2">{slides.map((_,idx)=><button key={idx} aria-label={`Slide ${idx+1}`} onClick={()=>setI(idx)} className={`h-2 rounded-full transition-all ${idx===i?'w-7 bg-[#b7c8ad]':'w-2 bg-white/25'}`}/>)}</div>
    </div>
  </div>
}
