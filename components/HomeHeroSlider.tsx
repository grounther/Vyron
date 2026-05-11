'use client'

import { useEffect, useState } from 'react'
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
    text: 'Tactical carry, automotive upgrades, gaming setups en smart daily utility — geselecteerd op kwaliteit, uitstraling en echte bruikbaarheid.',
    image: '/products/asorta-urban-sling-pro/2.jpg',
    href: '/product/asorta-urban-sling-pro',
    cta: 'View Urban Sling Pro',
    position: 'center center',
  },
  {
    kicker: 'Automotive drop',
    title: 'Upgrade your drive.',
    subtitle: 'Clean cockpit utility.',
    text: 'Premium mounts, lighting en daily-drive accessoires voor een strakkere cockpit en betere routine.',
    image: '/products/drivecharge/1_1c3d32e3-9eb6-47f9-b217-e2911571c64a.jpg',
    href: '/category/automotive',
    cta: 'Explore automotive',
    position: 'center center',
  },
  {
    kicker: 'Openingsactie',
    title: 'Launch offer.',
    subtitle: '10% on every order.',
    text: 'Vier de ASORTA launch met tijdelijke openingskorting op de volledige collectie.',
    image: '/products/asorta-drivecharge-mount/13.jpg',
    href: '/shop',
    cta: 'Shop launch offer',
    position: 'center center',
  },
  {
    kicker: 'Creator setup',
    title: 'Sharper setups.',
    subtitle: 'Better utility.',
    text: 'Desk, gaming en creator gear voor een strakke setup met premium functionaliteit.',
    image: '/products/asorta-wavemic-rgb/1.jpg',
    href: '/category/gaming',
    cta: 'Explore setup gear',
    position: 'center top',
  },
]

export default function HomeHeroSlider() {
  const [active, setActive] = useState(0)
  const slide = slides[active]

  useEffect(() => {
    const timer = setInterval(() => {
      setActive((current) => (current + 1) % slides.length)
    }, 6800)
    return () => clearInterval(timer)
  }, [])

  const go = (direction: number) => {
    setActive((current) => (current + direction + slides.length) % slides.length)
  }

  return (
<<<<<<< HEAD
<<<<<<< HEAD
    <section className="asorta-flagship-hero noise relative overflow-hidden border-b border-white/10">
      <div className="flagship-bg-glow" />

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

      <div className="relative mx-auto grid min-h-[620px] max-w-[1500px] items-center px-5 py-18 md:min-h-[680px] lg:grid-cols-[.88fr_1.12fr] lg:px-10">
        <div className="flagship-copy z-10 max-w-[570px] lg:pl-8">
<<<<<<< HEAD
<<<<<<< HEAD
          {/* Categorie labels toegevoegd */}
          <p className="mb-2 text-[10px] font-black uppercase tracking-[.45em] text-white/40">
            Tactical • Automotive • Gaming • Utility
          </p>
          
          {/* Titel met Open O */}
          <h1 className="asorta-metal-title">AS<span className="open-o">O</span>RTA</h1>
=======
          {/* Titel exact zoals in de afbeelding */}
=======
>>>>>>> 4144b0f (Tune ASORTA hero visual balance)
          <h1 className="asorta-metal-title">ASORTA</h1>
>>>>>>> d1ece6f (Upgrade ASORTA to v5.6 cinematic flagship polish)
          <p className="mt-4 text-sm font-black uppercase tracking-[.34em] text-white/48 md:text-base">Just what you need.</p>
=======
    <section className="asorta-campaign-hero noise">
      <div className="asorta-campaign-left">
        <div className="asorta-campaign-copy">
          <h1 className="asorta-metal-title">ASORTA</h1>
>>>>>>> 8ad6c8d (Rebuild ASORTA campaign hero)
=======
    <section className="asorta-flagship noise">
      <div className="asorta-flagship-orb asorta-flagship-orb-blue" />
      <div className="asorta-flagship-orb asorta-flagship-orb-red" />
      <div className="asorta-flagship-lines" />
>>>>>>> 4128d8e (rebuild asorta v5.7)

      <div className="asorta-flagship-copy">
        <p className="asorta-flagship-kicker">TACTICAL • AUTOMOTIVE • GAMING • UTILITY</p>
        <h1 className="asorta-hero-title-image-wrap" aria-label="ASORTA — JUST WHAT YOU NEED.">
          <img src="/asorta-title-metal.png" alt="ASORTA — JUST WHAT YOU NEED." className="asorta-hero-title-image" />
        </h1>
        <p className="asorta-flagship-text">
          Premium gear voor modern carry, automotive upgrades, gaming setups, desk organization en smart daily utility — geselecteerd op kwaliteit, uitstraling en echte bruikbaarheid.
        </p>
        <div className="asorta-flagship-actions">
          <Link href="/shop" className="btn-primary">
            Explore Collection <ArrowRight className="ml-2" size={18} />
          </Link>
          <Link href="#featured" className="btn-secondary">Best Sellers</Link>
        </div>
      </div>

      <div className="asorta-flagship-split" />

      <div className="asorta-flagship-scene">
        {slides.map((item, index) => (
          <img
            key={item.title}
            src={item.image}
            alt=""
            className={`asorta-flagship-image ${index === active ? 'active' : ''}`}
            style={{ objectPosition: item.position || 'center center' }}
          />
        ))}
        <div className="asorta-flagship-grade" />

<<<<<<< HEAD
<<<<<<< HEAD
          <div className="flagship-counter">{slideLabel}</div>

          {/* USP Badge toegevoegd */}
          <div className="absolute bottom-[8%] right-[5.4rem] hidden lg:block text-right">
            <div className="h-[1px] w-12 bg-orange-500 mb-3 ml-auto" />
            <p className="text-[11px] font-black uppercase tracking-[.25em] text-white/90">Premium Gear.</p>
            <p className="text-[9px] font-bold uppercase tracking-[.20em] text-white/40">Built to perform.</p>
          </div>
=======
        <div className="asorta-campaign-grade" />

        <button
          type="button"
          onClick={() => go(-1)}
          className="asorta-campaign-arrow asorta-campaign-arrow-left"
          aria-label="Vorige slide"
        >
          <ArrowLeft size={21} />
=======
        <button type="button" onClick={() => go(-1)} className="asorta-flagship-arrow asorta-flagship-arrow-left" aria-label="Vorige slide">
          <ArrowLeft size={22} />
        </button>
        <button type="button" onClick={() => go(1)} className="asorta-flagship-arrow asorta-flagship-arrow-right" aria-label="Volgende slide">
          <ArrowRight size={22} />
>>>>>>> 4128d8e (rebuild asorta v5.7)
        </button>

        <div className="asorta-flagship-card">
          <p>{slide.kicker}</p>
          <h2>{slide.title}</h2>
          <span>{slide.subtitle}</span>
>>>>>>> 8ad6c8d (Rebuild ASORTA campaign hero)
        </div>
        <div className="asorta-flagship-dots">
          {slides.map((_, index) => (
            <button key={index} type="button" onClick={() => setActive(index)} className={index === active ? 'active' : ''} aria-label={`Ga naar slide ${index + 1}`} />
          ))}
        </div>
      </div>

      <div className="asorta-mobile-slide-card asorta-mobile-flagship-card">
        <img src={slide.image} alt={slide.title} style={{ objectPosition: slide.position || 'center center' }} />
        <div>
          <p>{slide.kicker}</p>
          <h2>{slide.title}</h2>
          <span>{slide.text}</span>
          <Link href={slide.href}>{slide.cta} <ArrowRight size={16} /></Link>
        </div>
      </div>
    </section>
  )
}
