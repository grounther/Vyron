import Link from 'next/link'
import HomeCard from '@/components/HomeCard'
import { getPublicHomes } from '@/lib/housing-data'
import { Search, SlidersHorizontal } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Woningen zoeken', description: 'Bekijk huurwoningen die beschikbaar zijn voor woningruil.' }

type Params = Promise<{q?:string;city?:string;type?:string;max?:string}>
export default async function HomesPage({searchParams}:{searchParams:Params}){
  const p=await searchParams
  const all=await getPublicHomes()
  const q=(p.q||'').toLowerCase().trim(), city=(p.city||'').toLowerCase().trim(), type=(p.type||'').toLowerCase(), max=Number(p.max||0)
  const homes=all.filter(h=>(!q||`${h.city} ${h.district||''} ${h.province}`.toLowerCase().includes(q))&&(!city||h.city.toLowerCase().includes(city))&&(!type||h.property_type.toLowerCase().includes(type))&&(!max||h.monthly_rent<=max))
  return <main className="mx-auto min-h-screen max-w-7xl px-4 py-12 sm:px-5">
    <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end"><div><p className="kicker">Woningen</p><h1 className="mt-3 text-4xl font-black sm:text-6xl">Waar wil jij wonen?</h1><p className="mt-4 max-w-2xl leading-7 text-white/50">Bekijk de openbare woninggegevens. Je exacte adres en persoonlijke gegevens blijven altijd afgeschermd.</p></div><Link href="/search-profile" className="btn-primary gap-2 self-start"><SlidersHorizontal size={17}/> Maak mijn zoekprofiel</Link></div>
    <form className="mt-9 grid gap-3 rounded-[1.6rem] border border-white/10 bg-white/[.035] p-4 md:grid-cols-[1.3fr_1fr_1fr_1fr_auto]">
      <label className="label"><span>Zoeken</span><div className="relative"><Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/35"/><input name="q" defaultValue={p.q} className="field pl-10" placeholder="Plaats, wijk of provincie"/></div></label>
      <label className="label"><span>Plaats</span><input name="city" defaultValue={p.city} className="field" placeholder="Bijv. Zwolle"/></label>
      <label className="label"><span>Woningtype</span><select name="type" defaultValue={p.type||''} className="field"><option value="">Alle typen</option><option>Appartement</option><option>Eengezinswoning</option><option>Maisonnette</option><option>Studio</option><option>Seniorenwoning</option></select></label>
      <label className="label"><span>Max. huur</span><input name="max" defaultValue={p.max} inputMode="numeric" className="field" placeholder="€ per maand"/></label>
      <button className="btn-primary self-end px-6 py-[.92rem]">Filter</button>
    </form>
    <div className="mt-7 flex items-center justify-between text-sm"><span className="font-bold text-white/48">{homes.length} woningen gevonden</span>{(q||city||type||max>0)&&<Link href="/homes" className="font-black text-[#b8ff5a]">Wis filters</Link>}</div>
    {homes.length?<div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{homes.map(home=><HomeCard key={home.id} home={home}/>)}</div>:<div className="mt-5 rounded-[2rem] border border-white/10 bg-white/[.035] p-10 text-center"><h2 className="text-2xl font-black">Nog geen woning gevonden</h2><p className="mt-3 text-white/48">Maak je zoekopdracht iets ruimer of sla je wensen op. Dan kan Asorta je waarschuwen bij een nieuwe match.</p><Link href="/search-profile" className="btn-primary mt-6">Zoekprofiel opslaan</Link></div>}
  </main>
}
