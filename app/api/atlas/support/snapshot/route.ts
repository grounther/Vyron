import { NextResponse } from 'next/server'
import { getAtlasSupportSnapshot, requireAtlasAdminApi } from '@/lib/support-admin'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const auth = await requireAtlasAdminApi()
  if ('error' in auth) return auth.error
  const { admin } = auth

  const url = new URL(request.url)
  const selectedId = url.searchParams.get('id') || null

  return NextResponse.json(await getAtlasSupportSnapshot(admin, selectedId))
}
