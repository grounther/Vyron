export const CJ_API_BASE = 'https://developers.cjdropshipping.com/api2.0/v1'

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

export async function cjRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = process.env.CJ_ACCESS_TOKEN
  if (!token) throw new Error('CJ_ACCESS_TOKEN is not configured')

  const response = await fetch(`${CJ_API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'CJ-Access-Token': token,
      ...(options.headers || {})
    },
    cache: 'no-store'
  })

  if (!response.ok) {
    throw new Error(`CJ API request failed: ${response.status}`)
  }

  return response.json() as Promise<T>
}

// We only trigger real CJ orders after payment is confirmed.
// Payment -> Supabase order -> CJ createOrderV2 -> CJ confirmOrder -> tracking sync.
