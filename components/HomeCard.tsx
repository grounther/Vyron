import Image from 'next/image'
import Link from 'next/link'
import { Bath, BedDouble, Building2, MapPin, Maximize2, Trees } from 'lucide-react'
import { euro, type PublicHome } from '@/lib/housing'

export default function HomeCard({ home }: { home: PublicHome }) {
  return <article className="group overflow-hidden rounded-[1.7rem] border border-white/10 bg-white/[.035] transition hover:-translate-y-1 hover:border-[#b8ff5a]/30">
    <Link href={`/homes/${home.id}`} className="block">
      <div className="relative aspect-[16/10] overflow-hidden bg-[#111821]">
        {home.image_url ? <Image src={home.image_url} alt={`Huurwoning in ${home.city}`} fill className="object-cover transition duration-500 group-hover:scale-[1.03]" sizes="(max-width: 768px) 100vw, 33vw" unoptimized={home.image_url.startsWith('http')} /> : <div className="grid h-full place-items-center text-white/20"><Building2 size={42}/></div>}
        <span className="absolute left-4 top-4 rounded-full border border-white/15 bg-black/65 px-3 py-1.5 text-xs font-black backdrop-blur">{home.property_type}</span>
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between gap-4"><div><h2 className="text-xl font-black">{home.city}</h2><p className="mt-1 flex items-center gap-1.5 text-sm text-white/48"><MapPin size={14}/>{home.district || home.province}</p></div><strong className="text-lg text-[#b8ff5a]">{euro(home.monthly_rent)}<span className="text-xs text-white/35">/mnd</span></strong></div>
        <div className="mt-5 flex flex-wrap gap-2 text-xs font-bold text-white/58"><span className="flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5"><BedDouble size={14}/>{home.rooms} kamers</span>{home.living_area_m2&&<span className="flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5"><Maximize2 size={14}/>{home.living_area_m2} m²</span>}{home.has_garden&&<span className="flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5"><Trees size={14}/>Tuin</span>}{home.has_balcony&&<span className="flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5"><Bath size={14}/>Balkon</span>}</div>
        <p className="mt-5 line-clamp-2 text-sm leading-6 text-white/46">{home.description}</p>
      </div>
    </Link>
  </article>
}
