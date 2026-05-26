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

type ShippingState = {
  name: string
  phone: string
  address1: string
  address2: string
  city: string
  postalCode: string
  country: string
  countryCode: string
}

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

function hasShopifyVariant(item: CartItem) {
  return Boolean(String(item.shopifyVariantId || item.shopifyVariantLegacyId || '').trim())
}

type CheckoutClientCopy = {
  secure?: string
  title?: string
  intro?: string
  emptyTitle?: string
  emptyText?: string
  shopProducts?: string
  email?: string
  emailHelp?: string
  discount?: string
  discountHelp?: string
  apply?: string
  bridgeNote?: string
  order?: string
  summary?: string
  subtotal?: string
  shipping?: string
  shippingValue?: string
  total?: string
  pay?: string
  afterPayment?: string
  trust1?: string
  trust2?: string
  trust3?: string
}

export default function CheckoutClient({ copy = {} }: { copy?: Record<string, string | undefined> }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [state, setState] = useState<CheckoutState>('idle')
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [discountCode, setDiscountCode] = useState('')
  const [discountNotice, setDiscountNotice] = useState('')
  const [locale, setLocale] = useState<Locale>('nl')
  const [shipping, setShipping] = useState<ShippingState>({
    name: '',
    phone: '',
    address1: '',
    address2: '',
    city: '',
    postalCode: '',
    country: 'Netherlands',
    countryCode: 'NL',
  })

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
  const checkout = { ...dict.checkout, ...copy }
  const subtotal = useMemo(() => items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.qty || 0), 0), [items])
  const hasManualItems = useMemo(() => items.some((item) => !hasShopifyVariant(item)), [items])
  const normalizedDiscountCode = useMemo(() => normalizeDiscountCode(discountCode), [discountCode])

  function updateShipping(key: keyof ShippingState, value: string) {
    setShipping((current) => ({ ...current, [key]: value }))
  }

  function applyDiscountCode() {
    const code = normalizeDiscountCode(discountCode)
    setDiscountCode(code)

    if (!code) {
      localStorage.removeItem('asorta_discount_code')
      setDiscountNotice(checkout.discountRemoved)
      return
    }

    localStorage.setItem('asorta_discount_code', code)
    setDiscountNotice(`${code} ${checkout.discountApplied}`)
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setState('submitting')
    setMessage('')

    const code = normalizeDiscountCode(discountCode)

    if (email) localStorage.setItem('asorta_cart_email', email)
    if (code) localStorage.setItem('asorta_discount_code', code)
    else localStorage.removeItem('asorta_discount_code')

    const checkoutItems = items.map((item) => ({
      slug: item.slug,
      qty: item.qty,
      variantSku: item.variantSku || item.sku,
      shopifyVariantId: item.shopifyVariantId,
      shopifyVariantLegacyId: item.shopifyVariantLegacyId,
    }))

    const response = await fetch(hasManualItems ? '/api/checkout' : '/api/checkout/shopify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(hasManualItems ? {
        provider: 'site',
        email,
        items: checkoutItems,
        shipping: { ...shipping, email },
        discountCode: code,
      } : {
        email,
        items: checkoutItems,
        discountCode: code,
      }),
    })

    const body = await response.json().catch(() => ({}))
    if (!response.ok) {
      setState('error')
      setMessage(body.error || checkout.error)
      return
    }

    if (body.checkoutUrl) {
      setState('redirecting')
      window.location.href = body.checkoutUrl
      return
    }

    setState('done')
    if (hasManualItems && body.order?.orderNumber) {
      localStorage.removeItem('asorta_cart')
      setItems([])
      setMessage(`${body.message || 'Order aangemaakt.'} Ordernummer: ${body.order.orderNumber}`)
      return
    }
    setMessage(body.message || checkout.noUrl)
  }

  if (!items.length) {
    return <div className="card rounded-[1.6rem] p-6 sm:rounded-[2rem] sm:p-8 md:p-12"><p className="kicker">Checkout</p><h1 className="mt-3 text-3xl font-black sm:text-4xl md:text-6xl">{checkout.emptyTitle}</h1><p className="mt-4 text-white/60">{message || checkout.emptyText}</p><Link href="/shop" className="btn-primary mt-7">{checkout.shopProducts}</Link></div>
  }

  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_390px] lg:gap-8">
      <section className="card rounded-[1.6rem] p-5 sm:rounded-[2rem] sm:p-6 md:p-8">
        <p className="kicker">{checkout.secure}</p>
        <h1 className="mt-3 text-3xl font-black sm:text-4xl md:text-5xl">{checkout.title}</h1>
        <p className="mt-4 text-sm leading-6 text-white/55 sm:text-base">{checkout.intro}</p>

        {hasManualItems && <div className="mt-6 rounded-2xl border border-[#b7c8ad]/25 bg-[#b7c8ad]/10 p-4 text-sm leading-6 text-[#e7f0e2]">
          Je winkelmand bevat een of meerdere Pokemon producten. Deze checkout maakt een interne order aan en wordt apart verwerkt om zo de beste service te kunnen garanderen. Na het plaatsen van je order ontvang je een bevestiging per e-mail met daarin alle details en de verwachte levertijd. Heb je vragen? Neem gerust contact op via <a href="mailto:info@asorta.nl" className="underline">
        </div>}

        <label className="mt-7 grid gap-2 text-sm text-white/60 md:max-w-xl">
          <span className="font-black text-white/70">{checkout.email}</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="jij@email.nl"
            required={hasManualItems}
            className="rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-white outline-none focus:border-[#b7c8ad]"
          />
          <span className="text-xs leading-5 text-white/40">{checkout.emailHelp}</span>
        </label>

        {hasManualItems && <div className="mt-6 grid gap-4 text-sm text-white/60 md:max-w-2xl md:grid-cols-2">
          <label className="grid gap-2 md:col-span-2"><span className="font-black text-white/70">Naam voor verzending</span><input value={shipping.name} onChange={(event) => updateShipping('name', event.target.value)} required className="rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-white outline-none focus:border-[#b7c8ad]" /></label>
          <label className="grid gap-2"><span className="font-black text-white/70">Telefoon</span><input value={shipping.phone} onChange={(event) => updateShipping('phone', event.target.value)} className="rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-white outline-none focus:border-[#b7c8ad]" /></label>
          <label className="grid gap-2"><span className="font-black text-white/70">Postcode</span><input value={shipping.postalCode} onChange={(event) => updateShipping('postalCode', event.target.value)} required className="rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-white outline-none focus:border-[#b7c8ad]" /></label>
          <label className="grid gap-2 md:col-span-2"><span className="font-black text-white/70">Adres</span><input value={shipping.address1} onChange={(event) => updateShipping('address1', event.target.value)} required className="rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-white outline-none focus:border-[#b7c8ad]" /></label>
          <label className="grid gap-2"><span className="font-black text-white/70">Toevoeging</span><input value={shipping.address2} onChange={(event) => updateShipping('address2', event.target.value)} className="rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-white outline-none focus:border-[#b7c8ad]" /></label>
          <label className="grid gap-2"><span className="font-black text-white/70">Plaats</span><input value={shipping.city} onChange={(event) => updateShipping('city', event.target.value)} required className="rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-white outline-none focus:border-[#b7c8ad]" /></label>
        </div>}

        <div className="mt-6 grid gap-2 text-sm text-white/60 md:max-w-xl">
          <span className="font-black text-white/70">{checkout.discount}</span>
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
              {checkout.apply}
            </button>
          </div>
          <span className="text-xs leading-5 text-white/40">{checkout.discountHelp}</span>
          {discountNotice && <span className="rounded-xl border border-[#b7c8ad]/25 bg-[#b7c8ad]/10 px-3 py-2 text-xs text-[#e7f0e2]">{discountNotice}</span>}
        </div>

        <div className="mt-8 grid gap-3 text-sm text-white/62 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[.035] p-4"><Lock className="mb-3 text-[#b7c8ad]" /> {copy.trust1 || 'Veilige betaalomgeving'}</div>
          <div className="rounded-2xl border border-white/10 bg-white/[.035] p-4"><CreditCard className="mb-3 text-[#b7c8ad]" /> {copy.trust2 || 'Bevestiging per e-mail'}</div>
          <div className="rounded-2xl border border-white/10 bg-white/[.035] p-4"><Truck className="mb-3 text-[#b7c8ad]" /> {copy.trust3 || 'Tracking zodra beschikbaar'}</div>
        </div>

        {!hasManualItems && <div className="mt-8 rounded-2xl border border-[#b7c8ad]/20 bg-[#b7c8ad]/10 p-4 text-sm leading-6 text-[#e7f0e2] sm:p-5">
          {checkout.bridgeNote}
        </div>}
      </section>

      <aside className="card h-fit rounded-[1.6rem] p-5 sm:rounded-[1.8rem] sm:p-6 lg:sticky lg:top-24">
        <p className="kicker">{checkout.order}</p>
        <h2 className="mt-2 text-2xl font-black">{checkout.summary}</h2>
        <div className="mt-5 grid gap-3 sm:gap-4">
          {items.map((item) => <div key={`${item.slug}-${item.shopifyVariantId || item.shopifyVariantLegacyId || item.variantSku || item.sku || ''}`} className="flex gap-3 rounded-2xl border border-white/10 bg-white/[.035] p-3"><img src={item.hero || '/products/asorta-product-fallback.svg'} alt="" className="h-14 w-14 rounded-xl object-cover sm:h-16 sm:w-16" /><div className="min-w-0 flex-1"><p className="truncate font-black">{item.name}</p>{item.variantName && <p className="truncate text-xs text-white/40">{item.variantName}</p>}<p className="text-sm text-white/45">{item.qty} × €{Number(item.price || 0).toFixed(2)}</p>{!hasShopifyVariant(item) && <p className="mt-1 text-[11px] font-black uppercase tracking-wider text-[#b7c8ad]">Eigen voorraad</p>}</div></div>)}
        </div>
        <div className="mt-6 flex justify-between text-white/65"><span>{checkout.subtotal}</span><span>€{subtotal.toFixed(2)}</span></div>
        {normalizedDiscountCode && <div className="mt-3 flex justify-between gap-4 text-[#e7f0e2]"><span>{checkout.discountCode}</span><span className="truncate">{normalizedDiscountCode}</span></div>}
        <div className="mt-3 flex justify-between text-white/65"><span>{checkout.shipping}</span><span>{hasManualItems ? 'Wordt verwerkt in order' : checkout.shippingInShopify}</span></div>
        <div className="mt-6 flex justify-between border-t border-white/10 pt-6 text-xl font-black"><span>{checkout.total}</span><span>€{subtotal.toFixed(2)}</span></div>
        {normalizedDiscountCode && <p className="mt-2 text-xs leading-5 text-white/42">{checkout.discountCalculated}</p>}
        <button disabled={state === 'submitting' || state === 'redirecting'} className="btn-primary mt-6 w-full disabled:cursor-not-allowed disabled:opacity-60"><PackageCheck size={18} className="mr-2" />{state === 'submitting' ? checkout.starting : state === 'redirecting' ? checkout.redirecting : hasManualItems ? 'Order plaatsen' : checkout.pay}</button>
        {message && <p className={`mt-4 rounded-2xl border p-4 text-sm ${state === 'error' ? 'border-red-400/25 bg-red-400/10 text-red-100' : 'border-emerald-400/25 bg-emerald-400/10 text-emerald-100'}`}>{message}</p>}
        <p className="mt-4 flex gap-2 text-xs leading-5 text-white/42"><ShieldCheck size={15} /> {checkout.afterPayment}</p>
      </aside>
    </form>
  )
}
