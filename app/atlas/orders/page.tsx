import type React from 'react'
import Link from 'next/link'
import { AlertTriangle, CheckCircle2, PackageCheck, RefreshCcw, Truck } from 'lucide-react'
import { assertAtlasPermission } from '@/lib/atlas-auth'
import { cleanupCancelledOrders } from '@/lib/checkout/cleanup'
import { finalizePaidOrderAction, updateOrderFulfillment } from './actions'

export const metadata = { title: 'Orders | Atlas ASORTA', robots: { index: false, follow: false } }

type AnyRow = Record<string, any>

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

function eur(value: unknown) {
  const number = Number(value || 0)
  return `€${Number.isFinite(number) ? number.toFixed(2) : '0.00'}`
}

function date(value: unknown) {
  const raw = String(value || '')
  const parsed = raw ? new Date(raw) : null
  if (!parsed || Number.isNaN(parsed.getTime())) return '—'
  return parsed.toLocaleString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function rawFlag(order: AnyRow, key: string) {
  const raw = order.raw && typeof order.raw === 'object' ? order.raw : {}
  return raw[key]
}

function badge(status: unknown, kind: 'payment' | 'fulfillment') {
  const value = String(status || 'pending').toLowerCase()
  const good = kind === 'payment' ? ['paid', 'completed', 'authorized'].includes(value) : ['processing', 'fulfilled', 'shipped', 'delivered'].includes(value)
  const warn = kind === 'payment' ? ['pending', 'open'].includes(value) : ['pending_payment', 'pending', 'processing'].includes(value)
  const klass = good
    ? 'border-emerald-300/20 bg-emerald-300/10 text-emerald-100'
    : warn
      ? 'border-amber-300/20 bg-amber-300/10 text-amber-100'
      : 'border-white/10 bg-white/[.04] text-white/60'
  return <span className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[.12em] ${klass}`}>{value}</span>
}

export default async function AtlasOrdersPage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {}
  const saved = params.saved || params.finalized
  const error = Array.isArray(params.error) ? params.error[0] : params.error
  const { admin, staff } = await assertAtlasPermission('orders', '/atlas/orders')

  await cleanupCancelledOrders(admin, { source: 'atlas_orders_page' })

  const { data: orderRows, error: orderError } = await admin
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(80)

  const orders = (orderRows || []) as AnyRow[]
  const orderIds = orders.map((order) => String(order.id)).filter(Boolean)

  const [{ data: itemRows }, { data: eventRows }] = await Promise.all([
    orderIds.length ? admin.from('order_items').select('*').in('order_id', orderIds).order('created_at', { ascending: true }) : Promise.resolve({ data: [] as AnyRow[] }),
    orderIds.length ? admin.from('order_processing_events').select('*').in('order_id', orderIds).order('created_at', { ascending: false }).limit(240) : Promise.resolve({ data: [] as AnyRow[] }),
  ])

  const itemsByOrder = new Map<string, AnyRow[]>()
  for (const item of (itemRows || []) as AnyRow[]) {
    const id = String(item.order_id || '')
    if (!id) continue
    const existing = itemsByOrder.get(id) || []
    existing.push(item)
    itemsByOrder.set(id, existing)
  }

  const eventsByOrder = new Map<string, AnyRow[]>()
  for (const event of (eventRows || []) as AnyRow[]) {
    const id = String(event.order_id || '')
    if (!id) continue
    const existing = eventsByOrder.get(id) || []
    existing.push(event)
    eventsByOrder.set(id, existing)
  }

  const paid = orders.filter((order) => String(order.payment_status || '').toLowerCase() === 'paid').length
  const processing = orders.filter((order) => ['processing', 'pending'].includes(String(order.fulfillment_status || '').toLowerCase())).length
  const revenue = orders.filter((order) => String(order.payment_status || '').toLowerCase() === 'paid').reduce((sum, order) => sum + Number(order.total || 0), 0)

  const categories = [
    { key: 'pending_payment', title: 'Wacht op betaling', description: 'Orders die nog niet betaald zijn of nog op PayPal bevestiging wachten.', statuses: ['pending_payment', 'pending', 'open', ''] },
    { key: 'processing', title: 'In verwerking', description: 'Betaalde orders die voorraad/reward/finalisatie of handmatige verwerking nodig hebben.', statuses: ['processing'] },
    { key: 'packed', title: 'Ingepakt', description: 'Orders die klaarstaan om verzonden te worden.', statuses: ['packed'] },
    { key: 'shipped', title: 'Verzonden', description: 'Orders met verzending onderweg of tracking actief.', statuses: ['shipped', 'fulfilled'] },
    { key: 'delivered', title: 'Afgeleverd', description: 'Afgeronde orders die bij de klant zijn aangekomen.', statuses: ['delivered'] },
    { key: 'cancelled', title: 'Geannuleerd', description: 'Geannuleerde orders blijven maximaal 24 uur zichtbaar en worden daarna automatisch verwijderd.', statuses: ['cancelled', 'canceled'] },
  ]

  const ordersByCategory = categories.map((category) => ({
    ...category,
    orders: orders.filter((order) => {
      const status = String(order.fulfillment_status || '').toLowerCase()
      return category.statuses.includes(status)
    }),
  }))

  return <main className="mx-auto max-w-7xl px-4 py-10 md:px-6">
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="text-xs font-black uppercase tracking-[.35em] text-[#b7c8ad]">Atlas orders</p>
        <h1 className="mt-3 text-4xl font-black md:text-6xl">Orderbeheer</h1>
        <p className="mt-3 max-w-2xl text-white/55">Betaalstatus, voorraadverwerking, minigame reward, tracking en fulfillment per order.</p>
      </div>
      <Link href="/atlas" className="rounded-full border border-white/10 px-5 py-3 text-sm font-black text-white/60 hover:bg-white/10 hover:text-white">Terug naar Atlas</Link>
    </div>

    {saved ? <div className="mt-6 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-4 text-sm text-emerald-100"><CheckCircle2 className="mr-2 inline" size={18}/> Order bijgewerkt.</div> : null}
    {error ? <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-100"><AlertTriangle className="mr-2 inline" size={18}/> {error}</div> : null}
    {orderError ? <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-100">{orderError.message}</div> : null}

    <section className="mt-8 grid gap-4 md:grid-cols-4">
      <Stat icon={<PackageCheck />} label="Orders" value={String(orders.length)} />
      <Stat icon={<CheckCircle2 />} label="Betaald" value={String(paid)} />
      <Stat icon={<Truck />} label="In verwerking" value={String(processing)} />
      <Stat icon={<RefreshCcw />} label="Betaalde omzet" value={eur(revenue)} />
    </section>

    <section className="mt-8 grid gap-4">
      {orders.length ? ordersByCategory.map((category, index) => {
        const categoryTotal = category.orders.reduce((sum, order) => sum + Number(order.total || 0), 0)
        return <details key={category.key} open={index < 2} className="card rounded-[2rem] p-0 [&_summary::-webkit-details-marker]:hidden">
          <summary className="flex cursor-pointer flex-col gap-3 p-5 transition hover:bg-white/[.03] md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[.28em] text-[#b7c8ad]">{category.title}</p>
              <h2 className="mt-2 text-2xl font-black">{category.orders.length} order{category.orders.length === 1 ? '' : 's'}</h2>
              <p className="mt-1 max-w-2xl text-sm text-white/45">{category.description}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="rounded-full border border-white/10 bg-white/[.04] px-4 py-2 font-black text-white/70">{eur(categoryTotal)}</span>
              <span className="rounded-full border border-[#b7c8ad]/25 bg-[#b7c8ad]/10 px-4 py-2 font-black text-[#dbe9d4]">Uitklappen</span>
            </div>
          </summary>
          <div className="grid gap-5 border-t border-white/10 p-5">
            {category.orders.length ? category.orders.map((order) => {
              const items = itemsByOrder.get(String(order.id)) || []
              const events = eventsByOrder.get(String(order.id)) || []
              const isPaid = String(order.payment_status || '').toLowerCase() === 'paid'
              const inventoryDone = Boolean(rawFlag(order, 'inventory_decremented_at'))
              const packDone = Boolean(rawFlag(order, 'pack_credit_granted_at'))
              return <OrderCard key={order.id} order={order} items={items} events={events} isPaid={isPaid} inventoryDone={inventoryDone} packDone={packDone} />
            }) : <div className="rounded-[1.5rem] border border-white/10 bg-black/25 p-6 text-sm text-white/45">Geen orders in deze categorie.</div>}
          </div>
        </details>
      }) : <div className="card rounded-[2rem] p-8 text-center text-white/50">Nog geen orders gevonden.</div>}
    </section>
  </main>
}

function OrderCard({ order, items, events, isPaid, inventoryDone, packDone }: { order: AnyRow; items: AnyRow[]; events: AnyRow[]; isPaid: boolean; inventoryDone: boolean; packDone: boolean }) {
  return <article className="rounded-[1.6rem] border border-white/10 bg-black/25 p-5">
    <div className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
      <div>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[.22em] text-white/35">{date(order.created_at)}</p>
            <h2 className="mt-1 text-2xl font-black">{order.order_number || order.id}</h2>
            <p className="mt-1 text-sm text-white/50">{order.customer_email || 'Geen e-mail'} • {order.payment_provider || 'paypal'}</p>
          </div>
          <div className="flex flex-wrap gap-2">{badge(order.payment_status, 'payment')}{badge(order.fulfillment_status, 'fulfillment')}</div>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-xs uppercase tracking-[.16em] text-white/35"><tr><th className="py-2">Product</th><th>Aantal</th><th>SKU</th><th>Prijs</th><th>Totaal</th></tr></thead>
            <tbody>{items.map((item) => <tr key={item.id} className="border-t border-white/10 text-white/65"><td className="py-3 font-black text-white">{item.product_name || item.product_slug}</td><td>{item.quantity}</td><td>{item.variant_sku || item.supplier_sku || '—'}</td><td>{eur(item.unit_price)}</td><td>{eur(Number(item.unit_price || 0) * Number(item.quantity || 1))}</td></tr>)}</tbody>
          </table>
        </div>

        <div className="mt-5 grid gap-3 text-sm text-white/55 sm:grid-cols-4">
          <Info label="Subtotaal" value={eur(order.subtotal)} />
          <Info label="Verzending" value={eur(order.shipping_total)} />
          <Info label="Totaal" value={eur(order.total)} />
          <Info label="Winst indicatie" value={eur(order.estimated_profit)} />
        </div>

        <div className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
          <State label="Voorraad" done={inventoryDone} text={inventoryDone ? `Verwerkt ${date(rawFlag(order, 'inventory_decremented_at'))}` : isPaid ? 'Nog niet verwerkt' : 'Wacht op betaling'} />
          <State label="Minigame pakje" done={packDone} text={packDone ? `Toegekend ${date(rawFlag(order, 'pack_credit_granted_at'))}` : isPaid ? 'Nog niet toegekend' : 'Wacht op betaling'} />
          <State label="PayPal capture" done={isPaid} text={isPaid ? 'Betaald' : String(order.payment_status || 'pending')} />
        </div>
      </div>

      <div className="rounded-[1.5rem] border border-white/10 bg-black/25 p-4">
        <h3 className="text-lg font-black">Fulfillment</h3>
        <form action={updateOrderFulfillment} className="mt-4 grid gap-3">
          <input type="hidden" name="order_id" value={order.id} />
          <label className="grid gap-2 text-sm font-black text-white/60">Status
            <select name="fulfillment_status" defaultValue={order.fulfillment_status || 'processing'} className="support-input rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-white">
              <option value="pending_payment">Wacht op betaling</option>
              <option value="processing">In verwerking</option>
              <option value="packed">Ingepakt</option>
              <option value="shipped">Verzonden</option>
              <option value="delivered">Afgeleverd</option>
              <option value="cancelled">Geannuleerd</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-black text-white/60">Track & trace nummer
            <input name="tracking_number" defaultValue={order.tracking_number || ''} className="rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-white outline-none" />
          </label>
          <label className="grid gap-2 text-sm font-black text-white/60">Tracking URL
            <input name="tracking_url" defaultValue={order.tracking_url || ''} className="rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-white outline-none" />
          </label>
          <label className="grid gap-2 text-sm font-black text-white/60">Interne notitie
            <textarea name="note" rows={3} className="rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-white outline-none" placeholder="Bijv. pakket klaargezet, klant geïnformeerd..." />
          </label>
          <button className="btn-primary justify-center">Fulfillment opslaan</button>
        </form>

        {isPaid ? <form action={finalizePaidOrderAction} className="mt-3">
          <input type="hidden" name="order_id" value={order.id} />
          <button className="w-full rounded-full border border-[#b7c8ad]/30 px-5 py-3 text-sm font-black text-[#dbe9d4] hover:bg-[#b7c8ad]/10">Voorraad/reward opnieuw controleren</button>
        </form> : null}

        <div className="mt-5 border-t border-white/10 pt-4">
          <h4 className="text-sm font-black uppercase tracking-[.18em] text-white/35">Laatste events</h4>
          <div className="mt-3 grid gap-2 text-xs leading-5 text-white/50">
            {events.length ? events.slice(0, 5).map((event) => <div key={event.id} className="rounded-2xl bg-white/[.035] p-3"><strong className="text-white/75">{event.event_type}</strong><br/>{event.message || event.source || '—'}<br/><span className="text-white/30">{date(event.created_at)} {event.actor_email ? `• ${event.actor_email}` : ''}</span></div>) : <p>Nog geen orderlog.</p>}
          </div>
        </div>
      </div>
    </div>
  </article>
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="card rounded-[1.5rem] p-5"><div className="text-[#b7c8ad]">{icon}</div><p className="mt-4 text-xs font-black uppercase tracking-[.22em] text-white/35">{label}</p><p className="mt-2 text-2xl font-black">{value}</p></div>
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-white/10 bg-white/[.03] p-3"><p className="text-xs uppercase tracking-[.16em] text-white/35">{label}</p><p className="mt-1 font-black text-white">{value}</p></div>
}

function State({ label, done, text }: { label: string; done: boolean; text: string }) {
  return <div className={`rounded-2xl border p-3 ${done ? 'border-emerald-300/20 bg-emerald-300/10' : 'border-amber-300/20 bg-amber-300/10'}`}><p className="text-xs font-black uppercase tracking-[.16em] text-white/40">{label}</p><p className="mt-1 text-sm font-black text-white">{done ? 'OK' : 'Check'}</p><p className="mt-1 text-xs text-white/55">{text}</p></div>
}
