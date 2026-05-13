'use client'

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { Loader2, MessageCircle, RefreshCw, Send, ShieldCheck, Trash2, Wifi, WifiOff } from 'lucide-react'
import type { AtlasSupportConversation, AtlasSupportMessage, AtlasSupportSnapshot } from '@/lib/support-admin'
import CustomerPortalPanel from './CustomerPortalPanel'

type BusyAction = 'reply' | 'status' | 'archive' | null

type Props = {
  initialSnapshot: AtlasSupportSnapshot
}

function formatDate(value?: string | null) {
  if (!value) return 'Onbekend'
  try {
    return new Date(value).toLocaleString('nl-NL')
  } catch {
    return value
  }
}

function statusClass(status: string) {
  if (status === 'open') return 'border-emerald-300/20 bg-emerald-400/10 text-emerald-100'
  if (status === 'answered') return 'border-[#b7c8ad]/25 bg-[#6f7d64]/15 text-[#d7e5cc]'
  if (status === 'pending') return 'border-amber-300/20 bg-amber-400/10 text-amber-100'
  if (status === 'closed') return 'border-white/10 bg-white/[.04] text-white/40'
  return 'border-white/10 bg-white/[.06] text-white/55'
}

export default function AtlasSupportClient({ initialSnapshot }: Props) {
  const [conversations, setConversations] = useState<AtlasSupportConversation[]>(initialSnapshot.conversations)
  const [selected, setSelected] = useState<AtlasSupportConversation | null>(initialSnapshot.selected)
  const [messages, setMessages] = useState<AtlasSupportMessage[]>(initialSnapshot.messages)
  const [selectedId, setSelectedId] = useState(initialSnapshot.selected?.id || '')
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState<BusyAction>(null)
  const [error, setError] = useState('')
  const [liveState, setLiveState] = useState<'connected' | 'reconnecting'>('reconnecting')
  const scrollRef = useRef<HTMLDivElement | null>(null)

  const openCount = useMemo(() => conversations.filter((conversation) => conversation.status !== 'closed').length, [conversations])
  const selectedClosed = selected?.status === 'closed'

  function applySnapshot(snapshot: AtlasSupportSnapshot) {
    setConversations(snapshot.conversations || [])
    setSelected(snapshot.selected || null)
    setMessages(snapshot.messages || [])
    if (snapshot.selected?.id && !selectedId) setSelectedId(snapshot.selected.id)
    setError('')
  }

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, selected?.id])

  useEffect(() => {
    let active = true
    let stream: EventSource | null = null
    let fallback: number | undefined

    function startFallback() {
      if (fallback) return
      fallback = window.setInterval(async () => {
        try {
          const query = selectedId ? `?id=${encodeURIComponent(selectedId)}` : ''
          const response = await fetch(`/api/atlas/support/snapshot${query}`, { cache: 'no-store' })
          if (!response.ok) return
          const snapshot = (await response.json()) as AtlasSupportSnapshot
          if (active) applySnapshot(snapshot)
        } catch {}
      }, 3000)
    }

    function stopFallback() {
      if (!fallback) return
      window.clearInterval(fallback)
      fallback = undefined
    }

    const query = selectedId ? `?id=${encodeURIComponent(selectedId)}` : ''

    if ('EventSource' in window) {
      stream = new EventSource(`/api/atlas/support/stream${query}`)
      stream.onopen = () => {
        if (!active) return
        setLiveState('connected')
        stopFallback()
      }
      stream.onmessage = (event) => {
        if (!active) return
        const snapshot = JSON.parse(event.data) as AtlasSupportSnapshot
        applySnapshot(snapshot)
        setLiveState('connected')
      }
      stream.onerror = () => {
        if (!active) return
        setLiveState('reconnecting')
        startFallback()
      }
    } else {
      setLiveState('reconnecting')
      startFallback()
    }

    return () => {
      active = false
      stream?.close()
      stopFallback()
    }
  }, [selectedId])

  function chooseConversation(conversation: AtlasSupportConversation) {
    setSelectedId(conversation.id)
    setSelected(conversation)
    setMessages([])
    window.history.replaceState(null, '', `/atlas/support?id=${conversation.id}`)
  }

  async function sendReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selected?.id || selectedClosed) return
    const message = draft.trim()
    if (!message) return

    setBusy('reply')
    setError('')

    try {
      const response = await fetch(`/api/atlas/support/conversations/${selected.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      })
      const snapshot = await response.json()
      if (!response.ok) throw new Error(snapshot.error || 'Antwoord kon niet worden opgeslagen.')
      applySnapshot(snapshot)
      setDraft('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Antwoord kon niet worden verzonden.')
    } finally {
      setBusy(null)
    }
  }

  async function updateStatus(status: string) {
    if (!selected?.id || selected.status === status) return
    setBusy('status')
    setError('')

    try {
      const response = await fetch(`/api/atlas/support/conversations/${selected.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const snapshot = await response.json()
      if (!response.ok) throw new Error(snapshot.error || 'Status kon niet worden opgeslagen.')
      applySnapshot(snapshot)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Status wijzigen lukte niet.')
    } finally {
      setBusy(null)
    }
  }

  async function archiveConversation() {
    if (!selected?.id || selected.status !== 'closed') return
    setBusy('archive')
    setError('')

    try {
      const response = await fetch(`/api/atlas/support/conversations/${selected.id}`, { method: 'DELETE' })
      const snapshot = await response.json()
      if (!response.ok) throw new Error(snapshot.error || 'Archiveren lukte niet.')
      applySnapshot(snapshot)
      const nextId = snapshot.selected?.id || ''
      setSelectedId(nextId)
      window.history.replaceState(null, '', nextId ? `/atlas/support?id=${nextId}` : '/atlas/support')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Archiveren lukte niet.')
    } finally {
      setBusy(null)
    }
  }


  async function manualRefresh() {
    try {
      const query = selectedId ? `?id=${encodeURIComponent(selectedId)}` : ''
      const response = await fetch(`/api/atlas/support/snapshot${query}`, { cache: 'no-store' })
      const snapshot = await response.json()
      if (!response.ok) throw new Error(snapshot.error || 'Verversen lukte niet.')
      applySnapshot(snapshot)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verversen lukte niet.')
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(111,125,100,.18),transparent_38%),linear-gradient(145deg,rgba(255,255,255,.08),rgba(255,255,255,.02))] p-6 md:p-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="kicker">Atlas Customer Care</p>
            <h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">Support Center</h1>
            <p className="mt-4 max-w-2xl text-white/60">Live 1-op-1 chats, tickets en klantdossiers komen hier samen. Zoek direct op ordernummer, klantdata of tracking terwijl je antwoordt.</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/25 px-4 py-2 text-sm font-black text-white/55">
            {liveState === 'connected' ? <Wifi size={16} className="text-[#b7c8ad]" /> : <WifiOff size={16} className="text-amber-200" />}
            {liveState === 'connected' ? 'Live verbonden' : 'Opnieuw verbinden'}
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)_430px]">
        <div className="card rounded-[2rem] p-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black">Gesprekken</h2>
              <p className="text-xs text-white/35">{openCount} open · {conversations.length} totaal</p>
            </div>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-white/45">{conversations.length}</span>
          </div>
          <div className="grid max-h-[680px] gap-2 overflow-auto pr-1">
            {conversations.length ? (
              conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => chooseConversation(conversation)}
                  className={`rounded-2xl border p-4 text-left transition hover:bg-white/[.06] ${selected?.id === conversation.id ? 'border-[#b7c8ad]/50 bg-[#6f7d64]/10' : 'border-white/10 bg-white/[.025]'}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-black text-white">{conversation.customer_name || conversation.customer_email || 'Customer'}</p>
                      <p className="mt-1 line-clamp-1 text-xs text-white/45">{conversation.subject || 'Support request'}</p>
                    </div>
                    <StatusBadge status={conversation.status} />
                  </div>
                  <p className="mt-3 text-xs text-white/35">{conversation.source || 'website'} · {formatDate(conversation.last_message_at || conversation.created_at)}</p>
                </button>
              ))
            ) : (
              <p className="rounded-2xl border border-white/10 bg-white/[.025] p-5 text-sm text-white/50">Nog geen supportgesprekken.</p>
            )}
          </div>
        </div>

        <div className="card rounded-[2rem] p-5">
          {selected ? (
            <>
              <div className="flex flex-col gap-4 border-b border-white/10 pb-5 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <MessageCircle className="text-[#b7c8ad]" />
                    <h2 className="text-2xl font-black">{selected.subject || 'Support request'}</h2>
                  </div>
                  <p className="mt-2 text-sm text-white/50">{selected.customer_name || 'Customer'} · {selected.customer_email}</p>
                  <p className="mt-1 text-xs text-white/35">Chat #{selected.public_token.slice(0, 8)} · Laatste update {formatDate(selected.last_message_at || selected.updated_at || selected.created_at)}</p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <select
                    value={selected.status}
                    onChange={(event: ChangeEvent<HTMLSelectElement>) => updateStatus(event.target.value)}
                    disabled={busy === 'status' || busy === 'archive'}
                    className="rounded-full border border-white/10 bg-black/50 px-4 py-2 text-sm font-bold text-white"
                  >
                    <option value="open">Open</option>
                    <option value="pending">Pending</option>
                    <option value="answered">Answered</option>
                    <option value="closed">Closed</option>
                  </select>

                  {selected.status === 'closed' && selected.customer_email ? (
                    <button
                      type="button"
                      onClick={archiveConversation}
                      disabled={busy === 'archive'}
                      className="inline-flex items-center justify-center rounded-full border border-red-300/25 bg-red-500/10 px-4 py-2 text-sm font-black text-red-100 transition hover:bg-red-500/20 disabled:opacity-60"
                    >
                      {busy === 'archive' ? <Loader2 className="mr-2 animate-spin" size={15} /> : <Trash2 className="mr-2" size={15} />}
                      Mail kopie & archiveer
                    </button>
                  ) : null}
                </div>
              </div>

              {error && <div className="mt-4 rounded-2xl border border-red-300/20 bg-red-500/10 p-4 text-sm font-bold text-red-100">{error}</div>}

              <div className="mt-5 max-h-[520px] overflow-auto rounded-3xl border border-white/10 bg-black/25 p-4" aria-live="polite">
                {messages.length ? messages.map((message) => {
                  const customer = message.sender_type === 'customer'
                  const system = message.sender_type === 'system'
                  return (
                    <div key={message.id} className={`mb-4 flex ${system ? 'justify-center' : customer ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-6 ${system ? 'border border-white/10 bg-white/[.035] text-center text-white/42' : customer ? 'border border-white/10 bg-white/[.055] text-white/72' : 'bg-white text-black'}`}>
                        {!system && <p className={`mb-1 text-[10px] font-black uppercase tracking-[.18em] ${customer ? 'text-[#b7c8ad]' : 'text-black/45'}`}>{message.author_name || (customer ? 'Customer' : 'ASORTA Support')}</p>}
                        {message.body}
                        <p className={`mt-2 text-[10px] ${customer || system ? 'text-white/30' : 'text-black/35'}`}>{formatDate(message.created_at)}</p>
                      </div>
                    </div>
                  )
                }) : <div className="grid min-h-64 place-items-center text-sm text-white/45">Geen berichten gevonden.</div>}
                <div ref={scrollRef} />
              </div>

              {selectedClosed ? (
                <div className="mt-5 rounded-3xl border border-white/10 bg-white/[.035] p-5 text-sm leading-6 text-white/55">
                  Dit gesprek is gesloten. Gebruik “Mail kopie & archiveer” om de klant automatisch een transcript te sturen en het gesprek uit Atlas te archiveren.
                </div>
              ) : (
                <form onSubmit={sendReply} className="mt-5 grid gap-3">
                  <textarea
                    value={draft}
                    onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setDraft(event.target.value)}
                    className="support-input min-h-32 resize-none py-4"
                    placeholder="Typ antwoord als ASORTA Support..."
                  />
                  <button disabled={busy === 'reply'} className="btn-primary w-full">
                    {busy === 'reply' ? 'Versturen...' : 'Antwoord versturen'} <Send className="ml-2" size={17} />
                  </button>
                </form>
              )}
            </>
          ) : (
            <div className="grid min-h-96 place-items-center text-center text-white/50">
              <div>
                <ShieldCheck className="mx-auto mb-4 text-[#b7c8ad]" />
                <p>Selecteer een supportgesprek.</p>
              </div>
            </div>
          )}
        </div>

        <CustomerPortalPanel
          selectedConversation={selected ? {
            id: selected.id,
            customer_name: selected.customer_name,
            customer_email: selected.customer_email,
            subject: selected.subject,
          } : null}
          onSupportRefresh={manualRefresh}
        />
      </section>

      <button
        type="button"
        onClick={manualRefresh}
        className="mt-6 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[.2em] text-white/38 transition hover:text-white/70"
      >
        <RefreshCw size={14} /> Handmatig verversen
      </button>
    </main>
  )
}

function StatusBadge({ status }: { status: string }) {
  return <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[.14em] ${statusClass(status)}`}>{status || 'open'}</span>
}
