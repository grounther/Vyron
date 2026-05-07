import ProductCard from '@/components/ProductCard'
import { byCategory, categories, getCategory } from '@/lib/products'
import { notFound } from 'next/navigation'
export function generateStaticParams(){return categories.map(c=>({slug:c.slug}))}
export default async function CategoryPage({params}:{params:Promise<{slug:string}>}){const {slug}=await params; const c=getCategory(slug); if(!c)return notFound(); const list=byCategory(slug); return <main className="mx-auto max-w-7xl px-5 py-12"><p className="text-xs font-bold uppercase tracking-[.28em] text-white/40">Collection</p><h1 className="mt-2 text-5xl font-black">{c.name}</h1><p className="mt-4 max-w-2xl text-white/55">{c.text}</p><div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{list.map(p=><ProductCard key={p.slug} p={p}/>)}</div></main>}
