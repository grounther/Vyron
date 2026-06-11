import type React from 'react'
import { redirect } from 'next/navigation'
import { assertAtlasAccess, hasAtlasPermission, isSupportOnly } from '@/lib/atlas-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import AtlasMetricsGridClient from '@/components/atlas/AtlasMetricsGridClient'
import {
  ShieldCheck,
  Package,
  TrendingUp,
  Truck,
  Euro,
  AlertTriangle,
  Lock,
  FileText,
  PackageSearch,
  Megaphone,
  Mail,
  ShoppingCart,
  MessageCircle,
  PlugZap,
  ReceiptText,
  FileSpreadsheet,
  Calculator,
  UsersRound,
} from 'lucide-react'

export const metadata = { title: 'Atlas | ASORTA internal', robots: { index: false, follow: false } }

type AnyRow = Record<string, any>

type OrderItemRow = {
  id?: string
  order_id: string
  product_name?: string
  product_slug?: string
  quantity?: number
  unit_price?: number
  estimated_unit_cost?: number
  shopify_product_id?: string
  shopify_variant_id?: string
  supplier?: string
  supplier_sku?: string
}

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
  productRows: AnyRow[]
  errors: string[]
}

const emptyMetrics: AtlasMetrics = {
  activeProducts: 0,
  orderCount: 0,
  paidOrders: 0,
  pendingOrders: 0,
  paidRevenue: 0,
  estimatedCost: 0,
  estimatedProfit: 0,
  avgMargin: 0,
  orders: [],
  paidOrderRows: [],
  productRows: [],
  errors: [],
}

function number(value: unknown, fallback = 0) {
  const parsed = typeof value === 'number' ? value : Number(value || 0)
  return Number.isFinite(parsed) ? parsed : fallback
}

function eur(value: number) {
  return `€${number(value).toFixed(2)}`
}

function isPaidStatus(value: unknown) {
  const status = String(value || '').toLowerCase()
  return ['paid', 'authorized', 'partially_paid', 'complete', 'completed'].includes(status)
}

function isPendingStatus(value: unknown) {
  const status = String(value || '').toLowerCase()
  return ['pending', 'payment_pending', 'authorized'].includes(status)
}

function createdAt(value: unknown) {
  const raw = String(value || '')
  const date = raw ? new Date(raw) : null
  if (!date || Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function productSummary(items: OrderItemRow[]) {
  if (!items.length) return '—'
  const names = items.map((item) => String(item.product_name || item.product_slug || 'Product')).filter(Boolean)
  if (!names.length) return '—'
  return names.length > 1 ? `${names[0]} + ${names.length - 1} more` : names[0]
}

function supplierSummary(items: OrderItemRow[]) {
  const suppliers = Array.from(new Set(items.map((item) => String(item.supplier || 'manual')).filter(Boolean)))
  return suppliers.length ? suppliers.join(', ') : 'manual'
}

function legacyId(value: unknown) {
  const raw = String(value || '').trim()
  const match = raw.match(/(\d+)$/)
  return match?.[1] || raw
}

function productCostLookup(products: AnyRow[]) {
  const map = new Map<string, number>()

  for (const product of products) {
    const cost = number(product.estimated_cost)
    const variantLegacy = String(product.shopify_variant_legacy_id || '').trim()
    const variantGid = String(product.shopify_variant_id || '').trim()
    const productLegacy = String(product.shopify_product_legacy_id || '').trim()
    const productGid = String(product.shopify_product_id || '').trim()

    if (variantLegacy) map.set(`variant:${variantLegacy}`, cost)
    if (variantGid) map.set(`variant:${variantGid}`, cost)
    if (variantGid) map.set(`variant:${legacyId(variantGid)}`, cost)
    if (productLegacy) map.set(`product:${productLegacy}`, cost)
    if (productGid) map.set(`product:${productGid}`, cost)
    if (productGid) map.set(`product:${legacyId(productGid)}`, cost)
  }

  return map
}

function itemCost(item: OrderItemRow, costs: Map<string, number>) {
  const explicit = number(item.estimated_unit_cost)
  if (explicit > 0) return explicit

  const variant = String(item.shopify_variant_id || '').trim()
  const product = String(item.shopify_product_id || '').trim()

  return costs.get(`variant:${variant}`) || costs.get(`variant:${legacyId(variant)}`) || costs.get(`product:${product}`) || costs.get(`product:${legacyId(product)}`) || 0
}

async function loadMetrics(admin: ReturnType<typeof createAdminClient>): Promise<AtlasMetrics> {
  if (!admin) return emptyMetrics

  const errors: string[] = []

  const productsResult = await admin
    .from('products')
    .select('id,name,slug,price,estimated_cost,shopify_product_id,shopify_product_legacy_id,shopify_variant_id,shopify_variant_legacy_id,status')
    .in('status', ['active', 'launch'])
    .limit(2000)

  if (productsResult.error) errors.push(productsResult.error.message)
  const productRows = (productsResult.data || []) as AnyRow[]
  const costMap = productCostLookup(productRows)

  const ordersResult = await admin
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(80)

  if (ordersResult.error) errors.push(ordersResult.error.message)
  const orderRows = (ordersResult.data || []) as AnyRow[]
  const orderIds = orderRows.map((order) => String(order.id)).filter(Boolean)

  let itemRows: OrderItemRow[] = []
  if (orderIds.length) {
    const itemsResult = await admin
      .from('order_items')
      .select('*')
      .in('order_id', orderIds)

    if (itemsResult.error) errors.push(itemsResult.error.message)
    itemRows = (itemsResult.data || []) as OrderItemRow[]
  }

  const itemsByOrder = new Map<string, OrderItemRow[]>()
  for (const item of itemRows) {
    const orderId = String(item.order_id || '')
    if (!orderId) continue
    const existing = itemsByOrder.get(orderId) || []
    existing.push(item)
    itemsByOrder.set(orderId, existing)
  }

  const orders = orderRows.map((order): AtlasOrder => {
    const items = itemsByOrder.get(String(order.id)) || []
    const total = number(order.total) || items.reduce((sum, item) => sum + number(item.unit_price) * number(item.quantity, 1), 0)
    const computedCost = items.reduce((sum, item) => sum + itemCost(item, costMap) * number(item.quantity, 1), 0)
    const storedCost = number(order.estimated_cost)
    const cost = storedCost > 0 ? storedCost : computedCost
    const storedProfit = number(order.estimated_profit)
    const profit = storedProfit !== 0 || cost === 0 ? storedProfit || (total - cost) : total - cost
    const paymentStatus = String(order.payment_status || order.shopify_financial_status || 'pending')

    return {
      id: String(order.id),
      number: String(order.order_number || order.shopify_order_name || order.id || '—'),
      customer: String(order.customer_email || 'guest checkout'),
      productSummary: productSummary(items),
      total,
      cost,
      profit,
      paymentStatus,
      fulfillmentStatus: String(order.fulfillment_status || order.shopify_fulfillment_status || 'pending'),
      supplier: supplierSummary(items),
      createdAt: createdAt(order.created_at),
      shopifyOrderName: String(order.shopify_order_name || ''),
      tracking: String(order.tracking_number || ''),
    }
  })

  const paidOrderRows = orders.filter((order) => isPaidStatus(order.paymentStatus))
  const paidRevenue = paidOrderRows.reduce((sum, order) => sum + order.total, 0)
  const estimatedCost = paidOrderRows.reduce((sum, order) => sum + order.cost, 0)
  const estimatedProfit = paidRevenue - estimatedCost
  const avgMargin = paidRevenue ? Math.round((estimatedProfit / paidRevenue) * 100) : 0

  return {
    activeProducts: productRows.length,
    orderCount: orders.length,
    paidOrders: paidOrderRows.length,
    pendingOrders: orders.filter((order) => isPendingStatus(order.paymentStatus)).length,
    paidRevenue,
    estimatedCost,
    estimatedProfit,
    avgMargin,
    orders,
    paidOrderRows,
    productRows,
    errors,
  }
}

export default async function AtlasPage(){
  const { admin, staff } = await assertAtlasAccess('/atlas')

  if (isSupportOnly(staff)) redirect('/atlas/support')

  const metrics = await loadMetrics(admin)

  const cards = [
    { permission: 'pages' as const, href: '/atlas/pages', icon: <FileText className="text-[#b7c8ad]"/>, title: 'Page Editor', text: 'Beheer homepage teksten, promo slider content en support snippets.' },
    { permission: 'products' as const, href: '/atlas/products', icon: <PackageSearch className="text-[#b7c8ad]"/>, title: 'Product Editor', text: 'Beheer Pokemon producten, eigen SKU’s, voorraad, prijzen en marge-indicatie.' },
    { permission: 'promotions' as const, href: '/atlas/promotions', icon: <Megaphone className="text-[#b7c8ad]"/>, title: 'Acties', text: 'Beheer openingsacties, kortingsslides en promo placements.' },
    { permission: 'newsletter' as const, href: '/atlas/newsletter', icon: <Mail className="text-[#b7c8ad]"/>, title: 'Exclusive Drops', text: 'Beheer e-mail inschrijvingen, welcome mails en drop campagnes.' },
    { permission: 'recovery' as const, href: '/atlas/recovery', icon: <ShoppingCart className="text-[#b7c8ad]"/>, title: 'Cart Recovery', text: 'Bekijk abandoned carts en verstuur recovery mails.' },
    { permission: 'support' as const, href: '/atlas/support', icon: <MessageCircle className="text-[#b7c8ad]"/>, title: 'Support Center', text: 'Live chats, klantdossiers, orders, tracking en klantenservice antwoorden beheren.' },
    { permission: 'orders' as const, href: '/atlas/orders', icon: <ReceiptText className="text-[#b7c8ad]"/>, title: 'Orderbeheer', text: 'Betaalde PayPal/Mollie-orders verwerken, voorraad/rewards controleren en tracking bijwerken.' },
    { permission: 'orders' as const, href: '/atlas/bookkeeping', icon: <FileSpreadsheet className="text-[#b7c8ad]"/>, title: 'Boekhouding', text: 'Automatische boekhoudregels voor betaalde orders downloaden als Excel of CSV voor Sheets.' },
    { permission: 'pricing' as const, href: '/atlas/pricing', icon: <Calculator className="text-[#b7c8ad]"/>, title: 'Prijsbeheer', text: 'Cardmarket paste-helper, marktwaarde -2%, margecheck en pricing logs.' },
    { permission: 'integrations' as const, href: '/atlas/integrations', icon: <PlugZap className="text-[#b7c8ad]"/>, title: 'Integrations', text: 'Betaalproviders, PayPal checkout, Mollie voorbereiding en sync status.' },
    { permission: 'settings' as const, href: '/atlas/staff', icon: <UsersRound className="text-[#b7c8ad]"/>, title: 'Medewerkers', text: 'Beheer staff accounts, support badges en Atlas rechten per medewerker.' },
  ].filter((card) => hasAtlasPermission(staff, card.permission))

  return <main className="mx-auto max-w-7xl px-4 py-10 md:px-6">
    <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(111,125,100,.18),transparent_38%),linear-gradient(145deg,rgba(255,255,255,.08),rgba(255,255,255,.02))] p-6 md:p-10">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[.35em] text-[#b7c8ad]">Internal control</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">Atlas</h1>
          <p className="mt-4 max-w-2xl text-white/60">Intern ASORTA beheerpaneel. Je ziet alleen de onderdelen waarvoor je account rechten heeft.</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-white/55"><ShieldCheck className="mb-2 text-[#b7c8ad]"/> Ingelogd als {staff.displayName}<br/><span className="text-white/35">{staff.email}</span></div>
      </div>
    </section>

    {metrics.errors.length ? <section className="mt-8 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-100"><strong>Atlas data warning:</strong> {metrics.errors.join(' | ')}</section> : null}

    <AtlasMetricsGridClient metrics={metrics} />

    <section className="mt-8 grid gap-4 md:grid-cols-4">
      {cards.map((card) => <Link key={card.href} href={card.href} className="card group rounded-[1.7rem] p-6 transition hover:-translate-y-1 hover:border-white/25">{card.icon}<h2 className="mt-4 text-2xl font-black">{card.title}</h2><p className="mt-2 text-sm leading-6 text-white/55">{card.text}</p></Link>)}
    </section>

    {hasAtlasPermission(staff, 'orders') || hasAtlasPermission(staff, 'settings') ? <section className="mt-8 grid gap-6">
      <div className="card rounded-[2rem] p-5">
        <div className="mb-5 flex items-center justify-between"><h2 className="text-2xl font-black">Orders overview</h2><span className="rounded-full bg-[#b7c8ad]/10 px-3 py-1 text-xs font-black text-[#dbe9d4]">live Supabase</span></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[780px] text-left text-sm">
          <thead className="text-xs uppercase tracking-[.18em] text-white/35"><tr><th className="py-3">Order</th><th>Customer</th><th>Product</th><th>Total</th><th>Est. profit</th><th>Payment</th><th>Fulfillment</th><th>Supplier</th></tr></thead>
          <tbody>{metrics.orders.length ? metrics.orders.map((order)=><tr key={order.id} className="border-t border-white/10 text-white/70"><td className="py-4 font-black text-white">{order.number}</td><td>{order.customer}</td><td className="max-w-[220px] truncate">{order.productSummary}</td><td>{eur(order.total)}</td><td>{eur(order.profit)}</td><td>{order.paymentStatus}</td><td>{order.fulfillmentStatus}</td><td>{order.supplier}</td></tr>) : <tr className="border-t border-white/10"><td colSpan={8} className="py-8 text-center text-white/45">Nog geen live PayPal orders ontvangen. Zodra checkout-orders binnenkomen, verschijnen ze hier.</td></tr>}</tbody>
        </table></div>
      </div>

      <div className="card rounded-[2rem] p-5">
        <h2 className="text-2xl font-black">Live status</h2>
        <div className="mt-5 grid gap-3 text-sm text-white/60 sm:grid-cols-2 xl:grid-cols-5">
          <Step title="Catalog" text={`${metrics.activeProducts} active Pokemon products.`} />
          <Step title="Orders" text={`${metrics.orderCount} mirrored orders, ${metrics.pendingOrders} pending.`} />
          <Step title="Revenue" text={`${eur(metrics.paidRevenue)} paid revenue from PayPal/checkout.`} />
          <Step title="Profit" text={`${eur(metrics.estimatedProfit)} estimated profit after product cost.`} />
          <Step title="Fulfillment" text="Eigen voorraad wordt handmatig verwerkt; betaal- en verzendupdates blijven zichtbaar in Atlas." />
        </div>
      </div>
    </section> : null}
  </main>
}

function Stat({icon,label,value,helper,className = ''}:{icon:React.ReactNode;label:string;value:string;helper?:string;className?:string}){
  return <div className={`card min-h-[158px] self-start rounded-[1.5rem] p-5 ${className}`}><div className="text-[#b7c8ad]">{icon}</div><p className="mt-4 text-xs font-black uppercase tracking-[.22em] text-white/35">{label}</p><p className="mt-2 text-3xl font-black">{value}</p>{helper && <p className="mt-2 text-xs text-white/40">{helper}</p>}</div>
}

function MetricDetails({icon,label,value,helper,children,summaryClassName = '',panelClassName = ''}:{icon:React.ReactNode;label:string;value:string;helper?:string;children:React.ReactNode;summaryClassName?:string;panelClassName?:string}){
  return <details className="group contents">
    <summary className={`card min-h-[158px] self-start list-none rounded-[1.5rem] p-5 transition hover:-translate-y-1 hover:border-white/25 cursor-pointer group-open:border-[#b7c8ad]/40 group-open:bg-[#b7c8ad]/[.06] [&::-webkit-details-marker]:hidden ${summaryClassName}`}>
      <div className="text-[#b7c8ad]">{icon}</div><p className="mt-4 text-xs font-black uppercase tracking-[.22em] text-white/35">{label}</p><p className="mt-2 text-3xl font-black">{value}</p>{helper && <p className="mt-2 text-xs text-white/40">{helper}</p>}<p className="mt-3 text-xs font-black uppercase tracking-[.18em] text-[#b7c8ad]/70">Click for breakdown</p>
    </summary>
    <div className={`mt-0 rounded-[1.5rem] border border-white/10 bg-black/45 p-4 md:p-5 ${panelClassName}`}>{children}</div>
  </details>
}

function MiniStat({label,value}:{label:string;value:string}){
  return <div className="rounded-2xl border border-white/10 bg-white/[.035] p-4"><p className="text-xs font-black uppercase tracking-[.18em] text-white/35">{label}</p><p className="mt-2 text-xl font-black">{value}</p></div>
}

function RevenuePanel({metrics}:{metrics:AtlasMetrics}){
  return <div>
    <h3 className="flex items-center gap-2 text-lg font-black"><ReceiptText size={18} className="text-[#b7c8ad]"/> Paid revenue breakdown</h3>
    <div className="mt-4 grid gap-3 sm:grid-cols-3"><MiniStat label="Paid orders" value={String(metrics.paidOrders)}/><MiniStat label="Paid revenue" value={eur(metrics.paidRevenue)}/><MiniStat label="Pending orders" value={String(metrics.pendingOrders)}/></div>
    <div className="mt-4 grid gap-2 text-sm text-white/60">{metrics.paidOrderRows.length ? metrics.paidOrderRows.slice(0, 8).map((order) => <div key={order.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[.025] px-3 py-2"><span className="truncate font-bold text-white/80">{order.number} · {order.customer}</span><span>{eur(order.total)}</span></div>) : <p className="rounded-xl border border-white/10 bg-white/[.025] px-3 py-3">Nog geen betaalde orders gevonden.</p>}</div>
  </div>
}

function ProfitPanel({metrics}:{metrics:AtlasMetrics}){
  const top = [...metrics.paidOrderRows].sort((a,b)=>b.profit-a.profit).slice(0,8)
  return <div>
    <h3 className="flex items-center gap-2 text-lg font-black"><TrendingUp size={18} className="text-[#b7c8ad]"/> Estimated profit breakdown</h3>
    <div className="mt-4 grid gap-3 sm:grid-cols-4"><MiniStat label="Revenue" value={eur(metrics.paidRevenue)}/><MiniStat label="Est. cost" value={eur(metrics.estimatedCost)}/><MiniStat label="Est. profit" value={eur(metrics.estimatedProfit)}/><MiniStat label="Margin" value={`${metrics.avgMargin}%`}/></div>
    <div className="mt-4 grid gap-2 text-sm text-white/60">{top.length ? top.map((order) => <div key={order.id} className="grid gap-1 rounded-xl border border-white/10 bg-white/[.025] px-3 py-2 sm:grid-cols-[1fr_auto_auto]"><span className="truncate font-bold text-white/80">{order.number} · {order.productSummary}</span><span>Cost {eur(order.cost)}</span><span className="text-[#dbe9d4]">Profit {eur(order.profit)}</span></div>) : <p className="rounded-xl border border-white/10 bg-white/[.025] px-3 py-3">Nog geen profitdata. Zorg dat Shopify orders via webhook in Supabase staan en dat producten een estimated_cost hebben.</p>}</div>
  </div>
}

function Step({title,text}:{title:string;text:string}){return <div className="rounded-2xl border border-white/10 bg-white/[.035] p-4"><h3 className="font-black text-white">{title}</h3><p className="mt-1 leading-6">{text}</p></div>}
