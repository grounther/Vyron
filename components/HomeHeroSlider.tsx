'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, BadgeCheck, Headphones, Lock, ShieldCheck, Truck } from 'lucide-react'

const slides = [
  {
    kicker: 'Premium gear',
    title: 'Built for modern utility.',
    subtitle: 'Tactical carry, smart car upgrades and setup essentials in one clean catalog.',
    image: '/products/urban-sling/2_ffc916c0-7b8f-4b11-a8a7-c2e014a62fe7.jpg',
    href: '/product/asorta-urban-sling-pro',
    cta: 'View Urban Sling Pro',
  },
  {
    kicker: 'Automotive drop',
    title: 'Upgrade your daily drive.',
    subtitle: 'Wireless charging, ambient lighting and clean cockpit utility for everyday driving.',
    image: '/products/drivecharge/1_1c3d32e3-9eb6-47f9-b217-e2911571c64a.jpg',
    href: '/category/automotive',
    cta: 'Explore automotive',
  },
  {
    kicker: 'Launch system',
    title: 'Premium products. Clean checkout.',
    subtitle: 'ASORTA is being built as a scalable utility store with curated product drops.',
    image: '/products/ambientdrive/1_1620630875996.jpg',
    href: '/shop',
    cta: 'Shop launch catalog',
  },
  {
    kicker: 'Creator setup',
    title: 'Sharper setups. Better utility.',
    subtitle: 'Desk, gaming and creator accessories selected for function, style and content potential.',
    image: '/products/wavemic/1_a09d4f0d-2641-4a83-9da9-58e22e5d8d55.jpg',
    href: '/category/gaming',
    cta: 'Explore setup gear',
  },
]

const trust = [
  { icon: Lock, title: 'Secure checkout', text: 'Safe & encrypted' },
  { icon: BadgeCheck, title: 'Curated gear', text: 'Quality selected' },
  { icon: Truck, title: 'Tracked shipping', text: 'Fast & reliable' },
  { icon: Headphones, title: 'Support', text: "We're here" },
]

export default function HomeHeroSlider() {
  const [active, setActive] = useState(0)
  const slide = slides[active]

  useEffect(() => {
    const timer = setInterval(() => setActive((v) => (v + 1) % slides.length), 6400)
    return () => clearInterval(timer)
  }, [])

  const go = (direction: number) => {
    setActive((v) => (v + direction + slides.length) % slides.length)
  }

  const slideLabel = useMemo(() => `${active + 1} / ${slides.length}`, [active])

  return (
    <section className="hero-shell noise relative overflow-hidden border-b border-white/10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_76%_18%,rgba(90,120,110,.22),transparent_30%),radial-gradient(circle_at_18%_38%,rgba(255,255,255,.055),transparent_25%)]" />
      <div className="absolute inset-y-0 left-0 hidden w-[54%] bg-[linear-gradient(112deg,rgba(0,0,0,.72)_0%,rgba(0,0,0,.63)_58%,transparent_59%)] lg:block" />

      <button
        type="button"
        onClick={() => go(-1)}
        className="hero-arrow left-4 md:left-8"
        aria-label="Previous promo slide"
      >
        <ArrowLeft size={22} />
      </button>
      <button
        type="button"
        onClick={() => go(1)}
        className="hero-arrow right-4 md:right-8"
        aria-label="Next promo slide"
      >
        <ArrowRight size={22} />
      </button>

      <div className="relative mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-10 px-5 py-16 lg:grid-cols-[.92fr_1.08fr] lg:py-20">
        <div className="z-10 max-w-xl pt-8 lg:pt-0">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[.045] px-4 py-2 text-xs font-black uppercase tracking-[.24em] text-white/58 shadow-[0_16px_55px_rgba(0,0,0,.35)] backdrop-blur-xl">
            <ShieldCheck size={14} /> Tactical • Automotive • Gaming • Utility
          </div>

          <div className="flex items-center gap-4">
            <img src="/asorta-icon.png" alt="ASORTA icon" className="hidden h-20 w-20 object-contain drop-shadow-[0_12px_32px_rgba(255,255,255,.12)] sm:block" />
            <div>
              <h1 className="asorta-hero-title">ASORTA</h1>
              <p className="mt-2 text-sm font-black uppercase tracking-[.30em] text-white/48 sm:text-base">Just what you need.</p>
            </div>
          </div>

          <p className="mt-7 max-w-lg text-base leading-7 text-white/62 md:text-lg">
            Premium gear voor modern carry, automotive upgrades, gaming setups, desk organization en smart daily utility — geselecteerd op kwaliteit, uitstraling en echte bruikbaarheid.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/shop" className="btn-primary">
              Explore Collection <ArrowRight className="ml-2" size={18} />
            </Link>
            <Link href="#featured" className="btn-secondary">
              Best Sellers
            </Link>
          </div>

          <div className="mt-10 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
            {trust.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-2xl border border-white/10 bg-white/[.045] p-4 shadow-[0_18px_60px_rgba(0,0,0,.22)] backdrop-blur-xl transition hover:-translate-y-1 hover:border-white/20 hover:bg-white/[.07]">
                <Icon className="mb-2 text-white/75" size={20} />
                <p className="text-xs font-black text-white/88">{title}</p>
                <p className="mt-1 text-xs text-white/42">{text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <div className="absolute -inset-5 rounded-[2.5rem] bg-[radial-gradient(circle_at_50%_50%,rgba(98,132,148,.22),transparent_62%)] blur-2xl" />
          <div className="relative overflow-hidden rounded-[2rem] border border-white/12 bg-white/[.045] p-3 shadow-[0_40px_140px_rgba(0,0,0,.56)] backdrop-blur-xl">
            <div className="relative h-[340px] overflow-hidden rounded-[1.55rem] bg-[#080808] md:h-[520px]">
              {slides.map((s, idx) => (
                <img
                  key={s.title}
                  src={s.image}
                  alt={s.title}
                  className={`absolute inset-0 h-full w-full object-cover transition duration-700 ${idx === active ? 'scale-100 opacity-85' : 'scale-105 opacity-0'}`}
                />
              ))}
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,.42),transparent_44%),linear-gradient(0deg,rgba(0,0,0,.54),transparent_55%)]" />
              <div className="absolute bottom-5 left-5 right-5 rounded-3xl border border-white/10 bg-[#07101a]/78 p-5 shadow-[0_24px_80px_rgba(0,0,0,.45)] backdrop-blur-xl md:left-auto md:w-[78%]">
                <p className="text-xs font-black uppercase tracking-[.28em] text-white/45">{slide.kicker}</p>
                <h2 className="mt-2 text-2xl font-black leading-tight md:text-3xl">{slide.title}</h2>
                <p className="mt-2 text-sm leading-6 text-white/58">{slide.subtitle}</p>
                <Link href={slide.href} className="mt-4 inline-flex items-center gap-2 text-sm font-black text-white/75 transition hover:text-white">
                  {slide.cta} <ArrowRight size={16} />
                </Link>
              </div>
              <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-3 md:bottom-8">
                {slides.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActive(idx)}
                    className={`h-2 rounded-full transition-all ${idx === active ? 'w-8 bg-white shadow-[0_0_20px_rgba(255,255,255,.45)]' : 'w-2 bg-white/35 hover:bg-white/65'}`}
                    aria-label={`Go to promo slide ${idx + 1}`}
                  />
                ))}
              </div>
              <div className="absolute right-5 top-5 rounded-full border border-white/10 bg-black/45 px-3 py-1 text-[11px] font-black text-white/55 backdrop-blur-xl">{slideLabel}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
