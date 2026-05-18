'use client'

import { useEffect, useState } from 'react'
import { Heart, Loader2 } from 'lucide-react'

type WishlistButtonProps = {
  productSlug: string
  productName: string
}

export default function WishlistButton({ productSlug, productName }: WishlistButtonProps) {
  const [inWishlist, setInWishlist] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checked, setChecked] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadState() {
      try {
        const response = await fetch(`/api/account/wishlist?productSlug=${encodeURIComponent(productSlug)}`, {
          method: 'GET',
          credentials: 'same-origin',
        })

        if (response.status === 401) {
          if (!cancelled) setChecked(true)
          return
        }

        const data = await response.json().catch(() => null)
        if (!cancelled && data?.ok) {
          setInWishlist(Boolean(data.inWishlist))
          setChecked(true)
        }
      } catch {
        if (!cancelled) setChecked(true)
      }
    }

    loadState()
    return () => {
      cancelled = true
    }
  }, [productSlug])

  async function toggleWishlist() {
    if (loading) return
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/account/wishlist', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productSlug, action: 'toggle' }),
      })

      if (response.status === 401) {
        window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`
        return
      }

      const data = await response.json().catch(() => null)
      if (!response.ok || !data?.ok) {
        setMessage(data?.error || 'Wishlist kon niet worden bijgewerkt.')
        return
      }

      setInWishlist(Boolean(data.inWishlist))
      setChecked(true)
      setMessage(data.inWishlist ? 'Opgeslagen in je wishlist.' : 'Verwijderd uit je wishlist.')
    } finally {
      setLoading(false)
    }
  }

  const label = inWishlist ? 'In wishlist' : 'Add to wishlist'

  return <div className="grid gap-2">
    <button
      type="button"
      onClick={toggleWishlist}
      disabled={loading}
      aria-pressed={inWishlist}
      aria-label={`${label}: ${productName}`}
      className={`inline-flex w-full items-center justify-center gap-2 rounded-full border px-5 py-3 text-sm font-black transition ${inWishlist ? 'border-[#b7c8ad]/60 bg-[#b7c8ad]/15 text-[#dbe9d4]' : 'border-white/10 bg-white/[.035] text-white/70 hover:border-[#b7c8ad]/40 hover:text-white'} disabled:cursor-not-allowed disabled:opacity-60`}
    >
      {loading ? <Loader2 size={18} className="animate-spin" /> : <Heart size={18} className={inWishlist ? 'fill-[#b7c8ad] text-[#b7c8ad]' : ''} />}
      {!checked && loading ? 'Checking...' : label}
    </button>
    {message && <p className="text-xs text-white/45">{message}</p>}
  </div>
}
