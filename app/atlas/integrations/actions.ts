'use server'

import { revalidatePath } from 'next/cache'
import { assertAtlasAdmin } from '@/lib/atlas-auth'
import { syncShopifyProducts } from '@/lib/shopify/sync'

export async function runShopifySync(formData: FormData) {
  const { admin } = await assertAtlasAdmin('/atlas/integrations')
  const limit = Math.min(Math.max(Number(formData.get('limit') || 50), 1), 200)
  const result = await syncShopifyProducts(admin, { limit, source: 'manual' })
  revalidatePath('/atlas/integrations')
  revalidatePath('/atlas/products')
  return result
}
