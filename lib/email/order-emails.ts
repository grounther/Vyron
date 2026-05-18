import type { SupabaseClient } from '@supabase/supabase-js'
import { sendResendEmail } from '@/lib/newsletter'

type AnyRow = Record<string, any>

type OrderEmailInput = {
  order: AnyRow
  items?: AnyRow[]
  trackingNumber?: string | null
  trackingUrl?: string | null
}

function escapeHtml(value: unknown) {
  return String(value || '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[char] || char))
}

function escapeAttribute(value: unknown) {
  return escapeHtml(value).replace(/`/g, '&#096;')
}

function number(value: unknown, fallback = 0) {
  const parsed = Number(value || 0)
  return Number.isFinite(parsed) ? parsed : fallback
}

function eur(value: unknown) {
  return `€${number(value).toFixed(2)}`
}

function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'https://asorta.nl').replace(/\/$/, '')
}

function orderNumber(order: AnyRow) {
  return String(order.order_number || order.shopify_order_name || order.id || '').trim()
}

function orderEmailFrom() {
  return process.env.ORDER_EMAIL_FROM || process.env.NEWSLETTER_FROM || 'ASORTA <info@asorta.nl>'
}

function orderLookupUrl(order: AnyRow) {
  const params = new URLSearchParams()
  const orderNo = orderNumber(order)
  if (orderNo) params.set('order', orderNo)
  if (order.customer_email) params.set('email', String(order.customer_email))
  return `${siteUrl()}/track-order${params.toString() ? `?${params}` : ''}`
}

function emailShell({ eyebrow, title, body, ctaLabel, ctaUrl, itemsHtml = '' }: { eyebrow: string; title: string; body: string; ctaLabel?: string; ctaUrl?: string; itemsHtml?: string }) {
  const paragraphs = body.split('\n').filter(Boolean).map((line) => `<p style="margin:0 0 14px;color:rgba(255,255,255,.70);font-size:15px;line-height:1.7;">${escapeHtml(line)}</p>`).join('')
  return `<!doctype html><html><body style="margin:0;background:#050505;color:#f4f4f4;font-family:Arial,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#050505;padding:32px 12px;"><tr><td align="center"><table width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:#0b0b0b;border:1px solid rgba(255,255,255,.12);border-radius:24px;overflow:hidden;"><tr><td style="padding:34px 30px;background:linear-gradient(135deg,#050505,#111814);"><div style="font-size:12px;letter-spacing:.28em;text-transform:uppercase;color:#b7c8ad;font-weight:800;">${escapeHtml(eyebrow)}</div><h1 style="margin:14px 0 18px;font-size:32px;line-height:1.08;color:#fff;">${escapeHtml(title)}</h1>${paragraphs}${itemsHtml}${ctaLabel && ctaUrl ? `<a href="${escapeAttribute(ctaUrl)}" style="display:inline-block;margin-top:24px;background:#fff;color:#050505;text-decoration:none;border-radius:999px;padding:13px 20px;font-weight:900;">${escapeHtml(ctaLabel)}</a>` : ''}<p style="margin:28px 0 0;color:rgba(255,255,255,.38);font-size:12px;line-height:1.6;">ASORTA — Just what you need.</p></td></tr></table></td></tr></table></body></html>`
}

function itemsList(items: AnyRow[]) {
  if (!items.length) return ''
  const rows = items.map((item) => `<tr><td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,.08);color:#fff;font-weight:700;">${escapeHtml(item.product_name || 'Product')}</td><td align="center" style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,.08);color:rgba(255,255,255,.62);">${number(item.quantity, 1)}×</td><td align="right" style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,.08);color:rgba(255,255,255,.82);">${eur(item.unit_price)}</td></tr>`).join('')
  return `<table width="100%" cellpadding="0" cellspacing="0" style="margin-top:18px;border-top:1px solid rgba(255,255,255,.12);">${rows}</table>`
}

async function reserveEmailEvent(admin: SupabaseClient, key: string, eventType: string, order: AnyRow, recipient: string, payload: AnyRow = {}) {
  const { error } = await admin.from('email_events').insert({
    event_key: key,
    event_type: eventType,
    order_id: order.id || null,
    order_number: orderNumber(order),
    recipient,
    status: 'pending',
    payload,
  })

  if (!error) return true
  if ((error as any).code === '23505') return false

  // If the table has not been migrated yet, avoid breaking webhooks.
  if (String(error.message || '').toLowerCase().includes('email_events')) return true
  return true
}

async function markEmailEvent(admin: SupabaseClient, key: string, status: string, response: AnyRow = {}) {
  await admin.from('email_events').update({ status, provider_response: response, sent_at: status === 'sent' ? new Date().toISOString() : null }).eq('event_key', key).then(() => undefined, () => undefined)
}

export async function sendOrderConfirmationEmail(admin: SupabaseClient, input: OrderEmailInput) {
  const email = String(input.order.customer_email || '').trim().toLowerCase()
  if (!email || !email.includes('@')) return { skipped: true, reason: 'missing-email' }

  const orderNo = orderNumber(input.order)
  const key = `order-confirmation:${input.order.id || orderNo}`
  const shouldSend = await reserveEmailEvent(admin, key, 'order_confirmation', input.order, email)
  if (!shouldSend) return { skipped: true, reason: 'duplicate' }

  const html = emailShell({
    eyebrow: 'Order bevestigd',
    title: `We hebben je bestelling ontvangen`,
    body: `Bedankt voor je bestelling bij ASORTA.\nJe order ${orderNo} is ontvangen en wordt voorbereid. Zodra tracking beschikbaar is, ontvang je automatisch een update per e-mail.`,
    ctaLabel: 'Bekijk orderstatus',
    ctaUrl: orderLookupUrl(input.order),
    itemsHtml: itemsList(input.items || []),
  })

  const result = await sendResendEmail({
    from: orderEmailFrom(),
    to: email,
    subject: `Orderbevestiging ${orderNo} | ASORTA`,
    html,
    replyTo: 'support@asorta.nl',
  })

  await markEmailEvent(admin, key, result.error ? 'error' : 'sent', result as AnyRow)
  return result
}

export async function sendTrackingUpdateEmail(admin: SupabaseClient, input: OrderEmailInput) {
  const email = String(input.order.customer_email || '').trim().toLowerCase()
  const trackingNumber = input.trackingNumber || input.order.tracking_number || input.order.shopify_tracking_numbers?.[0] || ''
  const trackingUrl = input.trackingUrl || input.order.tracking_url || input.order.shopify_tracking_urls?.[0] || ''

  if (!email || !email.includes('@')) return { skipped: true, reason: 'missing-email' }
  if (!trackingNumber && !trackingUrl) return { skipped: true, reason: 'missing-tracking' }

  const orderNo = orderNumber(input.order)
  const key = `tracking:${input.order.id || orderNo}:${trackingNumber || trackingUrl}`
  const shouldSend = await reserveEmailEvent(admin, key, 'tracking_update', input.order, email, { trackingNumber, trackingUrl })
  if (!shouldSend) return { skipped: true, reason: 'duplicate' }

  const trackingText = trackingNumber ? `Trackingnummer: ${trackingNumber}` : 'Je trackinglink is beschikbaar.'
  const html = emailShell({
    eyebrow: 'Verzendupdate',
    title: `Je bestelling is onderweg`,
    body: `Goed nieuws: er is tracking beschikbaar voor order ${orderNo}.\n${trackingText}`,
    ctaLabel: trackingUrl ? 'Bekijk tracking' : 'Bekijk orderstatus',
    ctaUrl: trackingUrl || orderLookupUrl(input.order),
  })

  const result = await sendResendEmail({
    from: orderEmailFrom(),
    to: email,
    subject: `Tracking voor ${orderNo} | ASORTA`,
    html,
    replyTo: 'support@asorta.nl',
  })

  await markEmailEvent(admin, key, result.error ? 'error' : 'sent', result as AnyRow)
  return result
}
