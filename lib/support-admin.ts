import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

type SupabaseAdmin = NonNullable<ReturnType<typeof createAdminClient>>

export type AtlasSupportConversation = {
  id: string
  public_token: string
  customer_name: string | null
  customer_email: string | null
  subject: string | null
  status: string
  source: string | null
  assigned_to?: string | null
  last_message_at: string | null
  created_at: string
  updated_at?: string | null
}

export type AtlasSupportMessage = {
  id: string
  sender_type: 'customer' | 'operator' | 'system'
  author_name: string | null
  body: string
  created_at: string
}

export type AtlasSupportSnapshot = {
  conversations: AtlasSupportConversation[]
  selected: AtlasSupportConversation | null
  messages: AtlasSupportMessage[]
  serverTime: string
}

export function cleanText(value: unknown, limit = 3000) {
  return typeof value === 'string' ? value.trim().slice(0, limit) : ''
}

export function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[char] || char))
}

export async function requireAtlasAdminApi() {
  const auth = await createClient()
  const {
    data: { user },
  } = await auth.auth.getUser()

  if (!user?.email) {
    return { error: NextResponse.json({ error: 'Atlas login vereist.' }, { status: 401 }) }
  }

  const admin = createAdminClient()
  if (!admin) {
    return { error: NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY ontbreekt.' }, { status: 500 }) }
  }

  const { data: adminUser, error } = await admin
    .from('admin_users')
    .select('email')
    .eq('email', user.email)
    .eq('active', true)
    .maybeSingle()

  if (error || !adminUser) {
    return { error: NextResponse.json({ error: 'Geen Atlas rechten.' }, { status: 403 }) }
  }

  return { admin, user }
}

export async function getAtlasSupportSnapshot(admin: SupabaseAdmin, selectedId?: string | null): Promise<AtlasSupportSnapshot> {
  const { data: conversationsData = [] } = await admin
    .from('support_conversations')
    .select('id, public_token, customer_name, customer_email, subject, status, source, assigned_to, last_message_at, created_at, updated_at')
    .order('last_message_at', { ascending: false })
    .limit(60)

  let conversations = (conversationsData || []) as AtlasSupportConversation[]
  let selected = selectedId ? conversations.find((item) => item.id === selectedId) || null : conversations[0] || null

  if (selectedId && !selected) {
    const { data: direct } = await admin
      .from('support_conversations')
      .select('id, public_token, customer_name, customer_email, subject, status, source, assigned_to, last_message_at, created_at, updated_at')
      .eq('id', selectedId)
      .maybeSingle()

    if (direct) {
      selected = direct as AtlasSupportConversation
      conversations = [selected, ...conversations.filter((item) => item.id !== selected?.id)]
    }
  }

  const { data: messagesData = [] } = selected
    ? await admin
        .from('support_messages')
        .select('id, sender_type, author_name, body, created_at')
        .eq('conversation_id', selected.id)
        .order('created_at', { ascending: true })
    : { data: [] }

  return {
    conversations,
    selected,
    messages: (messagesData || []) as AtlasSupportMessage[],
    serverTime: new Date().toISOString(),
  }
}

export async function getCustomerSupportSnapshot(admin: SupabaseAdmin, token: string) {
  const { data: conversation, error } = await admin
    .from('support_conversations')
    .select('id, public_token, customer_name, customer_email, status, subject, source, last_message_at, created_at, updated_at')
    .eq('public_token', token)
    .maybeSingle()

  if (error || !conversation) return null

  const { data: messages = [] } = await admin
    .from('support_messages')
    .select('id, sender_type, author_name, body, created_at')
    .eq('conversation_id', conversation.id)
    .order('created_at', { ascending: true })

  return {
    conversation: conversation as AtlasSupportConversation,
    messages: (messages || []) as AtlasSupportMessage[],
    serverTime: new Date().toISOString(),
  }
}

export function snapshotSignature(snapshot: unknown) {
  if (!snapshot || typeof snapshot !== 'object') return JSON.stringify(snapshot)
  const { serverTime: _serverTime, ...stable } = snapshot as Record<string, unknown>
  return JSON.stringify(stable)
}

export function customerReplyEmailHtml(input: { subject: string | null; message: string }) {
  const safeMessage = escapeHtml(input.message).replace(/\n/g, '<br/>')
  return `<!doctype html><html><body style="margin:0;background:#050505;color:#f4f4f4;font-family:Arial,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#050505;padding:32px 12px;"><tr><td align="center"><table width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background:#0b0b0b;border:1px solid rgba(255,255,255,.12);border-radius:24px;overflow:hidden;"><tr><td style="padding:34px 30px;"><div style="font-size:12px;letter-spacing:.28em;text-transform:uppercase;color:#b7c8ad;font-weight:800;">ASORTA Support</div><h1 style="margin:14px 0 0;font-size:30px;line-height:1.1;color:#fff;">We hebben gereageerd</h1><p style="color:rgba(255,255,255,.52);line-height:1.7;">Onderwerp: ${escapeHtml(input.subject || 'Support request')}</p><div style="margin-top:20px;padding:18px;border-radius:18px;background:rgba(255,255,255,.06);color:rgba(255,255,255,.82);line-height:1.7;">${safeMessage}</div><p style="margin-top:24px;color:rgba(255,255,255,.50);line-height:1.6;">Je kunt direct verder praten via de live chat op asorta.nl/contact of via de supportknop op de site.</p></td></tr></table></td></tr></table></body></html>`
}

export function supportTranscriptHtml(input: {
  subject: string | null
  customerName: string | null
  publicToken: string
  messages: AtlasSupportMessage[]
}) {
  const rows = input.messages
    .map((message) => {
      const label = message.sender_type === 'customer' ? input.customerName || 'Klant' : message.sender_type === 'operator' ? 'ASORTA Support' : 'Systeem'
      const date = new Date(message.created_at).toLocaleString('nl-NL')
      return `<div style="margin:0 0 14px;padding:16px;border-radius:18px;background:${message.sender_type === 'customer' ? 'rgba(255,255,255,.08)' : 'rgba(183,200,173,.10)'};border:1px solid rgba(255,255,255,.10);"><div style="font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#b7c8ad;font-weight:800;">${escapeHtml(label)} · ${escapeHtml(date)}</div><div style="margin-top:8px;color:rgba(255,255,255,.82);line-height:1.7;">${escapeHtml(message.body).replace(/\n/g, '<br/>')}</div></div>`
    })
    .join('')

  return `<!doctype html><html><body style="margin:0;background:#050505;color:#f4f4f4;font-family:Arial,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#050505;padding:32px 12px;"><tr><td align="center"><table width="100%" cellpadding="0" cellspacing="0" style="max-width:680px;background:#0b0b0b;border:1px solid rgba(255,255,255,.12);border-radius:24px;overflow:hidden;"><tr><td style="padding:34px 30px;"><div style="font-size:12px;letter-spacing:.28em;text-transform:uppercase;color:#b7c8ad;font-weight:800;">ASORTA Support</div><h1 style="margin:14px 0 0;font-size:30px;line-height:1.1;color:#fff;">Kopie van je supportgesprek</h1><p style="color:rgba(255,255,255,.68);line-height:1.7;">Hi ${escapeHtml(input.customerName || 'daar')}, hierbij ontvang je een kopie van je afgesloten supportgesprek.</p><p style="color:rgba(255,255,255,.45);font-size:13px;line-height:1.7;"><strong>Onderwerp:</strong> ${escapeHtml(input.subject || 'Support request')}<br/><strong>Chat:</strong> ${escapeHtml(input.publicToken.slice(0, 8))}</p><div style="margin-top:22px;">${rows || '<p style="color:rgba(255,255,255,.55);">Geen berichten gevonden.</p>'}</div><p style="margin-top:28px;color:rgba(255,255,255,.38);font-size:12px;line-height:1.6;">ASORTA — Just what you need.</p></td></tr></table></td></tr></table></body></html>`
}
