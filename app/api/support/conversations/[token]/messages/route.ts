import { NextResponse } from 'next/server'
import { sendResendEmail } from '@/lib/newsletter'
import { cleanText, escapeHtml, getCustomerSupportSnapshot } from '@/lib/support-admin'
import { createAdminClient } from '@/lib/supabase/admin'

async function getConversation(token: string) {
  const supabase = createAdminClient()
  if (!supabase) return { supabase: null, conversation: null, error: 'Support database is niet geconfigureerd.' }

  const { data: conversation, error } = await supabase
    .from('support_conversations')
    .select('id, public_token, customer_name, customer_email, status, subject, last_message_at, updated_at')
    .eq('public_token', token)
    .maybeSingle()

  if (error || !conversation) return { supabase, conversation: null, error: 'Chat niet gevonden.' }
  return { supabase, conversation, error: null }
}

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = createAdminClient()
  if (!supabase) return NextResponse.json({ error: 'Support database is niet geconfigureerd.' }, { status: 500 })

  const snapshot = await getCustomerSupportSnapshot(supabase, token)
  if (!snapshot) return NextResponse.json({ error: 'Chat niet gevonden.' }, { status: 404 })

  return NextResponse.json(snapshot)
}

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const body = await request.json().catch(() => ({}))
  const message = cleanText(body.message)

  if (!message) return NextResponse.json({ error: 'Bericht is verplicht.' }, { status: 400 })

  const { supabase, conversation, error } = await getConversation(token)
  if (!supabase || !conversation) return NextResponse.json({ error }, { status: 404 })

  if (conversation.status === 'closed') {
    return NextResponse.json({ error: 'Deze chat is gesloten.' }, { status: 409 })
  }

  const { error: insertError } = await supabase.from('support_messages').insert({
    conversation_id: conversation.id,
    sender_type: 'customer',
    author_name: conversation.customer_name || 'Customer',
    body: message,
  })

  if (insertError) return NextResponse.json({ error: 'Bericht kon niet worden verzonden.' }, { status: 500 })

  const now = new Date().toISOString()
  await supabase
    .from('support_conversations')
    .update({ status: 'open', last_message_at: now, updated_at: now })
    .eq('id', conversation.id)

  await supabase
    .from('support_tickets')
    .update({ status: 'open', updated_at: now })
    .eq('conversation_id', conversation.id)

  await sendResendEmail({
    to: 'info@asorta.nl',
    subject: `Nieuw bericht in ASORTA chat: ${conversation.subject || 'Support'}`,
    html: `<p>Nieuw bericht van ${escapeHtml(conversation.customer_email || 'customer')}:</p><p>${escapeHtml(message).replace(/\n/g, '<br/>')}</p><p>Open Atlas Support Center om te antwoorden.</p>`,
    replyTo: conversation.customer_email || 'info@asorta.nl',
  })

  return NextResponse.json(await getCustomerSupportSnapshot(supabase, token))
}
