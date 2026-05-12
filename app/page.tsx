import Link from 'next/link'
import ProductCard from '@/components/ProductCard'
import HomeHeroSlider from '@/components/HomeHeroSlider'
import { categories } from '@/lib/products'
import { getFeaturedProducts, getProducts } from '@/lib/catalog'
import { getSiteContent } from '@/lib/site-content'
import { getActiveActions, getPrimaryAction } from '@/lib/actions'
import ActionBanner from '@/components/ActionBanner'
import ExclusiveDropsSignup from '@/components/ExclusiveDropsSignup'
import type { ReactNode } from 'react'
import { ArrowRight, Car, Gamepad2, Laptop, PackageCheck, ShieldCheck, Sparkles } from 'lucide-react'

const categoryVisuals: Record<string, {image:string; line:string; icon: ReactNode}> = {
  tactical: { image: '/products/urban-sling/2_ffc916c0-7b8f-4b11-a8a7-c2e014a62fe7.jpg', line: 'Built for performance', icon: <ShieldCheck size={22}/> },
  automotive: { image: '/products/drivecharge/1_1c3d32e3-9eb6-47f9-b217-e2911571c64a.jpg', line: 'Upgrade your drive', icon: <Car size={22}/> },
  'desk-setup': { image: '/products/monitor-lightbar-ultra.svg', line: 'Organized & productive', icon: <Laptop size={22}/> },
  gaming: { image: '/products/wavemic/1_a09d4f0d-2641-4a83-9da9-58e22e5d8d55.jpg', line: 'Elevate your game', icon: <Gamepad2 size={22}/> },
  'smart-utility': { image: '/products/drivecharge/13_99d408a4-2bbd-41f4-a3e8-0fc05e190202.jpg', line: 'Smarter everyday', icon: <PackageCheck size={22}/> },
  outdoor: { image: '/products/gps/1_f6ad23a2-5a67-4fd1-8c98-803f658e6409.jpg', line: 'Ready for travel', icon: <Sparkles size={22}/> },
}

export default async function Home(){
  const [content, products, featured, actions] = await Promise.all([getSiteContent(), getProducts(), getFeaturedProducts(), getActiveActions()])
  const homeAction = getPrimaryAction(actions, 'homepage')

  return <main>
  <HomeHeroSlider
    kicker={content['homepage.hero.kicker']}
    text={content['homepage.hero.text']}
    primaryCta={content['homepage.hero.primaryCta']}
    secondaryCta={content['homepage.hero.secondaryCta']}
  />

  <ActionBanner action={homeAction} />

  <section id="shop" className="mx-auto max-w-7xl px-5 py-14">
    <div className="mb-6"><div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#7aa6b8] shadow-[0_0_18px_rgba(122,166,184,.8)]"/><p className="kicker">{content['homepage.categories.kicker']}</p></div><h2 className="mt-2 text-3xl font-black md:text-5xl">{content['homepage.categories.title']}</h2></div>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {categories.slice(0,5).map((c)=>{
        const v = categoryVisuals[c.slug]
        return <Link key={c.slug} href={`/category/${c.slug}`} className="category-tile group">
          <img src={v?.image || '/products/asorta-product-fallback.svg'} alt="" className="absolute inset-0 h-full w-full object-cover opacity-36 transition duration-700 group-hover:scale-110 group-hover:opacity-50"/>
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,.76),rgba(0,0,0,.28)),linear-gradient(0deg,rgba(0,0,0,.75),transparent_70%)]"/>
          <div className="relative z-10 flex h-full flex-col justify-end p-5">
            <h3 className="text-xl font-black">{c.name}</h3>
            <p className="mt-1 text-sm text-white/58">{v?.line || c.text}</p>
            <span className="mt-5 grid h-10 w-10 place-items-center rounded-full border border-white/18 bg-black/35 text-white/75 transition group-hover:translate-x-1 group-hover:border-white/35 group-hover:text-white"><ArrowRight size={18}/></span>
          </div>
        </Link>
      })}
    </div>
  </section>

  <section id="featured" className="mx-auto max-w-7xl px-5 py-12">
    <div className="mb-7 flex items-end justify-between gap-4">
      <div><div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#7aa6b8] shadow-[0_0_18px_rgba(122,166,184,.8)]"/><p className="kicker">{content['homepage.featured.kicker']}</p></div><h2 className="mt-2 text-3xl font-black md:text-5xl">{content['homepage.featured.title']}</h2></div>
      <Link href="/shop" className="hidden items-center gap-2 text-sm font-black text-white/58 transition hover:text-white md:inline-flex">View all <ArrowRight size={16}/></Link>
    </div>
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{featured.map(p=><ProductCard key={p.slug} p={p}/>)}</div>
  </section>

  <section className="mx-auto max-w-7xl px-5 py-16"><div className="flex items-end justify-between gap-4"><div><p className="kicker">{content['homepage.catalog.kicker']}</p><h2 className="mt-2 text-3xl font-black md:text-5xl">{content['homepage.catalog.title']}</h2></div><Link href="/shop" className="hidden rounded-full border border-white/10 px-5 py-3 text-sm font-black text-white/70 transition hover:bg-white/10 md:inline-flex">View all</Link></div><div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{products.slice(0,8).map(p=><ProductCard key={p.slug} p={p}/>)}</div></section>

  <ExclusiveDropsSignup
    kicker={content['homepage.insiders.kicker']}
    title={content['homepage.insiders.title']}
    text={content['homepage.insiders.text']}
    button={content['homepage.insiders.button']}
  />
</main>}
