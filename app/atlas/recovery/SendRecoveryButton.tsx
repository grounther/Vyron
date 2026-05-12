'use client'

import { useState } from 'react'
import { Loader2, Mail } from 'lucide-react'

export default function SendRecoveryButton({ cartId, disabled }: { cartId: string; disabled?: boolean }) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function send() {
    setLoading(true)
    setMessage('')
    try {
      const response = await fetch('/api/recovery/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartId }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data?.error || 'Recovery mail mislukt.')
      setMessage(data.sent ? 'Mail verzonden.' : 'Dry-run opgeslagen.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Recovery mail mislukt.')
    } finally {
      setLoading(false)
    }
  }

  return <div>
    <button type="button" disabled={disabled || loading} onClick={send} className="inline-flex items-center rounded-full border border-[#b7c8ad]/25 bg-[#b7c8ad]/10 px-3 py-1.5 text-xs font-black text-[#dbe9d4] transition hover:bg-[#b7c8ad]/20 disabled:cursor-not-allowed disabled:opacity-40">
      {loading ? <Loader2 size={14} className="mr-2 animate-spin" /> : <Mail size={14} className="mr-2" />}
      Send recovery
    </button>
    {message && <p className="mt-1 max-w-[220px] text-xs text-white/45">{message}</p>}
  </div>
}
