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

export function cardScannerKeywords(input: string) {
  return normalizeScannerText(input)
    .split(' ')
    .filter((word) => word.length >= 2 && !['the', 'and', 'een', 'het', 'van', 'met', 'for', 'kaart', 'card', 'pokemon'].includes(word))
    .slice(0, 12)
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
    row.tags.join(' '),
  ].join(' '))
  let score = 0
  for (const word of words) {
    if (haystack.includes(word)) score += word.length >= 4 ? 3 : 1
    if (normalizeScannerText(row.name).includes(word)) score += 3
    if (normalizeScannerText(row.slug).includes(word)) score += 2
    if (row.tags.some((tag) => normalizeScannerText(tag).includes(word))) score += 2
  }
  const exactName = normalizeScannerText(row.name)
  const normalizedQuery = normalizeScannerText(query)
  if (exactName === normalizedQuery) score += 25
  if (exactName.startsWith(normalizedQuery) || normalizedQuery.startsWith(exactName)) score += 10
  return score
}

export function bestScannerValue(row: CardScannerResult) {
  if (typeof row.marketValue === 'number' && row.marketValue > 0) return { label: 'Marktwaarde', value: row.marketValue }
  if (typeof row.suggestedPrice === 'number' && row.suggestedPrice > 0) return { label: 'Adviesprijs', value: row.suggestedPrice }
  return { label: 'Webshopprijs', value: row.price }
}
