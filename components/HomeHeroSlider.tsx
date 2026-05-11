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
    const timer = setInterval(() => {
      setActive((current) => (current + 1) % slides.length)
    }, 6500)

    return () => clearInterval(timer)
  }, [])

  const go = (direction: number) => {
    setActive((current) => (current + direction + slides.length) % slides.length)
  }

  return (
    <section className="asorta-flagship noise">
      <div className="asorta-flagship-orb asorta-flagship-orb-blue" />
      <div className="asorta-flagship-orb asorta-flagship-orb-red" />
      <div className="asorta-flagship-lines" />

      <div className="asorta-flagship-copy">
        <p className="asorta-flagship-kicker">
          Tactical • Automotive • Gaming • Utility
        </p>

        <h1 className="asorta-hero-title-image-wrap">
          <img
            src="/asorta-hero-title.png"
            alt="ASORTA - Just what you need."
            className="asorta-hero-title-image"
          />
        </h1>

        <p className="asorta-flagship-text">
          Premium gear voor modern carry, automotive upgrades, gaming setups,
          desk organization en smart daily utility — geselecteerd op kwaliteit,
          uitstraling en echte bruikbaarheid.
        </p>

        <div className="asorta-flagship-actions">
          <Link href="/shop" className="btn-primary">
            Explore Collection <ArrowRight className="ml-2" size={18} />
          </Link>

          <Link href="#featured" className="btn-secondary">
            Best Sellers
          </Link>
        </div>
      </div>

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

        <button
          type="button"
          onClick={() => go(-1)}
          className="asorta-flagship-arrow asorta-flagship-arrow-left"
          aria-label="Vorige slide"
        >
          <ArrowLeft size={22} />
        </button>

        <button
          type="button"
          onClick={() => go(1)}
          className="asorta-flagship-arrow asorta-flagship-arrow-right"
          aria-label="Volgende slide"
        >
          <ArrowRight size={22} />
        </button>

        <div className="asorta-flagship-card">
          <p>{slide.kicker}</p>
          <h2>{slide.title}</h2>
          <span>{slide.subtitle}</span>
        </div>

        <div className="asorta-flagship-dots">
          {slides.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setActive(index)}
              className={index === active ? 'active' : ''}
              aria-label={`Ga naar slide ${index + 1}`}
            />
          ))}
        </div>
      </div>

      <div className="asorta-mobile-flagship-card">
        <img
          src={slide.image}
          alt={slide.title}
          style={{ objectPosition: slide.position || 'center center' }}
        />

        <div>
          <p>{slide.kicker}</p>
          <h2>{slide.title}</h2>
          <span>{slide.text}</span>

          <Link href={slide.href}>
            {slide.cta} <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  )
}