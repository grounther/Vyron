'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight } from 'lucide-react'

const slides = [
  {
    kicker: 'Premium gear',
    title: 'Premium gear.',
    subtitle: 'Built to perform.',
    image: '/products/urban-sling/2_ffc916c0-7b8f-4b11-a8a7-c2e014a62fe7.jpg',
    position: 'center center',
  },
  {
    kicker: 'Opening actie',
    title: '10% korting.',
    subtitle: 'Op de gehele bestelling.',
    image: '/products/urban-sling/1_396fbdc2-a8a9-4493-95fc-327e15a1a82a.jpg',
    position: 'center center',
  },
  {
    kicker: 'Automotive utility',
    title: 'Upgrade your drive.',
    subtitle: 'Clean cockpit utility.',
    image: '/products/drivecharge/13_99d408a4-2bbd-41f4-a3e8-0fc05e190202.jpg',
    position: 'center center',
  },
  {
    kicker: 'Creator setup',
    title: 'Sharper setups.',
    subtitle: 'Better utility.',
    image: '/products/wavemic/1_a09d4f0d-2641-4a83-9da9-58e22e5d8d55.jpg',
    position: 'center top',
  },
]

export default function HomeHeroSlider() {
  const [active, setActive] = useState(0)
  const slide = slides[active]

  useEffect(() => {
    const timer = setInterval(() => {
      setActive((current) => (current + 1) % slides.length)
    }, 7000)

    return () => clearInterval(timer)
  }, [])

  const slideLabel = useMemo(() => `${active + 1} / ${slides.length}`, [active])

  const go = (direction: number) => {
    setActive((current) => (current + direction + slides.length) % slides.length)
  }

  return (
    <section className="asorta-flagship-hero">
      <button
        type="button"
        onClick={() => go(-1)}
        className="hero-arrow left-5 md:left-8"
        aria-label="Vorige slide"
      >
        <ArrowLeft size={22} />
      </button>

      <button
        type="button"
        onClick={() => go(1)}
        className="hero-arrow right-5 md:right-8"
        aria-label="Volgende slide"
      >
        <ArrowRight size={22} />
      </button>

      <div className="asorta-hero-left">
        <div className="asorta-hero-content">
          <h1 className="asorta-metal-title">ASORTA</h1>

          <p className="asorta-hero-slogan">JUST WHAT YOU NEED.</p>

          <p className="asorta-hero-description">
            Premium gear voor modern carry, automotive upgrades, gaming setups,
            desk organization en smart daily utility — geselecteerd op kwaliteit,
            uitstraling en echte bruikbaarheid.
          </p>

          <div className="asorta-hero-actions">
            <Link href="/shop" className="btn-primary">
              Explore Collection <ArrowRight className="ml-2" size={18} />
            </Link>

            <Link href="#featured" className="btn-secondary">
              Best Sellers
            </Link>
          </div>
        </div>
      </div>

      <div className="asorta-hero-divider" />

      <div className="asorta-hero-right">
        {slides.map((item, index) => (
          <div
            key={item.kicker}
            className={`asorta-hero-image ${index === active ? 'active' : ''}`}
            style={{
              backgroundImage: `url(${item.image})`,
              backgroundPosition: item.position,
            }}
          />
        ))}

        <div className="asorta-hero-right-overlay" />

        <div className="asorta-slide-count">{slideLabel}</div>

        <div className="asorta-premium-card">
          <p>{slide.kicker}</p>
          <h2>{slide.title}</h2>
          <span>{slide.subtitle}</span>
        </div>

        <div className="asorta-slide-dots">
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
    </section>
  )
}