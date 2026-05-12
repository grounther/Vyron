import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendResendEmail } from '@/lib/newsletter'

function clean(value: unknown, limit = 3000) {
  return typeof value === 'string' ? value.trim().slice(0, limit) : ''
}

async function getConversation(token: string) {
  const supabase = createAdminClient()
  if (!supabase) return { supabase: null, conversation: null, error: 'Support database is niet geconfigureerd.' }

  const { data: conversation, error } = await supabase
    .from('support_conversations')
    .select('id, public_token, customer_name, customer_email, status, subject')
    .eq('public_token', token)
    .maybeSingle()

  if (error || !conversation) return { supabase, conversation: null, error: 'Chat niet gevonden.' }
  return { supabase, conversation, error: null }
}

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const { supabase, conversation, error } = await getConversation(token)
  if (!supabase || !conversation) return NextResponse.json({ error }, { status: 404 })

  const { data: messages, error: messagesError } = await supabase
    .from('support_messages')
    .select('id, sender_type, author_name, body, created_at')
    .eq('conversation_id', conversation.id)
    .order('created_at', { ascending: true })

  if (messagesError) return NextResponse.json({ error: 'Berichten konden niet worden geladen.' }, { status: 500 })

  return NextResponse.json({ conversation, messages: messages || [] })
}

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const body = await request.json().catch(() => ({}))
  const message = clean(body.message)

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

  await supabase
    .from('support_conversations')
    .update({ status: 'open', last_message_at: new Date().toISOString() })
    .eq('id', conversation.id)

  await sendResendEmail({
    to: 'info@asorta.nl',
    subject: `Nieuw bericht in ASORTA chat: ${conversation.subject || 'Support'}`,
    html: `<p>Nieuw bericht van ${conversation.customer_email || 'customer'}:</p><p>${message.replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[char] || char)).replace(/\n/g, '<br/>')}</p><p>Open Atlas Support Center om te antwoorden.</p>`,
    replyTo: conversation.customer_email || 'info@asorta.nl',
  })

  const { data: freshConversation } = await supabase
    .from('support_conversations')
    .select('id, public_token, customer_name, customer_email, status, subject')
    .eq('id', conversation.id)
    .single()

  const { data: messages } = await supabase
    .from('support_messages')
    .select('id, sender_type, author_name, body, created_at')
    .eq('conversation_id', conversation.id)
    .order('created_at', { ascending: true })

  return NextResponse.json({ conversation: freshConversation || conversation, messages: messages || [] })
}
