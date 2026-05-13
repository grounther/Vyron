'use client'

import type React from 'react'
import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { CheckCircle2, Loader2, Search, UploadCloud, Wand2, AlertTriangle } from 'lucide-react'

type Category = { slug: string; name: string }

type CJPreview = {
  ok: boolean
  productSku: string
  pid: string
  productNameEn: string
  slugSuggestion: string
  categoryName: string
  image: string
  images: string[]
  variantCount: number
  estimatedCostUsd: number | null
  suggestedSellPrice: string
  firstVariantSku: string
  firstVariantId: string
  weightGrams: number | null
  sourceIdentifier: string
  warnings: string[]
}

type Props = {
  categories: Category[]
  cjConfigured: boolean
  action: (formData: FormData) => void | Promise<void>
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function inferSku(input: string) {
  const match = input.toUpperCase().match(/CJ[A-Z0-9-]{6,}/)
  return match?.[0] || ''
}

export default function CJImportFormClient({ categories, cjConfigured, action }: Props) {
  const [url, setUrl] = useState('')
  const [sku, setSku] = useState('')
  const [countryCode, setCountryCode] = useState('CN')
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [category, setCategory] = useState('smart-utility')
  const [price, setPrice] = useState('')
  const [compareAt, setCompareAt] = useState('')
  const [shipping, setShipping] = useState('')
  const [badge, setBadge] = useState('CJ Import')
  const [status, setStatus] = useState('archived')
  const [shortText, setShortText] = useState('')
  const [description, setDescription] = useState('')
  const [preview, setPreview] = useState<CJPreview | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isPending, startTransition] = useTransition()
  const touchedName = useRef(false)
  const touchedSlug = useRef(false)
  const abortRef = useRef<AbortController | null>(null)

  const inferredSku = useMemo(() => inferSku(`${url} ${sku}`), [url, sku])
  const canPreview = Boolean(url.trim() || sku.trim())

  async function loadPreview(nextUrl = url, nextSku = sku, silent = false) {
    const cleanUrl = nextUrl.trim()
    const cleanSku = nextSku.trim()
    if (!cleanUrl && !cleanSku) return

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    try {
      if (!silent) setLoading(true)
      setError('')
      const query = new URLSearchParams()
      if (cleanUrl) query.set('url', cleanUrl)
      if (cleanSku) query.set('sku', cleanSku)
      if (countryCode.trim()) query.set('countryCode', countryCode.trim().toUpperCase())

      const response = await fetch(`/api/cj/product-preview?${query.toString()}`, {
        cache: 'no-store',
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'CJ preview kon niet worden opgehaald.')

      const nextPreview = data as CJPreview
      setPreview(nextPreview)
      if (nextPreview.productSku && !cleanSku) setSku(nextPreview.productSku)
      if (nextPreview.productNameEn && !touchedName.current) setName(nextPreview.productNameEn)
      if (nextPreview.slugSuggestion && !touchedSlug.current) setSlug(nextPreview.slugSuggestion)
      if (nextPreview.productNameEn && !shortText) setShortText(nextPreview.productNameEn)
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      setPreview(null)
      setError(err instanceof Error ? err.message : 'CJ preview kon niet worden opgehaald.')
    } finally {
      if (!controller.signal.aborted) setLoading(false)
    }
  }

  function handleUrlChange(event: React.ChangeEvent<HTMLInputElement>) {
    const value = event.target.value
    setUrl(value)
    const detected = inferSku(value)
    if (detected && !sku) setSku(detected)
  }

  useEffect(() => {
    if (!canPreview) return
    const timer = window.setTimeout(() => {
      loadPreview(url, sku || inferredSku, true)
    }, 750)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, sku, countryCode])

  return <section className="mt-8 rounded-[1.5rem] border border-[#b7c8ad]/25 bg-[#b7c8ad]/[.07] p-4 md:p-5">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <div className="flex items-center gap-2"><UploadCloud size={18} className="text-[#b7c8ad]"/><h2 className="text-lg font-black">CJ product importer</h2></div>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-white/55">Plak een CJ product-URL, SPU/productSku of variantSku. Atlas haalt server-side productdata, afbeeldingen, varianten, SKU’s en VID’s op en zet het product veilig als archived/draft in jouw eigen catalogus. Bij een CJ URL probeert Atlas de SPU/PID automatisch te herkennen.</p>
      </div>
      <div className={cjConfigured ? 'rounded-2xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-3 text-xs font-black uppercase tracking-[.18em] text-emerald-100' : 'rounded-2xl border border-amber-400/25 bg-amber-500/10 px-4 py-3 text-xs font-black uppercase tracking-[.18em] text-amber-100'}>
        {cjConfigured ? 'CJ API actief' : 'CJ_API_KEY ontbreekt'}
      </div>
    </div>

    <form action={(formData) => startTransition(() => action(formData))} className="mt-5 grid gap-5">
      <div className="rounded-[1.3rem] border border-white/10 bg-black/25 p-4">
        <div className="grid gap-4 md:grid-cols-[1fr_220px_170px]">
          <Field label="CJ product URL" name="cj_import_url" value={url} onChange={handleUrlChange} placeholder="https://cjdropshipping.com/product/..." />
          <Field label="CJ SPU / SKU" name="cj_import_sku" value={sku || inferredSku} onChange={(event) => setSku(event.target.value.toUpperCase())} placeholder="optioneel bij URL" />
          <Field label="Warehouse" name="cj_country_code" value={countryCode} onChange={(event) => setCountryCode(event.target.value.toUpperCase())} placeholder="CN, US, DE, NL..." />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => loadPreview()} disabled={!canPreview || loading || !cjConfigured} className="inline-flex items-center rounded-full border border-[#b7c8ad]/25 bg-[#b7c8ad]/10 px-4 py-2 text-sm font-black text-[#dbe9d4] transition hover:bg-[#b7c8ad]/20 disabled:opacity-45">
            {loading ? <Loader2 size={16} className="mr-2 animate-spin"/> : <Search size={16} className="mr-2"/>}
            Haal CJ-info op
          </button>
          <span className="inline-flex items-center gap-2 text-xs font-bold text-white/42"><Wand2 size={14}/> URL plakken is genoeg; Atlas probeert SPU/PID automatisch te herkennen.</span>
        </div>

        {error ? <div className="mt-4 flex gap-2 rounded-2xl border border-red-400/20 bg-red-500/10 p-3 text-sm font-bold text-red-100"><AlertTriangle size={17}/><span>{error}</span></div> : null}
        {preview ? <div className="mt-4 grid gap-4 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 md:grid-cols-[96px_1fr]">
          <img src={preview.image || '/products/asorta-product-fallback.svg'} alt="" className="h-24 w-24 rounded-2xl object-cover" />
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-black uppercase tracking-[.18em] text-emerald-100"><CheckCircle2 size={15}/> CJ preview geladen</div>
            <h3 className="mt-2 text-xl font-black">{preview.productNameEn || 'CJ product'}</h3>
            <p className="mt-1 text-sm text-white/55">SPU {preview.productSku || '—'} • PID {preview.pid || '—'} • {preview.variantCount} varianten • kostprijs ± {preview.estimatedCostUsd ? `$${preview.estimatedCostUsd.toFixed(2)}` : 'onbekend'}</p>
            {preview.warnings?.length ? <ul className="mt-3 list-disc pl-5 text-xs leading-5 text-amber-100/85">{preview.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul> : null}
          </div>
        </div> : null}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Naam override" name="cj_import_name" value={name} onChange={(event) => { touchedName.current = true; setName(event.target.value); if (!touchedSlug.current) setSlug(slugify(event.target.value)) }} placeholder="automatisch via CJ" />
        <Field label="Slug override" name="cj_import_slug" value={slug} onChange={(event) => { touchedSlug.current = true; setSlug(slugify(event.target.value)) }} placeholder="automatisch via CJ" />
        <label className="grid gap-2"><span className="text-xs font-black uppercase tracking-[.20em] text-white/38">Categorie</span><select name="cj_import_category" value={category} onChange={(event) => setCategory(event.target.value)} className="rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-white outline-none focus:border-[#b7c8ad]">{categories.map((c)=><option key={c.slug} value={c.slug}>{c.name}</option>)}</select></label>
        <Field label="Retail prijs EUR" name="cj_import_price" type="number" step="0.01" value={price} onChange={(event) => setPrice(event.target.value)} placeholder="vul voor livegang in" />
        <Field label="Compare-at EUR" name="cj_import_compare_at" type="number" step="0.01" value={compareAt} onChange={(event) => setCompareAt(event.target.value)} />
        <Field label="Estimated shipping EUR" name="cj_import_shipping" type="number" step="0.01" value={shipping} onChange={(event) => setShipping(event.target.value)} />
        <Field label="Badge" name="cj_import_badge" value={badge} onChange={(event) => setBadge(event.target.value)} />
        <label className="grid gap-2"><span className="text-xs font-black uppercase tracking-[.20em] text-white/38">Import status</span><select name="cj_import_status" value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-white outline-none focus:border-[#b7c8ad]"><option value="archived">archived - niet live</option><option value="draft">draft</option><option value="active">active</option><option value="launch">launch</option></select></label>
        <Field label="Korte tekst override" name="cj_import_short" value={shortText} onChange={(event) => setShortText(event.target.value)} placeholder="automatisch via CJ" />
      </div>

      <Textarea label="Beschrijving override" name="cj_import_description" value={description} onChange={(event) => setDescription(event.target.value)} rows={4} placeholder="Leeg laten = CJ description wordt opgeschoond overgenomen." />

      <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm font-bold text-white/65">
        <input name="cj_add_to_my_product" type="checkbox" className="mt-1" />
        <span>Voeg product ook toe aan CJ My Products als CJ dit toestaat. Dit is niet hetzelfde als een Shopify/store connectie; jouw Atlas-catalogus blijft de bron voor je eigen webshop.</span>
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <button className="btn-primary" type="submit" disabled={isPending || loading || !cjConfigured}><UploadCloud size={18} className="mr-2"/> {isPending ? 'Importeren...' : 'Importeren vanuit CJ'}</button>
        <p className="text-xs font-bold text-white/40">Advies: laat status op archived staan, controleer copy/prijs/compliance, zet daarna pas live.</p>
      </div>
    </form>
  </section>
}

function Field({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label:string }){
  return <label className="grid gap-2"><span className="text-xs font-black uppercase tracking-[.20em] text-white/38">{label}</span><input {...props} className="rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-white outline-none transition focus:border-[#b7c8ad]" /></label>
}

function Textarea({ label, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label:string }){
  return <label className="grid gap-2"><span className="text-xs font-black uppercase tracking-[.20em] text-white/38">{label}</span><textarea {...props} className="min-h-24 rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-white outline-none transition focus:border-[#b7c8ad]" /></label>
}
