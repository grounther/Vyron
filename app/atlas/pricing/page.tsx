import Link from 'next/link'
import type React from 'react'
import { assertAtlasAdmin } from '@/lib/atlas-auth'
import { applySuggestedPrice, updatePricingInput } from './actions'
import { calculatePricing, formatEuro, parseCardmarketPriceText } from '@/lib/pricing'
import { ArrowLeft, Calculator, ExternalLink, LineChart, Lock, Save, ShieldCheck, TrendingDown } from 'lucide-react'

export const metadata = { title: 'Atlas Pricing | ASORTA internal', robots: { index: false, follow: false } }

type ProductRow = Record<string, any>
type LogRow = Record<string, any>
type SearchParams = Record<string, string | string[] | undefined>

function text(value: unknown, fallback = '') {
  return typeof value === 'string' && value.trim() ? value : fallback
}

function number(value: unknown, fallback = 0) {
  const parsed = typeof value === 'number' ? value : Number(value || 0)
  return Number.isFinite(parsed) ? parsed : fallback
}

function bool(value: unknown, fallback = false) {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value !== 0
  if (typeof value === 'string') return ['true', '1', 'yes', 'on'].includes(value.toLowerCase())
  return fallback
}

function dateTime(value: unknown) {
  const raw = String(value || '')
  if (!raw) return 'Nog niet'
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return 'Nog niet'
  return date.toLocaleString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function param(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] || '' : value || ''
}

async function loadPricingData() {
  const { admin } = await assertAtlasAdmin('/atlas/pricing')

  const productsResult = await admin
    .from('products')
    .select('*')
    .in('status', ['active', 'launch', 'draft', 'sold_out'])
    .order('updated_at', { ascending: false })
    .limit(250)

  const logsResult = await admin
    .from('product_pricing_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(30)

  return {
    products: (productsResult.data || []) as ProductRow[],
    productError: productsResult.error?.message || '',
    logs: (logsResult.data || []) as LogRow[],
    logError: logsResult.error?.message || '',
  }
}

export default async function AtlasPricingPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams
  const { products, productError, logs, logError } = await loadPricingData()
  const success = param(params.saved) || param(params.applied)
  const error = param(params.error)

  return <main className="mx-auto max-w-7xl px-4 py-10 md:px-6">
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <Link href="/atlas" className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-black text-white/65 transition hover:bg-white/10 hover:text-white"><ArrowLeft size={16}/> Atlas</Link>
      <span className="rounded-full border border-[#b7c8ad]/20 bg-[#b7c8ad]/10 px-4 py-2 text-xs font-black uppercase tracking-[.18em] text-[#dbe9d4]">Cardmarket paste-helper</span>
    </div>

    <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(122,166,184,.20),transparent_42%),linear-gradient(145deg,rgba(255,255,255,.08),rgba(255,255,255,.02))] p-6 md:p-10">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[.35em] text-[#b7c8ad]">Atlas pricing engine</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">Prijsbeheer</h1>
          <p className="mt-4 max-w-3xl text-white/60">Plak het Cardmarket prijsblok of vul handmatig een marktwaarde in. ASORTA berekent automatisch marktwaarde -2%, bewaakt je minimale marge en logt iedere prijsactie.</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-white/60"><ShieldCheck className="mb-2 text-[#b7c8ad]"/> Geen scraping/API nodig. Jij controleert de bron en Atlas bewaakt marge + logs.</div>
      </div>
    </section>

    {success ? <section className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-100">Prijsdata opgeslagen.</section> : null}
    {error ? <section className="mt-6 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-100">{error}</section> : null}
    {productError ? <section className="mt-6 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-100">Productdata kon niet worden geladen: {productError}</section> : null}
    {logError ? <section className="mt-6 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-100">Run eerst de SQL migration voor pricing logs: {logError}</section> : null}

    <section className="mt-8 grid gap-5">
      {products.length ? products.map((product) => <PricingCard key={product.slug} product={product} />) : <div className="card rounded-[2rem] p-8 text-center text-white/50">Geen producten gevonden.</div>}
    </section>

    <section className="mt-10 rounded-[2rem] border border-white/10 bg-white/[.025] p-5 md:p-6">
      <div className="mb-5 flex items-center gap-2"><LineChart className="text-[#b7c8ad]"/><h2 className="text-2xl font-black">Laatste pricing logs</h2></div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[880px] text-left text-sm">
          <thead className="text-xs uppercase tracking-[.18em] text-white/35"><tr><th className="py-3">Tijd</th><th>Product</th><th>Actie</th><th>Oud</th><th>Markt</th><th>Advies</th><th>Toegepast</th><th>Status</th><th>Notitie</th></tr></thead>
          <tbody>{logs.length ? logs.map((log) => <tr key={log.id || `${log.product_slug}-${log.created_at}`} className="border-t border-white/10 text-white/65"><td className="py-3">{dateTime(log.created_at)}</td><td className="font-bold text-white/85">{log.product_name || log.product_slug}</td><td>{log.action}</td><td>{formatEuro(number(log.old_price))}</td><td>{log.market_value ? formatEuro(number(log.market_value)) : '—'}</td><td>{log.suggested_price ? formatEuro(number(log.suggested_price)) : '—'}</td><td>{log.applied_price ? formatEuro(number(log.applied_price)) : '—'}</td><td>{log.status}</td><td className="max-w-[280px] truncate">{log.note || '—'}</td></tr>) : <tr className="border-t border-white/10"><td colSpan={9} className="py-8 text-center text-white/45">Nog geen pricing logs.</td></tr>}</tbody>
        </table>
      </div>
    </section>
  </main>
}

function PricingCard({ product }: { product: ProductRow }) {
  const calculation = calculatePricing({
    currentPrice: number(product.price),
    estimatedCost: number(product.estimated_cost),
    estimatedShipping: number(product.estimated_shipping),
    marketValue: number(product.market_value),
    minMarginPercent: number(product.min_margin_percent, 15),
    minPrice: number(product.min_price),
    priceLocked: bool(product.price_locked),
  })

  const statusClass = calculation.status === 'ready' || product.pricing_status === 'applied'
    ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-100'
    : calculation.status === 'review'
      ? 'border-amber-400/20 bg-amber-400/10 text-amber-100'
      : calculation.status === 'locked'
        ? 'border-white/15 bg-white/[.05] text-white/70'
        : 'border-white/10 bg-black/30 text-white/55'

  const sample = `Available items 68\nFrom 98,37 €\nPrice Trend 136,18 €\n30-days average price 146,14 €\n7-days average price 131,66 €\n1-day average price 125,00 €`
  const parsed = parseCardmarketPriceText(sample)

  return <details className="card rounded-[1.8rem] p-5 md:p-6" open={product.pricing_status === 'review'}>
    <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <img src={text(product.hero_image, '/products/asorta-product-fallback.svg')} alt="" className="h-16 w-16 rounded-2xl object-cover" />
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[.20em] text-white/35">{product.category} · {product.status || 'draft'} · {product.supplier_sku || 'geen SKU'}</p>
            <h2 className="truncate text-xl font-black">{product.name}</h2>
            <p className="text-sm text-white/45">/{product.slug}</p>
          </div>
        </div>
        <div className="grid gap-2 text-right sm:grid-cols-4 sm:text-left">
          <Metric label="Huidig" value={formatEuro(number(product.price))}/>
          <Metric label="Markt" value={product.market_value ? formatEuro(number(product.market_value)) : '—'}/>
          <Metric label="Advies" value={calculation.suggestedPrice ? formatEuro(calculation.suggestedPrice) : '—'}/>
          <div className={`rounded-2xl border px-3 py-2 text-xs font-black uppercase tracking-[.14em] ${statusClass}`}>{product.pricing_status || calculation.status}</div>
        </div>
      </div>
    </summary>

    <div className="mt-6 grid gap-5 border-t border-white/10 pt-5 xl:grid-cols-[1.15fr_.85fr]">
      <form action={updatePricingInput} className="grid gap-4">
        <input type="hidden" name="slug" value={product.slug} />
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Cardmarket URL" name="cardmarket_url" defaultValue={text(product.cardmarket_url)} placeholder="https://www.cardmarket.com/..." />
          <Field label="Bron" name="market_source" defaultValue={text(product.market_source, 'Cardmarket handmatig')} />
          <Field label="Marktwaarde" name="market_value" type="number" step="0.01" defaultValue={product.market_value ? String(product.market_value) : ''} placeholder="bijv. 131.66" />
          <Field label="Minimale marge %" name="min_margin_percent" type="number" step="0.1" defaultValue={String(product.min_margin_percent ?? 15)} />
          <Field label="Minimum verkoopprijs" name="min_price" type="number" step="0.01" defaultValue={product.min_price ? String(product.min_price) : ''} placeholder="optioneel" />
          <div className="grid gap-2 rounded-xl border border-white/10 bg-black/35 p-4 text-sm text-white/60">
            <CheckField label="Auto-pricing aan" name="auto_pricing_enabled" defaultChecked={bool(product.auto_pricing_enabled)} />
            <CheckField label="Prijs lock / niet automatisch wijzigen" name="price_locked" defaultChecked={bool(product.price_locked)} />
          </div>
        </div>
        <Textarea label="Cardmarket prijsblok plakken" name="cardmarket_text" rows={7} placeholder={sample} />
        <Textarea label="Pricing note / audit notitie" name="pricing_note" rows={3} defaultValue={text(product.last_pricing_note)} placeholder="Bijv. 7-days average gebruikt vanwege recente marktbeweging." />
        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" className="btn-primary"><Save size={18} className="mr-2"/> Prijsdata verwerken</button>
          {product.cardmarket_url ? <Link href={text(product.cardmarket_url)} target="_blank" className="btn-secondary">Open Cardmarket <ExternalLink size={16} className="ml-2"/></Link> : null}
        </div>
      </form>

      <aside className="grid content-start gap-4">
        <div className="rounded-[1.4rem] border border-white/10 bg-black/35 p-5">
          <div className="flex items-center gap-2"><Calculator size={18} className="text-[#b7c8ad]"/><h3 className="font-black">Berekening</h3></div>
          <div className="mt-4 grid gap-2 text-sm text-white/60">
            <Row label="Marktwaarde" value={calculation.marketValue ? formatEuro(calculation.marketValue) : '—'} />
            <Row label="ASORTA -2%" value={calculation.suggestedPrice ? formatEuro(calculation.suggestedPrice) : '—'} />
            <Row label="Kostprijs + verzend" value={formatEuro(calculation.totalCost)} />
            <Row label="PayPal fee schatting" value={formatEuro(calculation.estimatedFee)} />
            <Row label="Min. veilige prijs" value={formatEuro(calculation.minSafePrice)} />
            <Row label="Marge op advies" value={`${calculation.marginPercent.toFixed(2)}%`} />
          </div>
          <p className={`mt-4 rounded-2xl border p-3 text-sm leading-6 ${statusClass}`}>{calculation.note}</p>
        </div>

        <form action={applySuggestedPrice} className="rounded-[1.4rem] border border-white/10 bg-white/[.025] p-5">
          <input type="hidden" name="slug" value={product.slug} />
          <button type="submit" disabled={!calculation.canApply} className="inline-flex w-full items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-black text-black transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:bg-white/20 disabled:text-white/35"><TrendingDown size={18} className="mr-2"/> Adviesprijs toepassen</button>
          {bool(product.price_locked) ? <p className="mt-3 flex items-center gap-2 text-xs text-white/45"><Lock size={14}/> Prijs is gelockt.</p> : null}
        </form>

        <div className="rounded-[1.4rem] border border-white/10 bg-black/25 p-5 text-xs leading-6 text-white/45">
          <p className="font-black uppercase tracking-[.18em] text-white/55">Paste helper voorbeeld</p>
          <p className="mt-2">De helper herkent o.a. From, Price Trend, 30-days, 7-days en 1-day average. Voorkeur: 7-days → Price Trend → 30-days → 1-day → From.</p>
          <p className="mt-2 text-white/35">Testwaarde herkend als: {parsed.preferredMetric} {parsed.preferredMarketValue ? formatEuro(parsed.preferredMarketValue) : '—'}</p>
        </div>
      </aside>
    </div>
  </details>
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div><p className="text-[10px] font-black uppercase tracking-[.18em] text-white/35">{label}</p><p className="mt-1 text-lg font-black text-white">{value}</p></div>
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[.025] px-3 py-2"><span>{label}</span><strong className="text-white/85">{value}</strong></div>
}

function Field({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return <label className="grid gap-2"><span className="text-xs font-black uppercase tracking-[.20em] text-white/38">{label}</span><input {...props} className="rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-white outline-none transition focus:border-[#b7c8ad]" /></label>
}

function Textarea({ label, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return <label className="grid gap-2"><span className="text-xs font-black uppercase tracking-[.20em] text-white/38">{label}</span><textarea {...props} className="min-h-24 rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-white outline-none transition focus:border-[#b7c8ad]" /></label>
}

function CheckField({ label, name, defaultChecked = false }: { label: string; name: string; defaultChecked?: boolean }) {
  return <label className="flex items-center gap-3 text-sm font-black text-white/70"><input type="checkbox" name={name} defaultChecked={defaultChecked} className="h-4 w-4 accent-[#b7c8ad]" /> {label}</label>
}
