import ShopClient from '@/components/ShopClient'
import { getProducts } from '@/lib/catalog'
import { getSiteContent } from '@/lib/site-content'

export default async function ShopPage(){
  const [products, content] = await Promise.all([getProducts(), getSiteContent()])
  return <main className="mx-auto max-w-7xl px-5 py-12">
    <section className="card relative overflow-hidden rounded-[2rem] p-8 md:p-12">
      <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-white/[.05] blur-3xl"/>
      <p className="kicker">{content['shop.kicker']}</p>
      <h1 className="mt-3 text-4xl font-black md:text-6xl">{content['shop.title']}</h1>
      <p className="mt-4 max-w-2xl leading-7 text-white/55">{content['shop.text']}</p>
    </section>
    <ShopClient products={products}/>
  </main>
}
