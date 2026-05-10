import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { products, getProduct } from '@/lib/products'
import ProductCard from '@/components/ProductCard'
import ProductPurchasePanel from '@/components/ProductPurchasePanel'
import { ArrowLeft, BadgeCheck, PackageCheck } from 'lucide-react'

export function generateStaticParams(){return products.map(p=>({slug:p.slug}))}

export async function generateMetadata({params}:{params:Promise<{slug:string}>}): Promise<Metadata>{
  const { slug } = await params
  const p = getProduct(slug)
  if(!p) return { title:'Product not found | ASORTA' }
  return {
    title: `${p.name} | ASORTA`,
    description: p.short,
    alternates:{canonical:`https://asorta.nl/product/${p.slug}`},
    openGraph:{
      title:`${p.name} | ASORTA`,
      description:p.short,
      url:`https://asorta.nl/product/${p.slug}`,
      siteName:'ASORTA',
      images:[{url:p.hero,alt:p.name}],
      type:'website'
    }
  }
}

export default async function ProductPage({params}:{params:Promise<{slug:string}>}){
  const { slug } = await params
  const p = getProduct(slug)
  if(!p) return notFound()
  const related = products.filter(x=>x.category===p.category && x.slug!==p.slug).slice(0,4)
  const productSchema = {
    '@context':'https://schema.org',
    '@type':'Product',
    name:p.name,
    description:p.description,
    image:p.images?.length ? p.images.map(img=>`https://asorta.nl${img}`) : [`https://asorta.nl${p.hero}`],
    brand:{'@type':'Brand',name:'ASORTA'},
    sku:p.variants?.[0]?.sku || p.supplier?.productId || p.slug,
    category:p.category,
    offers:{
      '@type':'Offer',
      url:`https://asorta.nl/product/${p.slug}`,
      priceCurrency:'EUR',
      price:p.price.toFixed(2),
      availability:'https://schema.org/InStock',
      itemCondition:'https://schema.org/NewCondition'
    }
  }
  return <main className="mx-auto max-w-7xl px-5 py-8 md:py-12">
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(productSchema)}} />
    <Link href="/shop" className="mb-7 inline-flex items-center gap-2 text-sm font-black text-white/55 hover:text-white"><ArrowLeft size={16}/> Back to shop</Link>

    <ProductPurchasePanel product={p}/>

    <section className="mt-12 grid gap-5 lg:grid-cols-3">
      <div className="card rounded-[1.7rem] p-6 lg:col-span-2"><p className="kicker">Product Story</p><h2 className="mt-2 text-2xl font-black">Modern utility, premium positioned.</h2><p className="mt-4 leading-7 text-white/58">{p.description}</p></div>
      <div className="card rounded-[1.7rem] p-6"><p className="kicker">Pricing</p><p className="mt-4 leading-7 text-white/58">{p.marginNote}</p>{p.supplier && <div className="mt-5 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/55"><strong className="text-white">Estimated landed cost:</strong> €{p.supplier.landedCost.toFixed(2)}<br/><strong className="text-white">Warehouse:</strong> {p.supplier.warehouse}<br/><strong className="text-white">Supplier:</strong> {p.supplier.name}</div>}</div>
    </section>

    <section className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
      <Info title="Key Features" items={p.features}/>
      <Info title="Specs" items={p.specs}/>
      <Info title="What's in the box" items={p.inBox || ['Final packing list will be confirmed before paid launch.']}/>
      <div className="card rounded-[1.7rem] p-6"><PackageCheck/><h3 className="mt-4 font-black">Supplier Notes</h3><p className="mt-3 text-sm leading-6 text-white/55">{p.supplierNotes}</p></div>
    </section>

    <section className="mt-6 grid gap-5 md:grid-cols-2">
      <Info title="Content Ideas" items={p.contentIdeas}/>
      <Info title="Launch Tags" items={p.tags.map(tag => `#${tag}`)}/>
    </section>

    {related.length>0 && <section className="mt-16"><p className="kicker">Related Utility</p><h2 className="mt-2 text-3xl font-black md:text-5xl">More in {p.category.replace('-',' ')}</h2><div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{related.map(x=><ProductCard key={x.slug} p={x}/>)}</div></section>}
  </main>
}
function Info({title,items}:{title:string;items:string[]}){return <div className="card rounded-[1.7rem] p-6"><BadgeCheck/><h3 className="mt-4 font-black">{title}</h3><ul className="mt-3 grid gap-2 text-sm leading-6 text-white/55">{items.map(i=><li key={i}>• {i}</li>)}</ul></div>}
