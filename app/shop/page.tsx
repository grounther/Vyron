import ProductCard from '@/components/ProductCard'
import { categories, products } from '@/lib/products'
import Link from 'next/link'

export default function ShopPage(){return <main className="mx-auto max-w-7xl px-5 py-12">
  <section className="card relative overflow-hidden rounded-[2rem] p-8 md:p-12">
    <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-white/[.05] blur-3xl"/>
    <p className="kicker">VYRON Catalog</p><h1 className="mt-3 text-4xl font-black md:text-6xl">Shop premium utility.</h1><p className="mt-4 max-w-2xl leading-7 text-white/55">Een curated launch catalog met tactical, automotive, desk, gaming en smart utility producten.</p>
  </section>
  <div className="mt-8 flex flex-wrap gap-3">{categories.map(c=><Link key={c.slug} className="rounded-full border border-white/10 px-4 py-2 text-sm font-black text-white/65 transition hover:bg-white/10 hover:text-white" href={`/category/${c.slug}`}>{c.name}</Link>)}</div>
  <section className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{products.map(p=><ProductCard key={p.slug} p={p}/>)}</section>
</main>}
