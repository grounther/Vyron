import { NextResponse } from 'next/server'
import { sendResendEmail } from '@/lib/newsletter'
import { cleanText, escapeHtml, getCustomerSupportSnapshot } from '@/lib/support-admin'
import { createAdminClient } from '@/lib/supabase/admin'

function supportEmailHtml(input: { name: string; email: string; subject: string; message: string; token: string }) {
  return `<!doctype html><html><body style="margin:0;background:#050505;color:#f4f4f4;font-family:Arial,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#050505;padding:32px 12px;"><tr><td align="center"><table width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background:#0b0b0b;border:1px solid rgba(255,255,255,.12);border-radius:24px;overflow:hidden;"><tr><td style="padding:34px 30px;"><div style="font-size:12px;letter-spacing:.28em;text-transform:uppercase;color:#b7c8ad;font-weight:800;">ASORTA Support</div><h1 style="margin:14px 0 0;font-size:30px;line-height:1.1;color:#fff;">Nieuw support gesprek</h1><p style="color:rgba(255,255,255,.70);line-height:1.7;"><strong>Naam:</strong> ${escapeHtml(input.name || 'Onbekend')}<br/><strong>E-mail:</strong> ${escapeHtml(input.email)}<br/><strong>Onderwerp:</strong> ${escapeHtml(input.subject)}<br/><strong>Chat:</strong> ${escapeHtml(input.token.slice(0, 8))}</p><div style="margin-top:20px;padding:18px;border-radius:18px;background:rgba(255,255,255,.06);color:rgba(255,255,255,.82);line-height:1.7;">${escapeHtml(input.message).replace(/\n/g, '<br/>')}</div><p style="margin-top:24px;color:rgba(255,255,255,.42);font-size:12px;">Beantwoord dit gesprek in Atlas Support Center.</p></td></tr></table></td></tr></table></body></html>`
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const name = cleanText(body.name, 160)
    const email = cleanText(body.email, 220).toLowerCase()
    const subject = cleanText(body.subject || 'Support request', 220) || 'Support request'
    const message = cleanText(body.message)
    const source = cleanText(body.source || 'website', 80)

    if (!email || !message) {
      return NextResponse.json({ error: 'E-mail en bericht zijn verplicht.' }, { status: 400 })
    }

    const supabase = createAdminClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Support database is niet geconfigureerd.' }, { status: 500 })
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
      .select('id, public_token, customer_name, customer_email, status, subject, last_message_at, created_at, updated_at')
      .single()

    if (conversationError || !conversation) {
      console.error('Support conversation insert failed', conversationError)
      return NextResponse.json({ error: 'Chat kon niet worden gestart. Controleer of de support SQL-migratie is uitgevoerd.' }, { status: 500 })
    }

    const { error: messageError } = await supabase.from('support_messages').insert({
      conversation_id: conversation.id,
      sender_type: 'customer',
      author_name: name || 'Customer',
      body: message,
    })

    if (messageError) {
      console.error('Support message insert failed', messageError)
      return NextResponse.json({ error: 'Bericht kon niet worden opgeslagen.' }, { status: 500 })
    }

    await supabase.from('support_tickets').insert({
      conversation_id: conversation.id,
      name,
      email,
      subject,
      message,
      source,
      status: 'open',
      updated_at: now,
    })

    await sendResendEmail({
      to: 'info@asorta.nl',
      subject: `Nieuwe ASORTA support chat: ${subject}`,
      html: supportEmailHtml({ name, email, subject, message, token: conversation.public_token }),
      replyTo: email,
    })

    const snapshot = await getCustomerSupportSnapshot(supabase, conversation.public_token)
    return NextResponse.json(snapshot || { conversation, messages: [] })
  } catch (error) {
    console.error('Support conversation route failed', error)
    return NextResponse.json({ error: 'Ongeldig support verzoek.' }, { status: 400 })
  }
}
