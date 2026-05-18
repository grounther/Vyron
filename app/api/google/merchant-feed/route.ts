import { getProducts } from '@/lib/catalog'
import { buildMerchantFeed } from '@/lib/seo/merchant-feed'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const products = await getProducts()
  const xml = buildMerchantFeed(products)

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
