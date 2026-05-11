'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight } from 'lucide-react'

const slides = [
  {
    kicker: 'Premium gear',
    title: 'Premium gear.',
    subtitle: 'Built to perform.',
    text: 'Tactical carry, automotive utility en smart everyday upgrades — geselecteerd op kwaliteit, uitstraling en echte bruikbaarheid.',
    image: '/products/urban-sling/2_ffc916c0-7b8f-4b11-a8a7-c2e014a62fe7.jpg',
    href: '/product/asorta-urban-sling-pro',
    cta: 'View Urban Sling Pro',
    position: 'center center',
  },
  {
    kicker: 'Opening deal',
    title: '10% korting.',
    subtitle: 'Op je gehele bestelling.',
    text: 'Openingsactie voor de eerste ASORTA klanten. Gebruik deze actie tijdens de launch en upgrade je setup voordeliger.',
    image: '/products/drivecharge/13_99d408a4-2bbd-41f4-a3e8-0fc05e190202.jpg',
    href: '/shop',
    cta: 'Shop launch deals',
    position: 'center center',
  },
  {
    kicker: 'Launch system',
    title: 'Clean products.',
    subtitle: 'Built to scale.',
    text: 'ASORTA groeit als curated utility store met launch drops, supplier mapping en premium product pages.',
    image: '/products/ambientdrive/1_1620630875996.jpg',
    href: '/shop',
    cta: 'Shop launch catalog',
    position: 'center center',
  },
  {
    kicker: 'Creator setup',
    title: 'Sharper setups.',
    subtitle: 'Better utility.',
    text: 'Desk, gaming en creator accessoires geselecteerd voor functie, stijl en content potential.',
    image: '/products/wavemic/1_a09d4f0d-2641-4a83-9da9-58e22e5d8d55.jpg',
    href: '/category/gaming',
    cta: 'Explore setup gear',
    position: 'center center',
  },
]

export default function HomeHeroSlider() {
  const [active, setActive] = useState(0)
  const slide = slides[active]

  useEffect(() => {
    const timer = setInterval(() => setActive((v) => (v + 1) % slides.length), 7000)
    return () => clearInterval(timer)
  }, [])

  const go = (direction: number) => {
    setActive((v) => (v + direction + slides.length) % slides.length)
  }

  const slideLabel = useMemo(() => `${active + 1} / ${slides.length}`, [active])

  return (
    <section className="asorta-flagship-hero relative overflow-hidden border-b border-white/10">
      <div className="asorta-hero-base" />

      <div className="asorta-hero-media" aria-hidden="true">
        {slides.map((s, idx) => (
          <img
            key={s.title}
            src={s.image}
            alt=""
            className={`asorta-hero-slide ${idx === active ? 'is-active' : ''}`}
            style={{ objectPosition: s.position }}
          />
        ))}
        <div className="asorta-hero-media-vignette" />
      </div>

      <div className="asorta-hero-divider" aria-hidden="true" />

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

      <div className="relative z-10 mx-auto grid min-h-[650px] max-w-[1440px] items-center px-5 py-20 md:min-h-[710px] lg:grid-cols-[.78fr_1.22fr] lg:px-8 lg:py-24">
        <div className="asorta-hero-content max-w-[520px] lg:pl-10">
          <div>
            <h1 className="asorta-metal-title">ASORTA</h1>
            <p className="asorta-hero-slogan">Just what you need.</p>
          </div>

          <p className="mt-7 max-w-[500px] text-base leading-7 text-white/66 md:text-lg">
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
          <div className="asorta-slide-card">
            <p className="text-xs font-black uppercase tracking-[.34em] text-white/62">{slide.kicker}</p>
            <h2 className="mt-2 text-2xl font-black leading-tight">{slide.title}</h2>
            <p className="text-lg font-bold uppercase tracking-[.14em] text-white/56">{slide.subtitle}</p>
          </div>

          <div className="asorta-slide-dots">
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
          <div className="asorta-slide-counter">{slideLabel}</div>
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
