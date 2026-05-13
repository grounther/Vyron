import { NextResponse } from 'next/server'
import { cleanText, requireAtlasAdminApi } from '@/lib/support-admin'
import { getSupportCustomerPortal } from '@/lib/support-customer-portal'

export const dynamic = 'force-dynamic'

function maybeUuid(value: unknown) {
  const text = cleanText(value, 80)
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(text) ? text : null
}

export async function POST(request: Request) {
  const auth = await requireAtlasAdminApi()
  if ('error' in auth) return auth.error
  const { admin, user } = auth

  const body = await request.json().catch(() => ({}))
  const note = cleanText(body.note, 5000)
  const query = cleanText(body.query, 180)
  const conversationId = maybeUuid(body.conversationId)
  const customerId = maybeUuid(body.customerId)
  const orderId = maybeUuid(body.orderId)
  const customerEmail = cleanText(body.customerEmail, 240).toLowerCase() || null
  const noteType = cleanText(body.noteType, 50) || 'general'

  if (!note) return NextResponse.json({ error: 'Notitie is leeg.' }, { status: 400 })
  if (!conversationId && !customerId && !orderId && !customerEmail) {
    return NextResponse.json({ error: 'Geen klant, order of gesprek gevonden voor deze notitie.' }, { status: 400 })
  }

  const { error } = await admin.from('support_customer_notes').insert({
    customer_id: customerId,
    customer_email: customerEmail,
    order_id: orderId,
    conversation_id: conversationId,
    note_type: noteType,
    note,
    created_by: user.email,
  })

  if (error) {
    return NextResponse.json({ error: 'Notitie kon niet worden opgeslagen. Controleer of v5_15_support_customer_portal_schema.sql is uitgevoerd.' }, { status: 500 })
  }

  return NextResponse.json(await getSupportCustomerPortal(admin, { query, conversationId }))
}
