import { rarityLabel, type TcgCard, type TcgRarity, type TcgSeriesKey } from '@/lib/tcg-game'

type TcgCardArtProps = {
  card: Pick<TcgCard, 'id' | 'number' | 'series' | 'seriesName' | 'name' | 'type' | 'rarity' | 'flavor'>
  className?: string
  compact?: boolean
  hideMeta?: boolean
}

type Palette = {
  ink: string
  base: string
  mid: string
  glow: string
  line: string
  foil: string
  accent: string
}

const typePalettes: Record<string, Palette> = {
  Flame: { ink: '#fff7ed', base: '#2c0707', mid: '#ef4444', glow: '#f97316', line: '#fed7aa', foil: '#fde68a', accent: '#fb7185' },
  Aqua: { ink: '#eff6ff', base: '#071a2c', mid: '#38bdf8', glow: '#0ea5e9', line: '#bfdbfe', foil: '#a7f3d0', accent: '#67e8f9' },
  Terra: { ink: '#f7fee7', base: '#10210b', mid: '#84cc16', glow: '#65a30d', line: '#d9f99d', foil: '#fef08a', accent: '#a3e635' },
  Volt: { ink: '#fefce8', base: '#2a2105', mid: '#facc15', glow: '#eab308', line: '#fef3c7', foil: '#fde047', accent: '#fbbf24' },
  Frost: { ink: '#f8fafc', base: '#091827', mid: '#93c5fd', glow: '#60a5fa', line: '#dbeafe', foil: '#cffafe', accent: '#bae6fd' },
  Shadow: { ink: '#faf5ff', base: '#11071c', mid: '#a855f7', glow: '#7e22ce', line: '#e9d5ff', foil: '#f0abfc', accent: '#c084fc' },
  Light: { ink: '#fffbeb', base: '#211805', mid: '#f6d36c', glow: '#f59e0b', line: '#fff7ed', foil: '#fff3b0', accent: '#fde68a' },
  Arcane: { ink: '#fdf4ff', base: '#1b0b2c', mid: '#d946ef', glow: '#8b5cf6', line: '#f5d0fe', foil: '#ddd6fe', accent: '#f0abfc' },
  Beast: { ink: '#fff7ed', base: '#251207', mid: '#fb923c', glow: '#ea580c', line: '#fed7aa', foil: '#fdba74', accent: '#f97316' },
  Dragon: { ink: '#f0fdf4', base: '#071c14', mid: '#10b981', glow: '#14b8a6', line: '#bbf7d0', foil: '#a7f3d0', accent: '#5eead4' },
  Metal: { ink: '#f8fafc', base: '#111827', mid: '#94a3b8', glow: '#64748b', line: '#e2e8f0', foil: '#cbd5e1', accent: '#f8fafc' },
  Wind: { ink: '#f0f9ff', base: '#07151f', mid: '#7dd3fc', glow: '#38bdf8', line: '#e0f2fe', foil: '#bae6fd', accent: '#a5f3fc' },
}

const rarityFrames: Record<TcgRarity, { border: string; shine: string; badge: string; label: string }> = {
  common: { border: 'rgba(255,255,255,.16)', shine: 'rgba(255,255,255,.10)', badge: 'rgba(255,255,255,.10)', label: 'C' },
  uncommon: { border: 'rgba(110,231,183,.56)', shine: 'rgba(110,231,183,.20)', badge: 'rgba(16,185,129,.20)', label: 'U' },
  rare: { border: 'rgba(125,211,252,.66)', shine: 'rgba(125,211,252,.24)', badge: 'rgba(14,165,233,.22)', label: 'R' },
  reverse_holo: { border: 'rgba(240,171,252,.76)', shine: 'rgba(217,70,239,.32)', badge: 'rgba(217,70,239,.20)', label: 'RH' },
  holo: { border: 'rgba(253,230,138,.82)', shine: 'rgba(251,191,36,.34)', badge: 'rgba(251,191,36,.20)', label: 'H' },
  full_art: { border: 'rgba(196,181,253,.88)', shine: 'rgba(167,139,250,.42)', badge: 'rgba(139,92,246,.24)', label: 'FA' },
  ultra_rare: { border: 'rgba(207,250,254,.92)', shine: 'rgba(34,211,238,.45)', badge: 'rgba(6,182,212,.25)', label: 'UR' },
  secret_rare: { border: 'rgba(254,240,138,.96)', shine: 'rgba(250,204,21,.55)', badge: 'rgba(234,179,8,.26)', label: 'SR' },
  gold_rare: { border: '#fde68a', shine: 'rgba(251,191,36,.68)', badge: 'rgba(251,191,36,.30)', label: 'GR' },
}

const typeGlyphs: Record<string, string> = {
  Flame: 'M50 18 C67 35 72 49 65 63 C59 76 41 80 33 66 C26 53 35 42 43 31 C46 27 48 22 50 18 Z',
  Aqua: 'M50 15 C65 35 73 48 68 62 C63 76 47 83 35 74 C24 66 26 50 38 35 C43 28 47 21 50 15 Z',
  Terra: 'M24 59 C27 35 45 22 72 25 C73 52 58 72 32 76 C35 66 44 59 59 54 C45 52 34 54 24 59 Z',
  Volt: 'M55 13 L31 53 L48 51 L42 87 L70 43 L52 45 Z',
  Frost: 'M50 15 L57 39 L81 32 L64 50 L81 68 L57 61 L50 85 L43 61 L19 68 L36 50 L19 32 L43 39 Z',
  Shadow: 'M50 18 C72 23 82 46 68 64 C58 77 36 78 27 61 C46 64 61 50 55 32 C51 41 40 46 30 43 C35 29 41 21 50 18 Z',
  Light: 'M50 14 L60 39 L86 50 L60 61 L50 86 L40 61 L14 50 L40 39 Z',
  Arcane: 'M50 16 C72 18 83 37 75 57 C68 77 43 84 27 70 C47 67 64 48 56 28 C45 40 35 44 24 41 C29 26 38 17 50 16 Z',
  Beast: 'M25 64 L33 32 L49 47 L67 28 L76 65 L61 77 L49 68 L36 78 Z',
  Dragon: 'M25 63 C28 35 49 20 73 27 C58 33 54 44 65 54 C50 51 40 58 36 75 C31 73 27 69 25 63 Z',
  Metal: 'M50 17 L76 32 L76 68 L50 83 L24 68 L24 32 Z',
  Wind: 'M20 47 C37 30 63 27 77 42 C62 39 51 45 43 56 C34 68 23 62 20 47 Z',
}

function hashString(input: string) {
  let h = 2166136261
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function seeded(seed: number) {
  let value = seed >>> 0
  return () => {
    value += 0x6d2b79f5
    let t = value
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function pointsFor(seed: number, count: number) {
  const rand = seeded(seed)
  return Array.from({ length: count }, (_, index) => {
    const angle = (Math.PI * 2 * index) / count + rand() * 0.42
    const radius = 28 + rand() * 20
    const x = 50 + Math.cos(angle) * radius
    const y = 50 + Math.sin(angle) * radius
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
}

function getPalette(type: string, series: TcgSeriesKey): Palette {
  const fallback = series === 'perfect-order' ? typePalettes.Light : typePalettes.Arcane
  return typePalettes[type] || fallback
}

function seedHue(seed: number, offset = 0) {
  return (seed % 360 + offset) % 360
}


function artworkUrlFor(card: Pick<TcgCard, 'id' | 'series'>) {
  if (card.series !== 'perfect-order') return null
  const match = card.id.match(/^po-(\d{3})$/)
  if (!match) return null
  return `/tcg/perfect-order/po-${match[1]}.png`
}

export default function TcgCardArt({ card, className = '', compact = false, hideMeta = false }: TcgCardArtProps) {
  const seed = hashString(`${card.id}-${card.name}-${card.rarity}-${card.type}`)
  const palette = getPalette(card.type, card.series)
  const frame = rarityFrames[card.rarity]
  const points = pointsFor(seed, card.rarity === 'common' || card.rarity === 'uncommon' ? 7 : 10)
  const pointsTwo = pointsFor(seed ^ 0xabcdef, 8)
  const hue = seedHue(seed, card.series === 'perfect-order' ? 38 : 235)
  const isPremium = ['full_art', 'ultra_rare', 'secret_rare', 'gold_rare'].includes(card.rarity)
  const isHolo = ['reverse_holo', 'holo', 'full_art', 'ultra_rare', 'secret_rare', 'gold_rare'].includes(card.rarity)
  const glyph = typeGlyphs[card.type] || typeGlyphs.Arcane
  const titleSize = compact ? 'text-[11px]' : 'text-sm sm:text-base'
  const artworkUrl = hideMeta ? null : artworkUrlFor(card)

  return (
    <div
      className={`relative aspect-[.72] overflow-hidden rounded-[1.25rem] border p-2.5 text-white shadow-[0_22px_70px_rgba(0,0,0,.42)] ${className}`}
      style={{
        borderColor: frame.border,
        background: `radial-gradient(circle at 30% 18%, ${frame.shine}, transparent 34%), radial-gradient(circle at 75% 78%, ${palette.glow}55, transparent 36%), linear-gradient(145deg, ${palette.base}, #050608 58%, hsl(${hue} 55% 13%))`,
      }}
    >
      <div
        className="absolute inset-0 opacity-45"
        style={{
          background: `linear-gradient(115deg, transparent 0%, ${palette.foil}14 22%, transparent 43%, ${palette.line}16 61%, transparent 82%), repeating-linear-gradient(${(seed % 80) + 20}deg, transparent 0 13px, rgba(255,255,255,.035) 14px 15px)`,
        }}
      />
      {isHolo ? (
        <div
          className="absolute inset-0 opacity-40 mix-blend-screen"
          style={{
            background: `conic-gradient(from ${seed % 360}deg at 50% 45%, rgba(255,255,255,0), ${palette.foil}55, rgba(125,211,252,.34), rgba(240,171,252,.30), rgba(255,255,255,0))`,
          }}
        />
      ) : null}
      {card.rarity === 'gold_rare' || card.rarity === 'secret_rare' ? <div className="absolute inset-[5px] rounded-[1rem] border border-yellow-100/50 shadow-[inset_0_0_32px_rgba(250,204,21,.18)]" /> : null}

      <div className="relative z-10 flex h-full flex-col rounded-[.95rem] border border-white/10 bg-black/18 p-2.5 backdrop-blur-[1px]">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[8px] font-black uppercase tracking-[.16em] text-white/45">{card.seriesName}</p>
            <h3 className={`${titleSize} mt-1 line-clamp-2 font-black leading-tight text-white`}>{hideMeta ? '???' : card.name}</h3>
          </div>
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/12 text-[9px] font-black text-white/80" style={{ background: frame.badge }}>{frame.label}</div>
        </div>

        <div className="relative my-2.5 min-h-0 flex-1 overflow-hidden rounded-[.9rem] border border-white/10 bg-black/25">
          {artworkUrl ? (
            <>
              <img
                src={artworkUrl}
                alt={`${card.name} artwork`}
                className="absolute inset-0 h-full w-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_28%,transparent,rgba(0,0,0,.18)_58%,rgba(0,0,0,.72))]" />
              {isHolo ? (
                <div
                  className="absolute inset-0 opacity-35 mix-blend-screen"
                  style={{
                    background: `linear-gradient(118deg, transparent 0%, ${palette.foil}44 22%, transparent 42%, rgba(255,255,255,.34) 52%, transparent 68%, ${palette.line}33 82%, transparent 100%)`,
                  }}
                />
              ) : null}
            </>
          ) : (
            <svg viewBox="0 0 100 100" role="img" aria-label={hideMeta ? 'Verborgen ASORTA kaart' : `${card.name} artwork`} className="absolute inset-0 h-full w-full">
              <defs>
                <radialGradient id={`orb-${seed}`} cx="50%" cy="40%" r="55%">
                  <stop offset="0%" stopColor={palette.foil} stopOpacity="0.92" />
                  <stop offset="42%" stopColor={palette.mid} stopOpacity="0.46" />
                  <stop offset="100%" stopColor={palette.base} stopOpacity="0" />
                </radialGradient>
                <linearGradient id={`line-${seed}`} x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor={palette.line} stopOpacity="0.92" />
                  <stop offset="55%" stopColor={palette.mid} stopOpacity="0.55" />
                  <stop offset="100%" stopColor={palette.glow} stopOpacity="0.82" />
                </linearGradient>
                <filter id={`soft-${seed}`} x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="2.3" />
                </filter>
              </defs>
              <rect width="100" height="100" fill="transparent" />
              <circle cx="50" cy="43" r={isPremium ? 36 : 30} fill={`url(#orb-${seed})`} opacity={hideMeta ? 0.22 : 0.75} />
              <polygon points={pointsTwo} fill={palette.glow} opacity={hideMeta ? 0.08 : 0.16} filter={`url(#soft-${seed})`} />
              <polygon points={points} fill="none" stroke={`url(#line-${seed})`} strokeWidth={isPremium ? 2.8 : 1.7} opacity={hideMeta ? 0.24 : 0.72} />
              <path d={glyph} fill={hideMeta ? 'rgba(255,255,255,.10)' : palette.mid} opacity={isPremium ? 0.62 : 0.48} />
              <path d={glyph} fill="none" stroke={palette.line} strokeWidth={isPremium ? 2.1 : 1.3} opacity={hideMeta ? 0.22 : 0.84} />
              {isPremium ? <circle cx="50" cy="50" r="38" fill="none" stroke={palette.foil} strokeWidth="1.2" strokeDasharray="5 4" opacity=".62" /> : null}
              <g opacity={hideMeta ? 0.12 : 0.36}>
                <path d={`M12 ${20 + (seed % 22)} C32 12, 46 38, 88 ${18 + (seed % 18)}`} stroke={palette.line} strokeWidth="1" fill="none" />
                <path d={`M8 ${70 - (seed % 16)} C29 85, 62 55, 92 ${78 - (seed % 22)}`} stroke={palette.foil} strokeWidth="1" fill="none" />
              </g>
            </svg>
          )}
          {hideMeta ? <div className="absolute inset-0 grid place-items-center bg-black/20 text-center text-[10px] font-black uppercase tracking-[.24em] text-white/35">Nog niet gevonden</div> : null}
        </div>

        {!hideMeta ? (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2 text-[9px] font-black uppercase tracking-[.14em] text-white/50">
              <span>{card.number}</span>
              <span>{card.type}</span>
            </div>
            {!compact ? <p className="line-clamp-2 text-[10px] leading-4 text-white/47">{card.flavor}</p> : null}
            <div className="rounded-full border border-white/10 bg-white/[.06] px-2.5 py-1 text-center text-[9px] font-black uppercase tracking-[.16em] text-white/70">{rarityLabel(card.rarity)}</div>
          </div>
        ) : (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2 text-[9px] font-black uppercase tracking-[.14em] text-white/30">
              <span>{card.number}</span>
              <span>Locked</span>
            </div>
            <div className="rounded-full border border-white/10 bg-white/[.04] px-2.5 py-1 text-center text-[9px] font-black uppercase tracking-[.16em] text-white/35">{rarityLabel(card.rarity)}</div>
          </div>
        )}
      </div>
    </div>
  )
}
