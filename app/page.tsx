import Link from 'next/link'
import ProductCard from '@/components/ProductCard'
import HomeHeroSlider from '@/components/HomeHeroSlider'
import { categories, featured, products } from '@/lib/products'
import type { ReactNode } from 'react'
import { ArrowRight, Car, Gamepad2, Laptop, PackageCheck, ShieldCheck, Sparkles, Zap } from 'lucide-react'

const categoryVisuals: Record<string, {image:string; line:string; icon: ReactNode}> = {
  tactical: { image: '/products/asorta-urban-sling-pro/2.jpg', line: 'Built for performance', icon: <ShieldCheck size={22}/> },
  automotive: { image: '/products/drivecharge/1_1c3d32e3-9eb6-47f9-b217-e2911571c64a.jpg', line: 'Upgrade your drive', icon: <Car size={22}/> },
  'desk-setup': { image: '/products/monitor-lightbar-ultra.svg', line: 'Organized & productive', icon: <Laptop size={22}/> },
  gaming: { image: '/products/asorta-wavemic-rgb/1.jpg', line: 'Elevate your game', icon: <Gamepad2 size={22}/> },
  'smart-utility': { image: '/products/asorta-trailpoint-mini/1.jpg', line: 'Smarter everyday', icon: <PackageCheck size={22}/> },
  outdoor: { image: '/products/gps/1_f6ad23a2-5a67-4fd1-8c98-803f658e6409.jpg', line: 'Ready for travel', icon: <Sparkles size={22}/> },
}

function SectionKicker({children}:{children:ReactNode}){return <div className="mb-6 flex items-center gap-2"><Zap size={14} className="text-[#7db3cf]"/><p className="kicker">{children}</p></div>}

export default function Home(){return <main className="asorta-home">
  <HomeHeroSlider/>

  <section id="shop" className="mx-auto max-w-[1500px] px-5 py-10 md:px-8">
    <SectionKicker>Browse categories</SectionKicker>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {categories.slice(0,5).map((c)=>{
        const v = categoryVisuals[c.slug]
        return <Link key={c.slug} href={`/category/${c.slug}`} className="asorta-category group">
          <img src={v?.image || '/products/asorta-product-fallback.svg'} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40 transition duration-700 group-hover:scale-110 group-hover:opacity-56"/>
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,.78),rgba(0,0,0,.30)),linear-gradient(0deg,rgba(0,0,0,.78),transparent_74%)]"/>
          <div className="relative z-10 flex h-full flex-col justify-end p-5">
            <div className="mb-5 grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-black/35 text-white/70">{v?.icon}</div>
            <h3 className="text-xl font-black">{c.name}</h3>
            <p className="mt-1 text-sm text-white/60">{v?.line || c.text}</p>
            <span className="mt-4 grid h-9 w-9 place-items-center rounded-full border border-white/18 bg-black/35 text-white/75 transition group-hover:translate-x-1 group-hover:border-white/35 group-hover:text-white"><ArrowRight size={17}/></span>
          </div>
        </Link>
      })}
    </div>
  </section>

  <section id="featured" className="mx-auto max-w-[1500px] px-5 py-12 md:px-8">
    <div className="mb-7 flex items-end justify-between gap-4">
      <div><SectionKicker>Best sellers</SectionKicker><h2 className="asorta-section-title">Launch essentials.</h2></div>
      <Link href="/shop" className="hidden items-center gap-2 text-sm font-black text-white/58 transition hover:text-white md:inline-flex">View all <ArrowRight size={16}/></Link>
    </div>
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{featured.map(p=><ProductCard key={p.slug} p={p}/>)}</div>
  </section>

  <section className="mx-auto max-w-[1500px] px-5 py-12 md:px-8">
    <div className="asorta-editorial-card">
      <div>
        <p className="kicker">ASORTA field standard</p>
        <h2>Designed for the gear you actually use.</h2>
        <p>Geen rommelige gadget-store. ASORTA selecteert tactical carry, automotive utility en setup gear alsof het één premium loadout is: strak, functioneel en klaar voor dagelijks gebruik.</p>
      </div>
      <Link href="/shop" className="btn-primary">Explore the system <ArrowRight size={18} className="ml-2"/></Link>
    </div>
  </section>

  <section className="mx-auto max-w-[1500px] px-5 py-12 md:px-8">
    <div className="flex items-end justify-between gap-4"><div><p className="kicker">Full Launch Catalog</p><h2 className="asorta-section-title">Just what you need.</h2></div><Link href="/shop" className="hidden rounded-full border border-white/10 px-5 py-3 text-sm font-black text-white/70 transition hover:bg-white/10 md:inline-flex">View all</Link></div>
    <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{products.slice(0,8).map(p=><ProductCard key={p.slug} p={p}/>)}</div>
  </section>
</main>}
