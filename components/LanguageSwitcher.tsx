'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { isLocale, normalizeLocale, type Locale } from '@/lib/i18n/config'

function getInitialLocale(): Locale {
  if (typeof document === 'undefined') return 'nl'
  const match = document.cookie.match(/(?:^|; )asorta_lang=([^;]+)/)
  const cookieValue = match ? decodeURIComponent(match[1]) : ''
  const storageValue = typeof localStorage !== 'undefined' ? localStorage.getItem('asorta_lang') : ''
  return normalizeLocale(cookieValue || storageValue)
}

export default function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const router = useRouter()
  const [locale, setLocale] = useState<Locale>('nl')

  useEffect(() => setLocale(getInitialLocale()), [])

  function choose(next: Locale) {
    if (!isLocale(next)) return
    setLocale(next)
    localStorage.setItem('asorta_lang', next)
    document.cookie = `asorta_lang=${next}; Path=/; Max-Age=31536000; SameSite=Lax`
    window.dispatchEvent(new CustomEvent('asorta-language-change', { detail: next }))
    router.refresh()
  }

  return (
    <div className={compact ? 'inline-flex rounded-full border border-white/10 bg-white/[.04] p-1' : 'inline-flex rounded-full border border-white/10 bg-black/30 p-1'} aria-label="Language selector">
      {(['nl', 'en'] as const).map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => choose(option)}
          className={`rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-[.12em] transition ${locale === option ? 'bg-white text-black' : 'text-white/55 hover:text-white'}`}
          aria-pressed={locale === option}
        >
          {option}
        </button>
      ))}
    </div>
  )
}
