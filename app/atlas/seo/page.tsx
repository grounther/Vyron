import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getProducts } from '@/lib/catalog'
import { AlertTriangle, CheckCircle2, ExternalLink, FileSearch, Globe2, ImageIcon, PackageCheck, Search, ShieldCheck } from 'lucide-react'

export const metadata = { title: 'Atlas SEO | ASORTA internal', robots: { index: false, follow: false } }

function siteUrl(path = '') {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || 'https://asorta.nl').replace(/\/$/, '')
  return `${base}${path}`
}

function scoreColor(value: number) {
  if (value >= 90) return 'text-emerald-200'
  if (value >= 70) return 'text-amber-200'
  return 'text-red-200'
}

export default async function AtlasSeoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) redirect('/atlas-access?next=/atlas/seo')

  const admin = createAdminClient()
  let isAdmin = false
  let adminCheckReady = false

  if (admin) {
    const { data } = await admin.from('admin_users').select('email, active').eq('email', user.email).eq('active', true).maybeSingle()
    isAdmin = Boolean(data)
    adminCheckReady = true
  }

  if (adminCheckReady && !isAdmin) redirect('/atlas-access?next=/atlas/seo')

  const products = await getProducts()
  const activeProducts = products.filter((product) => product.shopifyProductId && product.shopifyVariantLegacyId)
  const missingDescription = activeProducts.filter((product) => !product.description && !product.short)
  const missingImage = activeProducts.filter((product) => !product.hero && !(product.images || []).length)
  const missingPrice = activeProducts.filter((product) => !product.price || Number(product.price) <= 0)
  const missingCost = activeProducts.filter((product) => !product.cost || Number(product.cost) <= 0)
  const missingVariant = products.filter((product) => !product.shopifyVariantLegacyId)
  const complete = activeProducts.length
    ? Math.round(((activeProducts.length - missingDescription.length - missingImage.length - missingPrice.length) / activeProducts.length) * 100)
    : 0
  const readiness = Math.max(0, Math.min(100, complete))
  const productUrls = activeProducts.slice(0, 18).map((product) => ({ name: product.name, href: siteUrl(`/product/${product.slug}`) }))

  return <main className="mx-auto max-w-7xl px-4 py-10 md:px-6">
    <section className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(111,125,100,.18),transparent_38%),linear-gradient(145deg,rgba(255,255,255,.08),rgba(255,255,255,.02))] p-6 md:p-10">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[.35em] text-[#b7c8ad]">Atlas SEO</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">SEO & Google readiness</h1>
          <p className="mt-4 max-w-2xl text-white/60">Controleer of ASORTA klaarstaat voor Google Search, Merchant Center en product structured data.</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-white/55"><ShieldCheck className="mb-2 text-[#b7c8ad]"/> Alleen zichtbaar binnen Atlas.</div>
      </div>
    </section>

    {!adminCheckReady && <section className="mt-6 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-100/75"><AlertTriangle size={18} className="mb-2"/> Service role key ontbreekt. SEO health gebruikt dan alleen publiek beschikbare productdata.</section>}

    <section className="mt-8 grid gap-4 md:grid-cols-4">
      <Stat icon={<PackageCheck/>} label="Google-ready products" value={String(activeProducts.length)} helper="Shopify-synced + buyable" />
      <Stat icon={<Search/>} label="SEO score" value={`${readiness}%`} helper="Image, price and copy health" valueClass={scoreColor(readiness)} />
      <Stat icon={<ImageIcon/>} label="Missing images" value={String(missingImage.length)} helper="Product cards need image" />
      <Stat icon={<FileSearch/>} label="Missing copy" value={String(missingDescription.length)} helper="Short or description empty" />
    </section>

    <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_.9fr]">
      <div className="card rounded-[2rem] p-5 md:p-6">
        <h2 className="text-2xl font-black">Google endpoints</h2>
        <p className="mt-2 text-sm leading-6 text-white/55">Deze URLs gebruik je in Search Console, Merchant Center en bij technische SEO-checks.</p>
        <div className="mt-5 grid gap-3">
          <Endpoint title="Sitemap" href={siteUrl('/sitemap.xml')} text="Indienen in Google Search Console." />
          <Endpoint title="Merchant feed" href={siteUrl('/api/google/products.xml')} text="Productfeed voor Google Merchant Center." />
          <Endpoint title="Robots" href={siteUrl('/robots.txt')} text="Crawlerregels + sitemap verwijzing." />
          <Endpoint title="Shop" href={siteUrl('/shop')} text="Belangrijkste collectiepagina." />
        </div>
      </div>

      <div className="card rounded-[2rem] p-5 md:p-6">
        <h2 className="text-2xl font-black">Health checks</h2>
        <div className="mt-5 grid gap-3 text-sm">
          <Health label="Products without estimated_cost" value={missingCost.length} help="Niet fataal voor Google, wel nodig voor Atlas profit." />
          <Health label="Products without Shopify variant ID" value={missingVariant.length} help="Niet checkout-ready; verberg of opnieuw syncen." />
          <Health label="Products without description" value={missingDescription.length} help="Slecht voor SEO en conversie." />
          <Health label="Products without image" value={missingImage.length} help="Kan Merchant Center beperken of afkeuren." />
          <Health label="Products without valid price" value={missingPrice.length} help="Moet altijd gevuld zijn voor Google Shopping." />
        </div>
      </div>
    </section>

    <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_.9fr]">
      <div className="card rounded-[2rem] p-5 md:p-6">
        <h2 className="text-2xl font-black">Product URLs</h2>
        <p className="mt-2 text-sm text-white/50">Gebruik deze links voor URL Inspection en Rich Results tests.</p>
        <div className="mt-5 grid gap-2">
          {productUrls.length ? productUrls.map((product) => <Link key={product.href} href={product.href} target="_blank" className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[.025] px-4 py-3 text-sm text-white/62 transition hover:border-white/25 hover:text-white"><span className="truncate">{product.name}</span><ExternalLink size={14}/></Link>) : <p className="rounded-xl border border-white/10 bg-white/[.025] p-4 text-sm text-white/45">Nog geen Shopify-producten gevonden.</p>}
        </div>
      </div>

      <div className="card rounded-[2rem] p-5 md:p-6">
        <h2 className="text-2xl font-black">Next SEO actions</h2>
        <div className="mt-5 grid gap-3 text-sm text-white/60">
          <Step title="Search Console" text="Vraag indexering aan voor homepage, shop en je belangrijkste productpagina's." />
          <Step title="Merchant Center" text="Controleer Needs attention en los shipping, returns of identifiers op wanneer Google die vraagt." />
          <Step title="Rich Results" text="Test 1 productpagina en controleer of Product + Offer structured data wordt herkend." />
          <Step title="Content" text="Vul korte productteksten, specs en duidelijke voordelen aan voor hogere conversie." />
        </div>
      </div>
    </section>
  </main>
}

function Stat({ icon, label, value, helper, valueClass = '' }: { icon: React.ReactNode; label: string; value: string; helper: string; valueClass?: string }) {
  return <div className="card rounded-[1.5rem] p-5"><div className="text-[#b7c8ad]">{icon}</div><p className="mt-4 text-[11px] font-black uppercase tracking-[.22em] text-white/35">{label}</p><p className={`mt-2 text-3xl font-black ${valueClass}`}>{value}</p><p className="mt-2 text-xs text-white/42">{helper}</p></div>
}

function Endpoint({ title, href, text }: { title: string; href: string; text: string }) {
  return <Link href={href} target="_blank" className="rounded-2xl border border-white/10 bg-white/[.025] p-4 transition hover:border-white/25"><div className="flex items-center justify-between gap-3"><div><h3 className="font-black text-white">{title}</h3><p className="mt-1 text-xs text-white/42">{text}</p><p className="mt-2 break-all text-xs text-[#b7c8ad]">{href}</p></div><Globe2 size={18} className="text-white/35"/></div></Link>
}

function Health({ label, value, help }: { label: string; value: number; help: string }) {
  const ok = value === 0
  return <div className="rounded-2xl border border-white/10 bg-white/[.025] p-4"><div className="flex items-start justify-between gap-4"><div><h3 className="font-black text-white">{label}</h3><p className="mt-1 leading-5 text-white/45">{help}</p></div><span className={`rounded-full px-3 py-1 text-xs font-black ${ok ? 'bg-emerald-400/10 text-emerald-200' : 'bg-amber-400/10 text-amber-100'}`}>{ok ? 'OK' : value}</span></div></div>
}

function Step({ title, text }: { title: string; text: string }) {
  return <div className="rounded-2xl border border-white/10 bg-white/[.025] p-4"><CheckCircle2 className="text-[#b7c8ad]" size={18}/><h3 className="mt-3 font-black text-white">{title}</h3><p className="mt-1 leading-6 text-white/55">{text}</p></div>
}
