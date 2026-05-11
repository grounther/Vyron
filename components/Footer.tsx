import Link from 'next/link'
import { categories } from '@/lib/products'
import { BadgeCheck, Headphones, Lock, Truck } from 'lucide-react'

const trust = [
  { icon: Lock, title: 'Secure checkout', text: 'Encrypted checkout flow zodra payments live gaan.' },
  { icon: BadgeCheck, title: 'Curated gear', text: 'Producten geselecteerd op bruikbaarheid, uitstraling en kwaliteit.' },
  { icon: Truck, title: 'Tracked shipping', text: 'Tracked shipping met duidelijke levertijdcommunicatie.' },
  { icon: Headphones, title: 'Support', text: 'Support via chat/ticketflow en later support@asorta.nl.' },
]

export default function Footer(){return <footer className="mt-16 border-t border-white/10 bg-black/35">
  <div className="mx-auto max-w-7xl px-5 pt-12">
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {trust.map(({icon:Icon,title,text})=><div key={title} className="rounded-2xl border border-white/10 bg-white/[.03] p-4">
        <Icon className="text-white/68" size={20}/>
        <h4 className="mt-3 text-sm font-black">{title}</h4>
        <p className="mt-1 text-xs leading-5 text-white/43">{text}</p>
      </div>)}
    </div>
  </div>
  <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 md:grid-cols-[1.3fr_1fr_1fr_1fr]">
    <div>
      <div className="flex items-center gap-2 font-black tracking-[.45em] text-white"><img src="/asorta-icon.png" alt="" className="h-8 w-8 object-contain"/>ASORTA</div>
      <p className="mt-4 max-w-sm text-sm leading-6 text-white/55">Just what you need. Premium modern utility producten voor dagelijks gebruik, setup upgrades, automotive comfort en smart essentials.</p>
    </div>
    <div><h4 className="font-black">Shop</h4><div className="mt-4 grid gap-2 text-sm text-white/55">{categories.slice(0,5).map(c=><Link key={c.slug} href={`/category/${c.slug}`} className="hover:text-white">{c.name}</Link>)}</div></div>
    <div><h4 className="font-black">Support</h4><div className="mt-4 grid gap-2 text-sm text-white/55"><Link href="/shipping">Shipping</Link><Link href="/returns">Returns</Link><Link href="/contact">Contact</Link><Link href="/faq">FAQ</Link></div></div>
    <div><h4 className="font-black">Payments</h4><div className="mt-4 grid gap-2 text-sm text-white/55"><span>iDEAL | Wero</span><span>PayPal</span><span>Cards</span><span>Apple Pay / Google Pay</span></div></div>
  </div>
  <div className="border-t border-white/10 py-5 text-center text-xs text-white/35">© 2026 ASORTA. Premium utility ecommerce concept.</div>
</footer>}
