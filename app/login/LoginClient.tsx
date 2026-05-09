'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginClient({ next = '/account' }: { next?: string }) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  async function signIn() {
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
      options: { emailRedirectTo: redirectTo },
    })

    setLoading(false)
    if (error) setStatus(error.message)
    else setStatus('Magic link verzonden. Check je inbox om veilig in te loggen.')
  }

  return <div className="card rounded-[2rem] p-6">
    <p className="text-xs font-black uppercase tracking-[.35em] text-[#b7c8ad]">ASORTA account</p>
    <h1 className="mt-4 text-4xl font-black">Login</h1>
    <p className="mt-3 text-sm leading-6 text-white/55">Log veilig in met een magic link. Klanten kunnen straks bestellen met account of als gast.</p>
    <div className="mt-6 grid gap-3">
      <input className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none placeholder:text-white/30" placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} type="email" />
      <button className="btn-primary" onClick={signIn} disabled={loading}>{loading ? 'Versturen...' : 'Stuur magic link'}</button>
      {status && <p className="rounded-2xl border border-white/10 bg-white/[.04] p-3 text-sm text-white/65">{status}</p>}
    </div>
    <Link href="/checkout" className="mt-5 block text-center text-sm font-bold text-white/45 hover:text-white">Continue as guest</Link>
  </div>
}
