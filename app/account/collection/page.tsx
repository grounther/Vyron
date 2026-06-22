import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getTcgState } from '@/lib/tcg-game-server'
import { rarityLabel, rarityRank, tcgCardCatalog, tcgSeries, type TcgRarity, type TcgSeriesKey } from '@/lib/tcg-game'
import TcgCardArt from '@/components/TcgCardArt'
import TcgPackOpener from '@/components/TcgPackOpener'

export const metadata = { title: 'Mijn ASORTA collectie | ASORTA' }

type CollectionRow = {
  card_id: string
  variant: string
  quantity: number | string | null
}

const rarityOrder: TcgRarity[] = [
  'common',
  'uncommon',
  'rare',
  'reverse_holo',
  'holo',
  'full_art',
  'ultra_rare',
  'secret_rare',
  'gold_rare',
]

const rarityThemes: Record<TcgRarity, { chip: string; panel: string; title: string; glow: string }> = {
  common: {
    chip: 'border-white/15 bg-white/8 text-white/70',
    panel: 'border-white/10 bg-white/[.03]',
    title: 'text-white/92',
    glow: 'shadow-[0_0_0_rgba(255,255,255,0)]',
  },
  uncommon: {
    chip: 'border-emerald-300/30 bg-emerald-400/12 text-emerald-100',
    panel: 'border-emerald-300/18 bg-emerald-400/[.05]',
    title: 'text-emerald-100',
    glow: 'shadow-[0_0_28px_rgba(16,185,129,.08)]',
  },
  rare: {
    chip: 'border-sky-300/35 bg-sky-400/12 text-sky-100',
    panel: 'border-sky-300/20 bg-sky-400/[.05]',
    title: 'text-sky-100',
    glow: 'shadow-[0_0_30px_rgba(14,165,233,.10)]',
  },
  reverse_holo: {
    chip: 'border-fuchsia-300/40 bg-fuchsia-400/12 text-fuchsia-100',
    panel: 'border-fuchsia-300/22 bg-fuchsia-400/[.06]',
    title: 'text-fuchsia-100',
    glow: 'shadow-[0_0_36px_rgba(217,70,239,.12)]',
  },
  holo: {
    chip: 'border-blue-300/40 bg-blue-400/12 text-blue-100',
    panel: 'border-blue-300/22 bg-blue-400/[.06]',
    title: 'text-blue-100',
    glow: 'shadow-[0_0_38px_rgba(59,130,246,.12)]',
  },
  full_art: {
    chip: 'border-cyan-300/45 bg-cyan-400/14 text-cyan-50',
    panel: 'border-cyan-300/24 bg-cyan-400/[.07]',
    title: 'text-cyan-50',
    glow: 'shadow-[0_0_42px_rgba(6,182,212,.16)]',
  },
  ultra_rare: {
    chip: 'border-violet-300/45 bg-violet-400/14 text-violet-50',
    panel: 'border-violet-300/24 bg-violet-400/[.07]',
    title: 'text-violet-50',
    glow: 'shadow-[0_0_48px_rgba(139,92,246,.16)]',
  },
  secret_rare: {
    chip: 'border-yellow-200/55 bg-yellow-300/14 text-yellow-50',
    panel: 'border-yellow-200/24 bg-yellow-300/[.07]',
    title: 'text-yellow-50',
    glow: 'shadow-[0_0_54px_rgba(250,204,21,.18)]',
  },
  gold_rare: {
    chip: 'border-amber-200/70 bg-amber-300/16 text-amber-50',
    panel: 'border-amber-200/28 bg-amber-300/[.08]',
    title: 'text-amber-50',
    glow: 'shadow-[0_0_60px_rgba(251,191,36,.20)]',
  },
}

const seriesThemes: Record<TcgSeriesKey, { gradient: string; line: string; accent: string; pill: string }> = {
  'perfect-order': {
    gradient: 'from-[#0f0d07] via-[#17140c] to-[#090806]',
    line: 'from-[#e4c671]/70 via-[#f6e2a4]/35 to-transparent',
    accent: 'text-[#f1d279]',
    pill: 'border-[#f1d279]/25 bg-[#f1d279]/10 text-[#f7e8b2]',
  },
  'chaos-rising': {
    gradient: 'from-[#090d14] via-[#10192a] to-[#08070d]',
    line: 'from-sky-300/70 via-fuchsia-300/30 to-transparent',
    accent: 'text-sky-200',
    pill: 'border-sky-300/25 bg-sky-300/10 text-sky-100',
  },
}

export default async function AccountCollectionPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.email) redirect('/login?next=/account/collection')

  const admin = createAdminClient()
  let packCount = 0
  let collection: CollectionRow[] = []

  if (admin) {
    try {
      const state = await getTcgState(admin, user)
      packCount = state.availablePackCount
      collection = state.collection as CollectionRow[]
    } catch {
      packCount = 0
      collection = []
    }
  }

  const uniqueOwnedIds = new Set(collection.map((row) => row.card_id))
  const totalOwnedQuantity = collection.reduce((sum, row) => sum + Number(row.quantity || 0), 0)
  const totalUniqueOwned = uniqueOwnedIds.size
  const totalCards = tcgCardCatalog.length
  const masterProgress = Math.round((totalUniqueOwned / Math.max(totalCards, 1)) * 100)

  const ownedByRarity = new Map<TcgRarity, number>()
  const totalByRarity = new Map<TcgRarity, number>()
  const duplicateByRarity = new Map<TcgRarity, number>()

  for (const rarity of rarityOrder) {
    totalByRarity.set(rarity, tcgCardCatalog.filter((card) => card.rarity === rarity).length)
    ownedByRarity.set(
      rarity,
      tcgCardCatalog.filter((card) => card.rarity === rarity && uniqueOwnedIds.has(card.id)).length,
    )
    duplicateByRarity.set(
      rarity,
      collection
        .filter((row) => {
          const card = tcgCardCatalog.find((entry) => entry.id === row.card_id)
          return card?.rarity === rarity
        })
        .reduce((sum, row) => sum + Math.max(Number(row.quantity || 0) - 1, 0), 0),
    )
  }

  const chaseCollected = tcgCardCatalog.filter(
    (card) => ['full_art', 'ultra_rare', 'secret_rare', 'gold_rare'].includes(card.rarity) && uniqueOwnedIds.has(card.id),
  ).length
  const chaseTotal = tcgCardCatalog.filter((card) => ['full_art', 'ultra_rare', 'secret_rare', 'gold_rare'].includes(card.rarity)).length

  return (
    <main className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-0 top-0 h-[32rem] w-[32rem] rounded-full bg-[#8b6b1d]/12 blur-3xl" />
        <div className="absolute right-[-8rem] top-[12rem] h-[30rem] w-[30rem] rounded-full bg-sky-500/10 blur-3xl" />
        <div className="absolute inset-x-0 top-[28rem] h-px bg-gradient-to-r from-transparent via-[#caa553]/20 to-transparent" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16">
        <section className="relative overflow-hidden rounded-[2.25rem] border border-[#d6b86a]/20 bg-[radial-gradient(circle_at_top,rgba(250,220,125,.10),transparent_28%),linear-gradient(180deg,#060606,#0c0b09_48%,#050505)] p-6 shadow-[0_30px_120px_rgba(0,0,0,.42)] md:p-10">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent,rgba(255,255,255,.02),transparent)]" />
          <div className="relative flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-3xl">
              <p className="text-xs font-black uppercase tracking-[.4em] text-[#f1d279]">ASORTA TCG · Perfect Order Collection Guide</p>
              <h1 className="mt-4 text-4xl font-black tracking-[-0.04em] text-white sm:text-5xl md:text-7xl">Mijn verzameling</h1>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-white/68 md:text-base">
                Je collectiepagina is nu opgezet als een luxe ASORTA TCG guide: donkere premium panelen, rarity-glows en set-progressie voor
                <span className="font-black text-[#f3d88c]"> Perfect Order</span> en <span className="font-black text-sky-200">Chaos Rising</span>.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="#pack-opener" className="rounded-full border border-[#f1d279]/25 bg-[#f1d279]/10 px-5 py-3 text-sm font-black text-[#f6e8b6] transition hover:bg-[#f1d279]/18">Open pakjes</Link>
              <Link href="/account" className="rounded-full border border-white/10 px-5 py-3 text-sm font-black text-white/72 transition hover:bg-white/8 hover:text-white">Terug naar account</Link>
            </div>
          </div>

          <div className="relative mt-8 grid gap-4 md:grid-cols-4">
            <HeroStat label="Master set progress" value={`${totalUniqueOwned}/${totalCards}`} sub={`${masterProgress}% compleet`} accent="text-[#f3d88c]" />
            <HeroStat label="Beschikbare pakjes" value={String(packCount)} sub="Klaar om te openen" accent="text-cyan-200" />
            <HeroStat label="Totaal kaarten" value={String(totalOwnedQuantity)} sub="Inclusief doubles" accent="text-violet-200" />
            <HeroStat label="Chase cards" value={`${chaseCollected}/${chaseTotal}`} sub="Full Art t/m Gold Rare" accent="text-amber-100" />
          </div>

          <div className="relative mt-7 overflow-hidden rounded-[1.5rem] border border-white/10 bg-black/25 p-4 md:p-5">
            <div className="mb-3 flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[.28em] text-white/42">Master completion</p>
                <p className="mt-1 text-sm text-white/62">Werk naar de volledige 240-kaarten collectie toe.</p>
              </div>
              <p className="text-xl font-black text-[#f3d88c]">{masterProgress}%</p>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-white/8">
              <div className="h-full rounded-full bg-[linear-gradient(90deg,#d4af54,#f6df9a,#7dd3fc)]" style={{ width: `${masterProgress}%` }} />
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
          <div className="rounded-[2rem] border border-[#d6b86a]/16 bg-[linear-gradient(180deg,rgba(255,255,255,.05),rgba(255,255,255,.02))] p-5 shadow-[0_24px_90px_rgba(0,0,0,.28)] md:p-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[.28em] text-[#f1d279]">Rarity progression</p>
                <h2 className="mt-2 text-2xl font-black text-white md:text-3xl">Rarity style overzicht</h2>
              </div>
              <p className="max-w-xl text-sm leading-6 text-white/55">Elke zeldzaamheid heeft een eigen look, glow en chase-gevoel. Zo sluit de collectiepagina aan op de Perfect Order guide.</p>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {rarityOrder.map((rarity) => {
                const theme = rarityThemes[rarity]
                const owned = ownedByRarity.get(rarity) || 0
                const total = totalByRarity.get(rarity) || 0
                const duplicateCount = duplicateByRarity.get(rarity) || 0
                const pct = Math.round((owned / Math.max(total, 1)) * 100)
                return (
                  <div key={rarity} className={`rounded-[1.4rem] border p-4 ${theme.panel} ${theme.glow}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[.2em] ${theme.chip}`}>
                          {rarityLabel(rarity)}
                        </span>
                        <p className={`mt-3 text-lg font-black ${theme.title}`}>{owned}/{total}</p>
                      </div>
                      <p className="text-xs font-black uppercase tracking-[.2em] text-white/35">{pct}%</p>
                    </div>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/8">
                      <div className="h-full rounded-full bg-[linear-gradient(90deg,rgba(255,255,255,.5),rgba(255,255,255,.95))]" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="mt-3 text-xs text-white/48">Doubles: x{duplicateCount}</p>
                  </div>
                )
              })}
            </div>
          </div>

          <div id="pack-opener" className="rounded-[2rem] border border-cyan-300/14 bg-[radial-gradient(circle_at_top,rgba(34,211,238,.08),transparent_32%),linear-gradient(180deg,rgba(255,255,255,.05),rgba(255,255,255,.02))] p-5 shadow-[0_24px_90px_rgba(0,0,0,.28)] md:p-6">
            <div className="mb-5 flex items-end justify-between gap-3">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[.28em] text-cyan-200">Pack opener</p>
                <h2 className="mt-2 text-2xl font-black text-white md:text-3xl">Open je beloningspakjes</h2>
              </div>
              <div className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-[.22em] text-cyan-100">{packCount} beschikbaar</div>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-black/22 p-4">
              <TcgPackOpener initialPackCount={packCount} compact />
            </div>
          </div>
        </section>

        <section className="mt-10 space-y-8">
          {tcgSeries.map((series) => {
            const seriesTheme = seriesThemes[series.key]
            const cards = tcgCardCatalog
              .filter((card) => card.series === series.key)
              .sort((a, b) => rarityRank(b.rarity) - rarityRank(a.rarity) || a.number.localeCompare(b.number))
            const ownedInSeries = cards.filter((card) => uniqueOwnedIds.has(card.id)).length
            const ownedQuantityInSeries = collection
              .filter((row) => cards.some((card) => card.id === row.card_id))
              .reduce((sum, row) => sum + Number(row.quantity || 0), 0)
            const pct = Math.round((ownedInSeries / Math.max(cards.length, 1)) * 100)

            return (
              <section key={series.key} className={`overflow-hidden rounded-[2.1rem] border border-white/10 bg-gradient-to-br ${seriesTheme.gradient} p-5 shadow-[0_30px_110px_rgba(0,0,0,.36)] md:p-6`}>
                <div className="flex flex-wrap items-start justify-between gap-6">
                  <div className="max-w-3xl">
                    <div className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[.3em] ${seriesTheme.pill}`}>
                      {series.name}
                    </div>
                    <h2 className="mt-4 text-3xl font-black tracking-[-0.03em] text-white md:text-4xl">{ownedInSeries}/{cards.length} verzameld</h2>
                    <p className="mt-3 max-w-2xl text-sm leading-7 text-white/60">{series.description}</p>
                  </div>
                  <div className="grid min-w-[240px] gap-3 sm:grid-cols-3">
                    <SeriesMiniStat label="Progress" value={`${pct}%`} />
                    <SeriesMiniStat label="Unieke kaarten" value={`${ownedInSeries}`} />
                    <SeriesMiniStat label="Totaal copies" value={`${ownedQuantityInSeries}`} />
                  </div>
                </div>

                <div className="mt-6 h-3 overflow-hidden rounded-full bg-white/8">
                  <div className={`h-full rounded-full bg-gradient-to-r ${seriesTheme.line}`} style={{ width: `${pct}%` }} />
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                  {cards.map((card) => {
                    const variants = collection.filter((row) => row.card_id === card.id)
                    const isOwned = variants.length > 0
                    const qty = variants.reduce((sum, row) => sum + Number(row.quantity || 0), 0)
                    const rarityTheme = rarityThemes[card.rarity]
                    return (
                      <article
                        key={card.id}
                        className={`group relative overflow-hidden rounded-[1.6rem] border p-3 transition duration-200 ${
                          isOwned
                            ? `${rarityTheme.panel} ${rarityTheme.glow} hover:-translate-y-1 hover:border-white/18`
                            : 'border-white/7 bg-black/28 opacity-65'
                        }`}
                      >
                        <div className="absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
                        <TcgCardArt card={card} compact hideMeta={!isOwned} />
                        <div className="mt-3 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[.18em] ${rarityTheme.chip}`}>
                              {rarityLabel(card.rarity)}
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-[.2em] text-white/38">{card.number}</span>
                          </div>
                          <div className="flex items-center justify-between gap-2 text-xs">
                            <span className="font-semibold text-white/62">{card.type}</span>
                            <span className={`font-black ${isOwned ? 'text-white' : 'text-white/45'}`}>{isOwned ? `x${qty}` : 'Missing'}</span>
                          </div>
                          <p className="line-clamp-2 text-[11px] leading-5 text-white/46">{isOwned ? card.flavor : 'Nog niet in je collectie. Trek deze kaart uit een ASORTA pakje om hem vrij te spelen.'}</p>
                        </div>
                      </article>
                    )
                  })}
                </div>
              </section>
            )
          })}
        </section>
      </div>
    </main>
  )
}

function HeroStat({ label, value, sub, accent }: { label: string; value: string; sub: string; accent: string }) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-black/22 p-4 md:p-5">
      <p className="text-[11px] font-black uppercase tracking-[.24em] text-white/40">{label}</p>
      <p className={`mt-2 text-3xl font-black ${accent}`}>{value}</p>
      <p className="mt-1 text-xs text-white/52">{sub}</p>
    </div>
  )
}

function SeriesMiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.1rem] border border-white/10 bg-black/20 p-3">
      <p className="text-[10px] font-black uppercase tracking-[.22em] text-white/38">{label}</p>
      <p className="mt-2 text-xl font-black text-white">{value}</p>
    </div>
  )
}
