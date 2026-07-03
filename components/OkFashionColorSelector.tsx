'use client'

import { useMemo, useState } from 'react'
import type { OkFashionColor } from '@/lib/ok-fashion'

type Props = {
  image: string
  name: string
  colors: OkFashionColor[]
  defaultColor?: string
  logoText?: string
}

function isDark(hex: string) {
  const clean = hex.replace('#', '')
  const value = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean
  const r = parseInt(value.slice(0, 2), 16)
  const g = parseInt(value.slice(2, 4), 16)
  const b = parseInt(value.slice(4, 6), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 < 95
}

export default function OkFashionColorSelector({ image, name, colors, defaultColor, logoText }: Props) {
  const initial = useMemo(() => colors.find((color) => color.name === defaultColor) || colors[0], [colors, defaultColor])
  const [selected, setSelected] = useState(initial)
  const dark = isDark(selected.hex)

  return (
    <div className="w-full max-w-md overflow-hidden rounded-[2rem] border border-[#1f1712]/10 bg-[#fcf8f1]/72 shadow-[0_24px_90px_rgba(95,73,48,.14)] backdrop-blur">
      <div className="relative aspect-[4/5] overflow-hidden bg-[#f3eadf]">
        <div
          className="absolute inset-0 bg-center bg-cover"
          style={{
            backgroundColor: selected.hex,
            WebkitMaskImage: `url(${image})`,
            maskImage: `url(${image})`,
            WebkitMaskRepeat: 'no-repeat',
            maskRepeat: 'no-repeat',
            WebkitMaskSize: 'cover',
            maskSize: 'cover',
            WebkitMaskPosition: 'center',
            maskPosition: 'center',
          }}
        />
        <img
          src={image}
          alt={`${name} in ${selected.name}`}
          className="absolute inset-0 h-full w-full object-cover opacity-45 mix-blend-multiply grayscale"
        />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,.25),transparent_34%),linear-gradient(180deg,rgba(255,255,255,.06),rgba(0,0,0,.05))]" />
        <div className={`absolute bottom-4 left-4 rounded-full px-4 py-2 text-xs font-black uppercase tracking-[.18em] shadow-sm ${dark ? 'bg-[#f7f2e9]/88 text-[#1f1712]' : 'bg-[#1f1712]/82 text-[#f7f2e9]'}`}>
          {selected.name}
        </div>
      </div>
      <div className="border-t border-[#1f1712]/10 bg-[#f7f2e9] p-4">
        <p className="text-[11px] font-black uppercase tracking-[.26em] text-[#7a6248]">Kies kleur</p>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {colors.map((color) => {
            const active = color.name === selected.name
            return (
              <button
                key={color.name}
                type="button"
                onClick={() => setSelected(color)}
                className={`flex items-center gap-2 rounded-full border px-3 py-2 text-left text-xs font-black transition ${active ? 'border-[#1f1712] bg-[#1f1712] text-[#f7f2e9]' : 'border-[#1f1712]/10 bg-[#fcf8f1] text-[#4b3d31]/72 hover:border-[#1f1712]/25'}`}
                aria-pressed={active}
              >
                <span style={{ backgroundColor: color.hex }} className="h-5 w-5 shrink-0 rounded-full border border-black/12 shadow-inner" />
                {color.name}
              </button>
            )
          })}
        </div>
        {logoText && <p className="mt-4 text-sm leading-6 text-[#4b3d31]/70">{logoText}</p>}
      </div>
    </div>
  )
}
