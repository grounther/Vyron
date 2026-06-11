import type React from 'react'
import Link from 'next/link'
import { AlertTriangle, CheckCircle2, Download, Euro, FileSpreadsheet, RefreshCcw, TrendingUp } from 'lucide-react'
import { assertAtlasPermission } from '@/lib/atlas-auth'
import { loadBookkeepingRows, type BookkeepingExportRow } from '@/lib/bookkeeping'

export const metadata = { title: 'Boekhouding | Atlas ASORTA', robots: { index: false, follow: false } }

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

function cleanParam(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value
  return /^\d{4}-\d{2}-\d{2}$/.test(String(raw || '')) ? String(raw) : ''
}

function eur(value: unknown) {
  const parsed = Number(value || 0)
  return `€${Number.isFinite(parsed) ? parsed.toFixed(2) : '0.00'}`
}

function pct(value: unknown) {
  const parsed = Number(value || 0)
  return `${Number.isFinite(parsed) ? parsed.toFixed(1) : '0.0'}%`
}

function buildExportHref(format: 'xlsx' | 'csv', from: string, to: string) {
  const params = new URLSearchParams({ format })
  if (from) params.set('from', from)
  if (to) params.set('to', to)
  return `/api/atlas/bookkeeping/export?${params.toString()}`
}

function date(value: string) {
  if (!value) return '—'
  const parsed = new Date(`${value}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default async function AtlasBookkeepingPage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {}
  const from = cleanParam(params.from)
  const to = cleanParam(params.to)
  const { admin } = await assertAtlasPermission('orders', '/atlas/bookkeeping')
  const result = await loadBookkeepingRows(admin, { from, to, limit: 1000 })
  const rows = result.rows

  const totalRevenue = rows.reduce((sum, row) => sum + row.total, 0)
  const totalVat = rows.reduce((sum, row) => sum + row.vatTotal, 0)
  const totalCost = rows.reduce((sum, row) => sum + row.estimatedCost, 0)
  const totalProfit = rows.reduce((sum, row) => sum + row.grossProfit, 0)
  const avgMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0
  const lastRows = rows.slice(0, 80)

  return <main className="mx-auto max-w-7xl px-4 py-10 md:px-6">
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="text-xs font-black uppercase tracking-[.35em] text-[#b7c8ad]">Atlas boekhouding</p>
        <h1 className="mt-3 text-4xl font-black md:text-6xl">Boekhouding export</h1>
        <p className="mt-3 max-w-3xl text-white/55">Betaalde orders worden automatisch als boekhoudregels gesynchroniseerd en zijn direct te downloaden als Excel- of CSV-bestand voor Excel, Google Sheets of je boekhouder.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link href="/atlas/orders" className="rounded-full border border-white/10 px-5 py-3 text-sm font-black text-white/60 hover:bg-white/10 hover:text-white">Orders</Link>
        <Link href="/atlas" className="rounded-full border border-white/10 px-5 py-3 text-sm font-black text-white/60 hover:bg-white/10 hover:text-white">Atlas</Link>
      </div>
    </div>

    {result.warning ? <section className="mt-6 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm leading-6 text-amber-100"><AlertTriangle className="mr-2 inline" size={18}/> {result.warning}</section> : <section className="mt-6 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-4 text-sm leading-6 text-emerald-100"><CheckCircle2 className="mr-2 inline" size={18}/> Boekhoudregels zijn actief. Nieuwe betaalde orders worden automatisch gesynchroniseerd.</section>}

    <section className="mt-8 grid gap-4 md:grid-cols-4">
      <Stat icon={<FileSpreadsheet />} label="Regels" value={String(rows.length)} helper={result.source === 'bookkeeping_entries' ? 'uit boekhoudtabel' : 'tijdelijke export uit orders'} />
      <Stat icon={<Euro />} label="Omzet" value={eur(totalRevenue)} helper={`BTW: ${eur(totalVat)}`} />
      <Stat icon={<TrendingUp />} label="Brutomarge" value={eur(totalProfit)} helper={`Gem. marge: ${pct(avgMargin)}`} />
      <Stat icon={<RefreshCcw />} label="Gesynchroniseerd" value={String(result.synced || 0)} helper="bij openen/exporteren" />
    </section>

    <section className="mt-8 rounded-[2rem] border border-white/10 bg-white/[.035] p-5">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <form className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <label className="grid gap-2 text-sm font-bold text-white/70">Van
            <input type="date" name="from" defaultValue={from} className="support-input rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-white" />
          </label>
          <label className="grid gap-2 text-sm font-bold text-white/70">Tot en met
            <input type="date" name="to" defaultValue={to} className="support-input rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-white" />
          </label>
          <button className="rounded-full border border-[#b7c8ad]/30 px-5 py-3 text-sm font-black text-[#dbe9d4] hover:bg-[#b7c8ad]/10">Filter</button>
        </form>
        <div className="flex flex-wrap gap-2">
          <Link href={buildExportHref('xlsx', from, to)} className="inline-flex items-center gap-2 rounded-full bg-[#b7c8ad] px-5 py-3 text-sm font-black text-[#10150f] hover:opacity-90"><Download size={17}/> Download Excel</Link>
          <Link href={buildExportHref('csv', from, to)} className="inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-3 text-sm font-black text-white/70 hover:bg-white/10"><Download size={17}/> Download CSV</Link>
        </div>
      </div>
      <p className="mt-4 text-xs leading-5 text-white/40">Excel bevat numerieke kolommen voor omzet, verzendkosten, BTW, inkoopwaarde en marge. CSV gebruikt puntkomma’s en Nederlandse decimale komma’s.</p>
    </section>

    <section className="mt-8 rounded-[2rem] border border-white/10 bg-black/30 p-0">
      <div className="flex flex-col gap-2 border-b border-white/10 p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-black">Laatste boekhoudregels</h2>
          <p className="mt-1 text-sm text-white/45">Periode {from ? date(from) : 'start'} t/m {to ? date(to) : 'vandaag'}.</p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/[.04] px-4 py-2 text-xs font-black uppercase tracking-[.16em] text-white/45">{rows.length} regels</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1120px] text-left text-sm">
          <thead className="text-xs uppercase tracking-[.18em] text-white/35">
            <tr><th className="px-5 py-4">Boekdatum</th><th>Order</th><th>Klant</th><th>Producten</th><th>Betaalwijze</th><th>Omzet</th><th>Inkoop</th><th>Marge</th><th>Status</th></tr>
          </thead>
          <tbody>{lastRows.length ? lastRows.map((row) => <BookkeepingTableRow key={`${row.orderNumber}-${row.bookedAt}`} row={row} />) : <tr className="border-t border-white/10"><td colSpan={9} className="px-5 py-10 text-center text-white/45">Nog geen betaalde orders in deze periode.</td></tr>}</tbody>
        </table>
      </div>
    </section>
  </main>
}

function Stat({ icon, label, value, helper }: { icon: React.ReactNode; label: string; value: string; helper?: string }) {
  return <div className="card min-h-[158px] rounded-[1.5rem] p-5"><div className="text-[#b7c8ad]">{icon}</div><p className="mt-4 text-xs font-black uppercase tracking-[.22em] text-white/35">{label}</p><p className="mt-2 text-3xl font-black">{value}</p>{helper ? <p className="mt-2 text-xs text-white/40">{helper}</p> : null}</div>
}

function BookkeepingTableRow({ row }: { row: BookkeepingExportRow }) {
  return <tr className="border-t border-white/10 text-white/65">
    <td className="px-5 py-4 font-bold text-white/80">{date(row.bookedAt)}</td>
    <td className="font-black text-white">{row.orderNumber}</td>
    <td><div className="max-w-[190px] truncate">{row.customerName || row.customerEmail || '—'}</div><div className="max-w-[190px] truncate text-xs text-white/35">{row.customerEmail}</div></td>
    <td className="max-w-[260px] truncate">{row.productsSummary || '—'}</td>
    <td><div className="font-bold text-white/75">{row.paymentMethod || row.paymentProvider || '—'}</div><div className="text-xs text-white/35">{row.externalPaymentId || 'geen payment id'}</div></td>
    <td>{eur(row.total)}</td>
    <td>{eur(row.estimatedCost)}</td>
    <td><span className="font-black text-[#dbe9d4]">{eur(row.grossProfit)}</span><span className="ml-2 text-xs text-white/35">{pct(row.marginPercent)}</span></td>
    <td><span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-black uppercase tracking-[.12em] text-emerald-100">{row.paymentStatus || 'paid'}</span></td>
  </tr>
}
