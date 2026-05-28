import Link from 'next/link'
import { ArrowRight, BadgeCheck, CalendarDays, PackageCheck, ShieldCheck } from 'lucide-react'

export default function HomeHeroSlider({
  kicker = 'POKEMON TCG • SEALED • COLLECTIBLES • EVENTS',
  text = 'ASORTA wordt jouw plek voor Pokemon kaarten, sealed producten, collectibles en marktdeals. Online bestellen, lokaal kopen op markten en braderieen, en altijd duidelijk of iets direct uit eigen voorraad komt.',
  primaryCta = 'Shop Pokemon',
  secondaryCta = 'Markt voorraad',
}: {
  kicker?: string
  text?: string
  primaryCta?: string
  secondaryCta?: string
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
      <div className="mx-auto grid min-h-[680px] max-w-7xl items-center gap-10 px-4 py-12 sm:px-5 lg:grid-cols-[.92fr_1.08fr] lg:py-16">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[.045] px-4 py-2 text-[11px] font-black uppercase tracking-[.28em] text-white/55">
            <span className="h-2 w-2 rounded-full bg-amber-300 shadow-[0_0_18px_rgba(252,211,77,.75)]" />
            {kicker}
          </div>
          <h1 className="mt-6 text-5xl font-black leading-[.92] tracking-[-.055em] text-white sm:text-6xl md:text-7xl xl:text-8xl">
            Pokemon markt.<br />Online shop.<br />Eigen voorraad.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-white/62 sm:text-lg">{text}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/shop" className="btn-primary">
              {primaryCta} <ArrowRight className="ml-2" size={18} />
            </Link>
            <Link href="/category/market-deals" className="btn-secondary">{secondaryCta}</Link>
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {trust.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-2xl border border-white/10 bg-black/28 p-4 backdrop-blur">
                <Icon size={20} className="text-amber-200/80" />
                <h3 className="mt-3 text-sm font-black">{title}</h3>
                <p className="mt-1 text-xs leading-5 text-white/45">{text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <div className="asorta-tcg-hero-card">
            <img src="/asorta-tcg-hero.jpeg" alt="ASORTA Trading Cards Collectibles Events" className="h-full w-full object-cover" />
            <div className="absolute inset-0 rounded-[1.7rem] ring-1 ring-inset ring-white/14" />
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {['Pokemon boosters', 'Elite Trainer Boxes', 'Mystery packs'].map((label) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/[.035] px-4 py-3 text-center text-xs font-black uppercase tracking-[.18em] text-white/55">
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>
      <BadgeCheck className="pointer-events-none absolute bottom-10 right-10 hidden text-white/10 lg:block" size={78} />
    </section>
  )
}
