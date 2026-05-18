'use client'

import { useState, type ReactNode } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronRight, Euro, ExternalLink, Package, ReceiptText, TrendingUp, Truck } from 'lucide-react'
import type { AtlasMetrics, AtlasOrderOverview } from '@/lib/atlas-metrics'

type Panel = 'revenue' | 'profit' | null

function eur(value: number) {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(Number(value || 0))
}

function dateTime(value: string) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('nl-NL', { dateStyle: 'short', timeStyle: 'short' }).format(date)
}

function statusClass(value: string) {
  const status = value.toLowerCase()
  if (['paid', 'fulfilled'].includes(status)) return 'border-emerald-400/20 bg-emerald-400/10 text-emerald-100'
  if (status.includes('partial') || status.includes('authorized')) return 'border-blue-400/20 bg-blue-400/10 text-blue-100'
  if (status.includes('pending')) return 'border-amber-400/20 bg-amber-400/10 text-amber-100'
  if (status.includes('cancel') || status.includes('refund') || status.includes('void')) return 'border-red-400/20 bg-red-400/10 text-red-100'
  return 'border-white/10 bg-white/[.06] text-white/65'
}

export default function AtlasMetricsClient({ metrics }: { metrics: AtlasMetrics }) {
  const [panel, setPanel] = useState<Panel>(null)

  const togglePanel = (next: Panel) => setPanel((current) => current === next ? null : next)

  return <>
    <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard icon={<Package/>} label="Active products" value={String(metrics.productHealth.activeShopifyProducts)} helper={`${metrics.productHealth.missingCost} without cost`} />
      <MetricCard icon={<Euro/>} label="Paid revenue" value={eur(metrics.totals.paidRevenue)} helper={`${metrics.totals.paidOrders} paid orders`} active={panel === 'revenue'} onClick={() => togglePanel('revenue')} />
      <MetricCard icon={<TrendingUp/>} label="Est. profit" value={eur(metrics.totals.estimatedProfit)} helper={`${eur(metrics.totals.estimatedCost)} est. cost`} active={panel === 'profit'} onClick={() => togglePanel('profit')} />
      <MetricCard icon={<Truck/>} label="Avg. margin" value={`${metrics.totals.averageMargin}%`} helper={`${metrics.productHealth.averageCatalogMargin}% catalog avg.`} />
    </section>

    {panel && <section className="mt-5 rounded-[1.7rem] border border-white/10 bg-white/[.035] p-4 md:p-6">
      {panel === 'revenue' ? <RevenuePanel metrics={metrics}/> : <ProfitPanel metrics={metrics}/>} 
    </section>}

    <section className="mt-8 grid gap-6 xl:grid-cols-[1.45fr_.75fr]">
      <OrdersOverview orders={metrics.orders}/>
      <StatusOverview metrics={metrics}/>
    </section>
  </>
}

function MetricCard({ icon, label, value, helper, active, onClick }: { icon: ReactNode; label: string; value: string; helper?: string; active?: boolean; onClick?: () => void }) {
  const content = <>
    <div className="flex items-start justify-between gap-3">
      <div className="text-[#b7c8ad]">{icon}</div>
      {onClick && <span className="rounded-full border border-white/10 bg-white/[.04] p-1 text-white/45 transition group-hover:text-white">{active ? <ChevronDown size={16}/> : <ChevronRight size={16}/>}</span>}
    </div>
    <p className="mt-4 text-[11px] font-black uppercase tracking-[.22em] text-white/35">{label}</p>
    <p className="mt-2 text-3xl font-black tracking-tight">{value}</p>
    {helper && <p className="mt-2 text-xs text-white/42">{helper}</p>}
  </>

  if (onClick) {
    return <button type="button" onClick={onClick} className={`card group rounded-[1.5rem] p-5 text-left transition hover:-translate-y-0.5 hover:border-white/25 ${active ? 'border-[#b7c8ad]/40 bg-[#b7c8ad]/[.06]' : ''}`}>{content}</button>
  }

  return <div className="card rounded-[1.5rem] p-5">{content}</div>
}

function RevenuePanel({ metrics }: { metrics: AtlasMetrics }) {
  return <div>
    <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
      <div><p className="text-xs font-black uppercase tracking-[.24em] text-[#b7c8ad]">Revenue details</p><h2 className="mt-2 text-2xl font-black">Betaalde Shopify/PayPal omzet</h2></div>
      <p className="text-sm text-white/45">Revenue telt alleen orders met status paid / authorized / partially paid.</p>
    </div>
    <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <MiniStat label="Paid revenue" value={eur(metrics.totals.paidRevenue)}/>
      <MiniStat label="Paid orders" value={String(metrics.totals.paidOrders)}/>
      <MiniStat label="All mirrored orders" value={String(metrics.totals.allOrders)}/>
      <MiniStat label="Pending payment" value={String(metrics.totals.pendingOrders)}/>
    </div>
    <div className="mt-5 overflow-x-auto rounded-2xl border border-white/10">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="bg-white/[.03] text-xs uppercase tracking-[.18em] text-white/35"><tr><th className="px-4 py-3">Order</th><th>Customer</th><th>Date</th><th>Total</th><th>Payment</th><th>Fulfillment</th></tr></thead>
        <tbody>{metrics.recentPaidOrders.length ? metrics.recentPaidOrders.map((order) => <OrderMiniRow key={order.id} order={order}/>) : <tr><td colSpan={6} className="px-4 py-6 text-center text-white/45">Nog geen betaalde orders ontvangen via Shopify.</td></tr>}</tbody>
      </table>
    </div>
  </div>
}

function ProfitPanel({ metrics }: { metrics: AtlasMetrics }) {
  return <div>
    <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
      <div><p className="text-xs font-black uppercase tracking-[.24em] text-[#b7c8ad]">Profit details</p><h2 className="mt-2 text-2xl font-black">Geschatte winst op basis van estimated_cost</h2></div>
      <p className="text-sm text-white/45">Profit = paid revenue - estimated product cost. Supplier fees/shipping kunnen afwijken.</p>
    </div>
    <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <MiniStat label="Paid revenue" value={eur(metrics.totals.paidRevenue)}/>
      <MiniStat label="Estimated cost" value={eur(metrics.totals.estimatedCost)}/>
      <MiniStat label="Estimated profit" value={eur(metrics.totals.estimatedProfit)}/>
      <MiniStat label="Avg. margin" value={`${metrics.totals.averageMargin}%`}/>
    </div>
    <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_.8fr]">
      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-white/[.03] text-xs uppercase tracking-[.18em] text-white/35"><tr><th className="px-4 py-3">Order</th><th>Items</th><th>Revenue</th><th>Est. cost</th><th>Est. profit</th><th>Margin</th></tr></thead>
          <tbody>{metrics.topProfitOrders.length ? metrics.topProfitOrders.map((order) => <tr key={order.id} className="border-t border-white/10 text-white/68"><td className="px-4 py-3 font-black text-white">{order.shopifyOrderName || order.orderNumber}</td><td className="max-w-[260px] truncate">{order.itemsSummary}</td><td>{eur(order.total)}</td><td>{eur(order.estimatedCost)}</td><td className="font-black text-white">{eur(order.estimatedProfit)}</td><td>{order.margin}%</td></tr>) : <tr><td colSpan={6} className="px-4 py-6 text-center text-white/45">Nog geen betaalde orders met winstdata.</td></tr>}</tbody>
        </table>
      </div>
      <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/58">
        <h3 className="font-black text-white">Cost health</h3>
        <p className="mt-2 leading-6">Producten zonder <code className="text-white/80">estimated_cost</code> geven een te hoge winst. Vul inkoopkosten in Atlas Product Editor of via Shopify/DSers sync.</p>
        <div className="mt-4 grid gap-2">
          <MiniStat label="Products without cost" value={String(metrics.productHealth.missingCost)}/>
          <MiniStat label="Missing variant ID" value={String(metrics.productHealth.missingVariantId)}/>
        </div>
      </div>
    </div>
  </div>
}

function OrdersOverview({ orders }: { orders: AtlasOrderOverview[] }) {
  return <div className="card rounded-[2rem] p-5">
    <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between"><div><h2 className="text-2xl font-black">Orders overview</h2><p className="mt-1 text-sm text-white/45">Live gekoppeld aan Shopify order webhooks.</p></div><span className="w-fit rounded-full bg-white/10 px-3 py-1 text-xs font-black text-white/50">{orders.length} recent</span></div>
    <div className="overflow-x-auto"><table className="w-full min-w-[920px] text-left text-sm">
      <thead className="text-xs uppercase tracking-[.18em] text-white/35"><tr><th className="py-3">Order</th><th>Customer</th><th>Items</th><th>Total</th><th>Est. profit</th><th>Payment</th><th>Fulfillment</th><th>Tracking</th></tr></thead>
      <tbody>{orders.length ? orders.map((order) => <tr key={order.id} className="border-t border-white/10 text-white/70"><td className="py-4 font-black text-white"><div>{order.shopifyOrderName || order.orderNumber}</div><div className="mt-1 text-[11px] font-normal text-white/35">{dateTime(order.createdAt)}</div></td><td>{order.customerEmail}</td><td className="max-w-[280px] truncate" title={order.itemsSummary}>{order.itemsSummary}</td><td>€{order.total.toFixed(2)}</td><td className="font-black text-white">€{order.estimatedProfit.toFixed(2)}</td><td><Badge value={order.paymentStatus}/></td><td><Badge value={order.fulfillmentStatus}/></td><td>{order.trackingUrl ? <Link href={order.trackingUrl} target="_blank" className="inline-flex items-center gap-1 text-[#b7c8ad] hover:text-white">Track <ExternalLink size={13}/></Link> : order.trackingNumber || <span className="text-white/35">—</span>}</td></tr>) : <tr><td colSpan={8} className="py-8 text-center text-white/45">Nog geen Shopify orders ontvangen. Zodra Shopify webhooks binnenkomen, verschijnen orders hier live.</td></tr>}</tbody>
    </table></div>
  </div>
}

function StatusOverview({ metrics }: { metrics: AtlasMetrics }) {
  return <div className="card rounded-[2rem] p-5">
    <h2 className="text-2xl font-black">Live order health</h2>
    <div className="mt-5 grid gap-3">
      <MiniStat label="Fulfilled orders" value={String(metrics.totals.fulfilledOrders)}/>
      <MiniStat label="Catalog products" value={String(metrics.productHealth.activeShopifyProducts)}/>
      <MiniStat label="Catalog avg. margin" value={`${metrics.productHealth.averageCatalogMargin}%`}/>
    </div>
    <div className="mt-6 grid gap-5 text-sm">
      <Breakdown title="Payment status" rows={metrics.paymentBreakdown}/>
      <Breakdown title="Fulfillment status" rows={metrics.fulfillmentBreakdown}/>
    </div>
  </div>
}

function Breakdown({ title, rows }: { title: string; rows: { label: string; count: number; revenue: number }[] }) {
  return <div><h3 className="font-black text-white">{title}</h3><div className="mt-3 grid gap-2">{rows.length ? rows.map((row) => <div key={row.label} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[.025] px-3 py-2"><span className="capitalize text-white/65">{row.label}</span><span className="text-xs text-white/45">{row.count} · {eur(row.revenue)}</span></div>) : <p className="text-white/40">Nog geen data.</p>}</div></div>
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-white/10 bg-white/[.035] p-3"><p className="text-[10px] font-black uppercase tracking-[.18em] text-white/35">{label}</p><p className="mt-1 text-lg font-black text-white">{value}</p></div>
}

function Badge({ value }: { value: string }) {
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-black capitalize ${statusClass(value)}`}>{value.replace(/_/g, ' ')}</span>
}

function OrderMiniRow({ order }: { order: AtlasOrderOverview }) {
  return <tr className="border-t border-white/10 text-white/68"><td className="px-4 py-3 font-black text-white">{order.shopifyOrderName || order.orderNumber}</td><td>{order.customerEmail}</td><td>{dateTime(order.createdAt)}</td><td>{eur(order.total)}</td><td><Badge value={order.paymentStatus}/></td><td><Badge value={order.fulfillmentStatus}/></td></tr>
}
