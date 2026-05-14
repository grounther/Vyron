import { NextResponse } from 'next/server'
import { requireAtlasAdminApi } from '@/lib/server/atlas-api'

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function recoveryHtml(items: any[], recoveryUrl: string) {
  const rows = items.map((item) => `<li>${Number(item.qty || 1)}× ${escapeHtml(item.name)} — €${Number(item.price || 0).toFixed(2)}</li>`).join('')
  return `
    <div style="font-family:Arial,sans-serif;background:#050505;color:#fff;padding:28px;border-radius:18px">
      <h1 style="margin:0 0 12px;font-size:28px">Je ASORTA cart staat nog klaar.</h1>
      <p style="color:#bbb;line-height:1.6">Je geselecteerde premium gear wacht nog op je. Rond je bestelling af wanneer je klaar bent.</p>
      <ul style="color:#ddd;line-height:1.8">${rows}</ul>
      <a href="${recoveryUrl}" style="display:inline-block;margin-top:18px;background:#fff;color:#000;padding:13px 18px;border-radius:999px;font-weight:900;text-decoration:none">Verder met bestellen</a>
      <p style="margin-top:24px;color:#777;font-size:12px">ASORTA — Just what you need.</p>
    </div>`
}

export async function POST(request: Request) {
  const auth = await requireAtlasAdminApi()
  if (!auth.ok) return auth.response
  const admin = auth.admin

  const body = await request.json().catch(() => ({}))
  const cartId = String(body.cartId || '')
  if (!cartId) return NextResponse.json({ error: 'Missing cartId.' }, { status: 400 })


  const { data: cart, error } = await admin.from('cart_sessions').select('*').eq('id', cartId).single()
  if (error || !cart) return NextResponse.json({ error: error?.message || 'Cart not found.' }, { status: 404 })
  if (!cart.customer_email) return NextResponse.json({ error: 'Cart has no email.' }, { status: 400 })

  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.NEWSLETTER_FROM || 'ASORTA <info@asorta.nl>'
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://asorta.nl'
  const recoveryUrl = `${baseUrl}/cart?recover=${cart.recovery_token || cart.session_key}`

  if (apiKey) {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: cart.customer_email,
        subject: 'Je ASORTA cart staat nog klaar',
        html: recoveryHtml(cart.items || [], recoveryUrl),
      }),
    })
    if (!response.ok) {
      const text = await response.text()
      return NextResponse.json({ error: text }, { status: 500 })
    }
  }

  await admin.from('cart_recovery_events').insert({
    cart_session_id: cart.id,
    event_type: apiKey ? 'recovery_email_sent' : 'recovery_email_dry_run',
    email: cart.customer_email,
    metadata: { recoveryUrl },
  })

  await admin.from('cart_sessions').update({
    recovery_stage: Number(cart.recovery_stage || 0) + 1,
    first_reminder_at: cart.first_reminder_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).eq('id', cart.id)

  return NextResponse.json({ ok: true, sent: Boolean(apiKey) })
}
