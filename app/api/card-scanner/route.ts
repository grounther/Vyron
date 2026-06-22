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


type PokemonkaartCandidate = {
  url: string
  title: string
}

type PokemonkaartCard = {
  url: string
  name: string
  localId: string
  setName: string
  image: string
  marketValue: number | null
  finish: string
  rarity: string
}

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&euro;/g, '€')
    .replace(/&nbsp;/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function parseEuro(value: string) {
  const match = value.match(/€\s*([0-9.]+,[0-9]{2}|[0-9]+(?:\.[0-9]{3})*(?:,[0-9]{2})?)/)
  if (!match?.[1]) return null
  const parsed = Number(match[1].replace(/\./g, '').replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : null
}

function absolutePokemonkaartUrl(url: string) {
  if (url.startsWith('http')) return url
  return `https://www.pokemonkaart.nl${url.startsWith('/') ? '' : '/'}${url}`
}

function searchUrlsForPokemonkaart(candidate: string) {
  const q = encodeURIComponent(candidate)
  return [
    `https://www.pokemonkaart.nl/?s=${q}`,
    `https://www.pokemonkaart.nl/zoeken?keyword=${q}`,
    `https://www.pokemonkaart.nl/zoeken?q=${q}`,
  ]
}

function extractPokemonkaartCandidates(html: string) {
  const candidates = new Map<string, PokemonkaartCandidate>()
  const anchorRegex = /<a\s+[^>]*href=["']([^"']*\/kaart\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi
  let match: RegExpExecArray | null
  while ((match = anchorRegex.exec(html))) {
    const url = absolutePokemonkaartUrl(decodeHtml(match[1] || ''))
    const title = decodeHtml(match[2] || '')
    if (!url || !title || /privacy|disclaimer|contact/i.test(title)) continue
    if (!candidates.has(url)) candidates.set(url, { url, title })
  }
  return Array.from(candidates.values()).slice(0, 12)
}

function extractPokemonkaartDetail(html: string, url: string): PokemonkaartCard | null {
  const name = decodeHtml(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || '')
  const localId = decodeHtml(html.match(/<h1[^>]*>\s*#([^<]+)<\/h1>/i)?.[1] || html.match(/#\s*([A-Z0-9-]+\s*\/\s*\d{1,3})/i)?.[1] || '')
  const crumbs = decodeHtml(html.match(/←\s*Terug([\s\S]*?)<h1/i)?.[1] || '')
  const crumbParts = crumbs.split('»').map((part) => part.trim()).filter(Boolean)
  const setName = crumbParts.length >= 2 ? crumbParts[crumbParts.length - 2] : ''
  const priceSection = html.match(/Actuele marktprijs([\s\S]*?)Prijzen worden dagelijks bijgewerkt/i)?.[1] || ''
  const priceMatches = Array.from(priceSection.matchAll(/€\s*[0-9.]+,[0-9]{2}(?:[\s\S]{0,80}?)(?:<[^>]+>)*\s*([^<€]{3,40})?/gi))
  const firstPrice = priceMatches[0]?.[0] || priceSection
  const marketValue = parseEuro(firstPrice)
  const finish = decodeHtml((firstPrice.replace(/€\s*[0-9.]+,[0-9]{2}/, '').match(/([A-Za-z][A-Za-z\s-]{2,40})/)?.[1] || '').trim())
  const rarityBlock = html.match(/RARITY([\s\S]*?)ARTIST/i)?.[1] || ''
  const rarity = decodeHtml(rarityBlock).replace(/^RARITY\s*/i, '').trim()
  const imageAltMatch = html.match(/<img[^>]+alt=["']([^"']+)["'][^>]*>/i)
  const imageSrcMatch = html.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i)
  const image = imageSrcMatch?.[1] ? absolutePokemonkaartUrl(decodeHtml(imageSrcMatch[1])) : '/products/asorta-product-fallback.svg'

  if (!name || !marketValue) return null
  return { url, name, localId, setName, image, marketValue, finish, rarity }
}

function mapPokemonkaartCard(card: PokemonkaartCard, scannedQuery: string): CardScannerResult {
  const result: CardScannerResult = {
    id: `pokemonkaart:${card.url}`,
    name: card.name,
    slug: '',
    category: 'Pokémon kaart',
    image: card.image || '/products/asorta-product-fallback.svg',
    price: 0,
    compareAt: null,
    marketValue: card.marketValue,
    suggestedPrice: null,
    marketSource: 'Pokemonkaart.nl dagelijkse marktprijs',
    conditionLabel: card.finish || 'Conditie/variant controleren',
    sealedStatus: '',
    inventoryOnline: 0,
    inventoryMarket: 0,
    inventoryTotal: 0,
    cardmarketUrl: card.url,
    tags: [card.setName, card.localId, card.finish, card.rarity].filter(Boolean),
    source: 'pokemonkaart',
    setName: card.setName,
    setId: '',
    localId: card.localId,
    rarity: card.rarity || card.finish,
    cardmarketUpdatedAt: '',
  }
  return { ...result, score: scoreScannerResult(result, scannedQuery) + 8 }
}

async function fetchText(url: string, signal: AbortSignal): Promise<string> {
  const response = await fetch(url, {
    signal,
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'user-agent': 'ASORTA-card-scanner/1.0 (+https://asorta.nl/card-scanner; polite cached lookup)',
    },
    next: { revalidate: 60 * 60 * 12 },
  })
  if (!response.ok) return ''
  return response.text()
}

async function searchPokemonkaart(scannedQuery: string, maxResults: number) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 9000)
  try {
    const candidates = extractLikelyCardSearches(scannedQuery)
    const cardNumber = normalizeScannerText(extractCardNumber(scannedQuery))
    const links = new Map<string, PokemonkaartCandidate>()

    for (const candidate of candidates.slice(0, 4)) {
      for (const url of searchUrlsForPokemonkaart(candidate).slice(0, 2)) {
        const html = await fetchText(url, controller.signal)
        for (const link of extractPokemonkaartCandidates(html)) {
          const titleScore = scoreScannerResult({
            id: link.url,
            name: link.title,
            slug: '',
            category: '',
            image: '',
            price: 0,
            compareAt: null,
            marketValue: null,
            suggestedPrice: null,
            marketSource: '',
            conditionLabel: '',
            sealedStatus: '',
            inventoryOnline: 0,
            inventoryMarket: 0,
            inventoryTotal: 0,
            cardmarketUrl: '',
            tags: [],
            source: 'pokemonkaart',
          }, scannedQuery) + (cardNumber && normalizeScannerText(link.title).includes(cardNumber) ? 35 : 0)
          if (titleScore > 0 && !links.has(link.url)) links.set(link.url, link)
        }
        if (links.size >= 12) break
      }
      if (links.size >= 12) break
    }

    const rankedLinks = Array.from(links.values())
      .map((link) => ({ link, score: scoreScannerResult({
        id: link.url,
        name: link.title,
        slug: '',
        category: '',
        image: '',
        price: 0,
        compareAt: null,
        marketValue: null,
        suggestedPrice: null,
        marketSource: '',
        conditionLabel: '',
        sealedStatus: '',
        inventoryOnline: 0,
        inventoryMarket: 0,
        inventoryTotal: 0,
        cardmarketUrl: '',
        tags: [],
        source: 'pokemonkaart',
      }, scannedQuery) + (cardNumber && normalizeScannerText(link.title).includes(cardNumber) ? 35 : 0) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)

    const details = await Promise.all(rankedLinks.map(async ({ link }) => {
      const html = await fetchText(link.url, controller.signal)
      return extractPokemonkaartDetail(html, link.url)
    }))

    return details
      .filter((card): card is PokemonkaartCard => Boolean(card))
      .map((card) => mapPokemonkaartCard(card, scannedQuery))
      .filter((row) => (row.score || 0) > 0)
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, maxResults)
  } catch {
    return []
  } finally {
    clearTimeout(timeout)
  }
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

  const [local, pokemonkaart, tcgdex] = await Promise.all([
    searchLocalProducts(q, limit),
    external ? searchPokemonkaart(q, Math.max(4, limit)) : Promise.resolve([]),
    external ? searchTcgDex(q, Math.max(3, limit)) : Promise.resolve([]),
  ])

  const seen = new Set<string>()
  const results = [...local.results, ...pokemonkaart, ...tcgdex]
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
    externalCount: pokemonkaart.length + tcgdex.length,
    pokemonkaartCount: pokemonkaart.length,
    tcgdexCount: tcgdex.length,
    error: local.error,
    sourceNote: 'ASORTA database + Pokemonkaart.nl dagelijkse marktprijs + TCGdex fallback. Controleer exacte variant, taal en conditie altijd.',
  })
}
