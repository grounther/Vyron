'use client'

import { Info } from 'lucide-react'
import { useState } from 'react'

export default function InfoTip({ text, label = 'Meer informatie' }: { text: string; label?: string }) {
  const [open, setOpen] = useState(false)
  return <span className="group relative inline-flex shrink-0" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
    <button type="button" aria-label={label} aria-expanded={open} onClick={() => setOpen((value) => !value)} onBlur={() => setOpen(false)} className="grid h-7 w-7 place-items-center rounded-full border border-white/12 text-white/42 transition hover:border-[#b8ff5a]/45 hover:text-[#b8ff5a] focus:border-[#b8ff5a]/55 focus:text-[#b8ff5a] focus:outline-none">
      <Info size={15} aria-hidden="true" />
    </button>
    <span role="tooltip" className={`${open ? 'block' : 'hidden'} absolute right-0 top-9 z-40 w-64 rounded-xl border border-white/12 bg-[#111820] p-3 text-left text-xs font-medium leading-5 text-white/72 shadow-2xl sm:group-hover:block`}>
      {text}
    </span>
  </span>
}
