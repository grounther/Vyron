'use server'

import { revalidatePath } from 'next/cache'
import { assertAtlasAdmin } from '@/lib/atlas-auth'
import { sendSupportEmail, supportReplyTemplate } from '@/lib/support'

function clean(value: FormDataEntryValue | null, fallback = '') {
  return typeof value === 'string' ? value.trim() : fallback
}

export async function updateTicketStatus(formData: FormData) {
  const { admin } = await assertAtlasAdmin('/atlas/support')
  const id = clean(formData.get('id'))
  const status = clean(formData.get('status'), 'open')
  const priority = clean(formData.get('priority'), 'normal')

  if (!id) return

  await admin
    .from('support_tickets')
    .update({ status, priority, updated_at: new Date().toISOString() })
    .eq('id', id)

  revalidatePath('/atlas/support')
}

export async function sendTicketReply(formData: FormData) {
  const { admin, user } = await assertAtlasAdmin('/atlas/support')
  const id = clean(formData.get('id'))
  const reply = clean(formData.get('reply'))

  if (!id || !reply) return

  const { data: ticket } = await admin
    .from('support_tickets')
    .select('id,ticket_number,email,subject')
    .eq('id', id)
    .maybeSingle()

  if (!ticket?.email) return

  const ticketNumber = ticket.ticket_number || `AS-${String(ticket.id).slice(0, 8).toUpperCase()}`

  await admin.from('support_messages').insert({
    ticket_id: id,
    sender_type: 'agent',
    sender_name: user.email,
    sender_email: user.email,
    message: reply,
  })

  await admin
    .from('support_tickets')
    .update({ status: 'answered', updated_at: new Date().toISOString() })
    .eq('id', id)

  await sendSupportEmail({
    to: ticket.email,
    subject: `Reactie van ASORTA Support ${ticketNumber}`,
    html: supportReplyTemplate(ticketNumber, reply),
    replyTo: process.env.SUPPORT_REPLY_TO || 'info@asorta.nl',
  })

  revalidatePath('/atlas/support')
}
