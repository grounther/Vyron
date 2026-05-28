import ShopClient from '@/components/ShopClient'
import { getProducts } from '@/lib/catalog'
import { getSiteContent } from '@/lib/site-content'
import { getActiveActions, getPrimaryAction } from '@/lib/actions'
import ActionBanner from '@/components/ActionBanner'

export default async function ShopPage(){
  const [products, content, actions] = await Promise.all([getProducts(), getSiteContent(), getActiveActions()])
  const shopAction = getPrimaryAction(actions, 'shop')
  return <main className="mx-auto max-w-7xl px-4 py-8 sm:px-5 sm:py-12">
    <section className="card relative overflow-hidden rounded-[1.6rem] p-6 sm:rounded-[2rem] sm:p-8 md:p-12">
      <img src="/asorta-tcg-hero.jpeg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-18" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,.88),rgba(0,0,0,.58),rgba(0,0,0,.22))]" />
      <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-amber-300/[.08] blur-3xl"/>
      <div className="relative z-10">
        <p className="kicker">{content['shop.kicker']}</p>
        <h1 className="mt-3 text-3xl font-black sm:text-4xl md:text-6xl">{content['shop.title']}</h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-white/62 sm:text-base sm:leading-7">{content['shop.text']}</p>
      </div>
    </section>
    <ActionBanner action={shopAction} compact />
    <ShopClient products={products}/>
  </main>
}
