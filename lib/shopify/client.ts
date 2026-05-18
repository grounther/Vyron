import crypto from 'node:crypto'

export type ShopifyGraphqlResponse<T> = {
  data?: T
  errors?: unknown
}

type ShopifyTokenResponse = {
  access_token?: string
  scope?: string
  expires_in?: number
  error?: string
  error_description?: string
}

type ShopifyTokenCache = {
  accessToken: string
  expiresAt: number
}

let cachedAdminToken: ShopifyTokenCache | null = null

function cleanDomain(value: string) {
  return value.trim().replace(/^https?:\/\//, '').replace(/\/$/, '')
}

function formatShopifyErrors(value: unknown): string {
  if (!value) return 'Unknown Shopify error'

  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === 'string') return item
        if (item && typeof item === 'object' && 'message' in item) {
          return String((item as { message?: unknown }).message || JSON.stringify(item))
        }

        try {
          return JSON.stringify(item)
        } catch {
          return String(item)
        }
      })
      .join('; ')
  }

  if (typeof value === 'string') return value

  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

export function shopifyGidToLegacyId(value: unknown): string {
  const raw = String(value || '').trim()
  if (!raw) return ''

  const match = raw.match(/(\d+)(?:\?.*)?$/)
  return match?.[1] || raw
}

export function getShopifyConfig() {
  const rawStoreDomain = process.env.SHOPIFY_STORE_DOMAIN || ''
  const rawShop = process.env.SHOPIFY_SHOP || ''
  const apiVersion = process.env.SHOPIFY_API_VERSION || '2026-04'

  const shop = rawShop
    ? rawShop.trim().replace(/\.myshopify\.com$/i, '')
    : rawStoreDomain
      ? cleanDomain(rawStoreDomain).replace(/\.myshopify\.com$/i, '')
      : ''

  const storeDomain = rawStoreDomain
    ? cleanDomain(rawStoreDomain)
    : shop
      ? `${shop}.myshopify.com`
      : ''

  const checkoutDomain = cleanDomain(
    process.env.SHOPIFY_CHECKOUT_DOMAIN ||
      process.env.SHOPIFY_STORE_DOMAIN ||
      (shop ? `${shop}.myshopify.com` : '')
  )

  return {
    storeDomain,
    checkoutDomain,
    shop,
    adminToken: process.env.SHOPIFY_ADMIN_ACCESS_TOKEN || '',
    clientId: process.env.SHOPIFY_CLIENT_ID || '',
    clientSecret: process.env.SHOPIFY_CLIENT_SECRET || '',
    webhookSecret: process.env.SHOPIFY_WEBHOOK_SECRET || '',
    apiVersion,
  }
}

export function hasShopifyAdminConfig() {
  const config = getShopifyConfig()

  return Boolean(
    config.storeDomain &&
      (
        (config.clientId && config.clientSecret) ||
        config.adminToken
      )
  )
}

export async function getShopifyAdminAccessToken(): Promise<string> {
  const config = getShopifyConfig()

  if (!config.storeDomain || !config.shop) {
    throw new Error('Missing Shopify config: SHOPIFY_STORE_DOMAIN or SHOPIFY_SHOP.')
  }

  // Prefer permanent Dev Dashboard credentials.
  // SHOPIFY_ADMIN_ACCESS_TOKEN is only a legacy fallback.
  if (config.clientId && config.clientSecret) {
    const now = Date.now()

    if (cachedAdminToken && cachedAdminToken.expiresAt > now + 60_000) {
      return cachedAdminToken.accessToken
    }

    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: config.clientId,
      client_secret: config.clientSecret,
    })

    const response = await fetch(
      `https://${config.shop}.myshopify.com/admin/oauth/access_token`,
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
        cache: 'no-store',
      }
    )

    const text = await response.text()

    let data: ShopifyTokenResponse

    try {
      data = JSON.parse(text) as ShopifyTokenResponse
    } catch {
      throw new Error(`Shopify token request failed: ${text}`)
    }

    if (!response.ok || !data.access_token) {
      throw new Error(
        `Shopify token request failed: ${data.error_description || data.error || text}`
      )
    }

    cachedAdminToken = {
      accessToken: data.access_token,
      expiresAt: now + ((data.expires_in || 3600) * 1000),
    }

    return data.access_token
  }

  if (config.adminToken) {
    return config.adminToken
  }

  throw new Error(
    'Missing Shopify credentials. Set SHOPIFY_CLIENT_ID and SHOPIFY_CLIENT_SECRET in Vercel.'
  )
}

export async function shopifyAdminGraphql<T>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const config = getShopifyConfig()
  const accessToken = await getShopifyAdminAccessToken()

  if (!config.storeDomain) {
    throw new Error('SHOPIFY_STORE_DOMAIN ontbreekt.')
  }

  const response = await fetch(
    `https://${config.storeDomain}/admin/api/${config.apiVersion}/graphql.json`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken,
      },
      body: JSON.stringify({ query, variables }),
      cache: 'no-store',
    }
  )

  const body = (await response.json().catch(() => ({}))) as ShopifyGraphqlResponse<T>

  if (!response.ok || body.errors) {
    throw new Error(
      `Shopify Admin GraphQL request failed: ${formatShopifyErrors(body.errors || body)}`
    )
  }

  if (!body.data) {
    throw new Error('Shopify gaf geen data terug.')
  }

  return body.data
}

export async function shopifyAdminRest<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const config = getShopifyConfig()
  const accessToken = await getShopifyAdminAccessToken()

  if (!config.storeDomain) {
    throw new Error('SHOPIFY_STORE_DOMAIN ontbreekt.')
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const headers = new Headers(init.headers)

  headers.set('Content-Type', headers.get('Content-Type') || 'application/json')
  headers.set('X-Shopify-Access-Token', accessToken)

  const response = await fetch(
    `https://${config.storeDomain}/admin/api/${config.apiVersion}${normalizedPath}`,
    {
      ...init,
      headers,
      cache: 'no-store',
    }
  )

  const body = (await response.json().catch(() => ({}))) as T & { errors?: unknown }

  if (!response.ok) {
    throw new Error(
      `Shopify Admin REST request failed: HTTP ${response.status} ${formatShopifyErrors(body.errors || body)}`
    )
  }

  return body
}

export function verifyShopifyWebhook(rawBody: string, hmacHeader: string | null): boolean {
  const secret = getShopifyConfig().webhookSecret

  if (!secret || !hmacHeader) return false

  const calculated = crypto
    .createHmac('sha256', secret)
    .update(rawBody, 'utf8')
    .digest('base64')

  const received = Buffer.from(hmacHeader, 'base64')
  const expected = Buffer.from(calculated, 'base64')

  if (received.length !== expected.length) return false

  return crypto.timingSafeEqual(received, expected)
}
