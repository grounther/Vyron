'use client'

import { FormEvent, useState } from 'react'
import { CheckCircle2, Headphones, Mail, MessageCircle, Send, ShieldCheck, X } from 'lucide-react'

type TicketState = 'idle' | 'sending' | 'sent' | 'error'

export default function SupportWidget() {
  const [open, setOpen] = useState(false)
  const [state, setState] = useState<TicketState>('idle')
  const [error, setError] = useState('')
  const [ticketNumber, setTicketNumber] = useState('')

  async function submitTicket(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setState('sending')
    setError('')
    setTicketNumber('')

    const form = event.currentTarget
    const formData = new FormData(form)

    const payload = {
      name: String(formData.get('name') || '').trim(),
      email: String(formData.get('email') || '').trim(),
      subject: String(formData.get('subject') || '').trim(),
      message: String(formData.get('message') || '').trim(),
      source: 'support-widget',
      page: typeof window !== 'undefined' ? window.location.href : '',
    }

    if (!payload.email || !payload.message) {
      setError('Vul minimaal je e-mailadres en bericht in.')
      setState('error')
      return
    }

    try {
      const response = await fetch('/api/support-ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data?.error || 'Ticket kon niet worden opgeslagen')

      form.reset()
      setTicketNumber(data.ticketNumber || '')
      setState('sent')
    } catch {
      setError('Verzenden lukte niet. Probeer het later opnieuw of mail info@asorta.nl.')
      setState('error')
    }
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="support-float" aria-label="Open ASORTA support">
        <MessageCircle size={22} />
        <span className="support-float-pulse" />
      </button>

      <div className={`support-overlay ${open ? 'support-overlay-open' : ''}`}>
        <button className="absolute inset-0 cursor-default" type="button" aria-label="Close support" onClick={() => setOpen(false)} />
        <aside className={`support-panel ${open ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          <div className="flex items-start justify-between gap-4 border-b border-white/10 p-5">
            <div>
              <p className="kicker">ASORTA Support</p>
              <h2 className="mt-1 text-2xl font-black">Waar kunnen we mee helpen?</h2>
              <p className="mt-2 text-xs font-bold text-[#b7c8ad]">Ticket + e-mail support via info@asorta.nl</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="rounded-full border border-white/10 p-2 text-white/60 transition hover:bg-white/10 hover:text-white" aria-label="Close support panel">
              <X size={18} />
            </button>
          </div>

          <div className="p-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-white/[.045] p-4">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/10 text-white"><Headphones size={20} /></div>
                  <div><p className="text-sm font-black">Live support</p><p className="text-xs text-white/45">Realtime foundation actief</p></div>
                </div>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/[.045] p-4">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/10 text-white"><Mail size={20} /></div>
                  <div><p className="text-sm font-black">E-mail reply</p><p className="text-xs text-white/45">Antwoord per mail</p></div>
                </div>
              </div>
            </div>

            {state === 'sent' ? (
              <div className="mt-5 rounded-3xl border border-[#6f7d64]/50 bg-[#6f7d64]/15 p-5">
                <CheckCircle2 className="text-[#c8d6bd]" />
                <h3 className="mt-3 text-xl font-black">Bericht ontvangen.</h3>
                <p className="mt-2 text-sm leading-6 text-white/58">
                  Je support ticket is aangemaakt. Je ontvangt ook een bevestiging via e-mail.
                </p>
                {ticketNumber && <p className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-3 text-sm font-black text-white">Ticket: {ticketNumber}</p>}
                <button type="button" className="btn-secondary mt-5 w-full" onClick={() => setState('idle')}>Nieuw bericht</button>
              </div>
            ) : (
              <form onSubmit={submitTicket} className="mt-5 grid gap-3">
                <input name="name" className="support-input" placeholder="Naam" autoComplete="name" />
                <input name="email" className="support-input" placeholder="E-mail" type="email" autoComplete="email" required />
                <input name="subject" className="support-input" placeholder="Onderwerp" />
                <textarea name="message" className="support-input min-h-32 resize-none py-4" placeholder="Waar kunnen we mee helpen?" required />
                {error && <p className="text-sm font-bold text-red-300">{error}</p>}
                <button type="submit" disabled={state === 'sending'} className="btn-primary w-full">
                  {state === 'sending' ? 'Versturen...' : 'Bericht versturen'} <Send className="ml-2" size={17} />
                </button>
                <p className="flex items-center justify-center gap-2 text-center text-xs leading-5 text-white/36">
                  <ShieldCheck size={14} /> Veilig opgeslagen in ASORTA Support Center.
                </p>
              </form>
            )}
          </div>
        </aside>
      </div>
    </>
  )
}
