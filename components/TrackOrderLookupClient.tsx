'use client'

import { useState } from 'react'
import { Loader2, Mail, PackageCheck, PackageSearch, Truck } from 'lucide-react'

type OrderItem = {
  id?: string
  productName: string
  quantity: number
  unitPrice: number
}

type OrderResult = {
  orderNumber: string
  customerEmail: string
  paymentStatus: string
  fulfillmentStatus: string
  total: number
  currency: string
  trackingNumber?: string | null
  trackingUrl?: string | null
  orderStatusUrl?: string | null
  createdAt?: string | null
  updatedAt?: string | null
  items: OrderItem[]
  timeline: Array<{ key: string; label: string; description: string; done: boolean }>
}

function eur(value: number) {
  return `€${Number(value || 0).toFixed(2)}`
}

function statusLabel(value: string) {
  const status = String(value || '').toLowerCase()
  if (['paid', 'authorized', 'complete', 'completed', 'partially_paid'].includes(status)) return 'Betaald'
  if (['fulfilled', 'shipped'].includes(status)) return 'Verzonden'
  if (['cancelled', 'voided', 'refunded'].includes(status)) return 'Geannuleerd'
  if (['processing', 'in_progress'].includes(status)) return 'In behandeling'
  return status ? status.replace(/_/g, ' ') : 'In behandeling'
}

export default function TrackOrderLookupClient({ initialOrder = '', initialEmail = '' }: { initialOrder?: string; initialEmail?: string }) {
  const [orderNumber, setOrderNumber] = useState(initialOrder)
  const [email, setEmail] = useState(initialEmail)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [order, setOrder] = useState<OrderResult | null>(null)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    setOrder(null)
    setLoading(true)

    try {
      const response = await fetch('/api/orders/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNumber, email }),
      })

      const body = await response.json().catch(() => ({}))

      if (!response.ok) {
        setError(body?.error || 'We konden deze bestelling niet vinden. Controleer je ordernummer en e-mailadres.')
        return
      }

      setOrder(body.order)
    } catch {
      setError('Er ging iets mis bij het ophalen van je bestelling. Probeer het later opnieuw.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="mt-8 grid gap-6 lg:grid-cols-[.9fr_1.1fr]">
      <form onSubmit={submit} className="rounded-[2rem] border border-white/10 bg-white/[.035] p-6 md:p-8">
        <PackageSearch className="text-[#b7c8ad]" />
        <h2 className="mt-4 text-2xl font-black">Bestelling opzoeken</h2>
        <p className="mt-2 text-sm leading-6 text-white/55">Vul je ordernummer en het e-mailadres van je bestelling in. We tonen alleen statusinformatie die bij deze combinatie hoort.</p>

        <label className="mt-6 grid gap-2 text-sm text-white/60">
          <span className="font-black text-white/75">Ordernummer</span>
          <input
            value={orderNumber}
            onChange={(event) => setOrderNumber(event.target.value)}
            placeholder="Bijvoorbeeld #1001 of SHOPIFY-1001"
            className="rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-white outline-none focus:border-[#b7c8ad]"
            required
          />
        </label>

        <label className="mt-4 grid gap-2 text-sm text-white/60">
          <span className="font-black text-white/75">E-mailadres</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="jij@email.nl"
            className="rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-white outline-none focus:border-[#b7c8ad]"
            required
          />
        </label>

        {error ? <p className="mt-4 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">{error}</p> : null}

        <button disabled={loading} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-black text-black transition hover:bg-[#dfe8d8] disabled:opacity-60">
          {loading ? <Loader2 className="animate-spin" size={18} /> : <PackageSearch size={18} />}
          Status ophalen
        </button>
      </form>

      <div className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(111,125,100,.14),transparent_42%),rgba(255,255,255,.025)] p-6 md:p-8">
        {!order ? (
          <div className="grid h-full place-items-center rounded-[1.5rem] border border-dashed border-white/12 p-8 text-center text-white/45">
            <div>
              <Truck className="mx-auto text-[#b7c8ad]" size={34} />
              <h3 className="mt-4 text-xl font-black text-white">Live orderstatus</h3>
              <p className="mt-2 max-w-md text-sm leading-6">Na het opzoeken zie je hier betaalstatus, verwerking, producten en tracking zodra die beschikbaar is.</p>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="kicker">Order</p>
                <h3 className="mt-2 text-3xl font-black">{order.orderNumber}</h3>
                <p className="mt-2 text-sm text-white/45">{order.customerEmail}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[.035] px-4 py-3 text-right">
                <p className="text-xs font-black uppercase tracking-[.18em] text-white/35">Totaal</p>
                <p className="mt-1 text-2xl font-black">{eur(order.total)}</p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <StatusCard label="Betaling" value={statusLabel(order.paymentStatus)} />
              <StatusCard label="Verwerking" value={statusLabel(order.fulfillmentStatus)} />
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/[.025] p-4">
              <h4 className="font-black">Status timeline</h4>
              <div className="mt-4 grid gap-3">
                {order.timeline.map((step) => (
                  <div key={step.key} className="flex gap-3">
                    <span className={`mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-full border ${step.done ? 'border-[#b7c8ad] bg-[#b7c8ad] text-black' : 'border-white/15 text-white/25'}`}>
                      <PackageCheck size={14} />
                    </span>
                    <div>
                      <p className={`font-black ${step.done ? 'text-white' : 'text-white/45'}`}>{step.label}</p>
                      <p className="text-sm leading-6 text-white/45">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/[.025] p-4">
              <h4 className="font-black">Producten</h4>
              <div className="mt-3 grid gap-2 text-sm text-white/60">
                {order.items.map((item, index) => (
                  <div key={item.id || index} className="flex justify-between gap-4 rounded-xl bg-white/[.025] px-3 py-2">
                    <span className="truncate">{item.quantity}× {item.productName}</span>
                    <span className="shrink-0">{eur(item.unitPrice)}</span>
                  </div>
                ))}
              </div>
            </div>

            {order.trackingNumber || order.trackingUrl ? (
              <div className="mt-6 rounded-2xl border border-[#b7c8ad]/25 bg-[#b7c8ad]/10 p-4">
                <h4 className="font-black text-[#e7f0e2]">Tracking beschikbaar</h4>
                {order.trackingNumber ? <p className="mt-2 text-sm text-white/65">Trackingnummer: <span className="font-black text-white">{order.trackingNumber}</span></p> : null}
                {order.trackingUrl ? <a href={order.trackingUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex rounded-full bg-white px-5 py-2 text-sm font-black text-black">Bekijk tracking</a> : null}
              </div>
            ) : (
              <div className="mt-6 rounded-2xl border border-white/10 bg-white/[.025] p-4 text-sm leading-6 text-white/55">
                Tracking is nog niet beschikbaar. Zodra je bestelling is verzonden, ontvang je automatisch een update per e-mail.
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

function StatusCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[.035] p-4">
      <p className="text-xs font-black uppercase tracking-[.18em] text-white/35">{label}</p>
      <p className="mt-2 text-xl font-black capitalize">{value}</p>
    </div>
  )
}
