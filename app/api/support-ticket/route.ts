import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendSupportEmail, supportCustomerConfirmationTemplate, supportInternalNotificationTemplate } from '@/lib/support'

function clean(value: unknown, fallback = '') {
  return typeof value === 'string' ? value.trim().slice(0, 4000) : fallback
}

function ticketNumber() {
  const date = new Date()
  const stamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`
  const random = Math.random().toString(36).slice(2, 7).toUpperCase()
  return `AS-${stamp}-${random}`
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const name = clean(body.name).slice(0, 160)
    const email = clean(body.email).slice(0, 220).toLowerCase()
    const subject = clean(body.subject || 'Support request').slice(0, 220)
    const message = clean(body.message)
    const source = clean(body.source || 'support-widget').slice(0, 80)
    const page = clean(body.page || '').slice(0, 500)

    if (!email || !message || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email and message are required' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const number = ticketNumber()

    if (!supabase) {
      await sendSupportEmail({
        to: email,
        subject: `ASORTA support ticket ${number}`,
        html: supportCustomerConfirmationTemplate(number, name, message),
      })
      return NextResponse.json({ ok: true, stored: false, ticketNumber: number })
    }

    const { data: conversation } = await supabase
      .from('support_conversations')
      .insert({
        customer_name: name || null,
        customer_email: email,
        status: 'open',
        source,
        last_message_at: new Date().toISOString(),
        metadata: { page },
      })
      .select('id')
      .single()

    const { data: ticket, error } = await supabase
      .from('support_tickets')
      .insert({
        ticket_number: number,
        conversation_id: conversation?.id || null,
        name,
        email,
        subject,
        message,
        source,
        status: 'new',
        priority: 'normal',
        page_url: page || null,
      })
      .select('id,ticket_number')
      .single()

    if (error) {
      console.error('Support ticket insert failed', error)
      return NextResponse.json({ error: 'Could not save support ticket' }, { status: 500 })
    }

    if (conversation?.id) {
      await supabase.from('support_messages').insert({
        conversation_id: conversation.id,
        ticket_id: ticket.id,
        sender_type: 'customer',
        sender_name: name || null,
        sender_email: email,
        message,
      })
    }

    await Promise.allSettled([
      sendSupportEmail({
        to: email,
        subject: `ASORTA support ticket ${number}`,
        html: supportCustomerConfirmationTemplate(number, name, message),
        replyTo: process.env.SUPPORT_REPLY_TO || 'info@asorta.nl',
      }),
      sendSupportEmail({
        to: process.env.SUPPORT_NOTIFY_TO || 'info@asorta.nl',
        subject: `Nieuw supportticket ${number}: ${subject}`,
        html: supportInternalNotificationTemplate(number, email, subject, message),
        replyTo: email,
      }),
    ])

    return NextResponse.json({ ok: true, stored: true, ticketNumber: number })
  } catch (error) {
    console.error('Support route failed', error)
    return NextResponse.json({ error: 'Invalid support request' }, { status: 400 })
  }
}
