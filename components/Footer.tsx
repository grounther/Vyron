import Link from 'next/link'
import { categories } from '@/lib/products'

export default function Footer(){return <footer className="mt-16 border-t border-white/10 bg-black/35">
  <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 md:grid-cols-[1.3fr_1fr_1fr_1fr]">
    <div>
      <div className="font-black tracking-[.45em] text-white">ASORTA</div>
      <p className="mt-4 max-w-sm text-sm leading-6 text-white/55">Just what you need. Premium modern utility producten voor dagelijks gebruik, setup upgrades, automotive comfort en smart essentials.</p>
    </div>
    <div><h4 className="font-black">Shop</h4><div className="mt-4 grid gap-2 text-sm text-white/55">{categories.slice(0,5).map(c=><Link key={c.slug} href={`/category/${c.slug}`} className="hover:text-white">{c.name}</Link>)}</div></div>
    <div><h4 className="font-black">Support</h4><div className="mt-4 grid gap-2 text-sm text-white/55"><Link href="/shipping">Shipping</Link><Link href="/returns">Returns</Link><Link href="/contact">Contact</Link><Link href="/faq">FAQ</Link></div></div>
    <div><h4 className="font-black">Payments</h4><div className="mt-4 grid gap-2 text-sm text-white/55"><span>iDEAL | Wero</span><span>PayPal</span><span>Cards</span><span>Apple Pay / Google Pay</span></div></div>
  </div>
  <div className="border-t border-white/10 py-5 text-center text-xs text-white/35">© 2026 ASORTA. Premium utility ecommerce concept.</div>
</footer>}
