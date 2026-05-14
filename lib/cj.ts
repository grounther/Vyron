export const CJ_API_BASE = 'https://developers.cjdropshipping.com/api2.0/v1'

type CJBaseResponse<T> = {
  code?: number
  result?: boolean
  success?: boolean
  message?: string
  data?: T
  requestId?: string
}

type CJTokenData = {
  accessToken?: string
  accessTokenExpiryDate?: string
  refreshToken?: string
  refreshTokenExpiryDate?: string
}

export type CJInventory = {
  storageId?: string
  storageName?: string
  areaId?: string | number
  areaEn?: string
  areaCountryCode?: string
  totalInventory?: string | number
  totalInventoryNum?: string | number
  cjInventory?: string | number
  cjInventoryNum?: string | number
  factoryInventory?: string | number
  factoryInventoryNum?: string | number
  [key: string]: unknown
}

export type CJVariant = {
  vid?: string
  pid?: string
  variantName?: string
  variantNameEn?: string
  variantSku?: string
  variantKey?: string
  variantKeyEn?: string
  variantImage?: string
  variantLength?: string | number
  variantWidth?: string | number
  variantHeight?: string | number
  variantVolume?: string | number
  variantWeight?: string | number
  variantSellPrice?: string | number
  variantSugSellPrice?: string | number
  inventories?: CJInventory[]
  combineVariants?: CJVariant[]
  [key: string]: unknown
}

export type CJProductDetail = {
  pid?: string
  productName?: string
  productNameEn?: string
  productSku?: string
  bigImage?: string
  productImage?: string
  productImageSet?: string[]
  description?: string
  productWeight?: string | number
  packingWeight?: string | number
  productUnit?: string
  productType?: string
  categoryId?: string
  categoryName?: string
  entryCode?: string
  entryName?: string
  entryNameEn?: string
  productKey?: string
  productKeyEn?: string
  productPro?: string
  productProEn?: string
  productProEnSet?: string[]
  sellPrice?: string | number
  suggestSellPrice?: string
  listedNum?: string | number
  variants?: CJVariant[]
  video?: string
  videoId?: string
  videoList?: unknown[]
  [key: string]: unknown
}

export type CJSupplierMapping = {
  productSlug: string
  cjProductUrl: string
  cjProductId?: string
  cjVariantId?: string
  cjSku?: string
  warehouse: 'China' | 'EU' | 'US' | string
  estimatedProductCost: number
  estimatedShipping: number
  shippingMethod?: string
}

let cachedToken: { token: string; expiresAt: number } | null = null

function isCJSuccess<T>(response: CJBaseResponse<T>) {
  if (typeof response.result === 'boolean') return response.result
  if (typeof response.success === 'boolean') return response.success
  return response.code === 200
}

function cjErrorMessage<T>(response: CJBaseResponse<T>) {
  return [response.message || 'CJ API request failed', response.code ? `code ${response.code}` : '', response.requestId ? `requestId ${response.requestId}` : '']
    .filter(Boolean)
    .join(' - ')
}

async function getCJAccessToken() {
  const directToken = process.env.CJ_ACCESS_TOKEN
  if (directToken) return directToken

  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.token

  const apiKey = process.env.CJ_API_KEY
  if (!apiKey) throw new Error('CJ_API_KEY or CJ_ACCESS_TOKEN is not configured')

  const response = await fetch(`${CJ_API_BASE}/authentication/getAccessToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey }),
    cache: 'no-store',
  })

  if (!response.ok) throw new Error(`CJ token request failed: ${response.status}`)

  const body = (await response.json()) as CJBaseResponse<CJTokenData>
  if (!isCJSuccess(body) || !body.data?.accessToken) throw new Error(cjErrorMessage(body))

  const expiresAt = body.data.accessTokenExpiryDate ? new Date(body.data.accessTokenExpiryDate).getTime() : Date.now() + 60 * 60 * 1000
  cachedToken = { token: body.data.accessToken, expiresAt: Number.isFinite(expiresAt) ? expiresAt : Date.now() + 60 * 60 * 1000 }
  return cachedToken.token
}

export async function cjRequest<T>(path: string, options: RequestInit = {}): Promise<CJBaseResponse<T>> {
  const token = await getCJAccessToken()

  const response = await fetch(`${CJ_API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'CJ-Access-Token': token,
      ...(options.headers || {}),
    },
    cache: 'no-store',
  })

  if (!response.ok) throw new Error(`CJ API request failed: ${response.status}`)

  const body = (await response.json()) as CJBaseResponse<T>
  if (!isCJSuccess(body)) throw new Error(cjErrorMessage(body))
  return body
}

function buildQuery(params: Record<string, string | undefined>, features: string[] = []) {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value) query.set(key, value)
  })
  features.forEach((feature) => query.append('features', feature))
  const search = query.toString()
  return search ? `?${search}` : ''
}

export async function getCJProductBySku(productSku: string, countryCode?: string) {
  const query = buildQuery(
    {
      productSku: productSku.trim(),
      countryCode: countryCode?.trim().toUpperCase(),
    },
    ['enable_video'],
  )

  const response = await cjRequest<CJProductDetail>(`/product/query${query}`)
  if (!response.data) throw new Error('CJ gaf geen productdata terug.')
  return response.data
}

export async function getCJProductByPid(pid: string, countryCode?: string) {
  const query = buildQuery(
    {
      pid: pid.trim(),
      countryCode: countryCode?.trim().toUpperCase(),
    },
    ['enable_video'],
  )

  const response = await cjRequest<CJProductDetail>(`/product/query${query}`)
  if (!response.data) throw new Error('CJ gaf geen productdata terug.')
  return response.data
}

export async function addCJProductToMyProducts(productId: string) {
  const response = await cjRequest<boolean>('/product/addToMyProduct', {
    method: 'POST',
    body: JSON.stringify({ productId }),
  })
  return response.data
}

// We only trigger real CJ orders after payment is confirmed.
// Payment -> Supabase order -> CJ order creation -> CJ confirmation/payment -> tracking sync.


export type CJProductReference = {
  pid: string
  productSku: string
  variantSku: string
  sourceUrl: string
  resolvedFromPage: boolean
}

function normalizeCjUrl(input: string) {
  const value = input.trim()
  if (!/^https?:\/\//i.test(value)) return ''
  try {
    const url = new URL(value)
    const host = url.hostname.toLowerCase()
    const allowed = host === 'cjdropshipping.com' || host.endsWith('.cjdropshipping.com')
    if (!allowed) return ''
    return url.toString()
  } catch {
    return ''
  }
}

function findFirst(patterns: RegExp[], input: string) {
  for (const pattern of patterns) {
    const match = input.match(pattern)
    const value = match?.[1]?.trim()
    if (value) return value
  }
  return ''
}

function extractCjProductSkuFromHtml(html: string) {
  const raw = findFirst([
    /["']productSku["']\s*:\s*["'](CJ[A-Z0-9]{5,})["']/i,
    /["']productSKU["']\s*:\s*["'](CJ[A-Z0-9]{5,})["']/i,
    /["']spu["']\s*:\s*["'](CJ[A-Z0-9]{5,})["']/i,
    /["']sku["']\s*:\s*["'](CJ[A-Z0-9]{5,})["']/i,
    /\b(CJ[A-Z0-9]{5,})\b/i,
  ], html)

  return raw ? raw.toUpperCase() : ''
}

function extractCjPidFromHtml(html: string) {
  return findFirst([
    /["']pid["']\s*:\s*["']([A-Za-z0-9-]{8,})["']/i,
    /["']productId["']\s*:\s*["']([A-Za-z0-9-]{8,})["']/i,
    /["']id["']\s*:\s*["']([A-Za-z0-9-]{8,})["']/i,
  ], html)
}

export function extractCjProductReference(input: string): CJProductReference {
  const value = input.trim()
  const pidFromUrl = value.match(/-p-([A-Za-z0-9-]+)\.html/i)?.[1] || value.match(/[?&]pid=([A-Za-z0-9-]+)/i)?.[1] || ''
  const productSku = value.match(/\b(CJ[A-Z0-9]{5,})\b/i)?.[1]?.toUpperCase() || ''
  const variantSku = value.match(/\b(CJ[A-Z0-9-]{8,})\b/i)?.[1] || ''

  return {
    pid: pidFromUrl,
    productSku,
    variantSku: variantSku && variantSku.toUpperCase() !== productSku ? variantSku : '',
    sourceUrl: normalizeCjUrl(value),
    resolvedFromPage: false,
  }
}

export async function resolveCjProductReference(input: string, overrides: Partial<CJProductReference> = {}): Promise<CJProductReference> {
  const combined = [overrides.productSku, overrides.pid, overrides.variantSku, input].filter(Boolean).join(' ')
  const parsed = extractCjProductReference(combined)
  const sourceUrl = normalizeCjUrl(input) || parsed.sourceUrl
  let productSku = String(overrides.productSku || parsed.productSku || '').trim().toUpperCase()
  let pid = String(overrides.pid || parsed.pid || '').trim()
  let variantSku = String(overrides.variantSku || parsed.variantSku || '').trim()
  let resolvedFromPage = false

  if (sourceUrl && !productSku) {
    try {
      const response = await fetch(sourceUrl, {
        cache: 'no-store',
        headers: {
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'User-Agent': 'ASORTA Atlas CJ Importer/1.0',
        },
      })

      if (response.ok) {
        const html = await response.text()
        productSku = extractCjProductSkuFromHtml(html) || productSku
        pid = extractCjPidFromHtml(html) || pid
        resolvedFromPage = Boolean(productSku || pid)
      }
    } catch {
      // CJ product pages may block server-side HTML fetches. The importer still falls back to URL PID/API lookup.
    }
  }

  return { pid, productSku, variantSku, sourceUrl, resolvedFromPage }
}

export async function getCJProductByVariantSku(variantSku: string, countryCode?: string) {
  const query = buildQuery(
    {
      variantSku: variantSku.trim(),
      countryCode: countryCode?.trim().toUpperCase(),
    },
    ['enable_video'],
  )

  const response = await cjRequest<CJProductDetail>(`/product/query${query}`)
  if (!response.data) throw new Error('CJ gaf geen productdata terug.')
  return response.data
}

export async function queryCJProduct(params: { productSku?: string; pid?: string; variantSku?: string; countryCode?: string }) {
  const productSku = params.productSku?.trim()
  const pid = params.pid?.trim()
  const variantSku = params.variantSku?.trim()
  const countryCode = params.countryCode?.trim().toUpperCase()

  if (productSku) return getCJProductBySku(productSku, countryCode)
  if (pid) return getCJProductByPid(pid, countryCode)
  if (variantSku) return getCJProductByVariantSku(variantSku, countryCode)
  throw new Error('Geen CJ productSku, PID of variantSku gevonden.')
}
