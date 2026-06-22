import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  cardScannerKeywords,
  extractCardNumber,
  extractLikelyCardSearches,
  mapProductToScannerResult,
  normalizeScannerText,
  scannerNumber,
  scoreScannerResult,
  type CardScannerResult,
} from '@/lib/card-scanner'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type AnyRow = Record<string, any>

type TcgDexBrief = {
  id?: string
  localId?: string
  name?: string
  image?: string
}

type TcgDexCard = TcgDexBrief & {
  category?: string
  rarity?: string
  set?: { id?: string; name?: string }
  pricing?: {
    cardmarket?: Record<string, unknown>
  }
}

function escapeOrValue(value: string) {
  return value.replace(/[,%]/g, '').replace(/[^a-zA-Z0-9 _./-]/g, '').trim()
}

function priceFromCardmarket(pricing: Record<string, unknown> | undefined) {
  if (!pricing) return null
  const candidates = ['trend', 'avg7', 'avg30', 'avg', 'low', 'trend-holo', 'avg7-holo', 'avg30-holo', 'low-holo']
  for (const key of candidates) {
    const value = scannerNumber(pricing[key], 0)
    if (value > 0) return value
  }
  return null
}

function fullImage(url: string | undefined) {
  if (!url) return '/products/asorta-product-fallback.svg'
  if (/\.(png|jpe?g|webp|avif)$/i.test(url)) return url
  return `${url}/high.webp`
}

function cardmarketSearchUrl(card: TcgDexCard) {
  const setPart = card.set?.name ? ` ${card.set.name}` : ''
  const numberPart = card.localId ? ` ${card.localId}` : ''
  const query = encodeURIComponent(`${card.name || ''}${setPart}${numberPart}`.trim())
  return `https://www.cardmarket.com/en/Pokemon/Products/Search?searchString=${query}`
}

function mapTcgDexCard(card: TcgDexCard, scannedQuery: string): CardScannerResult {
  const cm = card.pricing?.cardmarket
  const marketValue = priceFromCardmarket(cm)
  const updated = typeof cm?.updated === 'string' ? cm.updated : ''
  const result: CardScannerResult = {
    id: `tcgdex:${card.id || card.name || Math.random().toString(36).slice(2)}`,
    name: String(card.name || 'Onbekende kaart'),
    slug: '',
    category: String(card.category || 'Pokémon kaart'),
    image: fullImage(card.image),
    price: 0,
    compareAt: null,
    marketValue,
    suggestedPrice: null,
    marketSource: marketValue ? 'TCGdex / Cardmarket' : 'TCGdex catalogus',
    conditionLabel: 'Prijsindicatie Cardmarket, conditie/taal controleren',
    sealedStatus: '',
    inventoryOnline: 0,
    inventoryMarket: 0,
    inventoryTotal: 0,
    cardmarketUrl: cardmarketSearchUrl(card),
    tags: [card.id, card.localId, card.set?.id, card.set?.name, card.rarity].filter(Boolean).map(String),
    source: 'tcgdex',
    setName: card.set?.name || '',
    setId: card.set?.id || '',
    localId: card.localId || '',
    rarity: card.rarity || '',
    cardmarketUpdatedAt: updated,
  }
  return { ...result, score: scoreScannerResult(result, scannedQuery) }
}

async function fetchJson<T>(url: string, signal: AbortSignal): Promise<T | null> {
  const response = await fetch(url, {
    signal,
    headers: { accept: 'application/json', 'user-agent': 'ASORTA-card-scanner/1.0' },
    next: { revalidate: 60 * 60 * 6 },
  })
  if (!response.ok) return null
  return (await response.json()) as T
}

async function searchTcgDex(scannedQuery: string, maxResults: number) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8500)
  try {
    const candidateNames = extractLikelyCardSearches(scannedQuery)
    const cardNumber = normalizeScannerText(extractCardNumber(scannedQuery))
    const briefById = new Map<string, TcgDexBrief>()

    for (const candidate of candidateNames.slice(0, 5)) {
      const url = `https://api.tcgdex.net/v2/en/cards?name=${encodeURIComponent(candidate)}&pagination:page=1&pagination:itemsPerPage=18`
      const rows = await fetchJson<TcgDexBrief[]>(url, controller.signal)
      for (const row of rows || []) {
        if (row.id && !briefById.has(row.id)) briefById.set(row.id, row)
      }
      if (briefById.size >= 24) break
    }

    const briefs = Array.from(briefById.values())
    if (!briefs.length) return []

    const prelim = briefs
      .map((row) => ({ row, score: scoreScannerResult({
        id: `tcgdex:${row.id || ''}`,
        name: String(row.name || ''),
        slug: '',
        category: '',
        image: fullImage(row.image),
        price: 0,
        compareAt: null,
        marketValue: null,
        suggestedPrice: null,
        marketSource: 'TCGdex',
        conditionLabel: '',
        sealedStatus: '',
        inventoryOnline: 0,
        inventoryMarket: 0,
        inventoryTotal: 0,
        cardmarketUrl: '',
        tags: [row.id, row.localId].filter(Boolean).map(String),
        source: 'tcgdex',
        localId: row.localId || '',
      }, scannedQuery) + (cardNumber && normalizeScannerText(row.localId).includes(cardNumber) ? 30 : 0) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)

    const fullCards = await Promise.all(prelim.map(async ({ row }) => {
      if (!row.id) return null
      return fetchJson<TcgDexCard>(`https://api.tcgdex.net/v2/en/cards/${encodeURIComponent(row.id)}`, controller.signal)
    }))

    return fullCards
      .filter((card): card is TcgDexCard => Boolean(card?.id || card?.name))
      .map((card) => mapTcgDexCard(card, scannedQuery))
      .filter((row) => (row.score || 0) > 0)
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, maxResults)
  } catch {
    return []
  } finally {
    clearTimeout(timeout)
  }
}

async function searchLocalProducts(q: string, limit: number) {
  const admin = createAdminClient()
  if (!admin) return { results: [] as CardScannerResult[], error: 'Supabase admin client ontbreekt.' }

  const words = cardScannerKeywords(q)
  const safeWords = words.map(escapeOrValue).filter(Boolean).slice(0, 7)

  let query = admin
    .from('products')
    .select('id,name,slug,category,hero_image,images,price,compare_at,market_value,suggested_price,market_source,condition_label,sealed_status,inventory_online,inventory_market,inventory_total,cardmarket_url,tags,status')
    .in('status', ['active', 'launch', 'draft', 'sold_out'])
    .limit(160)

  if (safeWords.length) {
    const orParts = safeWords.flatMap((word) => [
      `name.ilike.%${word}%`,
      `slug.ilike.%${word}%`,
      `category.ilike.%${word}%`,
      `condition_label.ilike.%${word}%`,
      `sealed_status.ilike.%${word}%`,
      `market_source.ilike.%${word}%`,
    ])
    query = query.or(orParts.join(','))
  }

  const { data, error } = await query
  if (error) return { results: [] as CardScannerResult[], error: error.message }

  const results = ((data || []) as AnyRow[])
    .map(mapProductToScannerResult)
    .map((row) => ({ ...row, score: scoreScannerResult(row, q) }))
    .filter((row) => (row.score || 0) > 0)
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, limit)

  return { results }
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const q = String(url.searchParams.get('q') || '').trim()
  const limit = Math.max(1, Math.min(30, Number(url.searchParams.get('limit') || 12)))
  const external = url.searchParams.get('external') !== '0'

  if (q.length < 2) {
    return NextResponse.json({ query: q, results: [], message: 'Richt de camera op de kaart of typ minimaal 2 tekens.' })
  }

  const [local, tcgdex] = await Promise.all([
    searchLocalProducts(q, limit),
    external ? searchTcgDex(q, Math.max(3, limit)) : Promise.resolve([]),
  ])

  const seen = new Set<string>()
  const results = [...local.results, ...tcgdex]
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .filter((item) => {
      const key = `${item.source}:${normalizeScannerText(item.name)}:${normalizeScannerText(item.setName)}:${normalizeScannerText(item.localId)}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .slice(0, limit)

  return NextResponse.json({
    query: q,
    results,
    localCount: local.results.length,
    externalCount: tcgdex.length,
    error: local.error,
    sourceNote: 'ASORTA database + TCGdex/Cardmarket prijsindicatie zonder API-key. Controleer exacte variant, taal en conditie altijd in Cardmarket.',
  })
}
