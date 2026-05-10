import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

function clean(value: unknown, fallback = '') {
  return typeof value === 'string' ? value.trim().slice(0, 3000) : fallback
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const name = clean(body.name).slice(0, 160)
    const email = clean(body.email).slice(0, 220)
    const subject = clean(body.subject || 'Support request').slice(0, 220)
    const message = clean(body.message)
    const source = clean(body.source || 'website').slice(0, 80)

    if (!email || !message) {
      return NextResponse.json({ error: 'Email and message are required' }, { status: 400 })
    }

    const supabase = createAdminClient()

    if (!supabase) {
      return NextResponse.json({ ok: true, stored: false, message: 'Support ticket received without database storage.' })
    }

    const { error } = await supabase.from('support_tickets').insert({
      name,
      email,
      subject,
      message,
      source,
      status: 'new',
    })

    if (error) {
      console.error('Support ticket insert failed', error)
      return NextResponse.json({ error: 'Could not save support ticket' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, stored: true })
  } catch (error) {
    console.error('Support route failed', error)
    return NextResponse.json({ error: 'Invalid support request' }, { status: 400 })
  }
}
