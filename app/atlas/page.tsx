import type React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
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
  const suppliers = Array.from(new Set(items.map((item) => String(item.supplier || 'dsers')).filter(Boolean)))
  return suppliers.length ? suppliers.join(', ') : 'dsers'
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
    .select('id,name,price,estimated_cost,shopify_product_id,shopify_product_legacy_id,shopify_variant_id,shopify_variant_legacy_id,status')
    .in('status', ['active', 'launch'])
    .not('shopify_product_id', 'is', null)
    .not('shopify_variant_legacy_id', 'is', null)
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
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) redirect('/atlas-access?next=/atlas')

  const admin = createAdminClient()
  let isAdmin = false
  let adminCheckReady = false

  if (admin) {
    const { data } = await admin.from('admin_users').select('email, role, active').eq('email', user.email).eq('active', true).maybeSingle()
    isAdmin = Boolean(data)
    adminCheckReady = true
  }

  if (adminCheckReady && !isAdmin) {
    return <main className="mx-auto max-w-xl px-4 py-16 md:px-6">
      <div className="card rounded-[2rem] p-6 text-center">
        <Lock className="mx-auto text-[#b7c8ad]" size={42}/>
        <h1 className="mt-4 text-3xl font-black">Access denied</h1>
        <p className="mt-3 text-white/55">Je bent ingelogd, maar dit account heeft geen ASORTA Atlas rechten. Voeg dit e-mailadres toe aan de Supabase tabel <code>admin_users</code>.</p>
      </div>
    </main>
  }

  const metrics = await loadMetrics(admin)

  return <main className="mx-auto max-w-7xl px-4 py-10 md:px-6">
    <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(111,125,100,.18),transparent_38%),linear-gradient(145deg,rgba(255,255,255,.08),rgba(255,255,255,.02))] p-6 md:p-10">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[.35em] text-[#b7c8ad]">Internal control</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">Atlas</h1>
          <p className="mt-4 max-w-2xl text-white/60">Intern ASORTA beheerpaneel voor live orders, productkosten, winstindicatie, supplier status en Shopify/DSers monitoring.</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-white/55"><ShieldCheck className="mb-2 text-[#b7c8ad]"/> Protected by Supabase Auth + admin allowlist.</div>
      </div>
    </section>

    {!adminCheckReady && <section className="mt-8 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-100/75"><AlertTriangle size={18} className="mb-2"/> Service role key ontbreekt. Atlas login werkt, maar live order metrics kunnen nog niet server-side worden geladen.</section>}
    {metrics.errors.length ? <section className="mt-8 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-100"><strong>Atlas data warning:</strong> {metrics.errors.join(' | ')}</section> : null}

    <AtlasMetricsGridClient metrics={metrics} />

    <section className="mt-8 grid gap-4 md:grid-cols-4">
      <Link href="/atlas/pages" className="card group rounded-[1.7rem] p-6 transition hover:-translate-y-1 hover:border-white/25"><FileText className="text-[#b7c8ad]"/><h2 className="mt-4 text-2xl font-black">Page Editor</h2><p className="mt-2 text-sm leading-6 text-white/55">Beheer homepage teksten, promo slider content en support snippets.</p></Link>
      <Link href="/atlas/products" className="card group rounded-[1.7rem] p-6 transition hover:-translate-y-1 hover:border-white/25"><PackageSearch className="text-[#b7c8ad]"/><h2 className="mt-4 text-2xl font-black">Product Editor</h2><p className="mt-2 text-sm leading-6 text-white/55">Bekijk Shopify launchproducten, varianten, DSers costs en marge-indicatie.</p></Link>
      <Link href="/atlas/promotions" className="card group rounded-[1.7rem] p-6 transition hover:-translate-y-1 hover:border-white/25"><Megaphone className="text-[#b7c8ad]"/><h2 className="mt-4 text-2xl font-black">Acties</h2><p className="mt-2 text-sm leading-6 text-white/55">Beheer openingsacties, kortingsslides en promo placements.</p></Link>
      <Link href="/atlas/newsletter" className="card group rounded-[1.7rem] p-6 transition hover:-translate-y-1 hover:border-white/25"><Mail className="text-[#b7c8ad]"/><h2 className="mt-4 text-2xl font-black">Exclusive Drops</h2><p className="mt-2 text-sm leading-6 text-white/55">Beheer e-mail inschrijvingen, welcome mails en drop campagnes.</p></Link>
      <Link href="/atlas/recovery" className="card group rounded-[1.7rem] p-6 transition hover:-translate-y-1 hover:border-white/25"><ShoppingCart className="text-[#b7c8ad]"/><h2 className="mt-4 text-2xl font-black">Cart Recovery</h2><p className="mt-2 text-sm leading-6 text-white/55">Bekijk abandoned carts en verstuur recovery mails.</p></Link>
      <Link href="/atlas/support" className="card group rounded-[1.7rem] p-6 transition hover:-translate-y-1 hover:border-white/25"><MessageCircle className="text-[#b7c8ad]"/><h2 className="mt-4 text-2xl font-black">Support Center</h2><p className="mt-2 text-sm leading-6 text-white/55">Live chats, klantdossiers, orders, tracking en klantenservice antwoorden beheren.</p></Link>
      <Link href="/atlas/integrations" className="card group rounded-[1.7rem] p-6 transition hover:-translate-y-1 hover:border-white/25"><PlugZap className="text-[#b7c8ad]"/><h2 className="mt-4 text-2xl font-black">Integrations</h2><p className="mt-2 text-sm leading-6 text-white/55">Shopify input, DSers bridge, PayPal checkout en sync status.</p></Link>
    </section>

    <section className="mt-8 grid gap-6 lg:grid-cols-[1.35fr_.65fr]">
      <div className="card rounded-[2rem] p-5">
        <div className="mb-5 flex items-center justify-between"><h2 className="text-2xl font-black">Orders overview</h2><span className="rounded-full bg-[#b7c8ad]/10 px-3 py-1 text-xs font-black text-[#dbe9d4]">live Supabase</span></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[780px] text-left text-sm">
          <thead className="text-xs uppercase tracking-[.18em] text-white/35"><tr><th className="py-3">Order</th><th>Customer</th><th>Product</th><th>Total</th><th>Est. profit</th><th>Payment</th><th>Fulfillment</th><th>Supplier</th></tr></thead>
          <tbody>{metrics.orders.length ? metrics.orders.map((order)=><tr key={order.id} className="border-t border-white/10 text-white/70"><td className="py-4 font-black text-white">{order.number}</td><td>{order.customer}</td><td className="max-w-[220px] truncate">{order.productSummary}</td><td>{eur(order.total)}</td><td>{eur(order.profit)}</td><td>{order.paymentStatus}</td><td>{order.fulfillmentStatus}</td><td>{order.supplier}</td></tr>) : <tr className="border-t border-white/10"><td colSpan={8} className="py-8 text-center text-white/45">Nog geen live Shopify/PayPal orders ontvangen. Zodra Shopify webhooks binnenkomen, verschijnen ze hier.</td></tr>}</tbody>
        </table></div>
      </div>

      <div className="card rounded-[2rem] p-5">
        <h2 className="text-2xl font-black">Live status</h2>
        <div className="mt-5 grid gap-3 text-sm text-white/60">
          <Step title="Catalog" text={`${metrics.activeProducts} active Shopify-synced products.`} />
          <Step title="Orders" text={`${metrics.orderCount} mirrored Shopify orders, ${metrics.pendingOrders} pending.`} />
          <Step title="Revenue" text={`${eur(metrics.paidRevenue)} paid revenue from Shopify/PayPal.`} />
          <Step title="Profit" text={`${eur(metrics.estimatedProfit)} estimated profit after product cost.`} />
          <Step title="Fulfillment" text="DSers status updates come through Shopify order/fulfillment webhooks." />
        </div>
      </div>
    </section>
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
