import Link from 'next/link'
import { ArrowRight, BadgeCheck, CalendarDays, PackageCheck, ShieldCheck } from 'lucide-react'
import type { Product } from '@/lib/products'
import HotDealsCarousel from './HotDealsCarousel'

export default function HomeHeroSlider({
  kicker = 'POKEMON TCG • SEALED • COLLECTIBLES • EVENTS',
  text = '',
  primaryCta = 'Shop Pokemon',
  secondaryCta = 'Markt voorraad',
  hotDeals = [],
}: {
  kicker?: string
  text?: string
  primaryCta?: string
  secondaryCta?: string
  hotDeals?: Product[]
}) {
  const trust = [
    { icon: ShieldCheck, title: 'Origineel sealed', text: 'Geen gewogen of geopende packs.' },
    { icon: PackageCheck, title: 'Eigen voorraad', text: 'Voorraad die ASORTA zelf beheert.' },
    { icon: CalendarDays, title: 'Markten & events', text: 'Ook verkrijgbaar op braderieen en beurzen.' },
  ]

  return (
    <section className="asorta-tcg-hero noise">
      <div className="asorta-tcg-glow asorta-tcg-glow-gold" />
      <div className="asorta-tcg-glow asorta-tcg-glow-blue" />
      <div className="mx-auto grid min-h-[700px] max-w-7xl items-center gap-8 px-4 py-12 sm:px-5 lg:grid-cols-[.9fr_1.1fr] lg:py-16 xl:gap-10">
        <div className="relative z-10 overflow-hidden rounded-[2rem] border border-white/10 bg-black/30 p-6 shadow-[0_35px_90px_rgba(0,0,0,.32)] backdrop-blur sm:p-8 xl:p-10">
          <img src="/asorta-tcg-hero.jpeg" alt="ASORTA Trading Cards Collectibles Events" className="absolute inset-0 h-full w-full object-cover opacity-[.26]" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,.86),rgba(0,0,0,.58)_58%,rgba(0,0,0,.36)),linear-gradient(180deg,rgba(15,23,42,.26),rgba(0,0,0,.5))]" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[.045] px-4 py-2 text-[11px] font-black uppercase tracking-[.28em] text-white/55">
              <span className="h-2 w-2 rounded-full bg-amber-300 shadow-[0_0_18px_rgba(252,211,77,.75)]" />
              {kicker}
            </div>
            <h1 className="mt-6 max-w-3xl text-5xl font-black leading-[.92] tracking-[-.055em] text-white sm:text-6xl md:text-7xl xl:text-[5.2rem]">
              Asorta TCG & meer.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-white/72 sm:text-lg">{text}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/shop" className="btn-primary">
                {primaryCta} <ArrowRight className="ml-2" size={18} />
              </Link>
              <Link href="/category/market-deals" className="btn-secondary">{secondaryCta}</Link>
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {trust.map(({ icon: Icon, title, text }) => (
                <div key={title} className="rounded-2xl border border-white/10 bg-black/32 p-4 backdrop-blur">
                  <Icon size={20} className="text-amber-200/80" />
                  <h3 className="mt-3 text-sm font-black">{title}</h3>
                  <p className="mt-1 text-xs leading-5 text-white/55">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="relative z-10">
          <HotDealsCarousel products={hotDeals} />
        </div>
      </div>
      <BadgeCheck className="pointer-events-none absolute bottom-10 right-10 hidden text-white/10 lg:block" size={78} />
    </section>
  )
}
