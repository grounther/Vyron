import { createAdminClient } from '@/lib/supabase/admin'

type Json = Record<string, unknown> | unknown[] | string | number | boolean | null

export type SupportTicket = {
  id: string
  ticket_number: string | null
  name: string | null
  email: string
  subject: string
  message: string
  source: string | null
  status: string
  priority: string | null
  created_at: string
  updated_at: string | null
}

export type SupportConversation = {
  id: string
  customer_name: string | null
  customer_email: string
  status: string
  source: string | null
  last_message_at: string | null
  created_at: string
}

export type SupportMessage = {
  id: string
  conversation_id: string
  sender_type: string
  sender_name: string | null
  sender_email: string | null
  message: string
  created_at: string
}

export async function getSupportDashboard() {
  const supabase = createAdminClient()
  if (!supabase) {
    return {
      tickets: [] as SupportTicket[],
      conversations: [] as SupportConversation[],
      messages: [] as SupportMessage[],
      stats: { open: 0, pending: 0, answered: 0, closed: 0, conversations: 0 },
    }
  }

  const [{ data: tickets }, { data: conversations }, { data: messages }] = await Promise.all([
    supabase
      .from('support_tickets')
      .select('id,ticket_number,name,email,subject,message,source,status,priority,created_at,updated_at')
      .order('created_at', { ascending: false })
      .limit(80),
    supabase
      .from('support_conversations')
      .select('id,customer_name,customer_email,status,source,last_message_at,created_at')
      .order('last_message_at', { ascending: false })
      .limit(40),
    supabase
      .from('support_messages')
      .select('id,conversation_id,sender_type,sender_name,sender_email,message,created_at')
      .order('created_at', { ascending: false })
      .limit(120),
  ])

  const safeTickets = (tickets || []) as SupportTicket[]
  const safeConversations = (conversations || []) as SupportConversation[]

  return {
    tickets: safeTickets,
    conversations: safeConversations,
    messages: (messages || []) as SupportMessage[],
    stats: {
      open: safeTickets.filter((ticket) => ['new', 'open'].includes(ticket.status)).length,
      pending: safeTickets.filter((ticket) => ticket.status === 'pending').length,
      answered: safeTickets.filter((ticket) => ticket.status === 'answered').length,
      closed: safeTickets.filter((ticket) => ticket.status === 'closed').length,
      conversations: safeConversations.length,
    },
  }
}

export async function sendSupportEmail({
  to,
  subject,
  html,
  replyTo,
}: {
  to: string
  subject: string
  html: string
  replyTo?: string
}) {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.SUPPORT_FROM || process.env.NEWSLETTER_FROM || 'ASORTA Support <info@asorta.nl>'

  if (!apiKey) return { ok: false, skipped: true }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      html,
      reply_to: replyTo,
    }),
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    console.error('Resend support email failed', response.status, text)
    return { ok: false, skipped: false }
  }

  return { ok: true, skipped: false }
}

export function supportCustomerConfirmationTemplate(ticketNumber: string, name: string, message: string) {
  return `
    <div style="background:#050505;color:#f4f4f4;font-family:Arial,sans-serif;padding:32px">
      <div style="max-width:620px;margin:auto;border:1px solid rgba(255,255,255,.12);border-radius:22px;padding:28px;background:#0d0d0d">
        <p style="letter-spacing:.32em;text-transform:uppercase;color:#b7c8ad;font-size:11px;font-weight:900">ASORTA Support</p>
        <h1 style="font-size:30px;margin:12px 0 8px">We hebben je bericht ontvangen.</h1>
        <p style="color:rgba(255,255,255,.68);line-height:1.7">Hi ${escapeHtml(name || 'daar')}, bedankt voor je bericht. We hebben een supportticket aangemaakt en komen zo snel mogelijk bij je terug via e-mail.</p>
        <div style="margin:24px 0;padding:16px;border-radius:16px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.10)">
          <p style="margin:0;color:rgba(255,255,255,.48);font-size:12px;text-transform:uppercase;letter-spacing:.22em">Ticketnummer</p>
          <p style="margin:6px 0 0;font-size:22px;font-weight:900">${ticketNumber}</p>
        </div>
        <p style="color:rgba(255,255,255,.50);line-height:1.7;font-size:14px">Je bericht: ${escapeHtml(message).slice(0, 600)}</p>
      </div>
    </div>
  `
}

export function supportInternalNotificationTemplate(ticketNumber: string, email: string, subject: string, message: string) {
  return `
    <div style="font-family:Arial,sans-serif;padding:24px">
      <h2>Nieuw ASORTA supportticket: ${escapeHtml(ticketNumber)}</h2>
      <p><strong>Klant:</strong> ${escapeHtml(email)}</p>
      <p><strong>Onderwerp:</strong> ${escapeHtml(subject)}</p>
      <hr />
      <p style="white-space:pre-wrap">${escapeHtml(message)}</p>
    </div>
  `
}

export function supportReplyTemplate(ticketNumber: string, reply: string) {
  return `
    <div style="background:#050505;color:#f4f4f4;font-family:Arial,sans-serif;padding:32px">
      <div style="max-width:620px;margin:auto;border:1px solid rgba(255,255,255,.12);border-radius:22px;padding:28px;background:#0d0d0d">
        <p style="letter-spacing:.32em;text-transform:uppercase;color:#b7c8ad;font-size:11px;font-weight:900">ASORTA Support</p>
        <h1 style="font-size:28px;margin:12px 0 8px">Reactie op je ticket</h1>
        <p style="color:rgba(255,255,255,.52)">Ticket: <strong>${escapeHtml(ticketNumber)}</strong></p>
        <div style="margin-top:22px;color:rgba(255,255,255,.75);line-height:1.75;white-space:pre-wrap">${escapeHtml(reply)}</div>
      </div>
    </div>
  `
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

export async function logSupportEvent(type: string, payload: Json) {
  const supabase = createAdminClient()
  if (!supabase) return
  await supabase.from('support_events').insert({ type, payload })
}
