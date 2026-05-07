import ProductCard from '@/components/ProductCard'
import { products } from '@/lib/products'
export default function Search(){return <main className="mx-auto max-w-7xl px-5 py-12"><h1 className="text-5xl font-black">Search</h1><p className="mt-4 text-white/55">Zoekfunctie koppelen we in de volgende stap interactief. Launch catalog:</p><div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{products.slice(0,8).map(p=><ProductCard key={p.slug} p={p}/>)}</div></main>}
