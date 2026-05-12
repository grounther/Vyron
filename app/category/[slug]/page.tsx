import { notFound } from 'next/navigation'
import ProductCard from '@/components/ProductCard'
import { categories, getCategory } from '@/lib/products'
import { byCategory } from '@/lib/catalog'

export function generateStaticParams(){return categories.map(c=>({slug:c.slug}))}

export default async function CategoryPage({params}:{params:Promise<{slug:string}>}){
  const { slug } = await params
  const c=getCategory(slug)
  if(!c) return notFound()
  const items=await byCategory(slug)
  return <main className="mx-auto max-w-7xl px-5 py-12"><section className="card rounded-[2rem] p-8 md:p-12"><p className="kicker">Collection</p><h1 className="mt-3 text-4xl font-black md:text-6xl">{c.name}</h1><p className="mt-4 max-w-2xl text-white/55">{c.text}</p></section><div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{items.map(p=><ProductCard key={p.slug} p={p}/>)}</div></main>
}
