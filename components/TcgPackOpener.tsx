'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, Sparkles, X } from 'lucide-react'
import { cardVisualClass, rarityLabel, tcgSeries, type TcgCard, type TcgSeriesKey } from '@/lib/tcg-game'

type PulledCard = TcgCard & { packSlot?: number; pullId?: string }

type TcgPackOpenerProps = {
  initialPackCount: number
  compact?: boolean
  autoOpen?: boolean
}

type Stage = 'idle' | 'choose' | 'tear' | 'opening' | 'reveal' | 'done'


export default function TcgPackOpener({ initialPackCount, compact = false, autoOpen = false }: TcgPackOpenerProps) {
  const [packCount, setPackCount] = useState(initialPackCount)
  const [stage, setStage] = useState<Stage>(autoOpen && initialPackCount > 0 ? 'choose' : 'idle')
  const [selectedSeries, setSelectedSeries] = useState<TcgSeriesKey | null>(null)
  const [cards, setCards] = useState<PulledCard[]>([])
  const [revealed, setRevealed] = useState(0)
  const [dragStart, setDragStart] = useState<number | null>(null)
  const [dragProgress, setDragProgress] = useState(0)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const currentSeries = useMemo(() => tcgSeries.find((series) => series.key === selectedSeries), [selectedSeries])
  const currentCard = cards[revealed]

  function reset() {
    setStage('idle')
    setSelectedSeries(null)
    setCards([])
    setRevealed(0)
    setDragStart(null)
    setDragProgress(0)
    setError('')
    setLoading(false)
  }

  function chooseSeries(seriesKey: TcgSeriesKey) {
    setSelectedSeries(seriesKey)
    setStage('tear')
    setError('')
  }

  async function openPack() {
    if (!selectedSeries || loading) return
    setLoading(true)
    setStage('opening')
    setError('')

    const response = await fetch('/api/account/tcg/open-pack', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seriesKey: selectedSeries }),
    })

    const data = await response.json().catch(() => ({}))
    setLoading(false)

    if (!response.ok || !data?.ok) {
      setError(data?.error || 'Pakje openen is mislukt.')
      setStage('tear')
      return
    }

    setCards(data.cards || [])
    setRevealed(0)
    setPackCount((count) => Math.max(0, count - 1))
    setTimeout(() => setStage('reveal'), 500)
  }

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    setDragStart(e.clientX)
    setDragProgress(0)
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (dragStart == null) return
    const distance = Math.abs(e.clientX - dragStart)
    setDragProgress(Math.min(100, Math.round(distance / 1.5)))
  }

  function onPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (dragStart == null) return
    const distance = Math.abs(e.clientX - dragStart)
    setDragStart(null)
    if (distance > 120) openPack()
    else setDragProgress(0)
  }

  function revealNext() {
    if (revealed < cards.length - 1) {
      setRevealed((value) => value + 1)
    } else {
      setRevealed(cards.length)
      setStage('done')
    }
  }

  if (compact && packCount <= 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[.03] p-4 text-sm text-white/55">
        Nog geen virtueel pakje beschikbaar. Plaats een bestelling met je account om er één te verdienen.
      </div>
    )
  }

  return (
    <>
      {stage === 'idle' ? (
        <div className="rounded-[1.7rem] border border-[#f6d36c]/20 bg-[#f6d36c]/10 p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[.25em] text-[#f6d36c]">ASORTA Collectiegame</p>
              <h3 className="mt-2 text-2xl font-black">Virtuele pakjes</h3>
              <p className="mt-2 text-sm leading-6 text-white/60">
                Je hebt <strong className="text-white">{packCount}</strong> pakje{packCount === 1 ? '' : 's'} klaarstaan. Open Perfect Order of Chaos Rising en bouw je digitale verzameling.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button disabled={packCount <= 0} onClick={() => setStage('choose')} className="btn-primary disabled:cursor-not-allowed disabled:opacity-40">
                Pakje openen <Sparkles className="ml-2" size={18} />
              </button>
              <Link href="/account/collection" className="rounded-full border border-white/10 px-5 py-3 text-sm font-black text-white/65 hover:bg-white/10 hover:text-white">Mijn collectie</Link>
            </div>
          </div>
        </div>
      ) : null}

      {stage !== 'idle' ? (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-black/80 px-4 py-6 backdrop-blur-xl">
          <div className="relative max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-[2rem] border border-white/10 bg-[#080a0c] p-5 shadow-[0_40px_140px_rgba(0,0,0,.65)] sm:p-7">
            <button onClick={reset} className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/[.04] text-white/60 hover:bg-white/10 hover:text-white"><X size={18} /></button>

            {stage === 'choose' ? (
              <div>
                <p className="kicker">Kies je virtuele pakje</p>
                <h2 className="mt-3 text-4xl font-black md:text-6xl">Perfect Order of Chaos Rising?</h2>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-white/60">Je krijgt één pakje per aankoop. Kies één serie; het andere pakje verdwijnt. Daarna scheur je het gekozen pakje open.</p>
                <div className="mt-8 grid gap-4 md:grid-cols-2">
                  {tcgSeries.map((series) => (
                    <button key={series.key} onClick={() => chooseSeries(series.key)} className={`group relative min-h-[330px] overflow-hidden rounded-[2rem] border p-6 text-left transition hover:-translate-y-1 ${series.key === 'perfect-order' ? 'border-amber-200/25 bg-[radial-gradient(circle_at_30%_20%,rgba(246,211,108,.25),transparent_42%),linear-gradient(180deg,rgba(255,255,255,.06),rgba(0,0,0,.2))]' : 'border-sky-200/25 bg-[radial-gradient(circle_at_70%_20%,rgba(96,165,250,.25),transparent_42%),linear-gradient(180deg,rgba(255,255,255,.06),rgba(0,0,0,.2))]'}`}>
                      <div className="absolute inset-x-8 top-8 h-24 rounded-full bg-white/10 blur-3xl transition group-hover:bg-white/20" />
                      <div className="relative z-10 flex h-full flex-col justify-between">
                        <div>
                          <p className="text-xs font-black uppercase tracking-[.32em] text-white/45">ASORTA Pack</p>
                          <h3 className="mt-5 text-4xl font-black text-white">{series.name}</h3>
                          <p className="mt-3 text-sm leading-6 text-white/60">{series.description}</p>
                        </div>
                        <div className="mt-8 inline-flex w-fit items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black text-black">Kies dit pakje <ArrowRight size={17} /></div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {stage === 'tear' && currentSeries ? (
              <div className="grid gap-7 lg:grid-cols-[.85fr_1.15fr] lg:items-center">
                <div>
                  <p className="kicker">Scheur het pakje open</p>
                  <h2 className="mt-3 text-4xl font-black md:text-5xl">{currentSeries.name}</h2>
                  <p className="mt-4 text-sm leading-7 text-white/60">Sleep met je muis of vinger over de bovenkant van het pakje. Links naar rechts of rechts naar links werkt allebei.</p>
                  {error ? <p className="mt-4 rounded-2xl border border-red-400/25 bg-red-500/10 p-4 text-sm text-red-100">{error}</p> : null}
                </div>

                <div
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerCancel={() => setDragStart(null)}
                  className={`relative mx-auto h-[430px] w-full max-w-[340px] touch-none select-none overflow-hidden rounded-[2rem] border p-6 shadow-[0_40px_110px_rgba(0,0,0,.55)] ${selectedSeries === 'perfect-order' ? 'border-amber-200/35 bg-[linear-gradient(135deg,#2a1d07,#0c0c0c_55%,#705c22)]' : 'border-sky-200/35 bg-[linear-gradient(135deg,#06172a,#0c0c0c_55%,#12385f)]'}`}
                >
                  <div className="absolute inset-x-0 top-0 h-16 bg-white/10" />
                  <div className="absolute left-0 top-14 h-2 bg-white transition-all" style={{ width: `${dragProgress}%` }} />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(255,255,255,.14),transparent_35%)]" />
                  <div className="relative z-10 flex h-full flex-col justify-between">
                    <div>
                      <p className="text-center text-xs font-black uppercase tracking-[.35em] text-white/50">Virtual Booster</p>
                      <h3 className="mt-10 text-center text-5xl font-black leading-none text-white">{currentSeries.name}</h3>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-center text-xs font-black uppercase tracking-[.22em] text-white/65">Drag over de bovenkant</div>
                  </div>
                </div>
              </div>
            ) : null}

            {stage === 'opening' ? (
              <div className="grid min-h-[460px] place-items-center text-center">
                <div>
                  <div className="mx-auto h-24 w-24 animate-pulse rounded-full border border-[#f6d36c]/30 bg-[#f6d36c]/10 shadow-[0_0_80px_rgba(246,211,108,.25)]" />
                  <h2 className="mt-8 text-4xl font-black">Pakje wordt geopend...</h2>
                  <p className="mt-3 text-white/55">De kaarten worden geschud en toegevoegd aan je collectie.</p>
                </div>
              </div>
            ) : null}

            {stage === 'reveal' && currentCard ? (
              <div className="grid gap-7 lg:grid-cols-[.8fr_1.2fr] lg:items-center">
                <div>
                  <p className="kicker">Kaart {Math.min(revealed + 1, cards.length)} van {cards.length}</p>
                  <h2 className="mt-3 text-4xl font-black md:text-5xl">Klik om te onthullen</h2>
                  <p className="mt-4 text-sm leading-7 text-white/60">Elke kaart wordt automatisch aan je verzameling toegevoegd. Dubbelen tellen mee als extra exemplaar.</p>
                </div>

                <button onClick={revealNext} className="relative mx-auto h-[460px] w-full max-w-[330px]">
                  {cards.slice(revealed, revealed + 5).map((card, stackIndex) => (
                    <div key={`${card.pullId}-${stackIndex}`} className="absolute inset-0 rounded-[1.7rem] border border-white/10 bg-[linear-gradient(135deg,#20252c,#050505)] p-4 shadow-[0_24px_70px_rgba(0,0,0,.45)] transition" style={{ transform: `translate(${stackIndex * 8}px, ${stackIndex * 8}px) rotate(${stackIndex * 1.5}deg)`, opacity: 1 - stackIndex * 0.12 }}>
                      {stackIndex === 0 ? (
                        <div className="flex h-full flex-col items-center justify-center rounded-[1.2rem] border border-white/10 bg-[radial-gradient(circle_at_50%_40%,rgba(246,211,108,.22),transparent_35%),linear-gradient(180deg,rgba(255,255,255,.06),rgba(255,255,255,.02))]">
                          <p className="text-xs font-black uppercase tracking-[.35em] text-white/45">ASORTA</p>
                          <div className="my-8 h-28 w-28 rounded-full border border-white/15 bg-black/30 shadow-[0_0_70px_rgba(246,211,108,.18)]" />
                          <p className="text-sm font-black uppercase tracking-[.25em] text-white/55">Card Back</p>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </button>
              </div>
            ) : null}

            {stage === 'done' ? (
              <div>
                <div className="text-center">
                  <CheckCircle2 className="mx-auto text-emerald-300" size={54} />
                  <p className="kicker mt-5">Toegevoegd aan je collectie</p>
                  <h2 className="mt-3 text-4xl font-black md:text-6xl">Je pulls</h2>
                </div>
                <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  {cards.map((card) => (
                    <div key={card.pullId || `${card.id}-${card.packSlot}`} className={`rounded-[1.35rem] border bg-gradient-to-br p-3 ${cardVisualClass(card)}`}>
                      <div className="grid aspect-[.72] place-items-center rounded-2xl border border-white/10 bg-black/35 p-3 text-center">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[.18em] text-white/45">{card.number}</p>
                          <h3 className="mt-3 text-lg font-black leading-tight">{card.name}</h3>
                          <p className="mt-2 text-xs text-white/45">{card.type}</p>
                          <p className="mt-4 rounded-full border border-white/10 bg-white/[.05] px-3 py-1 text-[10px] font-black uppercase tracking-[.16em] text-white/70">{rarityLabel(card.rarity)}</p>
                          <p className="mt-2 text-[10px] leading-4 text-white/38">{card.artStyle}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-8 flex flex-wrap justify-center gap-3">
                  {packCount > 0 ? <button className="btn-primary" onClick={() => setStage('choose')}>Nog een pakje openen</button> : null}
                  <Link href="/account/collection" className="rounded-full border border-white/10 px-5 py-3 text-sm font-black text-white/65 hover:bg-white/10 hover:text-white">Bekijk collectie</Link>
                  <button className="rounded-full border border-white/10 px-5 py-3 text-sm font-black text-white/65 hover:bg-white/10 hover:text-white" onClick={reset}>Sluiten</button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  )
}
