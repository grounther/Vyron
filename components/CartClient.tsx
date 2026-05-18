'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Lock, Trash2, Mail, RefreshCw } from 'lucide-react'

type Item = {
  slug: string
  name: string
  price: number
  hero: string
  qty: number
  variantName?: string
  variantSku?: string
  sku?: string
  lineKey?: string
  shopifyVariantId?: string
  shopifyVariantLegacyId?: string
}

function getCartSessionKey() {
  if (typeof window === 'undefined') return ''
  const existing = localStorage.getItem('asorta_cart_session')
  if (existing) return existing
  const created = `cart_${Date.now()}_${Math.random().toString(16).slice(2)}`
  localStorage.setItem('asorta_cart_session', created)
  return created
}

function itemKey(item: Item) {
  return item.lineKey || [item.slug, item.shopifyVariantId || item.shopifyVariantLegacyId || item.variantSku || item.sku || 'default'].join('::')
}

export default function CartClient() {
  const [items, setItems] = useState<Item[]>([])
  const [email, setEmail] = useState('')
  const [syncState, setSyncState] = useState<'idle' | 'syncing' | 'saved'>('idle')

  useEffect(() => {
    setItems(JSON.parse(localStorage.getItem('asorta_cart') || '[]'))
    setEmail(localStorage.getItem('asorta_cart_email') || '')
  }, [])

  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.price * item.qty, 0), [items])

  useEffect(() => {
    if (!items.length) return
    const timer = setTimeout(() => {
      const sessionKey = getCartSessionKey()
      setSyncState('syncing')
      fetch('/api/cart/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionKey, email: email || null, items }),
      })
        .then(() => setSyncState('saved'))
        .catch(() => setSyncState('idle'))
    }, 550)

    return () => clearTimeout(timer)
  }, [items, email])

  function save(next: Item[]) {
    setItems(next)
    localStorage.setItem('asorta_cart', JSON.stringify(next))
    window.dispatchEvent(new Event('asorta-cart'))
  }

  function saveEmail(value: string) {
    setEmail(value)
    localStorage.setItem('asorta_cart_email', value)
  }

  if (!items.length) {
    return (
      <div className="card rounded-[2rem] p-8 md:p-12">
        <p className="kicker">Cart</p>
        <h1 className="mt-3 text-4xl font-black md:text-6xl">Your cart is empty.</h1>
        <p className="mt-4 text-white/60">Kies eerst een premium utility product uit de catalogus.</p>
        <Link href="/shop" className="btn-primary mt-7">Shop products</Link>
      </div>
    )
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_390px]">
      <div className="grid gap-4">
        {items.map((item) => {
          const key = itemKey(item)
          return (
            <div key={key} className="card grid grid-cols-[92px_1fr] gap-4 rounded-[1.6rem] p-4 md:grid-cols-[120px_1fr]">
              <img src={item.hero} className="h-24 w-24 rounded-2xl object-cover md:h-32 md:w-32" alt="" />
              <div>
                <h3 className="font-black md:text-xl">{item.name}</h3>
                {item.variantName && <p className="mt-1 text-sm text-white/45">{item.variantName}</p>}
                <p className="mt-1 text-white/55">€{item.price.toFixed(2)}</p>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <button className="rounded-full border border-white/10 px-3 py-1" onClick={() => save(items.map((cartItem) => itemKey(cartItem) === key ? { ...cartItem, qty: Math.max(1, cartItem.qty - 1) } : cartItem))}>-</button>
                  <span className="min-w-6 text-center font-black">{item.qty}</span>
                  <button className="rounded-full border border-white/10 px-3 py-1" onClick={() => save(items.map((cartItem) => itemKey(cartItem) === key ? { ...cartItem, qty: cartItem.qty + 1 } : cartItem))}>+</button>
                  <button className="ml-auto inline-flex items-center gap-2 text-sm text-white/45 hover:text-white" onClick={() => save(items.filter((cartItem) => itemKey(cartItem) !== key))}><Trash2 size={15} /> Remove</button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <aside className="card h-fit rounded-[1.8rem] p-6 lg:sticky lg:top-24">
        <p className="kicker">Checkout</p>
        <h2 className="mt-2 text-2xl font-black">Order Summary</h2>

        <label className="mt-5 grid gap-2 rounded-2xl border border-white/10 bg-black/30 p-4">
          <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[.18em] text-white/38"><Mail size={14} /> Checkout email</span>
          <input value={email} onChange={(event) => saveEmail(event.target.value)} type="email" placeholder="jij@email.nl" className="rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-white outline-none focus:border-[#b7c8ad]" />
          <span className="text-xs leading-5 text-white/40">We gebruiken dit e-mailadres voor je orderbevestiging en trackingupdates.</span>
          <span className="inline-flex items-center gap-2 text-xs text-white/35">{syncState === 'syncing' ? <RefreshCw size={13} className="animate-spin" /> : null}{syncState === 'saved' ? 'Cart opgeslagen voor recovery.' : 'Cart recovery foundation actief.'}</span>
        </label>

        <div className="mt-6 flex justify-between text-white/65"><span>Subtotal</span><span>€{subtotal.toFixed(2)}</span></div>
        <div className="mt-3 flex justify-between text-white/65"><span>Shipping</span><span>Calculated at checkout</span></div>
        <div className="mt-6 flex justify-between border-t border-white/10 pt-6 text-xl font-black"><span>Total</span><span>€{subtotal.toFixed(2)}</span></div>
        <Link href="/checkout" className="btn-primary mt-6 w-full">Proceed to checkout</Link>
        <p className="mt-4 flex gap-2 text-xs leading-5 text-white/45"><Lock size={15} /> Je wordt veilig doorgestuurd naar de betaalomgeving. Na betaling ontvang je orderupdates per e-mail.</p>
      </aside>
    </div>
  )
}
