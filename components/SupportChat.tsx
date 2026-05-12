'use client'

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight, CheckCircle2, Headphones, Loader2, Send } from 'lucide-react'

type SupportMessage = {
  id: string
  sender_type: 'customer' | 'operator' | 'system'
  author_name: string | null
  body: string
  created_at: string
}

type SupportConversation = {
  id: string
  public_token: string
  customer_name: string | null
  customer_email: string | null
  status: string
  subject: string | null
}

type Props = {
  source?: string
  mode?: 'widget' | 'page'
}

const STORAGE_KEY = 'asorta_support_token'

export default function SupportChat({ source = 'support-widget', mode = 'widget' }: Props) {
  const [token, setToken] = useState<string | null>(null)
  const [conversation, setConversation] = useState<SupportConversation | null>(null)
  const [messages, setMessages] = useState<SupportMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const endRef = useRef<HTMLDivElement | null>(null)

  const hasChat = Boolean(token && conversation)
  const isClosed = conversation?.status === 'closed'

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (saved) setToken(saved)
    else setLoading(false)
  }, [])

  useEffect(() => {
    if (!token) return
    let active = true

    async function load() {
      try {
        const response = await fetch(`/api/support/conversations/${token}/messages`, { cache: 'no-store' })
        if (!response.ok) throw new Error('Support chat niet gevonden')
        const data = await response.json()
        if (!active) return
        setConversation(data.conversation)
        setMessages(data.messages || [])
        setLoading(false)
      } catch {
        if (!active) return
        window.localStorage.removeItem(STORAGE_KEY)
        setToken(null)
        setConversation(null)
        setMessages([])
        setLoading(false)
      }
    }

    load()
    const interval = window.setInterval(load, 6000)
    return () => {
      active = false
      window.clearInterval(interval)
    }
  }, [token])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, hasChat])

  const statusText = useMemo(() => {
    if (!conversation) return 'Online support foundation · meestal snel antwoord.'
    if (conversation.status === 'closed') return 'Deze chat is gesloten. Start gerust een nieuw gesprek.'
    if (conversation.status === 'answered') return 'Support heeft geantwoord.'
    if (conversation.status === 'pending') return 'Je bericht staat klaar voor ASORTA Support.'
    return 'Chat actief · ASORTA Support leest mee via Atlas.'
  }, [conversation])

  async function startChat(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStarting(true)
    setError('')

    const form = event.currentTarget
    const formData = new FormData(form)
    const payload = {
      name: String(formData.get('name') || '').trim(),
      email: String(formData.get('email') || '').trim(),
      subject: String(formData.get('subject') || 'Support request').trim(),
      message: String(formData.get('message') || '').trim(),
      source,
    }

    if (!payload.email || !payload.message) {
      setError('Vul minimaal je e-mailadres en bericht in.')
      setStarting(false)
      return
    }

    try {
      const response = await fetch('/api/support/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Chat kon niet worden gestart')

      window.localStorage.setItem(STORAGE_KEY, data.conversation.public_token)
      setToken(data.conversation.public_token)
      setConversation(data.conversation)
      setMessages(data.messages || [])
      form.reset()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verzenden lukte niet. Probeer opnieuw.')
    } finally {
      setStarting(false)
    }
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!token || isClosed) return

    const form = event.currentTarget
    const formData = new FormData(form)
    const message = String(formData.get('message') || '').trim()
    if (!message) return

    setSending(true)
    setError('')

    try {
      const response = await fetch(`/api/support/conversations/${token}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Bericht kon niet worden verzonden')
      setMessages(data.messages || [])
      setConversation(data.conversation)
      form.reset()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bericht verzenden lukte niet.')
    } finally {
      setSending(false)
    }
  }

  function newChat() {
    window.localStorage.removeItem(STORAGE_KEY)
    setToken(null)
    setConversation(null)
    setMessages([])
    setError('')
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="grid min-h-72 place-items-center rounded-3xl border border-white/10 bg-white/[.035] p-6">
        <Loader2 className="animate-spin text-white/55" />
      </div>
    )
  }

  return (
    <div className={mode === 'page' ? 'grid gap-5' : ''}>
      <div className="rounded-3xl border border-white/10 bg-white/[.045] p-4">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/10 text-white">
            <Headphones size={20} />
          </div>
          <div>
            <p className="text-sm font-black">Live chat</p>
            <p className="text-xs text-white/45">{statusText}</p>
          </div>
        </div>
      </div>

      {hasChat ? (
        <div className="mt-5 grid gap-4">
          <div className="support-chat-window rounded-3xl border border-white/10 bg-black/30 p-3">
            {messages.map((message) => {
              const mine = message.sender_type === 'customer'
              return (
                <div key={message.id} className={`mb-3 flex ${mine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-6 ${mine ? 'bg-white text-black' : 'border border-white/10 bg-white/[.06] text-white/75'}`}>
                    {!mine && <p className="mb-1 text-[10px] font-black uppercase tracking-[.18em] text-[#b7c8ad]">{message.author_name || 'ASORTA Support'}</p>}
                    {message.body}
                  </div>
                </div>
              )
            })}
            <div ref={endRef} />
          </div>

          {isClosed ? (
            <button type="button" onClick={newChat} className="btn-primary w-full">Nieuw gesprek starten</button>
          ) : (
            <form onSubmit={sendMessage} className="grid gap-3">
              <textarea name="message" className="support-input min-h-24 resize-none py-4" placeholder="Typ je bericht..." />
              {error && <p className="text-sm font-bold text-red-300">{error}</p>}
              <button type="submit" disabled={sending} className="btn-primary w-full">
                {sending ? 'Versturen...' : 'Verstuur bericht'} <Send className="ml-2" size={17} />
              </button>
            </form>
          )}

          <button type="button" onClick={newChat} className="text-xs font-black uppercase tracking-[.2em] text-white/38 transition hover:text-white/70">
            Ander gesprek starten
          </button>
        </div>
      ) : (
        <form onSubmit={startChat} className="mt-5 grid gap-3">
          <input name="name" className="support-input" placeholder="Naam" autoComplete="name" />
          <input name="email" className="support-input" placeholder="E-mail" type="email" autoComplete="email" />
          <input name="subject" className="support-input" placeholder="Onderwerp" />
          <textarea name="message" className="support-input min-h-32 resize-none py-4" placeholder="Waar kunnen we mee helpen?" />
          {error && <p className="text-sm font-bold text-red-300">{error}</p>}
          <button type="submit" disabled={starting} className="btn-primary w-full">
            {starting ? 'Starten...' : 'Start live chat'} <ArrowRight className="ml-2" size={17} />
          </button>
          <p className="text-center text-xs leading-5 text-white/36">
            Je gesprek blijft bewaard op dit apparaat. Als support niet direct online is, maken we automatisch een ticket aan.
          </p>
        </form>
      )}

      {hasChat && conversation?.status !== 'closed' && (
        <div className="rounded-3xl border border-[#6f7d64]/35 bg-[#6f7d64]/10 p-4 text-sm leading-6 text-white/60">
          <CheckCircle2 className="mb-2 text-[#c8d6bd]" size={20} />
          Chat #{conversation?.public_token?.slice(0, 8) || 'nieuw'} is actief. Je kunt dit gesprek ook via de contactpagina verder voeren.
        </div>
      )}
    </div>
  )
}
