'use client'

import { useState } from 'react'
import { Send, Loader2 } from 'lucide-react'

export default function SendCampaignButton({ campaignId, disabled }: { campaignId: string; disabled?: boolean }) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function send() {
    if (!confirm('Weet je zeker dat je deze campagne nu wilt versturen?')) return
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/newsletter/send-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data?.error || 'Versturen mislukt.')
      setMessage(`Verzonden naar ${data.count} inschrijvers.`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Versturen mislukt.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button disabled={disabled || loading} onClick={send} type="button" className="inline-flex items-center rounded-full border border-[#b7c8ad]/25 bg-[#b7c8ad]/10 px-4 py-2 text-sm font-black text-[#dbe9d4] transition hover:bg-[#b7c8ad]/20 disabled:cursor-not-allowed disabled:opacity-50">
        {loading ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Send size={16} className="mr-2" />}
        Send campaign
      </button>
      {message && <p className="mt-2 text-xs text-white/50">{message}</p>}
    </div>
  )
}
