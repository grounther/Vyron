import crypto from 'node:crypto'

export type ShopifyGraphqlResponse<T> = {
  data?: T
  errors?: unknown
}

function normalizeShopifyErrors(value: unknown): string[] {
  if (!value) return []
  if (Array.isArray(value)) {
    return value.map((item) => {
      if (typeof item === 'string') return item
      if (item && typeof item === 'object' && 'message' in item) return String((item as { message?: unknown }).message || JSON.stringify(item))
      return JSON.stringify(item)
    })
  }
  if (typeof value === 'string') return [value]
  if (typeof value === 'object') return [JSON.stringify(value)]
  return [String(value)]
}

type CachedToken = {
  token: string
  expiresAt: number
}

let cachedClientCredentialsToken: CachedToken | null = null

function cleanDomain(value: string) {
  return value.replace(/^https?:\/\//, '').replace(/\/$/, '').trim()
}

function deriveStoreDomain() {
  const explicitDomain = process.env.SHOPIFY_STORE_DOMAIN?.trim()
  if (explicitDomain) return cleanDomain(explicitDomain)

  const shop = process.env.SHOPIFY_SHOP?.trim().replace(/\.myshopify\.com$/i, '')
  return shop ? `${shop}.myshopify.com` : ''
}

export function getShopifyConfig() {
  const storeDomain = deriveStoreDomain()
  const checkoutDomain = cleanDomain(process.env.SHOPIFY_CHECKOUT_DOMAIN || storeDomain || '')
  const adminToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN || ''
  const clientId = process.env.SHOPIFY_CLIENT_ID || ''
  const clientSecret = process.env.SHOPIFY_CLIENT_SECRET || ''
  const webhookSecret = process.env.SHOPIFY_WEBHOOK_SECRET || ''
  const apiVersion = process.env.SHOPIFY_API_VERSION || '2026-04'
  const shop = storeDomain.replace(/\.myshopify\.com$/i, '')

  return { storeDomain, checkoutDomain, adminToken, clientId, clientSecret, webhookSecret, apiVersion, shop }
}

export function hasShopifyAdminConfig() {
  const { storeDomain, adminToken, clientId, clientSecret } = getShopifyConfig()
  return Boolean(storeDomain && (adminToken || (clientId && clientSecret)))
}

async function requestClientCredentialsToken() {
  const { storeDomain, clientId, clientSecret } = getShopifyConfig()
  if (!storeDomain || !clientId || !clientSecret) {
    throw new Error('Shopify Admin config ontbreekt. Zet SHOPIFY_STORE_DOMAIN plus SHOPIFY_ADMIN_ACCESS_TOKEN of SHOPIFY_CLIENT_ID/SHOPIFY_CLIENT_SECRET.')
  }

  const response = await fetch(`https://${storeDomain}/admin/oauth/access_token`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    }),
    cache: 'no-store',
  })

  const body = (await response.json().catch(() => ({}))) as { access_token?: string; expires_in?: number; error?: string; error_description?: string }

  if (!response.ok || !body.access_token) {
    throw new Error(`Shopify client-credentials token failed: ${body.error_description || body.error || `HTTP ${response.status}`}`)
  }

  const expiresInSeconds = Number(body.expires_in || 86399)
  cachedClientCredentialsToken = {
    token: body.access_token,
    expiresAt: Date.now() + Math.max(60, expiresInSeconds - 300) * 1000,
  }

  return cachedClientCredentialsToken.token
}

export async function getShopifyAdminAccessToken() {
  const { adminToken, clientId, clientSecret } = getShopifyConfig()
  if (adminToken) return adminToken

  if (!clientId || !clientSecret) {
    throw new Error('SHOPIFY_ADMIN_ACCESS_TOKEN ontbreekt en SHOPIFY_CLIENT_ID/SHOPIFY_CLIENT_SECRET zijn niet gezet.')
  }

  if (cachedClientCredentialsToken && cachedClientCredentialsToken.expiresAt > Date.now()) {
    return cachedClientCredentialsToken.token
  }

  return requestClientCredentialsToken()
}

export async function shopifyAdminGraphql<T>(query: string, variables?: Record<string, unknown>) {
  const { storeDomain, apiVersion } = getShopifyConfig()
  const token = await getShopifyAdminAccessToken()
  if (!storeDomain) throw new Error('SHOPIFY_STORE_DOMAIN ontbreekt.')

  const response = await fetch(`https://${storeDomain}/admin/api/${apiVersion}/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': token,
    },
    body: JSON.stringify({ query, variables }),
    cache: 'no-store',
  })

  const body = (await response.json().catch(() => ({}))) as ShopifyGraphqlResponse<T>
  const errors = normalizeShopifyErrors(body.errors)
  if (!response.ok || errors.length) {
    const detail = errors.join('; ') || `HTTP ${response.status}`
    throw new Error(`Shopify Admin GraphQL request failed: ${detail}`)
  }

  if (!body.data) throw new Error('Shopify gaf geen data terug.')
  return body.data
}

export async function shopifyAdminRest<T>(path: string, init: RequestInit = {}) {
  const { storeDomain, apiVersion } = getShopifyConfig()
  const token = await getShopifyAdminAccessToken()
  if (!storeDomain) throw new Error('SHOPIFY_STORE_DOMAIN ontbreekt.')

  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const response = await fetch(`https://${storeDomain}/admin/api/${apiVersion}${normalizedPath}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': token,
      ...(init.headers || {}),
    },
    cache: 'no-store',
  })

  const body = (await response.json().catch(() => ({}))) as T & { errors?: unknown }
  if (!response.ok) {
    throw new Error(`Shopify Admin REST request failed: HTTP ${response.status} ${JSON.stringify(body.errors || body).slice(0, 600)}`)
  }
  return body
}

export function verifyShopifyWebhook(rawBody: string, hmacHeader: string | null) {
  const secret = getShopifyConfig().webhookSecret
  if (!secret || !hmacHeader) return false

  const calculated = crypto.createHmac('sha256', secret).update(rawBody, 'utf8').digest('base64')
  const received = Buffer.from(hmacHeader, 'base64')
  const expected = Buffer.from(calculated, 'base64')
  if (received.length !== expected.length) return false
  return crypto.timingSafeEqual(received, expected)
}

export function shopifyGidToLegacyId(value: unknown) {
  const raw = String(value || '').trim()
  if (!raw) return ''
  const match = raw.match(/(\d+)(?:\?.*)?$/)
  return match?.[1] || raw
}
