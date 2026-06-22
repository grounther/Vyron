export type CardScannerResult = {
  id: string
  name: string
  slug: string
  category: string
  image: string
  price: number
  compareAt: number | null
  marketValue: number | null
  suggestedPrice: number | null
  marketSource: string
  conditionLabel: string
  sealedStatus: string
  inventoryOnline: number
  inventoryMarket: number
  inventoryTotal: number
  cardmarketUrl: string
  tags: string[]
  source?: 'asorta' | 'tcgdex' | 'pokemonkaart'
  setName?: string
  setId?: string
  localId?: string
  rarity?: string
  cardmarketUpdatedAt?: string
  score?: number
}

type AnyRow = Record<string, any>

export function scannerNumber(value: unknown, fallback = 0) {
  const parsed = typeof value === 'number' ? value : Number(value || 0)
  return Number.isFinite(parsed) ? parsed : fallback
}

function scannerText(value: unknown, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function tags(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).map((item) => item.trim()).filter(Boolean)
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) return parsed.map(String).map((item) => item.trim()).filter(Boolean)
    } catch {}
    return value.split(/[\n,;]+/).map((item) => item.trim()).filter(Boolean)
  }
  return []
}

export function normalizeScannerText(value: unknown) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const scannerStopWords = new Set([
  'the', 'and', 'een', 'het', 'van', 'met', 'for', 'kaart', 'card', 'pokemon', 'pokémon', 'trading', 'game', 'hp',
  'basic', 'stage', 'evolves', 'from', 'weakness', 'resistance', 'retreat', 'ability', 'attack', 'damage', 'during',
  'your', 'opponent', 'active', 'bench', 'discard', 'energy', 'trainer', 'supporter', 'stadium', 'item', 'illustrator',
  'illus', 'copyright', 'nintendo', 'creatures', 'gamefreak', 'game', 'freak', 'regulation', 'mark', 'rule', 'rules',
])

export function cardScannerKeywords(input: string) {
  return normalizeScannerText(input)
    .split(' ')
    .filter((word) => word.length >= 2 && !scannerStopWords.has(word))
    .slice(0, 18)
}

export function extractCardNumber(input: string) {
  const raw = String(input || '')
  const fraction = raw.match(/\b([A-Z]{0,4}\s*\d{1,3})\s*[/／]\s*(\d{1,3})\b/i)
  if (fraction?.[1]) return fraction[1].replace(/\s+/g, '')
  const collector = raw.match(/\b([A-Z]{1,5}\d{1,3})\b/i)
  if (collector?.[1]) return collector[1]
  return ''
}

export function extractLikelyCardSearches(input: string) {
  const normalized = normalizeScannerText(input)
  const words = cardScannerKeywords(input).filter((word) => !/^\d+$/.test(word))
  const candidates = new Set<string>()

  const lineCandidates = String(input || '')
    .split(/[\n\r]+/)
    .map((line) => normalizeScannerText(line))
    .filter((line) => line.length >= 3 && line.length <= 42)
    .filter((line) => cardScannerKeywords(line).length >= 1)

  for (const line of lineCandidates.slice(0, 4)) candidates.add(line)
  if (words.length) {
    candidates.add(words.slice(0, Math.min(3, words.length)).join(' '))
    candidates.add(words[0])
  }
  for (let size = 3; size >= 1; size -= 1) {
    for (let index = 0; index <= Math.min(words.length - size, 5); index += 1) {
      const part = words.slice(index, index + size).join(' ')
      if (part.length >= 3) candidates.add(part)
    }
  }

  if (normalized.length <= 34 && normalized.length >= 2) candidates.add(normalized)
  return Array.from(candidates).filter(Boolean).slice(0, 8)
}

export function mapProductToScannerResult(row: AnyRow): CardScannerResult {
  const image = scannerText(row.hero_image, '') || (Array.isArray(row.images) && row.images[0] ? String(row.images[0]) : '') || '/products/asorta-product-fallback.svg'
  return {
    id: String(row.id || row.slug || row.name || ''),
    name: scannerText(row.name, 'Onbekende kaart'),
    slug: scannerText(row.slug, ''),
    category: scannerText(row.category, ''),
    image,
    price: scannerNumber(row.price, 0),
    compareAt: row.compare_at == null ? null : scannerNumber(row.compare_at, 0),
    marketValue: row.market_value == null ? null : scannerNumber(row.market_value, 0),
    suggestedPrice: row.suggested_price == null ? null : scannerNumber(row.suggested_price, 0),
    marketSource: scannerText(row.market_source, ''),
    conditionLabel: scannerText(row.condition_label, 'Onbekend'),
    sealedStatus: scannerText(row.sealed_status, ''),
    inventoryOnline: scannerNumber(row.inventory_online, 0),
    inventoryMarket: scannerNumber(row.inventory_market, 0),
    inventoryTotal: scannerNumber(row.inventory_total, 0),
    cardmarketUrl: scannerText(row.cardmarket_url, ''),
    tags: tags(row.tags),
    source: 'asorta',
  }
}

export function scoreScannerResult(row: CardScannerResult, query: string) {
  const words = cardScannerKeywords(query)
  if (!words.length) return 0
  const haystack = normalizeScannerText([
    row.name,
    row.slug,
    row.category,
    row.conditionLabel,
    row.sealedStatus,
    row.marketSource,
    row.setName,
    row.setId,
    row.localId,
    row.rarity,
    row.tags.join(' '),
  ].join(' '))
  let score = 0
  for (const word of words) {
    if (haystack.includes(word)) score += word.length >= 4 ? 3 : 1
    if (normalizeScannerText(row.name).includes(word)) score += 4
    if (normalizeScannerText(row.slug).includes(word)) score += 2
    if (normalizeScannerText(row.setName).includes(word)) score += 2
    if (normalizeScannerText(row.localId).includes(word)) score += 5
    if (row.tags.some((tag) => normalizeScannerText(tag).includes(word))) score += 2
  }
  const exactName = normalizeScannerText(row.name)
  const normalizedQuery = normalizeScannerText(query)
  const number = extractCardNumber(query)
  if (exactName === normalizedQuery) score += 25
  if (exactName.startsWith(normalizedQuery) || normalizedQuery.startsWith(exactName)) score += 10
  if (number && normalizeScannerText(row.localId).includes(normalizeScannerText(number))) score += 18
  if (row.source === 'pokemonkaart' && row.marketValue) score += 10
  if (row.source === 'tcgdex' && row.marketValue) score += 6
  return score
}

export function bestScannerValue(row: CardScannerResult) {
  if (typeof row.marketValue === 'number' && row.marketValue > 0) return { label: row.source === 'pokemonkaart' ? 'Pokemonkaart waarde' : row.source === 'tcgdex' ? 'Cardmarket trend' : 'Marktwaarde', value: row.marketValue }
  if (typeof row.suggestedPrice === 'number' && row.suggestedPrice > 0) return { label: 'Adviesprijs', value: row.suggestedPrice }
  return { label: row.price > 0 ? 'Webshopprijs' : 'Geen prijs', value: row.price }
}
