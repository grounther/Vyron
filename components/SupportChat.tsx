use client'

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight, CheckCircle2, Headphones, Loader2, RotateCcw, Send } from 'lucide-react'

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

type StoredChat = {
  token: string
  email?: string | null
  savedAt: string
}

type Props = {
  source?: string
  mode?: 'widget' | 'page'
}

const STORAGE_KEY = 'asorta_support_conversation'
const LEGACY_STORAGE_KEY = 'asorta_support_token'

function readStoredChat(): StoredChat | null {
  if (typeof window === 'undefined') return null

  const modern = window.localStorage.getItem(STORAGE_KEY)
  if (modern) {
    try {
      const parsed = JSON.parse(modern) as StoredChat
      if (parsed?.token) return parsed
    } catch {
      window.localStorage.removeItem(STORAGE_KEY)
    }
  }

  const legacy = window.localStorage.getItem(LEGACY_STORAGE_KEY)
  if (legacy) {
    const migrated = { token: legacy, savedAt: new Date().toISOString() }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated))
    window.localStorage.removeItem(LEGACY_STORAGE_KEY)
    return migrated
  }

  return null
}

function storeChat(conversation: SupportConversation) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      token: conversation.public_token,
      email: conversation.customer_email,
      savedAt: new Date().toISOString(),
    }),
  )
  window.localStorage.removeItem(LEGACY_STORAGE_KEY)
}

function clearStoredChat() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(STORAGE_KEY)
  window.localStorage.removeItem(LEGACY_STORAGE_KEY)
}

export default function SupportChat({ source = 'support-widget', mode = 'widget' }: Props) {
  const [token, setToken] = useState<string | null>(null)
  const [conversation, setConversation] = useState<SupportConversation | null>(null)
  const [messages, setMessages] = useState<SupportMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const endRef = useRef<HTMLDivElement | null>(null)
  const lastMessageCount = useRef(0)

  const hasChat = Boolean(token && conversation)
  const isClosed = conversation?.status === 'closed'

  async function loadConversation(currentToken: string, silent = false) {
    try {
      if (!silent) setLoading(true)
      const response = await fetch(`/api/support/conversations/${currentToken}/messages`, {
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      })

      if (response.status === 404) {
        clearStoredChat()
        setToken(null)
        setConversation(null)
        setMessages([])
        setNotice('Dit supportgesprek is afgerond en gearchiveerd. Start gerust een nieuw gesprek.')
        return
      }

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Support chat niet gevonden')

      setConversation(data.conversation)
      setMessages(data.messages || [])
      if (data.conversation) storeChat(data.conversation)
      setError('')
    } catch {
      if (!silent) {
        clearStoredChat()
        setToken(null)
        setConversation(null)
        setMessages([])
        setError('Je vorige chat kon niet worden geladen. Start gerust een nieuw gesprek.')
      }
    } finally {
      if (!silent) setLoading(false)
    }
  }

  useEffect(() => {
    const saved = readStoredChat()
    if (saved?.token) setToken(saved.token)
    else setLoading(false)
  }, [])

  useEffect(() => {
    if (!token) return
    let active = true

    const load = async (silent = false) => {
      if (!active) return
      await loadConversation(token, silent)
    }

    load(false)
    const interval = window.setInterval(() => load(true), 2000)

    const handleFocus = () => load(true)
    const handleVisibility = () => {
      if (!document.hidden) load(true)
    }
    const handleStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY || event.key === LEGACY_STORAGE_KEY) {
        const saved = readStoredChat()
        if (saved?.token && saved.token !== token) setToken(saved.token)
      }
    }

    window.addEventListener('focus', handleFocus)
    window.addEventListener('storage', handleStorage)
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      active = false
      window.clearInterval(interval)
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('storage', handleStorage)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [token])

  useEffect(() => {
    if (messages.length !== lastMessageCount.current) {
      lastMessageCount.current = messages.length
      endRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages.length, hasChat])

  const statusText = useMemo(() => {
    if (!conversation) return 'Live support · chat blijft bewaard op dit apparaat.'
    if (conversation.status === 'closed') return 'Deze chat is gesloten. Je ontvangt een kopie wanneer support hem archiveert.'
    if (conversation.status === 'answered') return 'ASORTA Support heeft gereageerd · je kunt direct terugtypen.'
    if (conversation.status === 'pending') return 'Je bericht staat klaar voor ASORTA Support.'
    return 'Live chat actief · berichten worden automatisch bijgewerkt.'
  }, [conversation])

  async function startChat(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStarting(true)
    setError('')
    setNotice('')

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

      storeChat(data.conversation)
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
      if (data.conversation) storeChat(data.conversation)
      form.reset()
      window.setTimeout(() => loadConversation(token, true), 450)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bericht verzenden lukte niet.')
    } finally {
      setSending(false)
    }
  }

  function newChat() {
    clearStoredChat()
    setToken(null)
    setConversation(null)
    setMessages([])
    setError('')
    setNotice('')
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

      {notice && !hasChat && (
        <div className="mt-5 rounded-3xl border border-[#6f7d64]/35 bg-[#6f7d64]/10 p-4 text-sm leading-6 text-white/60">
          <CheckCircle2 className="mb-2 text-[#c8d6bd]" size={20} />
          {notice}
        </div>
      )}

      {hasChat ? (
        <div className="mt-5 grid gap-4">
          <div className="support-chat-window rounded-3xl border border-white/10 bg-black/30 p-3" aria-live="polite">
            {messages.map((message) => {
              const mine = message.sender_type === 'customer'
              const system = message.sender_type === 'system'
              return (
                <div key={message.id} className={`mb-3 flex ${system ? 'justify-center' : mine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-6 ${system ? 'border border-white/10 bg-white/[.035] text-center text-white/42' : mine ? 'bg-white text-black' : 'border border-white/10 bg-white/[.06] text-white/75'}`}>
                    {!mine && !system && <p className="mb-1 text-[10px] font-black uppercase tracking-[.18em] text-[#b7c8ad]">{message.author_name || 'ASORTA Support'}</p>}
                    {message.body}
                  </div>
                </div>
              )
            })}
            <div ref={endRef} />
          </div>

          {isClosed ? (
            <div className="grid gap-3">
              <div className="rounded-3xl border border-white/10 bg-white/[.035] p-4 text-sm leading-6 text-white/50">
                Dit gesprek is gesloten door ASORTA Support. Als het gesprek wordt gearchiveerd, ontvang je automatisch een kopie per e-mail.
              </div>
              <button type="button" onClick={newChat} className="btn-primary w-full">Nieuw gesprek starten</button>
            </div>
          ) : (
            <form onSubmit={sendMessage} className="grid gap-3">
              <textarea name="message" className="support-input min-h-24 resize-none py-4" placeholder="Typ je bericht..." />
              {error && <p className="text-sm font-bold text-red-300">{error}</p>}
              <button type="submit" disabled={sending} className="btn-primary w-full">
                {sending ? 'Versturen...' : 'Verstuur bericht'} <Send className="ml-2" size={17} />
              </button>
            </form>
          )}

          <button type="button" onClick={() => token && loadConversation(token, true)} className="inline-flex items-center justify-center gap-2 text-xs font-black uppercase tracking-[.2em] text-white/38 transition hover:text-white/70">
            <RotateCcw size={14} /> Chat verversen
          </button>

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
            Je gesprek blijft bewaard op dit apparaat en is ook zichtbaar op de contactpagina. Antwoorden verschijnen automatisch in deze chat.
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
