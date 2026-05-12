'use client'

import { useState } from 'react'
import { MessageCircle, X } from 'lucide-react'
import SupportChat from '@/components/SupportChat'

export default function SupportWidget() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="support-float"
        aria-label="Open ASORTA support"
      >
        <MessageCircle size={22} />
        <span className="support-float-pulse" />
      </button>

      <div className={`support-overlay ${open ? 'support-overlay-open' : ''}`}>
        <button className="absolute inset-0 cursor-default" type="button" aria-label="Close support" onClick={() => setOpen(false)} />
        <aside className={`support-panel ${open ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          <div className="flex items-start justify-between gap-4 border-b border-white/10 p-5">
            <div>
              <p className="kicker">ASORTA Support</p>
              <h2 className="mt-1 text-2xl font-black">Hoe kunnen we helpen?</h2>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full border border-white/10 p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
              aria-label="Close support panel"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-5">
            <SupportChat source="support-widget" mode="widget" />
          </div>
        </aside>
      </div>
    </>
  )
}
