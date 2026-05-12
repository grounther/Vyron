'use client'

import { useState } from 'react'
import { ArrowRight, CheckCircle2, Loader2, Mail, Sparkles } from 'lucide-react'

type SignupState = 'idle' | 'loading' | 'success' | 'error'

type ExclusiveDropsSignupProps = {
  kicker?: string
  title?: string
  text?: string
  button?: string
}

export default function ExclusiveDropsSignup({
  kicker = 'ASORTA Insiders',
  title = 'Exclusive drops, early access.',
  text = 'Schrijf je in voor exclusieve drops, early access en tijdelijke ASORTA kortingen. Geen spam — alleen updates die waarde hebben.',
  button = 'Join early access',
}: ExclusiveDropsSignupProps) {
  const [state, setState] = useState<SignupState>('idle')
  const [message, setMessage] = useState('')

  async function submit(formData: FormData) {
    setState('loading')
    setMessage('')

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: String(formData.get('name') || '').trim(),
          email: String(formData.get('email') || '').trim(),
          source: 'homepage_exclusive_drops',
          tags: ['exclusive-drops', 'homepage', 'early-access'],
        }),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data?.error || 'Inschrijven is niet gelukt. Probeer het opnieuw.')
      }

      setState('success')
      setMessage(data?.alreadySubscribed ? 'Je stond al op de ASORTA Insider lijst.' : 'Je staat op de ASORTA Insider lijst. Check straks je inbox.')
    } catch (error) {
      setState('error')
      setMessage(error instanceof Error ? error.message : 'Inschrijven is niet gelukt. Probeer het opnieuw.')
    }
  }

  return (
    <section className="mx-auto max-w-7xl px-5 py-12">
      <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_80%_20%,rgba(122,166,184,.16),transparent_34%),linear-gradient(120deg,rgba(255,255,255,.07),rgba(255,255,255,.025))] p-6 shadow-[0_30px_120px_rgba(0,0,0,.42)] md:p-12">
        <div className="absolute inset-0 opacity-[.08] [background-image:linear-gradient(rgba(255,255,255,.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.10)_1px,transparent_1px)] [background-size:70px_70px]" />
        <div className="relative grid gap-8 lg:grid-cols-[1fr_430px] lg:items-end">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles size={17} className="text-[#b7c8ad]" />
              <p className="kicker">{kicker}</p>
            </div>
            <h2 className="mt-3 max-w-3xl text-3xl font-black tracking-tight md:text-5xl">{title}</h2>
            <p className="mt-4 max-w-2xl leading-7 text-white/58">{text}</p>

            <div className="mt-6 flex flex-wrap gap-3 text-xs font-black uppercase tracking-[.20em] text-white/38">
              <span className="rounded-full border border-white/10 bg-black/25 px-3 py-2">Early access</span>
              <span className="rounded-full border border-white/10 bg-black/25 px-3 py-2">Drop alerts</span>
              <span className="rounded-full border border-white/10 bg-black/25 px-3 py-2">Launch discounts</span>
            </div>
          </div>

          <form action={submit} className="rounded-[1.5rem] border border-white/10 bg-black/35 p-4 backdrop-blur-xl">
            <label className="grid gap-2">
              <span className="text-xs font-black uppercase tracking-[.20em] text-white/38">Naam</span>
              <input name="name" autoComplete="name" placeholder="Oscar" className="rounded-xl border border-white/10 bg-black/45 px-4 py-3 text-white outline-none transition placeholder:text-white/25 focus:border-[#b7c8ad]" />
            </label>
            <label className="mt-3 grid gap-2">
              <span className="text-xs font-black uppercase tracking-[.20em] text-white/38">E-mail</span>
              <input name="email" type="email" required autoComplete="email" placeholder="info@asorta.nl" className="rounded-xl border border-white/10 bg-black/45 px-4 py-3 text-white outline-none transition placeholder:text-white/25 focus:border-[#b7c8ad]" />
            </label>
            <button disabled={state === 'loading'} className="mt-4 flex w-full items-center justify-center rounded-full bg-white px-5 py-3 font-black text-black transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60" type="submit">
              {state === 'loading' ? <Loader2 className="mr-2 animate-spin" size={18} /> : state === 'success' ? <CheckCircle2 className="mr-2" size={18} /> : <Mail className="mr-2" size={18} />}
              {state === 'success' ? 'Aangemeld' : button}
              {state === 'idle' && <ArrowRight className="ml-2" size={18} />}
            </button>
            {message && <p className={`mt-3 text-sm leading-6 ${state === 'error' ? 'text-red-200' : 'text-[#dbe9d4]'}`}>{message}</p>}
            <p className="mt-3 text-xs leading-5 text-white/35">Door je in te schrijven ga je akkoord met ASORTA updates. Uitschrijven kan altijd.</p>
          </form>
        </div>
      </div>
    </section>
  )
}
