import { NextResponse } from 'next/server'
import { cleanupCancelledOrders } from '@/lib/checkout/cleanup'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET?.trim()
  if (!secret) return process.env.NODE_ENV !== 'production'
  return request.headers.get('authorization') === `Bearer ${secret}`
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized cron request. Set CRON_SECRET in Vercel.' }, { status: 401 })
  }

  const admin = createAdminClient()
  if (!admin) {
    return NextResponse.json({ error: 'Supabase admin client ontbreekt.' }, { status: 500 })
  }

  const result = await cleanupCancelledOrders(admin, { source: 'vercel_cron_orders_cleanup', olderThanHours: 24 })
  if (!result.ok) return NextResponse.json(result, { status: 500 })
  return NextResponse.json(result)
}
