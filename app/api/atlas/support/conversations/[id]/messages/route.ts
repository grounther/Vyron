import { NextResponse } from 'next/server'
import { sendResendEmail } from '@/lib/newsletter'
import { cleanText, customerReplyEmailHtml, getAtlasSupportSnapshot, requireAtlasAdminApi } from '@/lib/support-admin'

export const dynamic = 'force-dynamic'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAtlasAdminApi()
  if ('error' in auth) return auth.error
  const { admin, user } = auth

  const { id } = await params
  const body = await request.json().catch(() => ({}))
  const message = cleanText(body.message)

  if (!message) {
    return NextResponse.json({ error: 'Bericht is verplicht.' }, { status: 400 })
  }

  const { data: conversation, error: conversationError } = await admin
    .from('support_conversations')
    .select('id, customer_email, customer_name, subject, public_token, status')
    .eq('id', id)
    .maybeSingle()

  if (conversationError || !conversation) {
    return NextResponse.json({ error: 'Gesprek niet gevonden.' }, { status: 404 })
  }

  if (conversation.status === 'closed') {
    return NextResponse.json({ error: 'Dit gesprek is gesloten.' }, { status: 409 })
  }

  const { error: insertError } = await admin.from('support_messages').insert({
    conversation_id: id,
    sender_type: 'operator',
    author_name: 'ASORTA Support',
    body: message,
  })

  if (insertError) {
    console.error('Atlas support reply insert failed', insertError)
    return NextResponse.json({ error: 'Antwoord kon niet worden opgeslagen. Controleer of de support SQL-migratie is uitgevoerd.' }, { status: 500 })
  }

  const now = new Date().toISOString()
  await admin
    .from('support_conversations')
    .update({
      status: 'answered',
      assigned_to: user.email,
      last_message_at: now,
      updated_at: now,
    })
    .eq('id', id)

  await admin
    .from('support_tickets')
    .update({ status: 'answered', updated_at: now })
    .eq('conversation_id', id)

  if (conversation.customer_email) {
    await sendResendEmail({
      to: conversation.customer_email,
      subject: `ASORTA Support: ${conversation.subject || 'antwoord op je vraag'}`,
      html: customerReplyEmailHtml({ subject: conversation.subject, message }),
      replyTo: 'info@asorta.nl',
    })
  }

  return NextResponse.json(await getAtlasSupportSnapshot(admin, id))
}
