'use client'

import { ChangeEvent, FormEvent, ReactNode, useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  Heart,
  Link2,
  Loader2,
  Mail,
  MessageCircle,
  PackageCheck,
  Phone,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  ShoppingCart,
  StickyNote,
  Trophy,
  Truck,
  UserRound,
} from 'lucide-react'
import type { AtlasSupportConversation } from '@/lib/support-admin'
import type { PortalOrder, PortalOrderItem, SupportCustomerPortal } from '@/lib/support-customer-portal'

type SelectedConversation = Pick<AtlasSupportConversation, 'id' | 'customer_name' | 'customer_email' | 'subject'>

type Props = {
  selectedConversation: SelectedConversation | null
  onSupportRefresh?: () => void
}

function formatDate(value?: string | null) {
  if (!value) return 'Onbekend'
  try {
    return new Date(value).toLocaleString('nl-NL')
  } catch {
    return value
  }
}

function formatMoney(value?: number | string | null) {
  const amount = Number(value || 0)
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(amount)
}

function shortId(value?: string | null, length = 8) {
  return value ? value.slice(0, length) : 'n.v.t.'
}

function badgeClass(status?: string | null) {
  if (!status) return 'border-white/10 bg-white/[.04] text-white/45'
  if (['paid', 'fulfilled', 'answered', 'converted', 'recovered'].includes(status)) return 'border-[#b7c8ad]/25 bg-[#b7c8ad]/10 text-[#dbe9d4]'
  if (['open', 'active', 'pending', 'checkout_started'].includes(status)) return 'border-amber-300/20 bg-amber-400/10 text-amber-100'
  if (['closed', 'cancelled', 'expired', 'abandoned'].includes(status)) return 'border-white/10 bg-white/[.04] text-white/40'
  return 'border-white/10 bg-white/[.06] text-white/55'
}

function cartItemCount(items: unknown) {
  if (!Array.isArray(items)) return 0
  return items.reduce((sum, item) => {
    if (!item || typeof item !== 'object') return sum + 1
    const quantity = Number((item as { quantity?: unknown; qty?: unknown }).quantity || (item as { qty?: unknown }).qty || 1)
    return sum + (Number.isFinite(quantity) && quantity > 0 ? quantity : 1)
  }, 0)
}

export default function CustomerPortalPanel({ selectedConversation, onSupportRefresh }: Props) {
  const defaultQuery = selectedConversation?.customer_email || selectedConversation?.customer_name || ''
  const [query, setQuery] = useState(defaultQuery)
  const [portal, setPortal] = useState<SupportCustomerPortal | null>(null)
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [noteDraft, setNoteDraft] = useState('')

  const orderItemsByOrder = useMemo(() => {
    const grouped: Record<string, PortalOrderItem[]> = {}
    ;(portal?.orderItems || []).forEach((item) => {
      if (!grouped[item.order_id]) grouped[item.order_id] = []
      grouped[item.order_id].push(item)
    })
    return grouped
  }, [portal?.orderItems])

  async function loadPortal(nextQuery = query) {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (nextQuery.trim()) params.set('query', nextQuery.trim())
      if (selectedConversation?.id) params.set('conversationId', selectedConversation.id)
      const response = await fetch(`/api/atlas/support/customer-portal?${params.toString()}`, { cache: 'no-store' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Klantportaal kon niet worden geladen.')
      setPortal(data as SupportCustomerPortal)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Klantportaal kon niet worden geladen.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setQuery(defaultQuery)
    loadPortal(defaultQuery)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConversation?.id])

  async function onSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await loadPortal(query)
  }

  async function portalPatch(payload: Record<string, unknown>, successMessage?: string) {
    setBusy(String(payload.action || 'update'))
    setError('')
    try {
      const response = await fetch('/api/atlas/support/customer-portal', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, query, conversationId: selectedConversation?.id || null }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Actie kon niet worden uitgevoerd.')
      setPortal(data as SupportCustomerPortal)
      if (successMessage) setNoteDraft('')
      onSupportRefresh?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Actie kon niet worden uitgevoerd.')
    } finally {
      setBusy(null)
    }
  }

  async function saveNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const note = noteDraft.trim()
    if (!note || !portal) return
    setBusy('note')
    setError('')
    try {
      const response = await fetch('/api/atlas/support/customer-portal/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          note,
          query,
          conversationId: selectedConversation?.id || null,
          customerId: portal.customer?.id || null,
          customerEmail: portal.customer?.email || selectedConversation?.customer_email || null,
          orderId: portal.orders[0]?.id || null,
          noteType: 'support',
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Notitie kon niet worden opgeslagen.')
      setPortal(data as SupportCustomerPortal)
      setNoteDraft('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Notitie kon niet worden opgeslagen.')
    } finally {
      setBusy(null)
    }
  }

  const customer = portal?.customer || null

  return (
    <aside className="card rounded-[2rem] p-5 xl:sticky xl:top-24 xl:max-h-[calc(100vh-7rem)] xl:overflow-auto">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="kicker">Customer Portal</p>
          <h2 className="mt-2 text-2xl font-black">Klantdossier</h2>
          <p className="mt-2 text-sm leading-6 text-white/50">Zoek op ordernummer, e-mail, naam, telefoon, trackingnummer of CJ order ID.</p>
        </div>
        <button type="button" onClick={() => loadPortal(query)} className="rounded-full border border-white/10 bg-white/[.04] p-2 text-white/45 transition hover:text-white" aria-label="Klantportaal verversen">
          <RefreshCw size={17} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <form onSubmit={onSearch} className="mt-5 flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16} />
          <input value={query} onChange={(event: ChangeEvent<HTMLInputElement>) => setQuery(event.target.value)} className="support-input h-12 pl-10" placeholder="AS-1001, e-mail, telefoon..." />
        </div>
        <button type="submit" disabled={loading} className="rounded-full border border-white/10 bg-white px-4 text-sm font-black text-black transition hover:-translate-y-0.5 disabled:opacity-60">
          {loading ? <Loader2 size={17} className="animate-spin" /> : 'Zoek'}
        </button>
      </form>

      {error ? <div className="mt-4 rounded-2xl border border-red-300/20 bg-red-500/10 p-4 text-sm font-bold text-red-100">{error}</div> : null}

      {portal?.warnings?.length ? (
        <div className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-400/10 p-4 text-xs leading-5 text-amber-100">
          <p className="mb-1 flex items-center gap-2 font-black"><AlertCircle size={14} /> Controlepunt</p>
          {portal.warnings.slice(0, 3).map((warning) => <p key={warning}>• {warning}</p>)}
        </div>
      ) : null}

      {!portal && loading ? <div className="mt-8 grid place-items-center py-10 text-sm text-white/45"><Loader2 className="mb-3 animate-spin text-[#b7c8ad]" /> Klantdata laden...</div> : null}

      {portal ? (
        <div className="mt-5 grid gap-5">
          <section className="rounded-3xl border border-white/10 bg-black/20 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="flex items-center gap-2 text-lg font-black"><UserRound size={18} className="text-[#b7c8ad]" /> {customer?.full_name || customer?.email || selectedConversation?.customer_name || 'Onbekende klant'}</h3>
                <div className="mt-3 grid gap-2 text-sm text-white/55">
                  <p className="flex items-center gap-2"><Mail size={14} className="text-white/30" /> {customer?.email || selectedConversation?.customer_email || 'Geen e-mail'}</p>
                  <p className="flex items-center gap-2"><Phone size={14} className="text-white/30" /> {customer?.phone || 'Geen telefoon'}</p>
                  <p className="text-xs text-white/35">Klant-ID: {shortId(customer?.id, 12)} · Auth: {shortId(customer?.auth_user_id, 12)}</p>
                </div>
              </div>
              {portal.matchedBy.length ? <span className="rounded-full border border-[#b7c8ad]/25 bg-[#b7c8ad]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[.14em] text-[#dbe9d4]">{portal.matchedBy[0]}</span> : null}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <MiniStat label="Orders" value={String(portal.metrics.totalOrders)} icon={<PackageCheck size={17} />} />
              <MiniStat label="Omzet" value={formatMoney(portal.metrics.totalSpent)} icon={<Trophy size={17} />} />
              <MiniStat label="Support" value={String(portal.metrics.openSupport)} icon={<MessageCircle size={17} />} />
              <MiniStat label="Loyalty" value={`${portal.metrics.loyaltyPoints} pt`} icon={<ShieldCheck size={17} />} />
            </div>

            {selectedConversation?.id && customer?.id ? (
              <button type="button" disabled={busy === 'linkConversation'} onClick={() => portalPatch({ action: 'linkConversation', customerId: customer.id })} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#b7c8ad]/25 bg-[#b7c8ad]/10 px-4 py-3 text-xs font-black uppercase tracking-[.14em] text-[#dbe9d4] transition hover:bg-[#b7c8ad]/15 disabled:opacity-60">
                <Link2 size={15} /> Koppel chat aan klant
              </button>
            ) : null}
          </section>

          <section className="rounded-3xl border border-white/10 bg-black/18 p-5">
            <h3 className="flex items-center gap-2 text-lg font-black"><PackageCheck size={18} className="text-[#b7c8ad]" /> Orders & tracking</h3>
            <div className="mt-4 grid gap-4">
              {portal.orders.slice(0, 8).map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  items={orderItemsByOrder[order.id] || []}
                  busy={busy}
                  onSave={(payload) => portalPatch({ action: 'updateOrder', orderId: order.id, ...payload })}
                  onLink={() => selectedConversation?.id ? portalPatch({ action: 'linkConversation', customerId: order.customer_id || customer?.id || null, orderId: order.id }) : undefined}
                  canLink={Boolean(selectedConversation?.id)}
                />
              ))}
              {!portal.orders.length ? <p className="text-sm text-white/45">Geen orders gevonden.</p> : null}
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-black/18 p-5">
            <h3 className="flex items-center gap-2 text-lg font-black"><MessageCircle size={18} className="text-[#b7c8ad]" /> Supporthistorie</h3>
            <div className="mt-4 grid gap-3">
              {portal.conversations.slice(0, 6).map((conversation) => (
                <div key={conversation.id} className="rounded-2xl border border-white/10 bg-white/[.03] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="line-clamp-1 font-black">{conversation.subject || 'Support request'}</p>
                    <SmallStatus status={conversation.status} />
                  </div>
                  <p className="mt-2 text-xs text-white/40">Chat #{shortId(conversation.public_token)} · {formatDate(conversation.last_message_at || conversation.created_at)}</p>
                </div>
              ))}
              {portal.tickets.slice(0, 4).map((ticket) => (
                <div key={ticket.id} className="rounded-2xl border border-white/10 bg-white/[.03] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="line-clamp-1 font-black">{ticket.subject || ticket.ticket_number || 'Ticket'}</p>
                    <SmallStatus status={ticket.status} />
                  </div>
                  <p className="mt-2 line-clamp-2 text-xs text-white/45">{ticket.message || ticket.email || 'Geen berichttekst'}</p>
                </div>
              ))}
              {portal.archives.slice(0, 3).map((archive) => (
                <div key={archive.id} className="rounded-2xl border border-white/10 bg-white/[.02] p-4 text-xs text-white/40">
                  Gearchiveerd: {archive.subject || 'Supportgesprek'} · {formatDate(archive.archived_at)}
                </div>
              ))}
              {!portal.conversations.length && !portal.tickets.length && !portal.archives.length ? <p className="text-sm text-white/45">Geen supporthistorie gevonden.</p> : null}
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-black/18 p-5">
            <h3 className="flex items-center gap-2 text-lg font-black"><ShoppingCart size={18} className="text-[#b7c8ad]" /> Cart, wishlist & loyalty</h3>
            <div className="mt-4 grid gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/[.03] p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-black">Loyalty</p>
                  <span className="rounded-full border border-[#b7c8ad]/25 bg-[#b7c8ad]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[.14em] text-[#dbe9d4]">{portal.metrics.loyaltyTier}</span>
                </div>
                <p className="mt-2 text-sm text-white/50">{portal.metrics.loyaltyPoints} punten · lifetime {formatMoney(portal.loyalty?.lifetime_spend || portal.metrics.totalSpent)}</p>
              </div>
              {portal.carts.slice(0, 3).map((cart) => (
                <div key={cart.id} className="rounded-2xl border border-white/10 bg-white/[.03] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-black">Cart {shortId(cart.session_key, 6)}</p>
                    <SmallStatus status={cart.status} />
                  </div>
                  <p className="mt-2 text-xs text-white/45">{cartItemCount(cart.items)} items · {formatMoney(cart.subtotal)} · laatste activiteit {formatDate(cart.last_activity_at)}</p>
                </div>
              ))}
              {portal.wishlist.slice(0, 5).map((item) => (
                <div key={item.id} className="rounded-2xl border border-white/10 bg-white/[.025] p-3 text-sm text-white/55">
                  <Heart size={13} className="mr-2 inline text-[#b7c8ad]" /> <span className="font-black text-white">{item.product_slug}</span>
                  <span className="text-white/35"> · sinds {formatDate(item.created_at)}</span>
                </div>
              ))}
              {!portal.carts.length && !portal.wishlist.length ? <p className="text-sm text-white/45">Geen carts of wishlistitems gevonden.</p> : null}
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-black/18 p-5">
            <h3 className="flex items-center gap-2 text-lg font-black"><StickyNote size={18} className="text-[#b7c8ad]" /> Interne servicenotities</h3>
            <form onSubmit={saveNote} className="mt-4 grid gap-3">
              <textarea value={noteDraft} onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setNoteDraft(event.target.value)} className="support-input min-h-24 resize-none py-4" placeholder="Interne notitie voor deze klant/chat/order..." />
              <button type="submit" disabled={busy === 'note' || !noteDraft.trim()} className="rounded-full border border-white/10 bg-white px-4 py-3 text-sm font-black text-black transition hover:-translate-y-0.5 disabled:opacity-60">
                {busy === 'note' ? 'Opslaan...' : 'Notitie opslaan'}
              </button>
            </form>
            <div className="mt-4 grid gap-3">
              {portal.notes.map((note) => (
                <div key={note.id} className="rounded-2xl border border-white/10 bg-white/[.03] p-4">
                  <p className="whitespace-pre-wrap text-sm leading-6 text-white/66">{note.note}</p>
                  <p className="mt-3 text-[11px] text-white/35">{note.created_by || 'Atlas'} · {formatDate(note.created_at)}</p>
                </div>
              ))}
              {!portal.notes.length ? <p className="text-sm text-white/45">Nog geen interne notities.</p> : null}
            </div>
          </section>
        </div>
      ) : null}
    </aside>
  )
}

function OrderCard({ order, items, busy, onSave, onLink, canLink }: { order: PortalOrder; items: PortalOrderItem[]; busy: string | null; onSave: (payload: Record<string, string>) => void; onLink: () => void; canLink: boolean }) {
  const [editing, setEditing] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState(order.payment_status || '')
  const [fulfillmentStatus, setFulfillmentStatus] = useState(order.fulfillment_status || '')
  const [trackingNumber, setTrackingNumber] = useState(order.tracking_number || '')
  const [trackingUrl, setTrackingUrl] = useState(order.tracking_url || '')
  const [cjOrderId, setCjOrderId] = useState(order.cj_order_id || '')

  useEffect(() => {
    setPaymentStatus(order.payment_status || '')
    setFulfillmentStatus(order.fulfillment_status || '')
    setTrackingNumber(order.tracking_number || '')
    setTrackingUrl(order.tracking_url || '')
    setCjOrderId(order.cj_order_id || '')
  }, [order.id, order.payment_status, order.fulfillment_status, order.tracking_number, order.tracking_url, order.cj_order_id])

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[.03] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-black">{order.order_number || shortId(order.id, 12)}</p>
          <p className="mt-1 text-xs text-white/40">{formatDate(order.created_at)} · {order.payment_provider || 'payment n.v.t.'}</p>
        </div>
        <p className="text-lg font-black">{formatMoney(order.total)}</p>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <SmallStatus status={order.payment_status} />
        <SmallStatus status={order.fulfillment_status} />
        {order.cj_order_id ? <span className="rounded-full border border-white/10 bg-white/[.04] px-2.5 py-1 text-[10px] font-black uppercase tracking-[.14em] text-white/45">CJ {shortId(order.cj_order_id, 10)}</span> : null}
      </div>
      {order.tracking_number || order.tracking_url ? (
        <div className="mt-3 rounded-2xl border border-[#b7c8ad]/15 bg-[#b7c8ad]/10 p-3 text-xs text-[#dbe9d4]">
          <p className="flex items-center gap-2 font-black"><Truck size={14} /> Tracking: {order.tracking_number || 'link beschikbaar'}</p>
          {order.tracking_url ? <a href={order.tracking_url} target="_blank" rel="noreferrer" className="mt-1 inline-block underline decoration-white/30 underline-offset-4">Open tracking</a> : null}
        </div>
      ) : null}

      {items.length ? (
        <div className="mt-3 grid gap-2">
          {items.slice(0, 5).map((item) => (
            <div key={item.id} className="flex justify-between gap-3 rounded-xl bg-black/20 px-3 py-2 text-xs text-white/55">
              <span className="line-clamp-1">{item.quantity || 1}× {item.product_name || item.product_slug || 'Product'}</span>
              <span>{formatMoney(Number(item.unit_price || 0) * Number(item.quantity || 1))}</span>
            </div>
          ))}
        </div>
      ) : <p className="mt-3 text-xs text-white/35">Geen orderregels gevonden.</p>}

      {editing ? (
        <div className="mt-4 grid gap-2 rounded-2xl border border-white/10 bg-black/25 p-3">
          <input className="support-input h-10" value={paymentStatus} onChange={(event: ChangeEvent<HTMLInputElement>) => setPaymentStatus(event.target.value)} placeholder="payment_status" />
          <input className="support-input h-10" value={fulfillmentStatus} onChange={(event: ChangeEvent<HTMLInputElement>) => setFulfillmentStatus(event.target.value)} placeholder="fulfillment_status" />
          <input className="support-input h-10" value={trackingNumber} onChange={(event: ChangeEvent<HTMLInputElement>) => setTrackingNumber(event.target.value)} placeholder="trackingnummer" />
          <input className="support-input h-10" value={trackingUrl} onChange={(event: ChangeEvent<HTMLInputElement>) => setTrackingUrl(event.target.value)} placeholder="tracking URL" />
          <input className="support-input h-10" value={cjOrderId} onChange={(event: ChangeEvent<HTMLInputElement>) => setCjOrderId(event.target.value)} placeholder="CJ order ID" />
          <button type="button" onClick={() => onSave({ paymentStatus, fulfillmentStatus, trackingNumber, trackingUrl, cjOrderId })} disabled={busy === 'updateOrder'} className="rounded-full bg-white px-4 py-2 text-xs font-black uppercase tracking-[.14em] text-black disabled:opacity-60">
            <Save size={14} className="mr-2 inline" /> Opslaan
          </button>
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={() => setEditing((current) => !current)} className="rounded-full border border-white/10 bg-white/[.04] px-3 py-2 text-xs font-black text-white/55 transition hover:text-white">{editing ? 'Sluit editor' : 'Bewerk order'}</button>
        {canLink ? <button type="button" onClick={onLink} disabled={busy === 'linkConversation'} className="rounded-full border border-[#b7c8ad]/25 bg-[#b7c8ad]/10 px-3 py-2 text-xs font-black text-[#dbe9d4] disabled:opacity-60"><Link2 size={13} className="mr-1 inline" /> Koppel order</button> : null}
      </div>
    </div>
  )
}

function MiniStat({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[.03] p-3">
      <div className="text-[#b7c8ad]">{icon}</div>
      <p className="mt-2 text-[10px] font-black uppercase tracking-[.16em] text-white/35">{label}</p>
      <p className="mt-1 text-sm font-black">{value}</p>
    </div>
  )
}

function SmallStatus({ status }: { status?: string | null }) {
  return <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[.14em] ${badgeClass(status)}`}>{status || 'n.v.t.'}</span>
}
