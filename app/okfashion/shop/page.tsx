import Link from 'next/link'
import { getProducts } from '@/lib/catalog'

const fashionCategories = new Set(['ok-cotton','ok-linen','ok-tailoring','ok-overshirts','ok-silk'])

export const metadata = {
  title: 'OK Fashion Shop | ASORTA',
  description: 'De afzonderlijke OK Fashion shop binnen ASORTA.',
}

const plannedProducts = [
  'Premium Cotton T-shirt',
  'Linen Shirt',
  'Overshirt',
  'Silk-Blend Shirt',
  'Relaxed Cotton Trouser',
  'Linen Trouser',
  'Linen Short',
  'Fluid Trouser',
]

export default async function OKFashionShopPage(){
  const products = (await getProducts()).filter((p)=>fashionCategories.has(p.category) || p.tags?.some((tag)=>tag.toLowerCase().includes('ok fashion')))
  return <main className="ok-fashion min-h-screen bg-[#f7f1e8] px-4 py-10 text-[#191512] sm:px-6 lg:px-8">
    <section className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] border border-[#191512]/10 bg-[#fffaf2] shadow-[0_28px_120px_rgba(78,56,35,.14)]">
      <div className="relative p-7 sm:p-10 md:p-14">
        <img src="/okfashion/ok-fashion-moodboard.png" alt="" className="absolute inset-0 h-full w-full object-cover opacity-18" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,250,242,.98),rgba(255,250,242,.75),rgba(255,250,242,.40))]" />
        <div className="relative z-10 max-w-3xl">
          <p className="text-xs font-black uppercase tracking-[.34em] text-[#7b6246]">OK Fashion shop</p>
          <h1 className="mt-3 font-serif text-5xl leading-none tracking-[-.05em] sm:text-7xl">The First Edit</h1>
          <p className="mt-5 text-sm leading-7 text-[#40352b]/72 sm:text-base">Deze afzonderlijke fashion shop is voorbereid voor OK Fashion producten. Het admin panel blijft één geheel: voeg producten toe in Atlas met een OK Fashion categorie of tag, en ze verschijnen hier.</p>
          <div className="mt-7 inline-flex rounded-full bg-[#191512] px-5 py-3 text-sm font-black text-[#f7f1e8]">Collectie in ontwikkeling</div>
        </div>
      </div>
    </section>

    <section className="mx-auto mt-10 max-w-7xl">
      {products.length ? <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">{products.map((p)=><Link key={p.slug} href={`/product/${p.slug}`} className="rounded-[1.6rem] border border-[#191512]/10 bg-[#fffaf2] p-3 shadow-[0_20px_80px_rgba(78,56,35,.08)] transition hover:-translate-y-1"><img src={p.hero} alt="" className="aspect-[4/5] w-full rounded-[1.2rem] object-cover"/><p className="mt-4 text-xs font-black uppercase tracking-[.24em] text-[#7b6246]">OK Fashion</p><h2 className="mt-2 font-serif text-2xl tracking-[-.03em]">{p.name}</h2><p className="mt-2 font-black">€{p.price.toFixed(2)}</p></Link>)}</div> : <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {plannedProducts.map((name)=><div key={name} className="rounded-[1.6rem] border border-[#191512]/10 bg-[#fffaf2] p-5 shadow-[0_20px_80px_rgba(78,56,35,.08)]">
          <div className="grid aspect-[4/5] place-items-center rounded-[1.2rem] bg-[#eee0cc] p-6 text-center font-serif text-3xl tracking-[-.05em] text-[#191512]/76">OK</div>
          <p className="mt-4 text-xs font-black uppercase tracking-[.24em] text-[#7b6246]">Coming soon</p>
          <h2 className="mt-2 font-serif text-2xl tracking-[-.03em]">{name}</h2>
          <p className="mt-2 text-sm leading-6 text-[#40352b]/62">Product in ontwikkeling voor OK Fashion — The First Edit.</p>
        </div>)}
      </div>}
    </section>
  </main>
}
