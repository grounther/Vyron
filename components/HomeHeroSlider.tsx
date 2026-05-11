'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight } from 'lucide-react'

const slides = [
  {
    kicker: 'Openingsactie',
    title: '10% korting.',
    subtitle: 'Op de gehele bestelling.',
    text: 'Tijdelijke launch deal voor de eerste ASORTA klanten. De kortingscode en voorwaarden worden straks beheerd vanuit Atlas.',
    image: '/products/urban-sling/2_ffc916c0-7b8f-4b11-a8a7-c2e014a62fe7.jpg',
    href: '/shop',
    cta: 'Shop met launch voordeel',
  },
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
    <section className="cinematic-hero clean-split-hero noise relative overflow-hidden border-b border-white/10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_18%,rgba(76,112,129,.18),transparent_34%),radial-gradient(circle_at_18%_42%,rgba(255,255,255,.035),transparent_24%)]" />

      <div className="absolute inset-y-0 right-0 w-full overflow-hidden lg:w-[65%]">
        {slides.map((s, idx) => (
          <img
            key={s.title + idx}
            src={s.image}
            alt={s.title}
            className={`absolute inset-0 h-full w-full object-cover transition duration-700 ease-out ${idx === active ? 'scale-100 opacity-70' : 'scale-105 opacity-0'}`}
          />
        ))}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,5,5,.96)_0%,rgba(5,5,5,.52)_24%,rgba(5,5,5,.16)_56%,rgba(5,5,5,.18)_100%)] lg:bg-[linear-gradient(90deg,rgba(5,5,5,.55)_0%,rgba(5,5,5,.13)_42%,rgba(5,5,5,.08)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_74%_58%,rgba(88,145,170,.13),transparent_34%)]" />
      </div>

      <div className="hero-left-panel absolute inset-y-0 left-0 hidden w-[38%] lg:block" />
      <div className="hero-divider absolute inset-y-0 left-[37.5%] hidden lg:block" />

      <button type="button" onClick={() => go(-1)} className="hero-arrow left-4 md:left-8" aria-label="Previous promo slide">
        <ArrowLeft size={22} />
      </button>
      <button type="button" onClick={() => go(1)} className="hero-arrow right-4 md:right-8" aria-label="Next promo slide">
        <ArrowRight size={22} />
      </button>

      <div className="relative mx-auto grid min-h-[650px] max-w-[1440px] items-center px-5 py-20 md:min-h-[720px] lg:grid-cols-[.58fr_1fr] lg:px-8 lg:py-24">
        <div className="z-10 max-w-xl lg:pl-10">
          <div className="clean-brand-lockup">
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
        </div>

        <div className="relative z-10 hidden h-full lg:block">
          <div className="absolute bottom-[17%] right-10 w-[320px] rounded-xl border border-white/10 bg-black/58 p-5 shadow-[0_24px_80px_rgba(0,0,0,.52)] backdrop-blur-xl">
            <p className="text-xs font-black uppercase tracking-[.34em] text-white/62">{slide.kicker}</p>
            <h2 className="mt-2 text-2xl font-black leading-tight">{slide.title}</h2>
            <p className="text-lg font-bold uppercase tracking-[.14em] text-white/56">{slide.subtitle}</p>
          </div>
          <div className="absolute bottom-[7%] left-[20%] flex gap-3">
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
