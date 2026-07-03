'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BadgeCheck, Headphones, Leaf, Lock, Scissors, Shirt, Sparkles, Truck } from 'lucide-react'
import type { ComponentType } from 'react'

type TrustItem = {
  title: string
  text: string
  icon: 'Lock' | 'BadgeCheck' | 'Truck' | 'Headphones'
}

type FooterClientProps = {
  trust: TrustItem[]
  payments: string[]
  supportTitle: string
  paymentsTitle: string
  copyright: string
  tcgLinks: { href: string; label: string }[]
}

const tcgIcons: Record<TrustItem['icon'], ComponentType<{ size?: number; className?: string }>> = {
  Lock,
  BadgeCheck,
  Truck,
  Headphones,
}

const fashionTrust = [
  {
    icon: Leaf,
    title: 'Natuurlijke materialen',
    text: 'Linnen, zijdeblends en premium katoen vormen de basis van The First Edit.',
  },
  {
    icon: Scissors,
    title: 'Subtiele afwerking',
    text: 'Sierlijk OK-logo aan de mouw/manchet, ton-sur-ton en ingetogen.',
  },
  {
    icon: Sparkles,
    title: 'Quiet luxury',
    text: 'Rustige kleuren, luxe textuur en moderne pasvormen zonder poespas.',
  },
  {
    icon: Shirt,
    title: 'Complete sets',
    text: 'Bovenstukken, broeken en shorts opgebouwd rond echte color stories.',
  },
]

export default function FooterClient({ trust, payments, supportTitle, paymentsTitle, copyright, tcgLinks }: FooterClientProps) {
  const pathname = usePathname() || ''
  const isFashion = pathname.startsWith('/okfashion')

  if (isFashion) {
    return (
      <footer className="ok-fashion mt-12 border-t border-[#1f1712]/10 bg-[#f3ecdf] text-[#1f1712] sm:mt-16">
        <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-5 sm:pt-12">
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
            {fashionTrust.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-2xl border border-[#1f1712]/10 bg-[#fcf8f1] p-4 shadow-[0_16px_50px_rgba(95,73,48,.08)]">
                <Icon size={20} className="text-[#7a6248]" />
                <h4 className="mt-3 text-sm font-black">{title}</h4>
                <p className="mt-1 text-xs leading-5 text-[#4b3d31]/58">{text}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-5 sm:py-12 md:grid-cols-[1.3fr_1fr_1fr_1fr]">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[.34em] text-[#7a6248]">by ASORTA</p>
            <div className="mt-2 font-serif text-4xl tracking-[-.06em] text-[#1f1712]">OK Fashion</div>
            <p className="mt-4 max-w-sm text-sm leading-6 text-[#4b3d31]/62">
              Premium kleding voor mensen die kwaliteit niet uitgelegd hoeven te krijgen. Natuurlijke materialen, rustige kleuren en subtiele details.
            </p>
          </div>
          <div>
            <h4 className="font-black">OK Fashion</h4>
            <div className="mt-4 grid gap-2 text-sm text-[#4b3d31]/62">
              <Link href="/okfashion" className="hover:text-[#1f1712]">Lookbook</Link>
              <Link href="/okfashion/shop" className="hover:text-[#1f1712]">Shop</Link>
              <Link href="/okfashion#first-edit" className="hover:text-[#1f1712]">The First Edit</Link>
              <Link href="/okfashion#ok-detail" className="hover:text-[#1f1712]">The OK Detail</Link>
            </div>
          </div>
          <div>
            <h4 className="font-black">Collectie</h4>
            <div className="mt-4 grid gap-2 text-sm text-[#4b3d31]/62">
              <Link href="/okfashion/product/premium-cotton-t-shirt" className="hover:text-[#1f1712]">Cotton Essentials</Link>
              <Link href="/okfashion/product/linen-shirt" className="hover:text-[#1f1712]">Linen Resort</Link>
              <Link href="/okfashion/product/overshirt" className="hover:text-[#1f1712]">Overshirts</Link>
              <Link href="/okfashion/product/silk-blend-shirt" className="hover:text-[#1f1712]">Silk Evening</Link>
            </div>
          </div>
          <div>
            <h4 className="font-black">Service</h4>
            <div className="mt-4 grid gap-2 text-sm text-[#4b3d31]/62">
              <Link href="/contact" className="hover:text-[#1f1712]">Contact</Link>
              <Link href="/shipping" className="hover:text-[#1f1712]">Verzending</Link>
              <Link href="/returns" className="hover:text-[#1f1712]">Retouren</Link>
              <Link href="/privacy" className="hover:text-[#1f1712]">Privacy</Link>
              <Link href="/terms" className="hover:text-[#1f1712]">Voorwaarden</Link>
            </div>
          </div>
        </div>
        <div className="border-t border-[#1f1712]/10 px-4 py-5 text-center text-xs text-[#4b3d31]/45">© OK Fashion by ASORTA. Quiet luxury, made simple.</div>
      </footer>
    )
  }

  return (
    <footer className="mt-12 border-t border-white/10 bg-black/35 sm:mt-16">
      <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-5 sm:pt-12">
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
          {trust.map(({ icon, title, text }) => {
            const Icon = tcgIcons[icon]
            return (
              <div key={title} className="rounded-2xl border border-white/10 bg-white/[.035] p-4">
                <Icon size={20} className="text-white/70" />
                <h4 className="mt-3 text-sm font-black">{title}</h4>
                <p className="mt-1 text-xs leading-5 text-white/45">{text}</p>
              </div>
            )
          })}
        </div>
      </div>
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-5 sm:py-12 md:grid-cols-[1.3fr_1fr_1fr_1fr]">
        <div>
          <div className="font-black tracking-[.35em] text-white sm:tracking-[.45em]">ASORTA</div>
          <p className="mt-4 max-w-sm text-sm leading-6 text-white/55">ASORTA brengt twee werelden samen: Trading Card Game producten en OK Fashion premium kleding. Eén platform, twee eigen shops.</p>
        </div>
        <div>
          <h4 className="font-black">Shops</h4>
          <div className="mt-4 grid gap-2 text-sm text-white/55">
            <Link href="/tcg" className="hover:text-white">Trading Card Game</Link>
            <Link href="/okfashion" className="hover:text-white">OK Fashion</Link>
            <Link href="/shop" className="hover:text-white">TCG shop</Link>
            {tcgLinks.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-white">{link.label}</Link>
            ))}
          </div>
        </div>
        <div>
          <h4 className="font-black">{supportTitle}</h4>
          <div className="mt-4 grid gap-2 text-sm text-white/55"><Link href="/about">Over ASORTA</Link><Link href="/track-order">Order volgen</Link><Link href="/shipping">Shipping</Link><Link href="/returns">Returns</Link><Link href="/contact">Contact</Link><Link href="/faq">FAQ</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></div>
        </div>
        <div>
          <h4 className="font-black">{paymentsTitle}</h4>
          <div className="mt-4 grid gap-2 text-sm text-white/55">{payments.map((payment) => <span key={payment}>{payment}</span>)}</div>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-5 text-center text-xs text-white/35">{copyright}</div>
    </footer>
  )
}
