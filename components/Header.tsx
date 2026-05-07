import Link from 'next/link'
import { Menu, Search, ShoppingBag } from 'lucide-react'

const links = [
  ['Shop','/shop'], ['Tactical','/category/tactical'], ['Automotive','/category/automotive'], ['Desk','/category/desk-setup'], ['Gaming','/category/gaming']
]

export default function Header(){
  return <header className="glass sticky top-0 z-50">
    <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
      <Link href="/" className="group flex items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-xl border border-white/15 bg-white/[.06] font-black tracking-tighter transition group-hover:border-white/30">V</span>
        <span className="font-black tracking-[.38em] text-white/90">VYRON</span>
      </Link>
      <nav className="hidden items-center gap-7 text-sm font-bold text-white/60 lg:flex">
        {links.map(([label,href])=><Link key={href} href={href} className="transition hover:text-white">{label}</Link>)}
      </nav>
      <div className="flex items-center gap-2">
        <Link href="/search" className="hidden rounded-full border border-white/10 p-2.5 text-white/70 transition hover:bg-white/10 md:inline-flex" aria-label="Search"><Search size={18}/></Link>
        <Link href="/cart" className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-black transition hover:-translate-y-0.5"><ShoppingBag size={17}/> Cart</Link>
        <button className="rounded-full border border-white/10 p-2.5 text-white/70 lg:hidden" aria-label="Menu"><Menu size={18}/></button>
      </div>
    </div>
  </header>
}
