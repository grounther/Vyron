'use client'

import { useState, type ReactNode } from 'react'
import { Euro, Package, ReceiptText, TrendingUp, Truck } from 'lucide-react'

type AtlasOrder = {
  id: string
  number: string
  customer: string
  productSummary: string
  total: number
  cost: number
  profit: number
  paymentStatus: string
  fulfillmentStatus: string
  supplier: string
  createdAt: string
  shopifyOrderName?: string
  tracking?: string
}

type AtlasMetrics = {
  activeProducts: number
  orderCount: number
  paidOrders: number
  pendingOrders: number
  paidRevenue: number
  estimatedCost: number
  estimatedProfit: number
  avgMargin: number
  orders: AtlasOrder[]
  paidOrderRows: AtlasOrder[]
  productRows: Record<string, unknown>[]
  errors: string[]
}

type PanelName = 'revenue' | 'profit'

function number(value: unknown, fallback = 0) {
  const parsed = typeof value === 'number' ? value : Number(value || 0)
  return Number.isFinite(parsed) ? parsed : fallback
}

function eur(value: number) {
  return `€${number(value).toFixed(2)}`
}

export default function AtlasMetricsGridClient({ metrics }: { metrics: AtlasMetrics }) {
  const [openPanels, setOpenPanels] = useState<Record<PanelName, boolean>>({
    revenue: false,
    profit: false,
  })

  function togglePanel(panel: PanelName) {
    setOpenPanels((current) => ({ ...current, [panel]: !current[panel] }))
  }

  const hasAnyPanel = openPanels.revenue || openPanels.profit

  return (
    <section className="mt-8">
      <div className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          icon={<Package />}
          label="Active products"
          value={String(metrics.activeProducts)}
          helper="Shopify-synced and buyable"
        />

        <MetricButton
          icon={<Euro />}
          label="Paid revenue"
          value={eur(metrics.paidRevenue)}
          helper={`${metrics.paidOrders} paid orders`}
          active={openPanels.revenue}
          onClick={() => togglePanel('revenue')}
        />

        <MetricButton
          icon={<TrendingUp />}
          label="Est. profit"
          value={eur(metrics.estimatedProfit)}
          helper={`${eur(metrics.estimatedCost)} estimated cost`}
          active={openPanels.profit}
          onClick={() => togglePanel('profit')}
        />

        <Stat
          icon={<Truck />}
          label="Avg. margin"
          value={`${metrics.avgMargin}%`}
          helper="Based on paid orders"
        />
      </div>

      {hasAnyPanel ? (
        <div className="mt-4 grid items-start gap-6 lg:grid-cols-2">
          {openPanels.revenue ? (
            <BreakdownPanel>
              <RevenuePanel metrics={metrics} />
            </BreakdownPanel>
          ) : (
            <div className="hidden lg:block" />
          )}

          {openPanels.profit ? (
            <BreakdownPanel>
              <ProfitPanel metrics={metrics} />
            </BreakdownPanel>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}

function Stat({ icon, label, value, helper }: { icon: ReactNode; label: string; value: string; helper?: string }) {
  return (
    <div className="card min-h-[158px] rounded-[1.5rem] p-5">
      <div className="text-[#b7c8ad]">{icon}</div>
      <p className="mt-4 text-xs font-black uppercase tracking-[.22em] text-white/35">{label}</p>
      <p className="mt-2 text-3xl font-black">{value}</p>
      {helper ? <p className="mt-2 text-xs text-white/40">{helper}</p> : null}
    </div>
  )
}

function MetricButton({ icon, label, value, helper, active, onClick }: { icon: ReactNode; label: string; value: string; helper?: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={active}
      className={`card min-h-[158px] rounded-[1.5rem] p-5 text-left transition hover:-translate-y-1 hover:border-white/25 ${active ? 'border-[#b7c8ad]/40 bg-[#b7c8ad]/[.06]' : ''}`}
    >
      <div className="text-[#b7c8ad]">{icon}</div>
      <p className="mt-4 text-xs font-black uppercase tracking-[.22em] text-white/35">{label}</p>
      <p className="mt-2 text-3xl font-black">{value}</p>
      {helper ? <p className="mt-2 text-xs text-white/40">{helper}</p> : null}
      <p className="mt-3 text-xs font-black uppercase tracking-[.18em] text-[#b7c8ad]/70">
        {active ? 'Hide breakdown' : 'Click for breakdown'}
      </p>
    </button>
  )
}

function BreakdownPanel({ children }: { children: ReactNode }) {
  return <div className="rounded-[1.9rem] border border-white/10 bg-black/45 p-5 shadow-2xl md:p-6">{children}</div>
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[.035] p-4">
      <p className="text-xs font-black uppercase tracking-[.18em] text-white/35">{label}</p>
      <p className="mt-2 text-xl font-black">{value}</p>
    </div>
  )
}

function RevenuePanel({ metrics }: { metrics: AtlasMetrics }) {
  return (
    <div>
      <h3 className="flex items-center gap-3 text-2xl font-black leading-tight">
        <ReceiptText size={20} className="text-[#b7c8ad]" />
        <span>Paid revenue<br className="hidden sm:block" /> breakdown</span>
      </h3>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <MiniStat label="Paid orders" value={String(metrics.paidOrders)} />
        <MiniStat label="Paid revenue" value={eur(metrics.paidRevenue)} />
        <MiniStat label="Pending orders" value={String(metrics.pendingOrders)} />
      </div>

      <div className="mt-5 grid gap-2 text-sm text-white/60">
        {metrics.paidOrderRows.length ? (
          metrics.paidOrderRows.slice(0, 8).map((order) => (
            <div key={order.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[.025] px-3 py-2">
              <span className="truncate font-bold text-white/80">{order.number} · {order.customer}</span>
              <span>{eur(order.total)}</span>
            </div>
          ))
        ) : (
          <p className="rounded-xl border border-white/10 bg-white/[.025] px-4 py-4">Nog geen betaalde orders gevonden.</p>
        )}
      </div>
    </div>
  )
}

function ProfitPanel({ metrics }: { metrics: AtlasMetrics }) {
  const top = [...metrics.paidOrderRows].sort((a, b) => b.profit - a.profit).slice(0, 8)

  return (
    <div>
      <h3 className="flex items-center gap-3 text-2xl font-black leading-tight">
        <TrendingUp size={20} className="text-[#b7c8ad]" />
        <span>Estimated profit<br className="hidden sm:block" /> breakdown</span>
      </h3>

      <div className="mt-5 grid gap-3 sm:grid-cols-4">
        <MiniStat label="Revenue" value={eur(metrics.paidRevenue)} />
        <MiniStat label="Est. cost" value={eur(metrics.estimatedCost)} />
        <MiniStat label="Est. profit" value={eur(metrics.estimatedProfit)} />
        <MiniStat label="Margin" value={`${metrics.avgMargin}%`} />
      </div>

      <div className="mt-5 grid gap-2 text-sm text-white/60">
        {top.length ? (
          top.map((order) => (
            <div key={order.id} className="grid gap-1 rounded-xl border border-white/10 bg-white/[.025] px-3 py-2 sm:grid-cols-[1fr_auto_auto]">
              <span className="truncate font-bold text-white/80">{order.number} · {order.productSummary}</span>
              <span>Cost {eur(order.cost)}</span>
              <span className="text-[#dbe9d4]">Profit {eur(order.profit)}</span>
            </div>
          ))
        ) : (
          <p className="rounded-xl border border-white/10 bg-white/[.025] px-4 py-4">Nog geen profitdata. Zorg dat Shopify orders via webhook in Supabase staan en dat producten een estimated_cost hebben.</p>
        )}
      </div>
    </div>
  )
}
