'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { CreditCard, Lock, PackageCheck, Truck } from 'lucide-react'

type CartItem = { slug: string; name: string; price: number; hero?: string; qty: number; variantSku?: string; sku?: string }

type CheckoutState = 'idle' | 'submitting' | 'redirecting' | 'done' | 'error'

export default function CheckoutClient() {
  const [items, setItems] = useState<CartItem[]>([])
  const [state, setState] = useState<CheckoutState>('idle')
  const [message, setMessage] = useState('')
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address1: '',
    address2: '',
    city: '',
    postalCode: '',
    province: '',
    country: 'Netherlands',
    countryCode: 'NL',
  })

  useEffect(() => {
    const cart = JSON.parse(localStorage.getItem('asorta_cart') || '[]')
    const email = localStorage.getItem('asorta_cart_email') || ''
    setItems(cart)
    setForm((current) => ({ ...current, email }))
  }, [])

  const subtotal = useMemo(() => items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.qty || 0), 0), [items])

  function update(key: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setState('submitting')
    setMessage('')

    const response = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: items.map((item) => ({ slug: item.slug, qty: item.qty, variantSku: item.variantSku || item.sku })),
        shipping: form,
      }),
    })

    const body = await response.json().catch(() => ({}))
    if (!response.ok) {
      setState('error')
      setMessage(body.error || 'Checkout kon niet worden gestart.')
      return
    }

    if (body.checkoutUrl) {
      setState('redirecting')
      window.location.href = body.checkoutUrl
      return
    }

    setState('done')
    setMessage(body.message || `Order ${body.order?.orderNumber || ''} is aangemaakt. Koppel Mollie om automatisch te redirecten naar betaling.`)
  }

  if (!items.length) {
    return <div className="card rounded-[2rem] p-8 md:p-12"><p className="kicker">Checkout</p><h1 className="mt-3 text-4xl font-black md:text-6xl">Je cart is leeg.</h1><p className="mt-4 text-white/60">Voeg eerst producten toe voordat je afrekent.</p><Link href="/shop" className="btn-primary mt-7">Shop products</Link></div>
  }

  return (
    <form onSubmit={submit} className="grid gap-8 lg:grid-cols-[1fr_390px]">
      <section className="card rounded-[2rem] p-6 md:p-8">
        <p className="kicker">Secure checkout</p>
        <h1 className="mt-3 text-4xl font-black md:text-5xl">Delivery details</h1>
        <p className="mt-4 text-white/55">Je blijft op de eigen ASORTA-site. Na betaling wordt de order server-side naar CJ of DSers gerouteerd.</p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <Field label="Naam" value={form.name} onChange={(v) => update('name', v)} required />
          <Field label="E-mail" value={form.email} onChange={(v) => update('email', v)} required type="email" />
          <Field label="Telefoon" value={form.phone} onChange={(v) => update('phone', v)} />
          <Field label="Adres" value={form.address1} onChange={(v) => update('address1', v)} required />
          <Field label="Toevoeging" value={form.address2} onChange={(v) => update('address2', v)} />
          <Field label="Stad" value={form.city} onChange={(v) => update('city', v)} required />
          <Field label="Postcode" value={form.postalCode} onChange={(v) => update('postalCode', v)} required />
          <Field label="Land" value={form.country} onChange={(v) => update('country', v)} required />
        </div>

        <div className="mt-8 grid gap-3 text-sm text-white/62 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[.035] p-4"><Lock className="mb-3 text-[#b7c8ad]" /> Server-side pricing</div>
          <div className="rounded-2xl border border-white/10 bg-white/[.035] p-4"><CreditCard className="mb-3 text-[#b7c8ad]" /> Mollie-ready payment</div>
          <div className="rounded-2xl border border-white/10 bg-white/[.035] p-4"><Truck className="mb-3 text-[#b7c8ad]" /> CJ/DSers routing</div>
        </div>
      </section>

      <aside className="card h-fit rounded-[1.8rem] p-6 lg:sticky lg:top-24">
        <p className="kicker">Order</p>
        <h2 className="mt-2 text-2xl font-black">Summary</h2>
        <div className="mt-5 grid gap-4">
          {items.map((item) => <div key={`${item.slug}-${item.variantSku || item.sku || ''}`} className="flex gap-3 rounded-2xl border border-white/10 bg-white/[.035] p-3"><img src={item.hero || '/products/asorta-product-fallback.svg'} alt="" className="h-16 w-16 rounded-xl object-cover" /><div className="min-w-0 flex-1"><p className="truncate font-black">{item.name}</p><p className="text-sm text-white/45">{item.qty} × €{Number(item.price || 0).toFixed(2)}</p></div></div>)}
        </div>
        <div className="mt-6 flex justify-between text-white/65"><span>Subtotal</span><span>€{subtotal.toFixed(2)}</span></div>
        <div className="mt-3 flex justify-between text-white/65"><span>Shipping</span><span>€0.00</span></div>
        <div className="mt-6 flex justify-between border-t border-white/10 pt-6 text-xl font-black"><span>Total</span><span>€{subtotal.toFixed(2)}</span></div>
        <button disabled={state === 'submitting' || state === 'redirecting'} className="btn-primary mt-6 w-full disabled:cursor-not-allowed disabled:opacity-60"><PackageCheck size={18} className="mr-2" />{state === 'submitting' ? 'Starting checkout...' : state === 'redirecting' ? 'Redirecting...' : 'Pay securely'}</button>
        {message && <p className={`mt-4 rounded-2xl border p-4 text-sm ${state === 'error' ? 'border-red-400/25 bg-red-400/10 text-red-100' : 'border-emerald-400/25 bg-emerald-400/10 text-emerald-100'}`}>{message}</p>}
        <p className="mt-4 text-xs leading-5 text-white/42">Betaling en fulfillment blijven server-side. Clientprijzen worden niet vertrouwd bij ordercreatie.</p>
      </aside>
    </form>
  )
}

function Field({ label, value, onChange, required, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; required?: boolean; type?: string }) {
  return <label className="grid gap-2 text-sm text-white/60"><span className="font-black text-white/70">{label}{required ? ' *' : ''}</span><input required={required} type={type} value={value} onChange={(event) => onChange(event.target.value)} className="rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-white outline-none focus:border-[#b7c8ad]" /></label>
}
