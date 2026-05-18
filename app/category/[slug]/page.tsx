import { notFound } from 'next/navigation'
import ProductCard from '@/components/ProductCard'
import { categories, getCategory } from '@/lib/products'
import { categoryName, categoryText } from '@/lib/i18n/config'
import { getServerLocale } from '@/lib/i18n/server'
import { byCategory } from '@/lib/catalog'
import { getSiteContent } from '@/lib/site-content'

export function generateStaticParams(){return categories.map(c=>({slug:c.slug}))}

export default async function CategoryPage({params}:{params:Promise<{slug:string}>}){
  const [{ slug }, locale] = await Promise.all([params, getServerLocale()])
  const c=getCategory(slug)
  if(!c) return notFound()
  const [items, content] = await Promise.all([byCategory(slug), getSiteContent()])
  return <main className="mx-auto max-w-7xl px-4 py-8 sm:px-5 sm:py-12"><section className="card rounded-[1.6rem] p-6 sm:rounded-[2rem] sm:p-8 md:p-12"><p className="kicker">{content['category.kicker']}</p><h1 className="mt-3 text-3xl font-black sm:text-4xl md:text-6xl">{categoryName(locale, c.slug, c.name)}</h1><p className="mt-4 max-w-2xl text-sm leading-6 text-white/55 sm:text-base">{categoryText(locale, c.slug, c.text)}</p></section>{items.length ? <div className="mt-6 grid grid-cols-2 gap-3 sm:mt-9 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">{items.map(p=><ProductCard key={p.slug} p={p}/>)}</div> : <div className="card mt-6 rounded-[1.6rem] p-8 text-center text-white/55">{content['category.empty']}</div>}</main>
}
