export type PricingInput = {
  currentPrice: number
  estimatedCost?: number | null
  estimatedShipping?: number | null
  marketValue?: number | null
  minMarginPercent?: number | null
  minPrice?: number | null
  priceLocked?: boolean | null
}

export type PricingCalculation = {
  marketValue: number
  suggestedPrice: number
  minSafePrice: number
  totalCost: number
  estimatedFee: number
  estimatedProfit: number
  marginPercent: number
  canApply: boolean
  status: 'ready' | 'review' | 'locked' | 'missing_market_value'
  note: string
}

export type ParsedCardmarketPrices = {
  from?: number
  priceTrend?: number
  average30Days?: number
  average7Days?: number
  average1Day?: number
  availableItems?: number
  preferredMarketValue?: number
  preferredMetric?: string
}

const PAYPAL_FEE_PERCENT = 0.034
const PAYPAL_FEE_FIXED = 0.35

export function roundMoney(value: number) {
  return Math.round((Number(value) || 0) * 100) / 100
}

export function parseMoney(value: unknown) {
  const raw = String(value ?? '').trim()
  if (!raw) return null
  const normalized = raw
    .replace(/\s/g, '')
    .replace(/€/g, '')
    .replace(/[^0-9,.-]/g, '')
  if (!normalized) return null

  let decimal = normalized
  if (normalized.includes(',') && normalized.includes('.')) {
    decimal = normalized.replace(/\./g, '').replace(',', '.')
  } else if (normalized.includes(',')) {
    decimal = normalized.replace(',', '.')
  }

  const parsed = Number(decimal)
  return Number.isFinite(parsed) ? parsed : null
}

function findNumber(text: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (!match?.[1]) continue
    const parsed = parseMoney(match[1])
    if (typeof parsed === 'number') return parsed
  }
  return undefined
}

export function parseCardmarketPriceText(input: string): ParsedCardmarketPrices {
  const text = String(input || '').replace(/\r/g, '\n')
  const availableItems = findNumber(text, [
    /Available\s+items\s*[:\-]?\s*([0-9]+)/i,
    /Beschikbare\s+items\s*[:\-]?\s*([0-9]+)/i,
    /Beschikbaar\s*[:\-]?\s*([0-9]+)/i,
  ])

  const parsed: ParsedCardmarketPrices = {
    availableItems,
    from: findNumber(text, [
      /\bFrom\s*[:\-]?\s*([0-9.,]+)\s*€/i,
      /\bVanaf\s*[:\-]?\s*€?\s*([0-9.,]+)/i,
    ]),
    priceTrend: findNumber(text, [
      /Price\s+Trend\s*[:\-]?\s*([0-9.,]+)\s*€/i,
      /Prijstrend\s*[:\-]?\s*€?\s*([0-9.,]+)/i,
    ]),
    average30Days: findNumber(text, [
      /30\s*-?\s*days?\s+average\s+price\s*[:\-]?\s*([0-9.,]+)\s*€/i,
      /30\s*-?\s*dagen?\s+gemiddelde\s*[:\-]?\s*€?\s*([0-9.,]+)/i,
    ]),
    average7Days: findNumber(text, [
      /7\s*-?\s*days?\s+average\s+price\s*[:\-]?\s*([0-9.,]+)\s*€/i,
      /7\s*-?\s*dagen?\s+gemiddelde\s*[:\-]?\s*€?\s*([0-9.,]+)/i,
    ]),
    average1Day: findNumber(text, [
      /1\s*-?\s*day\s+average\s+price\s*[:\-]?\s*([0-9.,]+)\s*€/i,
      /1\s*-?\s*dag\s+gemiddelde\s*[:\-]?\s*€?\s*([0-9.,]+)/i,
    ]),
  }

  const preference: Array<[keyof ParsedCardmarketPrices, string]> = [
    ['average7Days', 'Cardmarket 7-days average'],
    ['priceTrend', 'Cardmarket Price Trend'],
    ['average30Days', 'Cardmarket 30-days average'],
    ['average1Day', 'Cardmarket 1-day average'],
    ['from', 'Cardmarket From'],
  ]

  for (const [key, label] of preference) {
    const value = parsed[key]
    if (typeof value === 'number' && value > 0) {
      parsed.preferredMarketValue = value
      parsed.preferredMetric = label
      break
    }
  }

  return parsed
}

export function calculatePricing(input: PricingInput): PricingCalculation {
  const currentPrice = Number(input.currentPrice || 0)
  const marketValue = Number(input.marketValue || 0)
  const minMarginPercent = Number(input.minMarginPercent ?? 15)
  const minMargin = Math.max(0, Math.min(80, minMarginPercent)) / 100
  const totalCost = Math.max(0, Number(input.estimatedCost || 0) + Number(input.estimatedShipping || 0))
  const minPrice = Math.max(0, Number(input.minPrice || 0))

  if (!marketValue || marketValue <= 0) {
    return {
      marketValue: 0,
      suggestedPrice: 0,
      minSafePrice: minPrice,
      totalCost,
      estimatedFee: 0,
      estimatedProfit: 0,
      marginPercent: 0,
      canApply: false,
      status: 'missing_market_value',
      note: 'Geen marktwaarde ingevuld of herkend.',
    }
  }

  const suggestedPrice = roundMoney(marketValue * 0.98)
  const divisor = 1 - PAYPAL_FEE_PERCENT - minMargin
  const costBasedMinimum = divisor > 0 ? (totalCost + PAYPAL_FEE_FIXED) / divisor : Number.POSITIVE_INFINITY
  const minSafePrice = roundMoney(Math.max(minPrice, costBasedMinimum))
  const estimatedFee = roundMoney(suggestedPrice * PAYPAL_FEE_PERCENT + PAYPAL_FEE_FIXED)
  const estimatedProfit = roundMoney(suggestedPrice - totalCost - estimatedFee)
  const marginPercent = suggestedPrice > 0 ? roundMoney((estimatedProfit / suggestedPrice) * 100) : 0

  if (input.priceLocked) {
    return {
      marketValue,
      suggestedPrice,
      minSafePrice,
      totalCost,
      estimatedFee,
      estimatedProfit,
      marginPercent,
      canApply: false,
      status: 'locked',
      note: 'Prijs is handmatig gelockt; advies wordt niet automatisch toegepast.',
    }
  }

  const canApply = suggestedPrice >= minSafePrice
  return {
    marketValue,
    suggestedPrice,
    minSafePrice,
    totalCost,
    estimatedFee,
    estimatedProfit,
    marginPercent,
    canApply,
    status: canApply ? 'ready' : 'review',
    note: canApply
      ? `Adviesprijs is veilig: marktwaarde -2% met circa ${marginPercent.toFixed(2)}% marge.`
      : `Review nodig: adviesprijs ${formatEuro(suggestedPrice)} ligt onder minimale veilige prijs ${formatEuro(minSafePrice)}.`,
  }
}

export function formatEuro(value: number) {
  return `€${roundMoney(value).toFixed(2)}`
}
