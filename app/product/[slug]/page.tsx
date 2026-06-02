import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getProduct, getProducts } from '@/lib/catalog'
import { getActiveActions, getProductAction } from '@/lib/actions'
import ActionBanner from '@/components/ActionBanner'
import ProductCard from '@/components/ProductCard'
import ProductMediaGallery from '@/components/ProductMediaGallery'
import ProductViewTracker from '@/components/ProductViewTracker'
import { breadcrumbJsonLd, productJsonLd, stringifyJsonLd } from '@/lib/seo/structured-data'
import { absoluteUrl } from '@/lib/seo/config'
import { ArrowLeft, BadgeCheck, PackageCheck } from 'lucide-react'

export const dynamic = 'force-dynamic'

export function generateStaticParams(){return []}

export async function generateMetadata({params}:{params:Promise<{slug:string}>}){
  const { slug } = await params
  const p = await getProduct(slug)
  if(!p) return { title: 'Product | ASORTA' }
  const description = p.short || p.description || `${p.name} bij ASORTA.`
  return {
    title: p.name,
    description,
    alternates: { canonical: `/product/${p.slug}` },
    openGraph: { title: `${p.name} | ASORTA`, description, url: absoluteUrl(`/product/${p.slug}`), images: [p.hero] },
    twitter: { card: 'summary_large_image', title: `${p.name} | ASORTA`, description, images: [p.hero] },
  }
}

export default async function ProductPage({params}:{params:Promise<{slug:string}>}){
  const { slug } = await params
  const p = await getProduct(slug)
  if(!p) return notFound()
  const [allProducts, actions] = await Promise.all([getProducts(), getActiveActions()])
  const productAction = getProductAction(actions, p)
  const related = allProducts.filter(x=>x.category===p.category && x.slug!==p.slug).slice(0,4)
  return <main className="mx-auto max-w-7xl px-5 py-8 md:py-12">
    <ProductViewTracker product={p}/>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html: stringifyJsonLd(productJsonLd(p))}} />
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html: stringifyJsonLd(breadcrumbJsonLd([{ name: 'Home', url: absoluteUrl('/') }, { name: 'Shop', url: absoluteUrl('/shop') }, { name: p.name, url: absoluteUrl(`/product/${p.slug}`) }]))}} />
    <Link href="/shop" className="mb-7 inline-flex items-center gap-2 text-sm font-black text-white/55 hover:text-white"><ArrowLeft size={16}/> Back to shop</Link>
    <ProductMediaGallery product={p}/>

    <ActionBanner action={productAction} compact />

    <section className="mt-12 grid gap-5 lg:grid-cols-3">
      <div className="card rounded-[1.7rem] p-6 lg:col-span-2"><p className="kicker">Product Story</p><h2 className="mt-2 text-2xl font-black">Modern utility, premium positioned.</h2><p className="mt-4 leading-7 text-white/58">{p.description}</p></div>
      <div className="card rounded-[1.7rem] p-6"><p className="kicker">Shipping</p><h3 className="mt-2 text-xl font-black">Tracked delivery</h3><p className="mt-4 text-sm leading-6 text-white/58">{p.shippingInfo}</p></div>
    </section>

    <section className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
      <Info title="Key Features" items={p.features}/>
      <Info title="Specs" items={p.specs}/>
      <Info title="What's in the box" items={p.boxItems || ['Product as selected','Supplier packaging','Tracked shipment']}/>
      <div className="card rounded-[1.7rem] p-6"><PackageCheck/><h3 className="mt-4 font-black">Support & returns</h3><p className="mt-3 text-sm leading-6 text-white/55">Heb je vragen over dit product of je bestelling? ASORTA Support helpt je met productinformatie, tracking en retouraanvragen.</p></div>
    </section>

    {related.length>0 && <section className="mt-16"><p className="kicker">Related Utility</p><h2 className="mt-2 text-3xl font-black md:text-5xl">More in {p.category.replace('-',' ')}</h2><div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{related.map(x=><ProductCard key={x.slug} p={x}/>)}</div></section>}
  </main>
}
function Info({title,items}:{title:string;items:string[]}){return <div className="card rounded-[1.7rem] p-6"><BadgeCheck/><h3 className="mt-4 font-black">{title}</h3><ul className="mt-3 grid gap-2 text-sm leading-6 text-white/55">{items.map(i=><li key={i}>• {i}</li>)}</ul></div>}
