import Link from 'next/link'
import type React from 'react'
import { assertAtlasAdmin } from '@/lib/atlas-auth'
import { categories } from '@/lib/products'
import { getProducts } from '@/lib/catalog'
import { deleteProduct, saveProduct } from './actions'
import { PackagePlus, PackageSearch, Save, Trash2, UploadCloud } from 'lucide-react'

export const metadata = { title: 'Atlas Products | ASORTA internal', robots: { index: false, follow: false } }

type RawProduct = Record<string, any>

function text(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback
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

export default async function AtlasProducts(){
  await assertAtlasAdmin('/atlas/products')
  const [rawProducts, previewProducts] = await Promise.all([getRawProducts(), getProducts()])
  const rows = rawProducts.length ? rawProducts : previewProducts.map((p) => ({
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
    cj_product_id: p.supplier?.productId,
    cj_variant_ids: p.supplier?.variantIds,
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
      <p className="mt-4 max-w-3xl text-white/55">Voeg producten toe, bewerk bestaande producten, upload een hero afbeelding naar Supabase Storage en publiceer direct naar shop, categoriepagina’s en productpagina’s.</p>

      <details className="mt-8 rounded-[1.5rem] border border-[#b7c8ad]/20 bg-[#b7c8ad]/[.06] p-4 md:p-5" open={!rawProducts.length}>
        <summary className="flex cursor-pointer items-center gap-2 text-lg font-black"><PackagePlus className="text-[#b7c8ad]"/> Nieuw product toevoegen</summary>
        <ProductForm mode="create" categories={categories} />
      </details>
    </section>

    <section className="mt-8 grid gap-5">
      {rows.map((product) => <details key={product.slug} className="card rounded-[1.7rem] p-5">
        <summary className="cursor-pointer list-none">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <img src={text(product.hero_image) || '/products/asorta-product-fallback.svg'} alt="" className="h-16 w-16 rounded-2xl object-cover opacity-85" />
              <div><p className="text-xs font-black uppercase tracking-[.22em] text-white/35">{product.category} • {product.status || 'draft'}</p><h2 className="text-xl font-black">{product.name}</h2><p className="text-sm text-white/45">/{product.slug}</p></div>
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
      <label className="grid gap-2"><span className="text-xs font-black uppercase tracking-[.20em] text-white/38">Categorie</span><select name="category" defaultValue={text(p.category, 'smart-utility')} className="rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-white outline-none focus:border-[#b7c8ad]">{categories.map((c)=><option key={c.slug} value={c.slug}>{c.name}</option>)}</select></label>
      <Field label="Prijs" name="price" type="number" step="0.01" defaultValue={String(p.price || '')} required />
      <Field label="Compare at" name="compare_at" type="number" step="0.01" defaultValue={String(p.compare_at || '')} />
      <Field label="Estimated cost" name="estimated_cost" type="number" step="0.01" defaultValue={String(p.estimated_cost || '')} />
      <Field label="Badge" name="badge" defaultValue={text(p.badge, 'New')} />
      <label className="grid gap-2"><span className="text-xs font-black uppercase tracking-[.20em] text-white/38">Status</span><select name="status" defaultValue={text(p.status, 'draft')} className="rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-white outline-none focus:border-[#b7c8ad]"><option value="draft">draft</option><option value="active">active</option><option value="launch">launch</option><option value="archived">archived</option></select></label>
      <Field label="Warehouse" name="warehouse" defaultValue={text(p.warehouse, 'China')} />
    </div>

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
      <h3 className="mb-4 font-black">Supplier / CJ mapping</h3>
      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Supplier name" name="supplier_name" defaultValue={text(p.supplier_name)} />
        <Field label="Supplier URL" name="supplier_url" defaultValue={text(p.supplier_url)} />
        <Field label="CJ product ID" name="cj_product_id" defaultValue={text(p.cj_product_id)} />
        <Field label="CJ variant ID" name="cj_variant_id" defaultValue={text(p.cj_variant_id)} />
        <Field label="CJ SKU" name="cj_sku" defaultValue={text(p.cj_sku)} />
        <Field label="Estimated shipping" name="estimated_shipping" type="number" step="0.01" defaultValue={String(p.estimated_shipping || '')} />
        <Field label="Supplier status" name="supplier_status" defaultValue={text(p.supplier_status, 'testing')} />
        <Field label="Processing time" name="processing_time" defaultValue={text(p.processing_time)} />
        <Field label="Delivery time" name="delivery_time" defaultValue={text(p.delivery_time)} />
        <Textarea label="CJ variant IDs, één per regel" name="cj_variant_ids" defaultValue={list(p.cj_variant_ids)} rows={4} />
        <Textarea label="Supplier notes" name="supplier_notes" defaultValue={text(p.supplier_notes)} rows={4} />
        <Textarea label="Margin note" name="margin_note" defaultValue={text(p.margin_note)} rows={4} />
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

function Textarea({ label, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label:string }){
  return <label className="grid gap-2"><span className="text-xs font-black uppercase tracking-[.20em] text-white/38">{label}</span><textarea {...props} className="min-h-24 rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-white outline-none transition focus:border-[#b7c8ad]" /></label>
}
