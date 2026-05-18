'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { getDictionary, normalizeLocale, type Locale } from '@/lib/i18n/config'
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

function readLocale(): Locale {
  if (typeof document === 'undefined') return 'nl'
  const match = document.cookie.match(/(?:^|; )asorta_lang=([^;]+)/)
  return normalizeLocale(match ? decodeURIComponent(match[1]) : localStorage.getItem('asorta_lang'))
}

export default function CheckoutClient() {
  const [items, setItems] = useState<CartItem[]>([])
  const [state, setState] = useState<CheckoutState>('idle')
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [discountCode, setDiscountCode] = useState('')
  const [discountNotice, setDiscountNotice] = useState('')
  const [locale, setLocale] = useState<Locale>('nl')

  useEffect(() => {
    const cart = JSON.parse(localStorage.getItem('asorta_cart') || '[]')
    const savedEmail = localStorage.getItem('asorta_cart_email') || ''
    const query = new URLSearchParams(window.location.search)
    const incomingDiscount = query.get('discount') || query.get('code') || localStorage.getItem('asorta_discount_code') || ''
    setItems(cart)
    setEmail(savedEmail)
    setDiscountCode(normalizeDiscountCode(incomingDiscount))
    setLocale(readLocale())

    const updateLanguage = (event?: Event) => setLocale(normalizeLocale((event as CustomEvent<Locale> | undefined)?.detail || readLocale()))
    window.addEventListener('asorta-language-change', updateLanguage as EventListener)
    return () => window.removeEventListener('asorta-language-change', updateLanguage as EventListener)
  }, [])

  const dict = getDictionary(locale)
  const subtotal = useMemo(() => items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.qty || 0), 0), [items])

  const normalizedDiscountCode = useMemo(() => normalizeDiscountCode(discountCode), [discountCode])

  function applyDiscountCode() {
    const code = normalizeDiscountCode(discountCode)
    setDiscountCode(code)

    if (!code) {
      localStorage.removeItem('asorta_discount_code')
      setDiscountNotice(dict.checkout.discountRemoved)
      return
    }

    localStorage.setItem('asorta_discount_code', code)
    setDiscountNotice(`${code} ${dict.checkout.discountApplied}`)
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
      setMessage(body.error || dict.checkout.error)
      return
    }

    if (body.checkoutUrl) {
      setState('redirecting')
      window.location.href = body.checkoutUrl
      return
    }

    setState('done')
    setMessage(dict.checkout.noUrl)
  }

  if (!items.length) {
    return <div className="card rounded-[1.6rem] p-6 sm:rounded-[2rem] sm:p-8 md:p-12"><p className="kicker">Checkout</p><h1 className="mt-3 text-3xl font-black sm:text-4xl md:text-6xl">{dict.checkout.emptyTitle}</h1><p className="mt-4 text-white/60">{dict.checkout.emptyText}</p><Link href="/shop" className="btn-primary mt-7">{dict.checkout.shopProducts}</Link></div>
  }

  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_390px] lg:gap-8">
      <section className="card rounded-[1.6rem] p-5 sm:rounded-[2rem] sm:p-6 md:p-8">
        <p className="kicker">{dict.checkout.secure}</p>
        <h1 className="mt-3 text-3xl font-black sm:text-4xl md:text-5xl">{dict.checkout.title}</h1>
        <p className="mt-4 text-sm leading-6 text-white/55 sm:text-base">{dict.checkout.intro}</p>

        <label className="mt-7 grid gap-2 text-sm text-white/60 md:max-w-xl">
          <span className="font-black text-white/70">{dict.checkout.email}</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="jij@email.nl"
            className="rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-white outline-none focus:border-[#b7c8ad]"
          />
          <span className="text-xs leading-5 text-white/40">{dict.checkout.emailHelp}</span>
        </label>

        <div className="mt-6 grid gap-2 text-sm text-white/60 md:max-w-xl">
          <span className="font-black text-white/70">{dict.checkout.discount}</span>
          <div className="grid gap-2 sm:flex">
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
              {dict.checkout.apply}
            </button>
          </div>
          <span className="text-xs leading-5 text-white/40">{dict.checkout.discountHelp}</span>
          {discountNotice && <span className="rounded-xl border border-[#b7c8ad]/25 bg-[#b7c8ad]/10 px-3 py-2 text-xs text-[#e7f0e2]">{discountNotice}</span>}
        </div>

        <div className="mt-8 grid gap-3 text-sm text-white/62 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[.035] p-4"><Lock className="mb-3 text-[#b7c8ad]" /> Shopify variant IDs</div>
          <div className="rounded-2xl border border-white/10 bg-white/[.035] p-4"><CreditCard className="mb-3 text-[#b7c8ad]" /> PayPal via Shopify</div>
          <div className="rounded-2xl border border-white/10 bg-white/[.035] p-4"><Truck className="mb-3 text-[#b7c8ad]" /> DSers fulfillment</div>
        </div>

        <div className="mt-8 rounded-2xl border border-[#b7c8ad]/20 bg-[#b7c8ad]/10 p-4 text-sm leading-6 text-[#e7f0e2] sm:p-5">
          {dict.checkout.bridgeNote}
        </div>
      </section>

      <aside className="card h-fit rounded-[1.6rem] p-5 sm:rounded-[1.8rem] sm:p-6 lg:sticky lg:top-24">
        <p className="kicker">{dict.checkout.order}</p>
        <h2 className="mt-2 text-2xl font-black">{dict.checkout.summary}</h2>
        <div className="mt-5 grid gap-3 sm:gap-4">
          {items.map((item) => <div key={`${item.slug}-${item.shopifyVariantId || item.shopifyVariantLegacyId || item.variantSku || item.sku || ''}`} className="flex gap-3 rounded-2xl border border-white/10 bg-white/[.035] p-3"><img src={item.hero || '/products/asorta-product-fallback.svg'} alt="" className="h-14 w-14 rounded-xl object-cover sm:h-16 sm:w-16" /><div className="min-w-0 flex-1"><p className="truncate font-black">{item.name}</p>{item.variantName && <p className="truncate text-xs text-white/40">{item.variantName}</p>}<p className="text-sm text-white/45">{item.qty} × €{Number(item.price || 0).toFixed(2)}</p></div></div>)}
        </div>
        <div className="mt-6 flex justify-between text-white/65"><span>{dict.checkout.subtotal}</span><span>€{subtotal.toFixed(2)}</span></div>
        {normalizedDiscountCode && <div className="mt-3 flex justify-between gap-4 text-[#e7f0e2]"><span>{dict.checkout.discountCode}</span><span className="truncate">{normalizedDiscountCode}</span></div>}
        <div className="mt-3 flex justify-between text-white/65"><span>{dict.checkout.shipping}</span><span>{dict.checkout.shippingInShopify}</span></div>
        <div className="mt-6 flex justify-between border-t border-white/10 pt-6 text-xl font-black"><span>{dict.checkout.total}</span><span>€{subtotal.toFixed(2)}</span></div>
        {normalizedDiscountCode && <p className="mt-2 text-xs leading-5 text-white/42">{dict.checkout.discountCalculated}</p>}
        <button disabled={state === 'submitting' || state === 'redirecting'} className="btn-primary mt-6 w-full disabled:cursor-not-allowed disabled:opacity-60"><PackageCheck size={18} className="mr-2" />{state === 'submitting' ? dict.checkout.starting : state === 'redirecting' ? dict.checkout.redirecting : dict.checkout.pay}</button>
        {message && <p className={`mt-4 rounded-2xl border p-4 text-sm ${state === 'error' ? 'border-red-400/25 bg-red-400/10 text-red-100' : 'border-emerald-400/25 bg-emerald-400/10 text-emerald-100'}`}>{message}</p>}
        <p className="mt-4 flex gap-2 text-xs leading-5 text-white/42"><ShieldCheck size={15} /> {dict.checkout.afterPayment}</p>
      </aside>
    </form>
  )
}
