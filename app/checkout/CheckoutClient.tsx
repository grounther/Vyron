'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { CreditCard, Lock, PackageCheck, ShieldCheck, Truck } from 'lucide-react'

type CartItem = {
  slug: string
  name: string
  price: number
  hero?: string
  qty: number
  variantName?: string
  variantSku?: string
  sku?: string
  shopifyVariantId?: string
  shopifyVariantLegacyId?: string
}

type CheckoutState = 'idle' | 'submitting' | 'redirecting' | 'done' | 'error'

function normalizeDiscountCode(value: unknown) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, '')
    .replace(/[^A-Z0-9_-]/gi, '')
    .toUpperCase()
    .slice(0, 80)
}

export default function CheckoutClient() {
  const [items, setItems] = useState<CartItem[]>([])
  const [state, setState] = useState<CheckoutState>('idle')
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [discountCode, setDiscountCode] = useState('')
  const [discountNotice, setDiscountNotice] = useState('')

  useEffect(() => {
    const cart = JSON.parse(localStorage.getItem('asorta_cart') || '[]')
    const savedEmail = localStorage.getItem('asorta_cart_email') || ''
    const query = new URLSearchParams(window.location.search)
    const incomingDiscount = query.get('discount') || query.get('code') || localStorage.getItem('asorta_discount_code') || ''
    setItems(cart)
    setEmail(savedEmail)
    setDiscountCode(normalizeDiscountCode(incomingDiscount))
  }, [])

  const subtotal = useMemo(() => items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.qty || 0), 0), [items])

  const normalizedDiscountCode = useMemo(() => normalizeDiscountCode(discountCode), [discountCode])

  function applyDiscountCode() {
    const code = normalizeDiscountCode(discountCode)
    setDiscountCode(code)

    if (!code) {
      localStorage.removeItem('asorta_discount_code')
      setDiscountNotice('Kortingscode verwijderd.')
      return
    }

    localStorage.setItem('asorta_discount_code', code)
    setDiscountNotice(`${code} wordt toegepast in de beveiligde Shopify checkout.`)
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setState('submitting')
    setMessage('')

    const code = normalizeDiscountCode(discountCode)

    if (email) localStorage.setItem('asorta_cart_email', email)
    if (code) localStorage.setItem('asorta_discount_code', code)
    else localStorage.removeItem('asorta_discount_code')

    const response = await fetch('/api/checkout/shopify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        items: items.map((item) => ({
          slug: item.slug,
          qty: item.qty,
          variantSku: item.variantSku || item.sku,
          shopifyVariantId: item.shopifyVariantId,
          shopifyVariantLegacyId: item.shopifyVariantLegacyId,
        })),
        discountCode: code,
      }),
    })

    const body = await response.json().catch(() => ({}))
    if (!response.ok) {
      setState('error')
      setMessage(body.error || 'Shopify checkout kon niet worden gestart.')
      return
    }

    if (body.checkoutUrl) {
      setState('redirecting')
      window.location.href = body.checkoutUrl
      return
    }

    setState('done')
    setMessage('Checkout is aangemaakt, maar Shopify gaf geen checkout URL terug.')
  }

  if (!items.length) {
    return <div className="card rounded-[2rem] p-8 md:p-12"><p className="kicker">Checkout</p><h1 className="mt-3 text-4xl font-black md:text-6xl">Je cart is leeg.</h1><p className="mt-4 text-white/60">Voeg eerst producten toe voordat je afrekent.</p><Link href="/shop" className="btn-primary mt-7">Shop products</Link></div>
  }

  return (
    <form onSubmit={submit} className="grid gap-8 lg:grid-cols-[1fr_390px]">
      <section className="card rounded-[2rem] p-6 md:p-8">
        <p className="kicker">Secure checkout</p>
        <h1 className="mt-3 text-4xl font-black md:text-5xl">PayPal checkout via Shopify</h1>
        <p className="mt-4 text-white/55">Je blijft de ASORTA frontend gebruiken. Voor deze tijdelijke live-flow sturen we je cart veilig door naar Shopify checkout, zodat je met PayPal kunt betalen en DSers de Shopify order kan verwerken.</p>

        <label className="mt-8 grid gap-2 text-sm text-white/60 md:max-w-xl">
          <span className="font-black text-white/70">E-mail voor checkout</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="jij@email.nl"
            className="rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-white outline-none focus:border-[#b7c8ad]"
          />
          <span className="text-xs leading-5 text-white/40">Shopify vraagt straks je bezorgadres, shipping en PayPal-login. Je order komt daarna automatisch in Shopify terecht voor DSers.</span>
        </label>

        <div className="mt-6 grid gap-2 text-sm text-white/60 md:max-w-xl">
          <span className="font-black text-white/70">Kortingscode</span>
          <div className="flex gap-2">
            <input
              type="text"
              value={discountCode}
              onChange={(event) => {
                setDiscountCode(event.target.value.toUpperCase())
                setDiscountNotice('')
              }}
              onBlur={() => setDiscountCode(normalizeDiscountCode(discountCode))}
              placeholder="GRANDOPENING10"
              maxLength={80}
              className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-white outline-none focus:border-[#b7c8ad]"
            />
            <button
              type="button"
              onClick={applyDiscountCode}
              className="rounded-2xl border border-white/12 bg-white px-5 py-3 font-black text-black transition hover:bg-[#b7c8ad]"
            >
              Apply
            </button>
          </div>
          <span className="text-xs leading-5 text-white/40">De code wordt meegestuurd naar Shopify en daar op je PayPal-checkout toegepast.</span>
          {discountNotice && <span className="rounded-xl border border-[#b7c8ad]/25 bg-[#b7c8ad]/10 px-3 py-2 text-xs text-[#e7f0e2]">{discountNotice}</span>}
        </div>

        <div className="mt-8 grid gap-3 text-sm text-white/62 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[.035] p-4"><Lock className="mb-3 text-[#b7c8ad]" /> Shopify variant IDs</div>
          <div className="rounded-2xl border border-white/10 bg-white/[.035] p-4"><CreditCard className="mb-3 text-[#b7c8ad]" /> PayPal via Shopify</div>
          <div className="rounded-2xl border border-white/10 bg-white/[.035] p-4"><Truck className="mb-3 text-[#b7c8ad]" /> DSers fulfillment</div>
        </div>

        <div className="mt-8 rounded-2xl border border-[#b7c8ad]/20 bg-[#b7c8ad]/10 p-5 text-sm leading-6 text-[#e7f0e2]">
          Later, zodra Mollie/iDEAL/Wero rond is, kan deze stap worden vervangen door de eigen ASORTA checkout. Nu is Shopify checkout bewust de PayPal + DSers bridge.
        </div>
      </section>

      <aside className="card h-fit rounded-[1.8rem] p-6 lg:sticky lg:top-24">
        <p className="kicker">Order</p>
        <h2 className="mt-2 text-2xl font-black">Summary</h2>
        <div className="mt-5 grid gap-4">
          {items.map((item) => <div key={`${item.slug}-${item.shopifyVariantId || item.shopifyVariantLegacyId || item.variantSku || item.sku || ''}`} className="flex gap-3 rounded-2xl border border-white/10 bg-white/[.035] p-3"><img src={item.hero || '/products/asorta-product-fallback.svg'} alt="" className="h-16 w-16 rounded-xl object-cover" /><div className="min-w-0 flex-1"><p className="truncate font-black">{item.name}</p>{item.variantName && <p className="truncate text-xs text-white/40">{item.variantName}</p>}<p className="text-sm text-white/45">{item.qty} × €{Number(item.price || 0).toFixed(2)}</p></div></div>)}
        </div>
        <div className="mt-6 flex justify-between text-white/65"><span>Subtotal</span><span>€{subtotal.toFixed(2)}</span></div>
        {normalizedDiscountCode && <div className="mt-3 flex justify-between text-[#e7f0e2]"><span>Discount code</span><span>{normalizedDiscountCode}</span></div>}
        <div className="mt-3 flex justify-between text-white/65"><span>Shipping</span><span>In Shopify</span></div>
        <div className="mt-6 flex justify-between border-t border-white/10 pt-6 text-xl font-black"><span>Total</span><span>€{subtotal.toFixed(2)}</span></div>
        {normalizedDiscountCode && <p className="mt-2 text-xs leading-5 text-white/42">De korting wordt door Shopify berekend voordat je via PayPal betaalt.</p>}
        <button disabled={state === 'submitting' || state === 'redirecting'} className="btn-primary mt-6 w-full disabled:cursor-not-allowed disabled:opacity-60"><PackageCheck size={18} className="mr-2" />{state === 'submitting' ? 'Starting Shopify checkout...' : state === 'redirecting' ? 'Redirecting to Shopify...' : 'Pay with PayPal'}</button>
        {message && <p className={`mt-4 rounded-2xl border p-4 text-sm ${state === 'error' ? 'border-red-400/25 bg-red-400/10 text-red-100' : 'border-emerald-400/25 bg-emerald-400/10 text-emerald-100'}`}>{message}</p>}
        <p className="mt-4 flex gap-2 text-xs leading-5 text-white/42"><ShieldCheck size={15} /> Orders worden door Shopify/DSers verwerkt nadat PayPal-betaling is afgerond.</p>
      </aside>
    </form>
  )
}
