'use client'

import { useState } from 'react'
import Link from 'next/link'
import { LockKeyhole, ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function AdminAccessClient({ next = '/atlas', error }: { next?: string; error?: string }) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState(error ? 'De vorige login kon niet worden afgerond. Vraag een nieuwe link aan.' : '')
  const [loading, setLoading] = useState(false)

  async function sendAdminMagicLink() {
    if (!email) {
      setStatus('Vul eerst je admin e-mailadres in.')
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
        shouldCreateUser: false,
      },
    })

    setLoading(false)

    if (error) {
      setStatus('Login kon niet worden verzonden. Controleer of dit e-mailadres bestaat en adminrechten heeft.')
      return
    }

    setStatus('Atlas access link verzonden. Open de link op dezelfde browser waar je Atlas wilt gebruiken.')
  }

  return <div className="card rounded-[2rem] p-6">
    <div className="flex items-center gap-3">
      <div className="grid h-12 w-12 place-items-center rounded-2xl border border-[#b7c8ad]/25 bg-[#b7c8ad]/10 text-[#b7c8ad]">
        <LockKeyhole size={22} />
      </div>
      <div>
        <p className="text-xs font-black uppercase tracking-[.32em] text-[#b7c8ad]">Internal access</p>
        <h1 className="text-3xl font-black">Atlas</h1>
      </div>
    </div>

    <p className="mt-5 text-sm leading-6 text-white/55">
      Secure ASORTA operator login. Deze route is alleen bedoeld voor interne toegang en gebruikt een aparte magic-link flow.
    </p>

    <div className="mt-6 grid gap-3">
      <input
        className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none placeholder:text-white/30"
        placeholder="Admin email"
        value={email}
        onChange={(e)=>setEmail(e.target.value)}
        type="email"
        autoComplete="email"
      />
      <button className="btn-primary" onClick={sendAdminMagicLink} disabled={loading}>
        {loading ? 'Versturen...' : 'Stuur Atlas access link'}
      </button>
      {status && <p className="rounded-2xl border border-white/10 bg-white/[.04] p-3 text-sm text-white/65">{status}</p>}
    </div>

    <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm leading-6 text-white/50">
      <ShieldCheck size={18} className="mb-2 text-[#b7c8ad]" />
      Atlas controleert na login server-side of je e-mailadres actief staat in de Supabase tabel <code>admin_users</code>.
    </div>

    <div className="mt-5 text-center text-sm font-bold">
      <Link href="/login" className="text-white/40 hover:text-white">Naar klantlogin</Link>
    </div>
  </div>
}
