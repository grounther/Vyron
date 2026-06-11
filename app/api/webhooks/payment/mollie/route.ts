import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { processMolliePayment } from '@/lib/checkout/mollie'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const admin = createAdminClient()
  if (!admin) return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY ontbreekt.' }, { status: 503 })

  try {
    const formData = await request.formData().catch(() => null)
    const paymentId = String(formData?.get('id') || '').trim()
    if (!paymentId) return NextResponse.json({ error: 'Missing Mollie payment id.' }, { status: 400 })

    const result = await processMolliePayment(admin, paymentId)
    return NextResponse.json({ ok: true, paymentStatus: result.status, paid: result.paid })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Mollie webhook failed.' }, { status: 500 })
  }
}
