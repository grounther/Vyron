import ShopClient from '@/components/ShopClient'
import { products } from '@/lib/products'

export default function ShopPage(){return <main className="mx-auto max-w-7xl px-5 py-12">
  <section className="card relative overflow-hidden rounded-[2rem] p-8 md:p-12">
    <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-white/[.05] blur-3xl"/>
    <p className="kicker">ASORTA Catalog</p>
    <h1 className="mt-3 text-4xl font-black md:text-6xl">Just what you need.</h1>
    <p className="mt-4 max-w-2xl leading-7 text-white/55">Een curated launch catalog met premium utility producten. Zoek, filter en vind snel wat past bij jouw setup, auto, carry of daily routine.</p>
  </section>
  <ShopClient products={products}/>
</main>}
