import { NextResponse } from 'next/server'
import { cleanText, requireAtlasAdminApi } from '@/lib/support-admin'
import { getSupportCustomerPortal, linkSupportConversation, updateCustomerLoyalty, updateSupportOrder } from '@/lib/support-customer-portal'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const auth = await requireAtlasAdminApi()
  if ('error' in auth) return auth.error
  const { admin } = auth

  const url = new URL(request.url)
  const query = url.searchParams.get('query') || ''
  const conversationId = url.searchParams.get('conversationId') || null

  return NextResponse.json(await getSupportCustomerPortal(admin, { query, conversationId }))
}

export async function PATCH(request: Request) {
  const auth = await requireAtlasAdminApi()
  if ('error' in auth) return auth.error
  const { admin, user } = auth

  const body = await request.json().catch(() => ({}))
  const action = cleanText(body.action, 80)
  const query = cleanText(body.query, 180)
  const conversationId = cleanText(body.conversationId, 80) || null

  try {
    if (action === 'linkConversation') {
      await linkSupportConversation(admin, {
        conversationId: cleanText(body.conversationId, 80),
        customerId: cleanText(body.customerId, 80) || null,
        orderId: cleanText(body.orderId, 80) || null,
        linkedBy: user.email,
      })
    } else if (action === 'updateLoyalty') {
      await updateCustomerLoyalty(admin, {
        customerId: cleanText(body.customerId, 80) || null,
        customerEmail: typeof body.customerEmail === 'string' ? body.customerEmail : undefined,
        customerName: typeof body.customerName === 'string' ? body.customerName : undefined,
        pointsMode: typeof body.pointsMode === 'string' ? body.pointsMode : 'add',
        points: Number(body.points || 0),
        lifetimeSpend: body.lifetimeSpend === null || body.lifetimeSpend === undefined || body.lifetimeSpend === '' ? null : Number(body.lifetimeSpend),
        tier: typeof body.tier === 'string' ? body.tier : null,
        reason: typeof body.reason === 'string' ? body.reason : null,
        createdBy: user.email,
      })
    } else if (action === 'updateOrder') {
      await updateSupportOrder(admin, {
        orderId: cleanText(body.orderId, 80),
        paymentStatus: typeof body.paymentStatus === 'string' ? body.paymentStatus : undefined,
        fulfillmentStatus: typeof body.fulfillmentStatus === 'string' ? body.fulfillmentStatus : undefined,
        trackingNumber: typeof body.trackingNumber === 'string' ? body.trackingNumber : undefined,
        trackingUrl: typeof body.trackingUrl === 'string' ? body.trackingUrl : undefined,
        cjOrderId: typeof body.cjOrderId === 'string' ? body.cjOrderId : undefined,
      })
    } else {
      return NextResponse.json({ error: 'Onbekende klantportaal actie.' }, { status: 400 })
    }
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Actie kon niet worden uitgevoerd.' }, { status: 400 })
  }

  return NextResponse.json(await getSupportCustomerPortal(admin, { query, conversationId }))
}
