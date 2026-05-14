'use client'

import { useState } from 'react'
import { RefreshCw } from 'lucide-react'

type SyncResult = {
  imported: number
  updated: number
  mapped: number
  slugs: string[]
}

export default function ShopifySyncButton() {
  const [state, setState] = useState<'idle' | 'syncing' | 'done' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [limit, setLimit] = useState(50)

  async function sync() {
    setState('syncing')
    setMessage('')
    const response = await fetch('/api/admin/shopify/sync-products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ limit }),
    })
    const body = (await response.json().catch(() => ({}))) as SyncResult & { error?: string }
    if (!response.ok) {
      setState('error')
      setMessage(body.error || 'Shopify sync failed.')
      return
    }
    setState('done')
    setMessage(`Shopify sync klaar: ${body.imported} producten bijgewerkt, ${body.mapped} supplier mappings aangemaakt.`)
  }

  return (
    <div className="rounded-[1.6rem] border border-white/10 bg-white/[.035] p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <label className="grid gap-2 text-sm text-white/60">
          <span className="text-xs font-black uppercase tracking-[.22em] text-white/35">Product limit</span>
          <input
            value={limit}
            onChange={(event) => setLimit(Number(event.target.value || 50))}
            type="number"
            min={1}
            max={200}
            className="w-40 rounded-2xl border border-white/10 bg-black/50 px-4 py-3 font-black text-white outline-none focus:border-[#b7c8ad]"
          />
        </label>
        <button onClick={sync} disabled={state === 'syncing'} className="btn-primary min-w-56 disabled:cursor-not-allowed disabled:opacity-60">
          {state === 'syncing' ? <RefreshCw size={18} className="mr-2 animate-spin" /> : <RefreshCw size={18} className="mr-2" />}
          Sync Shopify
        </button>
      </div>
      {message && <p className={`mt-4 rounded-2xl border p-4 text-sm ${state === 'error' ? 'border-red-400/25 bg-red-400/10 text-red-100' : 'border-emerald-400/25 bg-emerald-400/10 text-emerald-100'}`}>{message}</p>}
    </div>
  )
}
