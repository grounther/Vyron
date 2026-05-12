'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendResendEmail } from '@/lib/newsletter'

async function requireAdmin() {
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user?.email) redirect('/atlas-access?next=/atlas/support')

  const admin = createAdminClient()
  if (!admin) throw new Error('SUPABASE_SERVICE_ROLE_KEY ontbreekt')

  const { data } = await admin.from('admin_users').select('email').eq('email', user.email).eq('active', true).maybeSingle()
  if (!data) throw new Error('Geen Atlas rechten')

  return { admin, user }
}

function clean(value: FormDataEntryValue | null, limit = 3000) {
  return typeof value === 'string' ? value.trim().slice(0, limit) : ''
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[char] || char))
}

type TranscriptMessage = {
  sender_type: 'customer' | 'operator' | 'system'
  author_name: string | null
  body: string
  created_at: string
}

function transcriptHtml(input: {
  subject: string | null
  customerName: string | null
  publicToken: string
  messages: TranscriptMessage[]
}) {
  const rows = input.messages.map((message) => {
    const label = message.sender_type === 'customer' ? (input.customerName || 'Klant') : message.sender_type === 'operator' ? 'ASORTA Support' : 'Systeem'
    const date = new Date(message.created_at).toLocaleString('nl-NL')
    return `<div style="margin:0 0 14px;padding:16px;border-radius:18px;background:${message.sender_type === 'customer' ? 'rgba(255,255,255,.08)' : 'rgba(183,200,173,.10)'};border:1px solid rgba(255,255,255,.10);"><div style="font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#b7c8ad;font-weight:800;">${escapeHtml(label)} · ${escapeHtml(date)}</div><div style="margin-top:8px;color:rgba(255,255,255,.82);line-height:1.7;">${escapeHtml(message.body).replace(/\n/g, '<br/>')}</div></div>`
  }).join('')

  return `<!doctype html><html><body style="margin:0;background:#050505;color:#f4f4f4;font-family:Arial,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#050505;padding:32px 12px;"><tr><td align="center"><table width="100%" cellpadding="0" cellspacing="0" style="max-width:680px;background:#0b0b0b;border:1px solid rgba(255,255,255,.12);border-radius:24px;overflow:hidden;"><tr><td style="padding:34px 30px;"><div style="font-size:12px;letter-spacing:.28em;text-transform:uppercase;color:#b7c8ad;font-weight:800;">ASORTA Support</div><h1 style="margin:14px 0 0;font-size:30px;line-height:1.1;color:#fff;">Kopie van je supportgesprek</h1><p style="color:rgba(255,255,255,.68);line-height:1.7;">Hi ${escapeHtml(input.customerName || 'daar')}, hierbij ontvang je een kopie van je afgesloten supportgesprek.</p><p style="color:rgba(255,255,255,.45);font-size:13px;line-height:1.7;"><strong>Onderwerp:</strong> ${escapeHtml(input.subject || 'Support request')}<br/><strong>Chat:</strong> ${escapeHtml(input.publicToken.slice(0, 8))}</p><div style="margin-top:22px;">${rows || '<p style="color:rgba(255,255,255,.55);">Geen berichten gevonden.</p>'}</div><p style="margin-top:28px;color:rgba(255,255,255,.38);font-size:12px;line-height:1.6;">ASORTA — Just what you need.</p></td></tr></table></td></tr></table></body></html>`
}

export async function replyToSupportConversation(formData: FormData) {
  const { admin, user } = await requireAdmin()
  const conversationId = clean(formData.get('conversation_id'), 80)
  const message = clean(formData.get('message'))

  if (!conversationId || !message) return

  const { data: conversation } = await admin
    .from('support_conversations')
    .select('id, customer_email, customer_name, subject, public_token, status')
    .eq('id', conversationId)
    .single()

  if (!conversation || conversation.status === 'closed') return

  await admin.from('support_messages').insert({
    conversation_id: conversationId,
    sender_type: 'operator',
    author_name: 'ASORTA Support',
    body: message,
  })

  await admin
    .from('support_conversations')
    .update({ status: 'answered', assigned_to: user.email, last_message_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', conversationId)

  if (conversation.customer_email) {
    await sendResendEmail({
      to: conversation.customer_email,
      subject: `ASORTA Support: ${conversation.subject || 'antwoord op je vraag'}`,
      html: `<!doctype html><html><body style="margin:0;background:#050505;color:#f4f4f4;font-family:Arial,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#050505;padding:32px 12px;"><tr><td align="center"><table width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background:#0b0b0b;border:1px solid rgba(255,255,255,.12);border-radius:24px;overflow:hidden;"><tr><td style="padding:34px 30px;"><div style="font-size:12px;letter-spacing:.28em;text-transform:uppercase;color:#b7c8ad;font-weight:800;">ASORTA Support</div><h1 style="margin:14px 0 0;font-size:30px;line-height:1.1;color:#fff;">We hebben gereageerd</h1><div style="margin-top:20px;padding:18px;border-radius:18px;background:rgba(255,255,255,.06);color:rgba(255,255,255,.82);line-height:1.7;">${escapeHtml(message).replace(/\n/g, '<br/>')}</div><p style="margin-top:24px;color:rgba(255,255,255,.50);line-height:1.6;">Je kunt direct verder praten via de live chat op asorta.nl/contact.</p></td></tr></table></td></tr></table></body></html>`,
      replyTo: 'info@asorta.nl',
    })
  }

  revalidatePath('/atlas/support')
}

export async function updateSupportStatus(formData: FormData) {
  const { admin, user } = await requireAdmin()
  const conversationId = clean(formData.get('conversation_id'), 80)
  const status = clean(formData.get('status'), 40)

  if (!conversationId || !['open', 'pending', 'answered', 'closed'].includes(status)) return

  await admin
    .from('support_conversations')
    .update({ status, assigned_to: user.email, updated_at: new Date().toISOString() })
    .eq('id', conversationId)

  if (status === 'closed') {
    await admin.from('support_messages').insert({
      conversation_id: conversationId,
      sender_type: 'system',
      author_name: 'ASORTA System',
      body: 'Dit supportgesprek is gesloten door ASORTA Support. Je kunt een nieuw gesprek starten als je meer hulp nodig hebt.',
    })
  }

  await admin
    .from('support_tickets')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)

  revalidatePath('/atlas/support')
}

export async function emailAndDeleteClosedConversation(formData: FormData) {
  const { admin, user } = await requireAdmin()
  const conversationId = clean(formData.get('conversation_id'), 80)
  if (!conversationId) return

  const { data: conversation } = await admin
    .from('support_conversations')
    .select('id, public_token, customer_name, customer_email, subject, status, source, created_at, last_message_at')
    .eq('id', conversationId)
    .single()

  if (!conversation || conversation.status !== 'closed' || !conversation.customer_email) return

  const { data: messages = [] } = await admin
    .from('support_messages')
    .select('sender_type, author_name, body, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  await sendResendEmail({
    to: conversation.customer_email,
    subject: `ASORTA Support transcript: ${conversation.subject || 'supportgesprek'}`,
    html: transcriptHtml({
      subject: conversation.subject,
      customerName: conversation.customer_name,
      publicToken: conversation.public_token,
      messages: (messages || []) as TranscriptMessage[],
    }),
    replyTo: 'info@asorta.nl',
  })

  await admin.from('support_conversation_archives').insert({
    original_conversation_id: conversation.id,
    public_token: conversation.public_token,
    customer_name: conversation.customer_name,
    customer_email: conversation.customer_email,
    subject: conversation.subject,
    source: conversation.source,
    status: conversation.status,
    transcript: messages || [],
    archived_by: user.email,
    emailed_to_customer: true,
  })

  await admin.from('support_tickets').update({ status: 'closed', updated_at: new Date().toISOString() }).eq('conversation_id', conversationId)
  await admin.from('support_conversations').delete().eq('id', conversationId)

  revalidatePath('/atlas/support')
}
