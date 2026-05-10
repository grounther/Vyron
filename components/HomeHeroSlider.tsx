'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, BadgeCheck, Lock, ShieldCheck, Truck } from 'lucide-react'

const slides = [
  {
    kicker: 'Premium gear',
    title: 'Premium gear.',
    subtitle: 'Built to perform.',
    text: 'Tactical carry, automotive utility en smart everyday upgrades — geselecteerd op kwaliteit, uitstraling en echte bruikbaarheid.',
    image: '/products/urban-sling/2_ffc916c0-7b8f-4b11-a8a7-c2e014a62fe7.jpg',
    href: '/product/asorta-urban-sling-pro',
    cta: 'View Urban Sling Pro',
  },
  {
    kicker: 'Automotive drop',
    title: 'Upgrade your drive.',
    subtitle: 'Clean cockpit utility.',
    text: 'Wireless charging, interior ambiance en practical car accessories voor moderne bestuurders.',
    image: '/products/drivecharge/13_99d408a4-2bbd-41f4-a3e8-0fc05e190202.jpg',
    href: '/category/automotive',
    cta: 'Explore automotive',
  },
  {
    kicker: 'Launch system',
    title: 'Clean products.',
    subtitle: 'Built to scale.',
    text: 'ASORTA groeit als curated utility store met launch drops, supplier mapping en premium product pages.',
    image: '/products/ambientdrive/1_1620630875996.jpg',
    href: '/shop',
    cta: 'Shop launch catalog',
  },
  {
    kicker: 'Creator setup',
    title: 'Sharper setups.',
    subtitle: 'Better utility.',
    text: 'Desk, gaming en creator accessoires geselecteerd voor functie, stijl en content potential.',
    image: '/products/wavemic/1_a09d4f0d-2641-4a83-9da9-58e22e5d8d55.jpg',
    href: '/category/gaming',
    cta: 'Explore setup gear',
  },
]

const trust = [
  { icon: Lock, title: 'Secure checkout', text: 'Safe & encrypted' },
  { icon: BadgeCheck, title: 'Curated gear', text: 'Quality selected' },
  { icon: Truck, title: 'Tracked shipping', text: 'Fast & reliable' },
]

export default function HomeHeroSlider() {
  const [active, setActive] = useState(0)
  const slide = slides[active]

  useEffect(() => {
    const timer = setInterval(() => setActive((v) => (v + 1) % slides.length), 6500)
    return () => clearInterval(timer)
  }, [])

  const go = (direction: number) => {
    setActive((v) => (v + direction + slides.length) % slides.length)
  }

  const slideLabel = useMemo(() => `${active + 1} / ${slides.length}`, [active])

  return (
    <section className="cinematic-hero noise relative overflow-hidden border-b border-white/10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_74%_14%,rgba(76,112,129,.22),transparent_30%),radial-gradient(circle_at_18%_40%,rgba(255,255,255,.045),transparent_24%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,#050505_0%,rgba(5,5,5,.94)_30%,rgba(5,5,5,.68)_47%,rgba(5,5,5,.08)_70%,rgba(5,5,5,.18)_100%)]" />
      <div className="absolute inset-y-0 right-0 w-[64%] overflow-hidden">
        {slides.map((s, idx) => (
          <img
            key={s.title}
            src={s.image}
            alt={s.title}
            className={`absolute inset-0 h-full w-full object-cover transition duration-700 ease-out ${idx === active ? 'scale-100 opacity-70' : 'scale-105 opacity-0'}`}
          />
        ))}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#050505_0%,rgba(5,5,5,.72)_20%,rgba(5,5,5,.22)_48%,rgba(5,5,5,.1)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_60%,rgba(80,145,180,.18),transparent_35%)]" />
      </div>
      <div className="absolute inset-y-0 left-[43%] hidden w-52 -skew-x-[16deg] bg-black/50 blur-[1px] lg:block" />

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

      <div className="relative mx-auto grid min-h-[680px] max-w-[1440px] items-center px-5 py-20 md:min-h-[760px] lg:grid-cols-[.95fr_1.05fr] lg:px-8 lg:py-24">
        <div className="z-10 max-w-xl lg:pl-10">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[.045] px-4 py-2 text-xs font-black uppercase tracking-[.24em] text-white/62 shadow-[0_16px_55px_rgba(0,0,0,.35)] backdrop-blur-xl">
            <ShieldCheck size={14} /> Tactical • Automotive • Gaming • Utility
          </div>

          <div>
            <h1 className="asorta-metal-title">ASORTA</h1>
            <p className="mt-3 text-sm font-black uppercase tracking-[.32em] text-white/46 md:text-base">Just what you need.</p>
          </div>

          <p className="mt-7 max-w-lg text-base leading-7 text-white/66 md:text-lg">
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

          <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4 text-sm text-white/52">
            {trust.map(({ icon: Icon, title, text }) => (
              <div key={title} className="hero-trust-inline">
                <Icon className="text-white/82" size={21} />
                <span>
                  <b className="block text-xs font-black text-white/86">{title}</b>
                  <small className="block text-xs text-white/42">{text}</small>
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 hidden h-full lg:block">
          <div className="absolute bottom-[18%] right-10 w-[310px] rounded-xl border border-white/10 bg-black/50 p-5 shadow-[0_24px_80px_rgba(0,0,0,.5)] backdrop-blur-xl">
            <p className="text-xs font-black uppercase tracking-[.34em] text-white/62">{slide.kicker}</p>
            <h2 className="mt-2 text-2xl font-black leading-tight">{slide.title}</h2>
            <p className="text-lg font-bold uppercase tracking-[.14em] text-white/56">{slide.subtitle}</p>
          </div>
          <div className="absolute bottom-[7%] left-[22%] flex gap-3">
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
          <div className="absolute right-10 top-[20%] rounded-full border border-white/10 bg-black/45 px-3 py-1 text-[11px] font-black text-white/55 backdrop-blur-xl">{slideLabel}</div>
        </div>

        <div className="relative z-10 mt-10 rounded-[2rem] border border-white/10 bg-black/42 p-4 shadow-[0_30px_100px_rgba(0,0,0,.5)] backdrop-blur-xl lg:hidden">
          <img src={slide.image} alt={slide.title} className="h-[300px] w-full rounded-[1.4rem] object-cover opacity-80" />
          <div className="mt-4">
            <p className="text-xs font-black uppercase tracking-[.28em] text-white/45">{slide.kicker}</p>
            <h2 className="mt-2 text-2xl font-black leading-tight">{slide.title}</h2>
            <p className="mt-2 text-sm leading-6 text-white/58">{slide.text}</p>
            <Link href={slide.href} className="mt-4 inline-flex items-center gap-2 text-sm font-black text-white/75 transition hover:text-white">
              {slide.cta} <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
