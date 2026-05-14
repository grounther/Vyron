import crypto from 'node:crypto'

export type ShopifyGraphqlResponse<T> = {
  data?: T
  errors?: Array<{ message: string; [key: string]: unknown }>
}

export function getShopifyConfig() {
  const storeDomain = process.env.SHOPIFY_STORE_DOMAIN?.replace(/^https?:\/\//, '').replace(/\/$/, '') || ''
  const adminToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN || ''
  const webhookSecret = process.env.SHOPIFY_WEBHOOK_SECRET || ''
  const apiVersion = process.env.SHOPIFY_API_VERSION || '2026-04'
  return { storeDomain, adminToken, webhookSecret, apiVersion }
}

export function hasShopifyAdminConfig() {
  const { storeDomain, adminToken } = getShopifyConfig()
  return Boolean(storeDomain && adminToken)
}

export async function shopifyAdminGraphql<T>(query: string, variables?: Record<string, unknown>) {
  const { storeDomain, adminToken, apiVersion } = getShopifyConfig()
  if (!storeDomain || !adminToken) throw new Error('SHOPIFY_STORE_DOMAIN of SHOPIFY_ADMIN_ACCESS_TOKEN ontbreekt.')

  const response = await fetch(`https://${storeDomain}/admin/api/${apiVersion}/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': adminToken,
    },
    body: JSON.stringify({ query, variables }),
    cache: 'no-store',
  })

  const body = (await response.json().catch(() => ({}))) as ShopifyGraphqlResponse<T>
  if (!response.ok || body.errors?.length) {
    const detail = body.errors?.map((error) => error.message).join('; ') || `HTTP ${response.status}`
    throw new Error(`Shopify Admin GraphQL request failed: ${detail}`)
  }

  if (!body.data) throw new Error('Shopify gaf geen data terug.')
  return body.data
}

export async function shopifyAdminRest<T>(path: string, init: RequestInit = {}) {
  const { storeDomain, adminToken, apiVersion } = getShopifyConfig()
  if (!storeDomain || !adminToken) throw new Error('SHOPIFY_STORE_DOMAIN of SHOPIFY_ADMIN_ACCESS_TOKEN ontbreekt.')

  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const response = await fetch(`https://${storeDomain}/admin/api/${apiVersion}${normalizedPath}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': adminToken,
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
