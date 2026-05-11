'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight } from 'lucide-react'

type HeroSlide = {
  kicker: string
  title: string
  subtitle: string
  text: string
  image: string
  href: string
  cta: string
  position?: string
}

const slides: HeroSlide[] = [
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
    kicker: 'Openingsactie',
    title: '10% korting.',
    subtitle: 'Op de gehele bestelling.',
    text: 'Vier de ASORTA launch met 10% korting op je complete bestelling. Actie tijdelijk beschikbaar tijdens de openingsfase.',
    image: '/products/drivecharge/13_99d408a4-2bbd-41f4-a3e8-0fc05e190202.jpg',
    href: '/shop',
    cta: 'Shop met korting',
    position: 'center center',
  },
  {
    kicker: 'Automotive drop',
    title: 'Upgrade your drive.',
    subtitle: 'Clean cockpit utility.',
    text: 'Wireless charging, interior ambiance en practical car accessories voor moderne bestuurders.',
    image: '/products/drivecharge/1_1c3d32e3-9eb6-47f9-b217-e2911571c64a.jpg',
    href: '/category/automotive',
    cta: 'Explore automotive',
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
    position: 'center top',
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
    <section className="asorta-flagship-hero noise relative overflow-hidden border-b border-white/10">
      <div className="flagship-bg-glow" />

      {/* De productfoto's aan de rechterkant */}
      <div className="flagship-visual" aria-hidden="true">
        {slides.map((s, idx) => (
          <img
            key={s.title}
            src={s.image}
            alt=""
            style={{ objectPosition: s.position || 'center center' }}
            className={`flagship-slide-image ${idx === active ? 'is-active' : ''}`}
          />
        ))}
        <div className="flagship-image-grade" />
      </div>

      {/* DE TACTICAL DIVIDER MET TEXTUUR - Start 60% boven, Eind 40% onder */}
      <div className="flagship-divider" />

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
        className="hero-arrow right-4 md:left-8" /* Fixed position in original but moved to right 8 */
        aria-label="Next promo slide"
      >
        <ArrowRight size={22} />
      </button>

      <div className="relative mx-auto grid min-h-[620px] max-w-[1500px] items-center px-5 py-18 md:min-h-[680px] lg:grid-cols-[1fr_1fr] lg:px-10">
        <div className="flagship-copy z-10 max-w-[570px] lg:pl-8">
<<<<<<< HEAD
          {/* Categorie labels toegevoegd */}
          <p className="mb-2 text-[10px] font-black uppercase tracking-[.45em] text-white/40">
            Tactical • Automotive • Gaming • Utility
          </p>
          
          {/* Titel met Open O */}
          <h1 className="asorta-metal-title">AS<span className="open-o">O</span>RTA</h1>
=======
          {/* Titel exact zoals in de afbeelding */}
          <h1 className="asorta-metal-title">ASORTA</h1>
>>>>>>> d1ece6f (Upgrade ASORTA to v5.6 cinematic flagship polish)
          <p className="mt-4 text-sm font-black uppercase tracking-[.34em] text-white/48 md:text-base">Just what you need.</p>

          <p className="mt-7 max-w-lg text-base leading-7 text-white/68 md:text-lg">
            {slide.text}
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
          {/* USP Badge rechtsonder */}
          <div className="absolute bottom-[8%] right-[5.4rem] bg-black/40 border border-white/10 p-4 backdrop-blur-md">
            <p className="text-[11px] font-black uppercase tracking-[.25em] text-white/90 text-right">PREMIUM GEAR.</p>
            <p className="text-[9px] font-bold uppercase tracking-[.20em] text-white/40 text-right">BUILT TO PERFORM.</p>
          </div>

          <div className="flagship-dots">
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

          <div className="flagship-counter">{slideLabel}</div>

          {/* USP Badge toegevoegd */}
          <div className="absolute bottom-[8%] right-[5.4rem] hidden lg:block text-right">
            <div className="h-[1px] w-12 bg-orange-500 mb-3 ml-auto" />
            <p className="text-[11px] font-black uppercase tracking-[.25em] text-white/90">Premium Gear.</p>
            <p className="text-[9px] font-bold uppercase tracking-[.20em] text-white/40">Built to perform.</p>
          </div>
        </div>
      </div>
    </section>
  )
}