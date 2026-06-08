import { NextResponse } from 'next/server'
import { cleanText, getAtlasSupportSnapshot, requireAtlasAdminApi } from '@/lib/support-admin'
import { buildSorkaiStaffAssist } from '@/lib/sorkai'

export const dynamic = 'force-dynamic'

type AnyRow = Record<string, any>

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAtlasAdminApi()
  if ('error' in auth) return auth.error
  const { admin, user, staff } = auth
  const { id } = await params
  const body = await request.json().catch(() => ({}))
  const question = cleanText(body.question, 1200)

  const { data: conversation, error } = await admin
    .from('support_conversations')
    .select('id, public_token, customer_name, customer_email, subject, status, metadata, last_message_at, created_at, updated_at')
    .eq('id', id)
    .maybeSingle()

  if (error || !conversation) {
    return NextResponse.json({ error: 'Gesprek niet gevonden.' }, { status: 404 })
  }

  const assist = await buildSorkaiStaffAssist(admin, conversation as AnyRow, question)
  const now = new Date().toISOString()

  const { error: insertError } = await admin.from('support_messages').insert({
    conversation_id: id,
    sender_type: 'system',
    author_name: 'Sorkai Assist',
    body: assist.body,
    is_internal: true,
    internal_kind: 'sorkai_assist',
  })

  if (insertError) {
    console.error('Sorkai assist insert failed', insertError)
    return NextResponse.json({ error: 'Sorkai assist kon niet worden opgeslagen. Run de v5_38 SQL-migratie.' }, { status: 500 })
  }

  await admin.from('support_conversations').update({ updated_at: now }).eq('id', id).then(() => undefined, () => undefined)

  await admin.from('support_sorkai_logs').insert({
    conversation_id: id,
    customer_email: (conversation as AnyRow).customer_email || null,
    customer_message: question || null,
    response_body: assist.body,
    intent: `staff_${assist.intent || 'assist'}`,
    confidence: assist.confidence,
    needs_human: assist.needsHuman,
    live_status: 'staff_assist',
    metadata: {
      internal: true,
      asked_by: user.email,
      asked_by_name: staff.displayName,
      question,
    },
  }).then(() => undefined, () => undefined)

  return NextResponse.json(await getAtlasSupportSnapshot(admin, id))
}
