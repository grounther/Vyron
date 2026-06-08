import Link from 'next/link'
import type React from 'react'
import { assertAtlasAdmin } from '@/lib/atlas-auth'
import { categories } from '@/lib/products'
import { getProducts } from '@/lib/catalog'
import { deleteProduct, saveProduct } from './actions'
import { PackagePlus, PackageSearch, Save, Trash2, UploadCloud } from 'lucide-react'

export const metadata = { title: 'Atlas Products | ASORTA internal', robots: { index: false, follow: false } }

type RawProduct = Record<string, any>
type SearchParams = Record<string, string | string[] | undefined>

function text(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback
}

function param(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] || '' : value || ''
}

function list(value: unknown, fallback: string[] = []) {
  if (Array.isArray(value)) return value.map(String).join('\n')
  return fallback.join('\n')
}

function json(value: unknown, fallback: unknown = []) {
  const source = value ?? fallback
  try {
    return JSON.stringify(source, null, 2)
  } catch {
    return '[]'
  }
}

async function getRawProducts() {
  const { admin } = await assertAtlasAdmin('/atlas/products')
  const { data } = await admin.from('products').select('*').order('created_at', { ascending: true })
  return (data || []) as RawProduct[]
}

export default async function AtlasProducts({ searchParams }: { searchParams?: Promise<SearchParams> | SearchParams }){
  await assertAtlasAdmin('/atlas/products')
  const params = searchParams ? await searchParams : {}
  const saveStatus = param(params.save)
  const saveMessage = param(params.save_message)
  const [rawProducts, previewProducts] = await Promise.all([getRawProducts(), getProducts()])
  const rows: RawProduct[] = rawProducts.length ? rawProducts : previewProducts.map((p): RawProduct => ({
    slug: p.slug,
    name: p.name,
    category: p.category,
    price: p.price,
    compare_at: p.compareAt,
    estimated_cost: p.cost,
    status: 'draft',
    hero_image: p.hero,
    images: p.images || [],
    badge: p.badge,
    short_description: p.short,
    description: p.description,
    features: p.features,
    specs: p.specs,
    tags: p.tags,
    box_items: p.boxItems || [],
    shipping_info: p.shippingInfo,
    content_ideas: p.contentIdeas,
    supplier_notes: p.supplierNotes,
    margin_note: p.marginNote,
    variants: p.variants || [],
    videos: p.videos || [],
    supplier_name: p.supplier?.name,
    supplier_url: p.supplier?.productUrl,
    warehouse: p.supplier?.warehouse,
    supplier_status: p.supplier?.status,
    processing_time: p.supplier?.processingTime,
    delivery_time: p.supplier?.deliveryTime,
  }))

  return <main className="mx-auto max-w-7xl px-4 py-10 md:px-6">
    <Link href="/atlas" className="text-sm font-black text-white/50 hover:text-white">← Back to Atlas</Link>

    <section className="mt-6 card rounded-[2rem] p-6 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="flex items-center gap-3"><PackageSearch className="text-[#b7c8ad]"/><div><p className="kicker">Atlas product editor</p><h1 className="text-4xl font-black">Products</h1></div></div>
        <div className="rounded-2xl border border-[#b7c8ad]/20 bg-[#b7c8ad]/10 px-4 py-3 text-sm font-bold text-[#dbe9d4]">Supabase Auth + admin_users beveiligd</div>
      </div>
      <p className="mt-4 max-w-3xl text-white/55">Voeg eigen voorraad toe, beheer SKU’s, prijzen, voorraadtekst, afbeeldingen en publiceer gecontroleerd naar shop, categoriepagina’s en productpagina’s.</p>


      {saveStatus ? <div className={saveStatus === 'success' ? 'mt-6 rounded-2xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-3 text-sm font-bold text-emerald-100' : 'mt-6 rounded-2xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-100'}>
        {saveMessage || (saveStatus === 'success' ? 'Product opgeslagen.' : 'Product opslaan mislukt.')}
      </div> : null}


      <details className="mt-8 rounded-[1.5rem] border border-[#b7c8ad]/20 bg-[#b7c8ad]/[.06] p-4 md:p-5" open={!rawProducts.length}>
        <summary className="flex cursor-pointer items-center gap-2 text-lg font-black"><PackagePlus className="text-[#b7c8ad]"/> Nieuw product handmatig toevoegen</summary>
        <ProductForm mode="create" categories={categories} />
      </details>
    </section>

    <section className="mt-8 grid gap-5">
      {rows.map((product) => <details key={product.slug} className="card rounded-[1.7rem] p-5">
        <summary className="cursor-pointer list-none">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <img src={text(product.hero_image) || '/products/asorta-product-fallback.svg'} alt="" className="h-16 w-16 rounded-2xl object-cover opacity-85" />
              <div><p className="text-xs font-black uppercase tracking-[.22em] text-white/35">{product.category} • {product.status || 'draft'}{product.supplier_sku ? ` • SKU ${product.supplier_sku}` : ''} • online {Number(product.inventory_online || 0)} / markt {Number(product.inventory_market || 0)}</p><h2 className="text-xl font-black">{product.name}</h2><p className="text-sm text-white/45">/{product.slug}</p></div>
            </div>
            <div className="text-right"><p className="text-2xl font-black">€{Number(product.price || 0).toFixed(2)}</p><p className="text-xs text-white/45">Cost ± €{Number(product.estimated_cost || 0).toFixed(2)}</p></div>
          </div>
        </summary>
        <ProductForm mode="edit" product={product} categories={categories} />
        <form action={deleteProduct} className="mt-4 border-t border-white/10 pt-4">
          <input type="hidden" name="slug" value={product.slug} />
          <button type="submit" className="inline-flex items-center rounded-full border border-red-400/20 bg-red-500/10 px-4 py-2 text-sm font-black text-red-200 transition hover:bg-red-500/20">
            <Trash2 size={16} className="mr-2"/> Delete product
          </button>
        </form>
      </details>)}
    </section>
  </main>
}

function ProductForm({ mode, product, categories }:{ mode:'create'|'edit'; product?:RawProduct; categories:{slug:string;name:string}[] }){
  const p = product || {}
  return <form action={saveProduct} className="mt-6 grid gap-6" encType="multipart/form-data">
    <div className="grid gap-4 md:grid-cols-3">
      <Field label="Naam" name="name" defaultValue={text(p.name)} required />
      <Field label="Slug" name="slug" defaultValue={text(p.slug)} placeholder="wordt automatisch gemaakt als leeg" />
      <label className="grid gap-2"><span className="text-xs font-black uppercase tracking-[.20em] text-white/38">Categorie</span><select name="category" defaultValue={text(p.category, 'booster-packs')} className="rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-white outline-none focus:border-[#b7c8ad]">{categories.map((c)=><option key={c.slug} value={c.slug}>{c.name}</option>)}</select></label>
      <Field label="Prijs" name="price" type="number" step="0.01" defaultValue={String(p.price || '')} required />
      <Field label="Compare at" name="compare_at" type="number" step="0.01" defaultValue={String(p.compare_at || '')} />
      <Field label="Estimated cost" name="estimated_cost" type="number" step="0.01" defaultValue={String(p.estimated_cost || '')} />
      <Field label="Eigen SKU" name="supplier_sku" defaultValue={text(p.supplier_sku)} placeholder="bijv. AS-PKM-BOOST-001" />
      <Field label="Online voorraad" name="inventory_online" type="number" min="0" step="1" defaultValue={String(p.inventory_online ?? '')} />
      <Field label="Marktvoorraad" name="inventory_market" type="number" min="0" step="1" defaultValue={String(p.inventory_market ?? '')} />
      <Field label="Totaal voorraad" name="inventory_total" type="number" min="0" step="1" defaultValue={String(p.inventory_total ?? '')} placeholder="automatisch online + markt" />
      <Field label="Badge" name="badge" defaultValue={text(p.badge, 'Eigen voorraad')} />
      <label className="grid gap-2"><span className="text-xs font-black uppercase tracking-[.20em] text-white/38">Status</span><select name="status" defaultValue={text(p.status, 'draft')} className="rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-white outline-none focus:border-[#b7c8ad]"><option value="draft">draft</option><option value="active">active</option><option value="launch">launch</option><option value="sold_out">sold_out</option><option value="archived">archived</option></select></label>
      <Field label="Conditie label" name="condition_label" defaultValue={text(p.condition_label, 'Sealed')} />
      <Field label="Sealed status" name="sealed_status" defaultValue={text(p.sealed_status, 'Origineel sealed')} />
      <CheckField label="Online verkoopbaar" name="sell_online" defaultChecked={p.sell_online !== false} />
      <CheckField label="Mee naar markten" name="sell_market" defaultChecked={Boolean(p.sell_market)} />
      <CheckField label="Hot Deal tonen" name="hot_deal" defaultChecked={Boolean(p.hot_deal)} />
      <CheckField label="Auto-pricing aan" name="auto_pricing_enabled" defaultChecked={Boolean(p.auto_pricing_enabled)} />
      <CheckField label="Prijs lock" name="price_locked" defaultChecked={Boolean(p.price_locked)} />
    </div>

    <section className="rounded-[1.4rem] border border-[#b7c8ad]/15 bg-[#b7c8ad]/[.035] p-4">
      <h3 className="mb-4 font-black">Prijsautomatisering / marktwaarde</h3>
      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Cardmarket URL" name="cardmarket_url" defaultValue={text(p.cardmarket_url)} placeholder="https://www.cardmarket.com/..." />
        <Field label="Marktwaarde" name="market_value" type="number" step="0.01" defaultValue={String(p.market_value || '')} placeholder="bijv. 131.66" />
        <Field label="Prijsbron" name="market_source" defaultValue={text(p.market_source, 'Cardmarket handmatig')} />
        <Field label="Minimale marge %" name="min_margin_percent" type="number" step="0.1" defaultValue={String(p.min_margin_percent ?? 15)} />
        <Field label="Minimum verkoopprijs" name="min_price" type="number" step="0.01" defaultValue={String(p.min_price || '')} />
        <div className="rounded-xl border border-white/10 bg-black/35 px-4 py-3 text-xs leading-5 text-white/50">Gebruik Atlas → Prijsbeheer om Cardmarket tekstblokken te plakken, adviesprijzen te berekenen en wijzigingen te loggen.</div>
      </div>
    </section>

    <section className="rounded-[1.4rem] border border-white/10 bg-white/[.025] p-4">
      <div className="mb-4 flex items-center gap-2"><UploadCloud size={17} className="text-[#b7c8ad]"/><h3 className="font-black">Images</h3></div>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Hero image URL" name="hero_image" defaultValue={text(p.hero_image)} placeholder="/products/... of Supabase Storage URL" />
        <label className="grid gap-2"><span className="text-xs font-black uppercase tracking-[.20em] text-white/38">Upload hero image</span><input name="image_file" type="file" accept="image/*" className="rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-white file:mr-4 file:rounded-full file:border-0 file:bg-white file:px-4 file:py-2 file:font-black file:text-black" /></label>
        <Textarea label="Extra image URLs, één per regel" name="images" defaultValue={list(p.images)} rows={5} />
        <Textarea label="Videos JSON" name="videos" defaultValue={json(p.videos)} rows={5} />
      </div>
    </section>

    <div className="grid gap-4 md:grid-cols-2">
      <Textarea label="Short description" name="short_description" defaultValue={text(p.short_description)} rows={3} />
      <Textarea label="Description" name="description" defaultValue={text(p.description)} rows={5} />
      <Textarea label="Features, één per regel" name="features" defaultValue={list(p.features)} rows={6} />
      <Textarea label="Specs, één per regel" name="specs" defaultValue={list(p.specs)} rows={6} />
      <Textarea label="Tags, één per regel" name="tags" defaultValue={list(p.tags)} rows={4} />
      <Textarea label="Box items, één per regel" name="box_items" defaultValue={list(p.box_items)} rows={4} />
      <Textarea label="Shipping info" name="shipping_info" defaultValue={text(p.shipping_info)} rows={3} />
      <Textarea label="Content ideas, één per regel" name="content_ideas" defaultValue={list(p.content_ideas)} rows={4} />
    </div>

    <section className="rounded-[1.4rem] border border-white/10 bg-white/[.025] p-4">
      <h3 className="mb-4 font-black">Eigen voorraad / verkoopinformatie</h3>
      <div className="grid gap-4 md:grid-cols-3">
        <input type="hidden" name="supplier" value="manual" />
        <Field label="Voorraadlocatie" name="warehouse" defaultValue={text(p.warehouse, 'Eigen voorraad')} />
        <Field label="Inkoop/verkoop notitie" name="supplier_name" defaultValue={text(p.supplier_name, 'Eigen voorraad')} />
        <Field label="Verzendkosten" name="estimated_shipping" type="number" step="0.01" defaultValue={String(p.estimated_shipping || '')} />
        <Field label="Status voorraad" name="supplier_status" defaultValue={text(p.supplier_status, 'manual')} />
        <Field label="Verwerkingstijd" name="processing_time" defaultValue={text(p.processing_time, '1-2 werkdagen')} />
        <Field label="Levertijd" name="delivery_time" defaultValue={text(p.delivery_time, '1-3 werkdagen')} />
        <Textarea label="Interne productnotities" name="supplier_notes" defaultValue={text(p.supplier_notes)} rows={4} />
        <Textarea label="Marge / inkoopnotitie" name="margin_note" defaultValue={text(p.margin_note)} rows={4} />
      </div>
    </section>

    <Textarea label="Variants JSON" name="variants" defaultValue={json(p.variants)} rows={8} />

    <div className="flex flex-wrap items-center gap-3">
      <button className="btn-primary" type="submit"><Save size={18} className="mr-2"/> {mode === 'create' ? 'Create product' : 'Save product'}</button>
    </div>
  </form>
}

function Field({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label:string }){
  return <label className="grid gap-2"><span className="text-xs font-black uppercase tracking-[.20em] text-white/38">{label}</span><input {...props} className="rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-white outline-none transition focus:border-[#b7c8ad]" /></label>
}


function CheckField({ label, name, defaultChecked = false }: { label: string; name: string; defaultChecked?: boolean }){
  return <label className="flex min-h-[3.2rem] items-center gap-3 rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm font-black text-white/70"><input type="checkbox" name={name} defaultChecked={defaultChecked} className="h-4 w-4 accent-[#b7c8ad]" /> {label}</label>
}

function Textarea({ label, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label:string }){
  return <label className="grid gap-2"><span className="text-xs font-black uppercase tracking-[.20em] text-white/38">{label}</span><textarea {...props} className="min-h-24 rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-white outline-none transition focus:border-[#b7c8ad]" /></label>
}
