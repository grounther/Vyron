import { NextResponse } from 'next/server'
import { sendResendEmail } from '@/lib/newsletter'
import {
  cleanText,
  getAtlasSupportSnapshot,
  requireAtlasAdminApi,
  supportTranscriptHtml,
  type AtlasSupportMessage,
} from '@/lib/support-admin'

export const dynamic = 'force-dynamic'

const ALLOWED_STATUSES = ['open', 'pending', 'answered', 'closed']

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAtlasAdminApi()
  if ('error' in auth) return auth.error
  const { admin, user } = auth

  const { id } = await params
  const body = await request.json().catch(() => ({}))
  const status = cleanText(body.status, 40)

  if (!ALLOWED_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Ongeldige status.' }, { status: 400 })
  }

  const { data: current } = await admin
    .from('support_conversations')
    .select('id, status')
    .eq('id', id)
    .maybeSingle()

  if (!current) {
    return NextResponse.json({ error: 'Gesprek niet gevonden.' }, { status: 404 })
  }

  const { error: updateError } = await admin
    .from('support_conversations')
    .update({ status, assigned_to: user.email, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (updateError) {
    return NextResponse.json({ error: 'Status kon niet worden opgeslagen.' }, { status: 500 })
  }

  if (status === 'closed' && current.status !== 'closed') {
    await admin.from('support_messages').insert({
      conversation_id: id,
      sender_type: 'system',
      author_name: 'ASORTA System',
      body: 'Dit supportgesprek is gesloten door ASORTA Support. Je kunt een nieuw gesprek starten als je meer hulp nodig hebt.',
    })
  }

  await admin
    .from('support_tickets')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('conversation_id', id)

  return NextResponse.json(await getAtlasSupportSnapshot(admin, id))
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAtlasAdminApi()
  if ('error' in auth) return auth.error
  const { admin, user } = auth

  const { id } = await params
  const { data: conversation } = await admin
    .from('support_conversations')
    .select('id, public_token, customer_name, customer_email, subject, status, source, created_at, last_message_at')
    .eq('id', id)
    .maybeSingle()

  if (!conversation) {
    return NextResponse.json({ error: 'Gesprek niet gevonden.' }, { status: 404 })
  }

  if (conversation.status !== 'closed') {
    return NextResponse.json({ error: 'Sluit het gesprek eerst voordat je het archiveert.' }, { status: 409 })
  }

  if (!conversation.customer_email) {
    return NextResponse.json({ error: 'Er is geen klant-e-mailadres voor het transcript.' }, { status: 409 })
  }

  const { data: messages = [] } = await admin
    .from('support_messages')
    .select('id, sender_type, author_name, body, created_at')
    .eq('conversation_id', id)
    .order('created_at', { ascending: true })

  await sendResendEmail({
    to: conversation.customer_email,
    subject: `ASORTA Support transcript: ${conversation.subject || 'supportgesprek'}`,
    html: supportTranscriptHtml({
      subject: conversation.subject,
      customerName: conversation.customer_name,
      publicToken: conversation.public_token,
      messages: (messages || []) as AtlasSupportMessage[],
    }),
    replyTo: 'info@asorta.nl',
  })

  const { error: archiveError } = await admin.from('support_conversation_archives').insert({
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

  if (archiveError) {
    console.error('Support archive insert failed', archiveError)
    return NextResponse.json({ error: 'Archiveren lukte niet. Controleer of de support archief SQL-migratie is uitgevoerd.' }, { status: 500 })
  }

  await admin.from('support_tickets').update({ status: 'closed', updated_at: new Date().toISOString() }).eq('conversation_id', id)
  await admin.from('support_conversations').delete().eq('id', id)

  return NextResponse.json(await getAtlasSupportSnapshot(admin, null))
}
