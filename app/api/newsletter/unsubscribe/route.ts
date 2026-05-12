import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isValidEmail, normalizeEmail } from '@/lib/newsletter'

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const email = normalizeEmail(String(body.email || ''))

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: 'Ongeldig e-mailadres.' }, { status: 400 })
  }

  const admin = createAdminClient()
  if (!admin) return NextResponse.json({ error: 'Database niet geconfigureerd.' }, { status: 500 })

  const { error } = await admin
    .from('newsletter_subscribers')
    .update({ status: 'unsubscribed', updated_at: new Date().toISOString() })
    .eq('email', email)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
