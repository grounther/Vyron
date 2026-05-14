import { NextResponse } from 'next/server'
import { requireAtlasAdminApi, requireInternalToken } from '@/lib/server/atlas-api'
import { createFulfillmentForOrder } from '@/lib/fulfillment/router'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const orderId = String(body.orderId || '').trim()
  if (!orderId) return NextResponse.json({ error: 'Missing orderId.' }, { status: 400 })

  let adminAuth = await requireAtlasAdminApi()
  if (!adminAuth.ok && !requireInternalToken(request, 'INTERNAL_FULFILLMENT_TOKEN')) return adminAuth.response

  if (!adminAuth.ok) {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const admin = createAdminClient()
    if (!admin) return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY ontbreekt.' }, { status: 503 })
    const result = await createFulfillmentForOrder(admin, orderId)
    return NextResponse.json({ ok: true, ...result })
  }

  try {
    const result = await createFulfillmentForOrder(adminAuth.admin, orderId)
    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Fulfillment failed.' }, { status: 500 })
  }
}
