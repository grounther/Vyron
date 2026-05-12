import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

function clean(value: unknown, fallback = '') {
  return typeof value === 'string' ? value.trim().slice(0, 3000) : fallback
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const name = clean(body.name).slice(0, 160)
    const email = clean(body.email).slice(0, 220).toLowerCase()
    const subject = clean(body.subject || 'Support request').slice(0, 220) || 'Support request'
    const message = clean(body.message)
    const source = clean(body.source || 'website').slice(0, 80)

    if (!email || !message) {
      return NextResponse.json({ error: 'Email and message are required' }, { status: 400 })
    }

    const supabase = createAdminClient()

    if (!supabase) {
      return NextResponse.json({ ok: true, stored: false, message: 'Support ticket received without database storage.' })
    }

    const now = new Date().toISOString()
    const { data: conversation, error: conversationError } = await supabase
      .from('support_conversations')
      .insert({
        customer_name: name || null,
        customer_email: email,
        subject,
        source,
        status: 'open',
        last_message_at: now,
        updated_at: now,
      })
      .select('id, public_token')
      .single()

    if (conversationError || !conversation) {
      console.error('Support ticket conversation insert failed', conversationError)
      return NextResponse.json({ error: 'Could not create support conversation' }, { status: 500 })
    }

    await supabase.from('support_messages').insert({
      conversation_id: conversation.id,
      sender_type: 'customer',
      author_name: name || 'Customer',
      body: message,
    })

    const { error } = await supabase.from('support_tickets').insert({
      conversation_id: conversation.id,
      name,
      email,
      subject,
      message,
      source,
      status: 'open',
      updated_at: now,
    })

    if (error) {
      console.error('Support ticket insert failed', error)
      return NextResponse.json({ error: 'Could not save support ticket' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, stored: true, token: conversation.public_token })
  } catch (error) {
    console.error('Support route failed', error)
    return NextResponse.json({ error: 'Invalid support request' }, { status: 400 })
  }
}
