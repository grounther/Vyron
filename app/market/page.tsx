import Link from 'next/link'
import type React from 'react'
import ProductCard from '@/components/ProductCard'
import { getMarketProducts } from '@/lib/catalog'
import { ArrowRight, CalendarDays, PackageCheck, QrCode, ShieldCheck } from 'lucide-react'

export const metadata = {
  title: 'Marktvoorraad | ASORTA',
  description: 'Pokemon TCG producten die ASORTA meeneemt naar markten, braderieen en events.',
}

export default async function MarketPage() {
  const products = await getMarketProducts()
  const totalMarketStock = products.reduce((sum, product) => sum + Number(product.inventoryMarket || 0), 0)

  return <main className="mx-auto max-w-7xl px-4 py-10 sm:px-5 md:py-14">
    <section className="relative overflow-hidden rounded-[2.2rem] border border-white/10 bg-black/35 p-6 shadow-[0_40px_100px_rgba(0,0,0,.35)] sm:p-8 md:p-10">
      <img src="/asorta-tcg-hero.jpeg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-18" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,.88),rgba(0,0,0,.58)),linear-gradient(180deg,rgba(0,0,0,.2),rgba(0,0,0,.72))]" />
      <div className="relative z-10 grid gap-8 lg:grid-cols-[1.15fr_.85fr] lg:items-end">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[.045] px-4 py-2 text-[11px] font-black uppercase tracking-[.26em] text-white/55"><CalendarDays size={14}/> Markten & braderieen</div>
          <h1 className="mt-5 max-w-3xl text-4xl font-black tracking-[-.04em] text-white sm:text-6xl">Marktvoorraad van ASORTA.</h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-white/65 sm:text-lg">Deze producten zijn bedoeld voor verkoop op markten en events. Ideaal voor QR-codes bij de kraam: klanten zien direct welke Pokemon producten beschikbaar zijn.</p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row"><Link href="/shop" className="btn-primary">Online shop <ArrowRight size={18} className="ml-2"/></Link><Link href="/contact" className="btn-secondary">Vraag naar locatie</Link></div>
        </div>
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          <Stat icon={<PackageCheck size={20}/>} label="Producten mee" value={String(products.length)} />
          <Stat icon={<QrCode size={20}/>} label="QR-ready" value="Marktmodus" />
          <Stat icon={<ShieldCheck size={20}/>} label="Marktvoorraad" value={String(totalMarketStock)} />
        </div>
      </div>
    </section>

    <section className="mt-10">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div><p className="kicker">Beschikbaar op locatie</p><h2 className="mt-2 text-3xl font-black md:text-5xl">Producten voor de kraam</h2></div>
        <p className="max-w-sm text-sm leading-6 text-white/50">Zet in Atlas bij een product “Mee naar markten” aan en vul marktvoorraad in om het hier te tonen.</p>
      </div>
      {products.length ? <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">{products.map((product) => <ProductCard key={product.slug} p={product}/>)}</div> : <div className="card rounded-[1.7rem] p-6"><h3 className="text-2xl font-black">Nog geen marktvoorraad</h3><p className="mt-3 text-sm leading-6 text-white/55">Voeg producten toe in Atlas en zet “Mee naar markten” aan.</p></div>}
    </section>
  </main>
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="rounded-2xl border border-white/10 bg-white/[.045] p-4 backdrop-blur"><div className="text-white/65">{icon}</div><p className="mt-3 text-xs font-black uppercase tracking-[.20em] text-white/38">{label}</p><p className="mt-1 text-2xl font-black text-white">{value}</p></div>
}
