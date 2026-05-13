const CJ_API_BASE = 'https://developers.cjdropshipping.com/api2.0/v1'

type CjEnvelope<T> = {
  code?: number | string
  result?: boolean
  success?: boolean
  message?: string
  data?: T
  requestId?: string
}

type CachedToken = {
  accessToken: string
  expiresAt: number
}

let cachedToken: CachedToken | null = null

export type CjProductVariant = {
  vid?: string
  pid?: string
  variantName?: string | null
  variantNameEn?: string | null
  variantSku?: string | null
  variantImage?: string | null
  variantKey?: string | null
  variantSellPrice?: string | number | null
  sellPrice?: string | number | null
  variantStandard?: string | null
  inventoryNum?: number | string | null
  inventoryQuantity?: number | string | null
  inventory?: number | string | null
  variantInventory?: number | string | null
  [key: string]: unknown
}

export type CjProductDetail = {
  pid?: string
  id?: string
  productName?: string | null
  productNameEn?: string | null
  productSku?: string | null
  sku?: string | null
  productImage?: string | null
  bigImage?: string | null
  productImageSet?: string[] | null
  description?: string | null
  sellPrice?: string | number | null
  nowPrice?: string | number | null
  productWeight?: number | string | null
  packingWeight?: number | string | null
  packWeight?: number | string | null
  categoryName?: string | null
  threeCategoryName?: string | null
  deliveryCycle?: string | null
  variants?: CjProductVariant[]
  variantList?: CjProductVariant[]
  [key: string]: unknown
}

export function getCjIntegrationStatus() {
  return {
    configured: Boolean(process.env.CJ_API_KEY || process.env.CJ_ACCESS_TOKEN),
    hasApiKey: Boolean(process.env.CJ_API_KEY),
    hasAccessToken: Boolean(process.env.CJ_ACCESS_TOKEN),
    hasShopId: Boolean(process.env.CJ_SHOP_ID),
    productConnectionsEnabled: process.env.CJ_ENABLE_PRODUCT_CONNECTIONS === 'true',
  }
}

function tokenExpiry(value: unknown) {
  if (typeof value !== 'string') return Date.now() + 14 * 24 * 60 * 60 * 1000
  const parsed = Date.parse(value)
  if (!Number.isFinite(parsed)) return Date.now() + 14 * 24 * 60 * 60 * 1000
  return parsed - 10 * 60 * 1000
}

async function getAccessToken() {
  const direct = process.env.CJ_ACCESS_TOKEN
  if (direct) return direct

  if (cachedToken && cachedToken.expiresAt > Date.now()) return cachedToken.accessToken

  const apiKey = process.env.CJ_API_KEY
  if (!apiKey) {
    throw new Error('CJ_API_KEY of CJ_ACCESS_TOKEN ontbreekt. Zet deze server-side in je hosting environment variables.')
  }

  const response = await fetch(`${CJ_API_BASE}/authentication/getAccessToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey }),
    cache: 'no-store',
  })

  const payload = (await response.json().catch(() => null)) as CjEnvelope<{ accessToken?: string; accessTokenExpiryDate?: string }> | null

  if (!response.ok || !payload?.data?.accessToken) {
    throw new Error(payload?.message || `CJ token request failed with HTTP ${response.status}`)
  }

  cachedToken = {
    accessToken: payload.data.accessToken,
    expiresAt: tokenExpiry(payload.data.accessTokenExpiryDate),
  }

  return cachedToken.accessToken
}

export async function cjRequest<T>(path: string, init: RequestInit = {}) {
  const token = await getAccessToken()
  const headers = new Headers(init.headers)
  headers.set('CJ-Access-Token', token)
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')

  const response = await fetch(`${CJ_API_BASE}${path}`, {
    ...init,
    headers,
    cache: 'no-store',
  })

  const payload = (await response.json().catch(() => null)) as CjEnvelope<T> | null
  const success = payload?.success === true || payload?.result === true || payload?.code === 200 || payload?.code === '200'

  if (!response.ok || !success) {
    throw new Error(payload?.message || `CJ API request failed with HTTP ${response.status}`)
  }

  return payload?.data as T
}

export function extractCjProductReference(input: string) {
  const value = input.trim()
  const pidFromUrl = value.match(/-p-([A-Za-z0-9-]+)\.html/i)?.[1] || value.match(/[?&]pid=([A-Za-z0-9-]+)/i)?.[1] || ''
  const productSku = value.match(/\b(CJ[A-Z0-9]{5,})\b/i)?.[1]?.toUpperCase() || ''
  const variantSku = value.match(/\b(CJ[A-Z0-9]{5,}(?:-[A-Za-z0-9]+|\d+[A-Z]{2,})?)\b/i)?.[1] || ''

  return {
    pid: pidFromUrl,
    productSku,
    variantSku: variantSku && variantSku !== productSku ? variantSku : '',
  }
}

export function firstText(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim()
    if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  }
  return ''
}

export function numberValue(value: unknown, fallback = 0) {
  const n = typeof value === 'number' ? value : Number(String(value ?? '').replace(',', '.'))
  return Number.isFinite(n) ? n : fallback
}

export function inventoryValue(variant: CjProductVariant) {
  const raw = variant.inventoryNum ?? variant.inventoryQuantity ?? variant.inventory ?? variant.variantInventory
  const n = numberValue(raw, NaN)
  return Number.isFinite(n) ? Math.max(0, Math.round(n)) : null
}

export function buildCjProductUrl(sourceInput: string, pid: string, productSku: string) {
  if (/^https?:\/\//i.test(sourceInput)) return sourceInput
  if (pid) return `https://cjdropshipping.com/product/p-${pid}.html`
  if (productSku) return `https://cjdropshipping.com/search?q=${encodeURIComponent(productSku)}`
  return ''
}

export async function queryCjProduct(reference: { productSku?: string; pid?: string; variantSku?: string; countryCode?: string }) {
  const params = new URLSearchParams()
  if (reference.productSku) params.set('productSku', reference.productSku)
  else if (reference.variantSku) params.set('variantSku', reference.variantSku)
  else if (reference.pid) params.set('pid', reference.pid)
  else throw new Error('Geef een CJ URL, PID, SPU/productSku of variantSku op.')

  params.append('features', 'enable_video')
  params.append('features', 'enable_inventory')
  params.append('features', 'enable_combine')
  if (reference.countryCode) params.set('countryCode', reference.countryCode)

  const product = await cjRequest<CjProductDetail>(`/product/query?${params.toString()}`)
  if (Array.isArray(product?.variantList) && !Array.isArray(product.variants)) product.variants = product.variantList
  return product
}

export async function addCjProductToMyProducts(pid: string) {
  if (!pid) return null
  return cjRequest(`/product/addToMyProduct`, {
    method: 'POST',
    body: JSON.stringify({ productId: pid }),
  })
}

export async function createCjProductConnection(input: {
  platformProductId: string
  cjProductId: string
  logistics: string
  sourceCountryCode: string
  sourceCountry: string
  targetCountryCode: string
  targetCountry: string
  variantList: Array<{ cjVariantId: string; platformVariantId: string }>
}) {
  if (!input.variantList.length) throw new Error('CJ product connection heeft minimaal één variant nodig.')
  const body: Record<string, unknown> = {
    defaultArea: 1,
    logistics: input.logistics,
    cjProductId: input.cjProductId,
    platformProductId: input.platformProductId,
    sourceCountryCode: input.sourceCountryCode,
    sourceCountry: input.sourceCountry,
    targetCountryCode: input.targetCountryCode,
    targetCountry: input.targetCountry,
    variantList: input.variantList,
  }

  if (process.env.CJ_SHOP_ID) body.shopId = process.env.CJ_SHOP_ID

  return cjRequest(`/product/conn/connection`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}
