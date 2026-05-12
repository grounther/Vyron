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

export async function replyToSupportConversation(formData: FormData) {
  const { admin, user } = await requireAdmin()
  const conversationId = clean(formData.get('conversation_id'), 80)
  const message = clean(formData.get('message'))

  if (!conversationId || !message) return

  const { data: conversation } = await admin
    .from('support_conversations')
    .select('id, customer_email, customer_name, subject, public_token')
    .eq('id', conversationId)
    .single()

  if (!conversation) return

  await admin.from('support_messages').insert({
    conversation_id: conversationId,
    sender_type: 'operator',
    author_name: 'ASORTA Support',
    body: message,
  })

  await admin
    .from('support_conversations')
    .update({ status: 'answered', assigned_to: user.email, last_message_at: new Date().toISOString() })
    .eq('id', conversationId)

  if (conversation.customer_email) {
    await sendResendEmail({
      to: conversation.customer_email,
      subject: `ASORTA Support: ${conversation.subject || 'antwoord op je vraag'}`,
      html: `<!doctype html><html><body style="margin:0;background:#050505;color:#f4f4f4;font-family:Arial,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#050505;padding:32px 12px;"><tr><td align="center"><table width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background:#0b0b0b;border:1px solid rgba(255,255,255,.12);border-radius:24px;overflow:hidden;"><tr><td style="padding:34px 30px;"><div style="font-size:12px;letter-spacing:.28em;text-transform:uppercase;color:#b7c8ad;font-weight:800;">ASORTA Support</div><h1 style="margin:14px 0 0;font-size:30px;line-height:1.1;color:#fff;">We hebben gereageerd</h1><div style="margin-top:20px;padding:18px;border-radius:18px;background:rgba(255,255,255,.06);color:rgba(255,255,255,.82);line-height:1.7;">${message.replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[char] || char)).replace(/\n/g, '<br/>')}</div><p style="margin-top:24px;color:rgba(255,255,255,.50);line-height:1.6;">Je kunt verder reageren via de chat op asorta.nl/contact.</p></td></tr></table></td></tr></table></body></html>`,
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

  await admin
    .from('support_tickets')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)

  revalidatePath('/atlas/support')
}
