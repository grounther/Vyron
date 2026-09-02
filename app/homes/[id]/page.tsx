import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPublicHome } from '@/lib/housing-data'
import { euro } from '@/lib/housing'
import { ArrowLeft, BedDouble, Building2, Check, MapPin, Maximize2, ShieldCheck } from 'lucide-react'

export const dynamic='force-dynamic'
export default async function HomeDetail({params}:{params:Promise<{id:string}>}){
  const {id}=await params, home=await getPublicHome(id)
  if(!home)notFound()
  const features=[home.has_garden&&'Tuin',home.has_balcony&&'Balkon',home.has_elevator&&'Lift',home.ground_floor&&'Begane grond',home.accessibility].filter((x):x is string=>typeof x==='string'&&x.length>0)
  return <main className="mx-auto min-h-screen max-w-7xl px-4 py-10 sm:px-5"><Link href="/homes" className="inline-flex items-center gap-2 text-sm font-black text-white/55 hover:text-white"><ArrowLeft size={16}/> Terug naar woningen</Link><div className="mt-6 grid gap-7 lg:grid-cols-[1.2fr_.8fr]">
    <section><div className="relative aspect-[16/9] overflow-hidden rounded-[2rem] border border-white/10 bg-[#101720]">{home.image_url?<Image src={home.image_url} alt={`Woning in ${home.city}`} fill className="object-cover" priority unoptimized={home.image_url.startsWith('http')}/>:<div className="grid h-full place-items-center text-white/20"><Building2 size={64}/></div>}<div className="absolute left-5 top-5"><span className="status-pill">Beschikbaar voor ruil</span></div></div><div className="mt-6 rounded-[2rem] border border-white/10 bg-white/[.035] p-6 sm:p-8"><p className="kicker">Over de woning</p><h1 className="mt-3 text-4xl font-black sm:text-5xl">{home.property_type} in {home.city}</h1><p className="mt-3 flex items-center gap-2 text-white/50"><MapPin size={17}/>{home.district||home.province}, {home.province}</p><div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4"><Info icon={<BedDouble/>} value={`${home.rooms} kamers`}/><Info icon={<Maximize2/>} value={home.living_area_m2?`${home.living_area_m2} m²`:'Op aanvraag'}/><Info icon={<Building2/>} value={home.provider_name||'Verhuurder'}/><Info icon={<ShieldCheck/>} value="Adres privé"/></div><p className="mt-7 text-lg leading-8 text-white/60">{home.description}</p>{features.length>0&&<div className="mt-7 flex flex-wrap gap-2">{features.map(x=><span key={x} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-2 text-sm font-bold text-white/62"><Check size={15} className="text-[#b8ff5a]"/>{x}</span>)}</div>}</div></section>
    <aside className="h-fit rounded-[2rem] border border-white/10 bg-white/[.045] p-6 lg:sticky lg:top-24 sm:p-8"><p className="text-sm text-white/45">Kale huur</p><strong className="mt-1 block text-4xl">{euro(home.monthly_rent)} <span className="text-sm text-white/35">per maand</span></strong><div className="my-7 border-t border-white/10"/><h2 className="text-2xl font-black">Past deze woning bij jou?</h2><p className="mt-3 leading-7 text-white/50">Asorta toont pas een echte match als de bewoner jouw woning óók zoekt. Zo weet je dat interesse wederzijds kan zijn.</p><Link href="/search-profile" className="btn-primary mt-6 w-full">Controleer mijn match</Link><Link href="/place-home" className="btn-secondary mt-3 w-full">Eerst mijn woning plaatsen</Link><p className="mt-5 flex items-start gap-2 text-xs leading-5 text-white/35"><ShieldCheck size={15} className="mt-0.5 shrink-0"/>Exacte adres- en contactgegevens worden niet openbaar getoond.</p></aside>
  </div></main>
}

function Info({icon,value}:{icon:React.ReactNode;value:string}){return <div className="rounded-2xl border border-white/10 bg-black/20 p-4"><span className="block text-[#b8ff5a] [&_svg]:h-5 [&_svg]:w-5">{icon}</span><strong className="mt-4 block text-sm">{value}</strong></div>}
