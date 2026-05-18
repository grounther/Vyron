import Link from 'next/link'
import { BadgeCheck, Headphones, Lock, Truck } from 'lucide-react'
import { categories } from '@/lib/products'
import { categoryName } from '@/lib/i18n/config'
import { getServerDictionary, getServerLocale } from '@/lib/i18n/server'

export default async function Footer(){
  const [locale, dict] = await Promise.all([getServerLocale(), getServerDictionary()])
  const trust = [
    { icon: Lock, title: dict.footer.secureCheckout, text: dict.footer.secureCheckoutText },
    { icon: BadgeCheck, title: dict.footer.curatedGear, text: dict.footer.curatedGearText },
    { icon: Truck, title: dict.footer.trackedShipping, text: dict.footer.trackedShippingText },
    { icon: Headphones, title: dict.footer.support, text: dict.footer.supportText },
  ]

  return <footer className="mt-12 border-t border-white/10 bg-black/35 sm:mt-16">
  <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-5 sm:pt-12">
    <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
      {trust.map(({icon:Icon,title,text})=><div key={title} className="rounded-2xl border border-white/10 bg-white/[.035] p-4">
        <Icon size={20} className="text-white/70"/>
        <h4 className="mt-3 text-sm font-black">{title}</h4>
        <p className="mt-1 text-xs leading-5 text-white/45">{text}</p>
      </div>)}
    </div>
  </div>
  <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-5 sm:py-12 md:grid-cols-[1.3fr_1fr_1fr_1fr]">
    <div>
      <div className="font-black tracking-[.35em] text-white sm:tracking-[.45em]">ASORTA</div>
      <p className="mt-4 max-w-sm text-sm leading-6 text-white/55">{dict.footer.brandText}</p>
    </div>
    <div><h4 className="font-black">Shop</h4><div className="mt-4 grid gap-2 text-sm text-white/55">{categories.slice(0,5).map(c=><Link key={c.slug} href={`/category/${c.slug}`} className="hover:text-white">{categoryName(locale, c.slug, c.name)}</Link>)}</div></div>
    <div><h4 className="font-black">Support</h4><div className="mt-4 grid gap-2 text-sm text-white/55"><Link href="/shipping">Shipping</Link><Link href="/returns">Returns</Link><Link href="/contact">Contact</Link><Link href="/faq">FAQ</Link></div></div>
    <div><h4 className="font-black">{dict.footer.payments}</h4><div className="mt-4 grid gap-2 text-sm text-white/55"><span>PayPal</span><span>iDEAL | Wero</span><span>Cards</span><span>Apple Pay / Google Pay</span></div></div>
  </div>
  <div className="border-t border-white/10 px-4 py-5 text-center text-xs text-white/35">© 2026 ASORTA. Premium utility ecommerce concept.</div>
</footer>
}
