import { GET as merchantFeedGET } from '../merchant-feed/route'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  return merchantFeedGET()
}
