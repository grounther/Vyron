import Link from 'next/link'
import ProductCard from '@/components/ProductCard'
import PaymentNote from '@/components/PaymentNote'
import { categories, featured, products } from '@/lib/products'
import { ArrowRight, ShieldCheck, Truck, Sparkles, Zap, Star, Lock, BadgeCheck } from 'lucide-react'

const trust = [
  {i:<ShieldCheck/>,t:'Premium Selection',d:'Alleen producten met utility, marktvraag en premium fit.'},
  {i:<Truck/>,t:'Supplier Filter',d:'Geselecteerd voor betrouwbare fulfillment, tracking en kwaliteit.'},
  {i:<Sparkles/>,t:'Low Refund Focus',d:'Eerlijke specs, duidelijke content en praktische producten.'},
  {i:<Zap/>,t:'Content Ready',d:'Gekozen voor TikTok, Reels en hoge visuele conversie.'}
]

export default function Home(){return <main>
  <section className="noise metal relative min-h-[calc(100vh-4rem)] overflow-hidden px-5 py-16 md:py-24">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_18%,rgba(91,102,83,.34),transparent_34%)]"/>
    <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[#050505] to-transparent"/>
    <div className="relative mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1.02fr_.98fr]">
      <div className="pt-8 md:pt-16">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[.04] px-4 py-2 text-xs font-black uppercase tracking-[.18em] text-white/55"><Star size={14}/> Tactical Luxury Utility</div>
        <h1 className="text-balance text-6xl font-black tracking-[-.06em] md:text-8xl lg:text-9xl">VYRON</h1>
        <p className="mt-4 text-2xl font-semibold text-white/82 md:text-4xl">Engineered for Modern Utility.</p>
        <p className="mt-6 max-w-xl text-base leading-7 text-white/55 md:text-lg">Premium gear voor modern carry, automotive upgrades, gaming setups, desk organization en smart daily utility — geselecteerd op kwaliteit, uitstraling en echte bruikbaarheid.</p>
        <div className="mt-9 flex flex-wrap gap-4"><Link href="/shop" className="btn-primary">Explore Collection <ArrowRight className="ml-2" size={18}/></Link><Link href="#featured" className="btn-secondary">Best Sellers</Link></div>
        <div className="mt-10 grid max-w-xl grid-cols-3 gap-3 text-xs text-white/45">
          <div className="card rounded-2xl p-4"><Lock className="mb-2" size={17}/><b className="text-white/80">Secure checkout</b></div>
          <div className="card rounded-2xl p-4"><BadgeCheck className="mb-2" size={17}/><b className="text-white/80">Curated gear</b></div>
          <div className="card rounded-2xl p-4"><Truck className="mb-2" size={17}/><b className="text-white/80">Tracked shipping</b></div>
        </div>
      </div>
      <div className="relative">
        <div className="absolute -inset-6 rounded-[2.5rem] bg-[radial-gradient(circle,rgba(214,214,214,.12),transparent_62%)] blur-2xl"/>
        <div className="card relative overflow-hidden rounded-[2.2rem] p-3 shadow-2xl">
          <img src="https://images.unsplash.com/photo-1518005020951-eccb494ad742?q=80&w=1400&auto=format&fit=crop" alt="VYRON premium utility" className="h-[330px] w-full rounded-[1.7rem] object-cover opacity-85 md:h-[540px]"/>
          <div className="absolute bottom-6 left-6 right-6 rounded-3xl border border-white/10 bg-black/55 p-5 backdrop-blur-xl"><p className="text-xs font-black uppercase tracking-[.28em] text-white/45">Launch System</p><p className="mt-2 text-xl font-black">Premium products. Clean checkout. Built to scale.</p></div>
        </div>
      </div>
    </div>
  </section>

  <section id="shop" className="mx-auto max-w-7xl px-5 py-16">
    <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><p className="kicker">Collections</p><h2 className="mt-2 text-3xl font-black md:text-5xl">Shop by Utility</h2></div><p className="max-w-md text-sm leading-6 text-white/52">Geen chaos, geen overvolle AliExpress vibe. Alleen duidelijke collecties die direct te begrijpen zijn.</p></div>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{categories.map((c,idx)=><Link key={c.slug} href={`/category/${c.slug}`} className="card group relative overflow-hidden rounded-[1.7rem] p-6 transition hover:-translate-y-1 hover:border-white/25"><div className="absolute right-5 top-5 text-5xl font-black text-white/[.035]">0{idx+1}</div><h3 className="text-2xl font-black">{c.name}</h3><p className="mt-3 max-w-xs text-sm leading-6 text-white/55">{c.text}</p><span className="mt-6 inline-flex items-center gap-2 text-sm font-black text-white/70 group-hover:text-white">Explore <ArrowRight size={16}/></span></Link>)}</div>
  </section>

  <section id="featured" className="mx-auto max-w-7xl px-5 py-16">
    <p className="kicker">Launch Picks</p><h2 className="mt-2 text-3xl font-black md:text-5xl">Hero Products</h2>
    <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{featured.map(p=><ProductCard key={p.slug} p={p}/>)}</div>
  </section>

  <section className="mx-auto max-w-7xl px-5 py-12"><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{trust.map(x=><div key={x.t} className="card rounded-[1.7rem] p-6"><div className="text-vyron-silver">{x.i}</div><h3 className="mt-4 font-black">{x.t}</h3><p className="mt-2 text-sm leading-6 text-white/55">{x.d}</p></div>)}</div></section>

  <section className="mx-auto max-w-7xl px-5 py-16"><div className="flex items-end justify-between gap-4"><div><p className="kicker">Full Launch Catalog</p><h2 className="mt-2 text-3xl font-black md:text-5xl">All Products</h2></div><Link href="/shop" className="hidden rounded-full border border-white/10 px-5 py-3 text-sm font-black text-white/70 transition hover:bg-white/10 md:inline-flex">View all</Link></div><div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{products.slice(0,12).map(p=><ProductCard key={p.slug} p={p}/>)}</div></section>

  <section className="mx-auto max-w-7xl px-5 py-12"><div className="card overflow-hidden rounded-[2rem] p-8 md:p-12"><p className="kicker">VYRON Insiders</p><div className="mt-3 grid gap-6 md:grid-cols-[1fr_auto] md:items-end"><div><h2 className="text-3xl font-black md:text-5xl">Exclusive drops, early access.</h2><p className="mt-4 max-w-xl text-white/55">Later koppelen we dit aan e-mail automation. Nu staat de premium sectie klaar voor conversie.</p></div><Link href="/shop" className="btn-primary">Start shopping</Link></div></div></section>
  <PaymentNote/>
</main>}
