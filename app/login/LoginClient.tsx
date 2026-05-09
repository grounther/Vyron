'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type AuthMode = 'login' | 'register'

export default function LoginClient({ next = '/account', mode = 'login' }: { next?: string; mode?: AuthMode }) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const isRegister = mode === 'register'

  async function sendMagicLink() {
    if (!email) {
      setStatus('Vul eerst je e-mailadres in.')
      return
    }

    setLoading(true)
    setStatus('')
    const supabase = createClient()
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
        shouldCreateUser: isRegister ? true : false,
      },
    })

    setLoading(false)
    if (error) {
      if (!isRegister && error.message.toLowerCase().includes('signups not allowed')) {
        setStatus('Dit e-mailadres bestaat nog niet. Maak eerst gratis een account aan.')
      } else {
        setStatus(error.message)
      }
      return
    }

    setStatus(isRegister
      ? 'Registratielink verzonden. Open de link op hetzelfde apparaat/browser waarmee je wilt inloggen.'
      : 'Magic link verzonden. Open de link op hetzelfde apparaat/browser waarmee je wilt inloggen.'
    )
  }

  return <div className="card rounded-[2rem] p-6">
    <p className="text-xs font-black uppercase tracking-[.35em] text-[#b7c8ad]">ASORTA account</p>
    <h1 className="mt-4 text-4xl font-black">{isRegister ? 'Account maken' : 'Login'}</h1>
    <p className="mt-3 text-sm leading-6 text-white/55">
      {isRegister
        ? 'Maak veilig een account aan met je e-mailadres. Je ontvangt een bevestigingslink per e-mail.'
        : 'Log veilig in met een magic link. Open de link op hetzelfde apparaat als waar je wilt inloggen.'}
    </p>

    <div className="mt-5 grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-black/30 p-1 text-sm font-black">
      <Link href={`/login?next=${encodeURIComponent(next)}`} className={`rounded-xl px-3 py-2 text-center ${!isRegister ? 'bg-white !text-zinc-950 shadow-[0_12px_40px_rgba(255,255,255,.08)]' : 'text-white/45 hover:text-white'}`}>Inloggen</Link>
      <Link href={`/register?next=${encodeURIComponent(next)}`} className={`rounded-xl px-3 py-2 text-center ${isRegister ? 'bg-white !text-zinc-950 shadow-[0_12px_40px_rgba(255,255,255,.08)]' : 'text-white/45 hover:text-white'}`}>Registreren</Link>
    </div>

    <div className="mt-6 grid gap-3">
      <input className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none placeholder:text-white/30" placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} type="email" />
      <button className="btn-primary" onClick={sendMagicLink} disabled={loading}>{loading ? 'Versturen...' : isRegister ? 'Maak account aan' : 'Stuur magic link'}</button>
      {status && <p className="rounded-2xl border border-white/10 bg-white/[.04] p-3 text-sm text-white/65">{status}</p>}
    </div>

    <div className="mt-5 grid gap-2 text-center text-sm font-bold">
      <Link href="/checkout" className="text-white/45 hover:text-white">Continue as guest</Link>
      {!isRegister && <Link href="/register" className="text-[#b7c8ad] hover:text-white">Nog geen account? Registreer hier</Link>}
    </div>
  </div>
}
