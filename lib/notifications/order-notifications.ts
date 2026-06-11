import type { SupabaseClient } from '@supabase/supabase-js'
import { sendResendEmail } from '@/lib/newsletter'

type AnyRow = Record<string, any>

type NotificationChannelResult = {
  channel: string
  ok: boolean
  skipped?: boolean
  error?: string
  response?: AnyRow
}

type NotificationReserve = {
  reserved: boolean
  reason?: string
  auditAvailable: boolean
}

function clean(value: unknown, fallback = '') {
  return String(value ?? fallback).trim()
}

function number(value: unknown, fallback = 0) {
  const parsed = typeof value === 'number' ? value : Number(String(value || '').replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : fallback
}

function eur(value: unknown) {
  return `€${number(value).toFixed(2)}`
}

function siteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL || 'https://asorta.nl'
  if (configured.startsWith('http://') || configured.startsWith('https://')) return configured.replace(/\/$/, '')
  return `https://${configured.replace(/\/$/, '')}`
}

function rawObject(order: AnyRow) {
  return order.raw && typeof order.raw === 'object' && !Array.isArray(order.raw) ? order.raw as AnyRow : {}
}

function orderNo(order: AnyRow) {
  return clean(order.order_number || order.shopify_order_name || order.id || 'ASORTA order')
}

function paymentLabel(order: AnyRow) {
  const provider = clean(order.payment_provider || '').toLowerCase()
  const raw = rawObject(order)
  const mollieMethod = clean(raw.mollie_payment?.method || raw.mollie_payment?.metadata?.method || raw.payment_method || '').toLowerCase()
  const paypal = provider.includes('paypal')

  const labels: Record<string, string> = {
    ideal: 'iDEAL via Mollie',
    wero: 'Wero via Mollie',
    bancontact: 'Bancontact via Mollie',
    creditcard: 'Creditcard/debitcard via Mollie',
    applepay: 'Apple Pay via Mollie',
    googlepay: 'Google Pay via Mollie',
    klarnapaylater: 'Klarna achteraf via Mollie',
    klarnasliceit: 'Klarna in 3x via Mollie',
    in3: 'in3 via Mollie',
    riverty: 'Riverty via Mollie',
  }

  if (mollieMethod && labels[mollieMethod]) return labels[mollieMethod]
  if (provider.includes('mollie')) return 'Mollie'
  if (paypal) return 'PayPal'
  return provider || 'Betaalprovider onbekend'
}

function addressLine(order: AnyRow) {
  const shipping = order.shipping_address && typeof order.shipping_address === 'object' ? order.shipping_address as AnyRow : {}
  const parts = [shipping.address1, shipping.address2].map((part) => clean(part)).filter(Boolean)
  const city = [shipping.postalCode || shipping.postal_code, shipping.city].map((part) => clean(part)).filter(Boolean).join(' ')
  const country = clean(shipping.countryCode || shipping.country_code || shipping.country)
  return [parts.join(' '), city, country].filter(Boolean).join(', ')
}

function customerName(order: AnyRow) {
  const shipping = order.shipping_address && typeof order.shipping_address === 'object' ? order.shipping_address as AnyRow : {}
  return clean(shipping.name || order.customer_name || order.customer_email || 'Klant')
}

function envFirst(...names: string[]) {
  for (const name of names) {
    const value = process.env[name]
    if (value && value.trim()) return value.trim()
  }
  return ''
}

function envList(...names: string[]) {
  const value = envFirst(...names)
  if (!value) return []
  return value.split(/[;,]/).map((item) => item.trim()).filter(Boolean)
}

function hasTelegramConfig() {
  return Boolean(envFirst('ORDER_NOTIFY_TELEGRAM_BOT_TOKEN', 'TELEGRAM_BOT_TOKEN') && envList('ORDER_NOTIFY_TELEGRAM_CHAT_IDS', 'ORDER_NOTIFY_TELEGRAM_CHAT_ID', 'TELEGRAM_CHAT_ID').length)
}

function hasPushoverConfig() {
  return Boolean(envFirst('ORDER_NOTIFY_PUSHOVER_APP_TOKEN', 'PUSHOVER_APP_TOKEN') && envList('ORDER_NOTIFY_PUSHOVER_USER_KEYS', 'ORDER_NOTIFY_PUSHOVER_USER_KEY', 'PUSHOVER_USER_KEY').length)
}

function hasEmailConfig() {
  return Boolean(envList('ORDER_NOTIFY_EMAILS', 'ORDER_NOTIFY_EMAIL').length)
}

function hasAnyNotificationChannel() {
  return hasTelegramConfig() || hasPushoverConfig() || hasEmailConfig()
}

async function safeOrderEvent(admin: SupabaseClient, row: AnyRow) {
  await admin.from('order_processing_events').insert(row).then(() => undefined, () => undefined)
}

async function loadOrderItems(admin: SupabaseClient, orderId: string) {
  const { data } = await admin
    .from('order_items')
    .select('product_name,product_slug,quantity,unit_price')
    .eq('order_id', orderId)
    .order('created_at', { ascending: true })
    .limit(20)
    .then((result) => result, () => ({ data: [] as AnyRow[] }))

  return (data || []) as AnyRow[]
}

function itemLines(items: AnyRow[]) {
  if (!items.length) return 'Producten: geen orderregels gevonden'
  return items.slice(0, 8).map((item) => {
    const qty = Math.max(1, number(item.quantity, 1))
    const name = clean(item.product_name || item.product_slug || 'Product')
    return `• ${qty}x ${name} (${eur(item.unit_price)})`
  }).join('\n')
}

function atlasOrderUrl(order: AnyRow) {
  const params = new URLSearchParams()
  const orderId = clean(order.id)
  if (orderId) params.set('focus', orderId)
  return `${siteUrl()}/atlas/orders${params.toString() ? `?${params.toString()}` : ''}`
}

function truncate(value: string, max = 3900) {
  if (value.length <= max) return value
  return `${value.slice(0, Math.max(0, max - 1))}…`
}

function buildPlainMessage(order: AnyRow, items: AnyRow[]) {
  const address = addressLine(order)
  const lines = [
    '🎉 Nieuwe betaalde ASORTA order',
    '',
    `Order: ${orderNo(order)}`,
    `Totaal: ${eur(order.total)}`,
    `Klant: ${customerName(order)}`,
    `E-mail: ${clean(order.customer_email || '—')}`,
    `Betaling: ${paymentLabel(order)}`,
    `Status: ${clean(order.fulfillment_status || 'processing')}`,
    address ? `Adres: ${address}` : '',
    '',
    itemLines(items),
    '',
    `Open in Atlas: ${atlasOrderUrl(order)}`,
  ].filter((line) => line !== '')

  return truncate(lines.join('\n'))
}

function buildEmailHtml(order: AnyRow, items: AnyRow[]) {
  const safe = (value: unknown) => String(value || '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[char] || char))
  const rows = items.length
    ? items.map((item) => `<tr><td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,.08);color:#fff;font-weight:700;">${safe(item.product_name || item.product_slug || 'Product')}</td><td align="center" style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,.08);color:rgba(255,255,255,.65);">${number(item.quantity, 1)}x</td><td align="right" style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,.08);color:rgba(255,255,255,.82);">${safe(eur(item.unit_price))}</td></tr>`).join('')
    : `<tr><td style="padding:8px 0;color:rgba(255,255,255,.65);">Geen orderregels gevonden.</td></tr>`

  return `<!doctype html><html><body style="margin:0;background:#050505;color:#f4f4f4;font-family:Arial,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#050505;padding:32px 12px;"><tr><td align="center"><table width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:#0b0b0b;border:1px solid rgba(255,255,255,.12);border-radius:24px;overflow:hidden;"><tr><td style="padding:34px 30px;background:linear-gradient(135deg,#050505,#111814);"><div style="font-size:12px;letter-spacing:.28em;text-transform:uppercase;color:#b7c8ad;font-weight:800;">ASORTA ordermelding</div><h1 style="margin:14px 0 18px;font-size:32px;line-height:1.08;color:#fff;">Nieuwe betaalde order</h1><p style="margin:0 0 12px;color:rgba(255,255,255,.72);font-size:15px;line-height:1.7;"><strong style="color:#fff;">${safe(orderNo(order))}</strong> is betaald en verwerkt.</p><p style="margin:0 0 12px;color:rgba(255,255,255,.72);font-size:15px;line-height:1.7;">Totaal: <strong style="color:#fff;">${safe(eur(order.total))}</strong><br/>Klant: ${safe(customerName(order))}<br/>E-mail: ${safe(order.customer_email || '—')}<br/>Betaling: ${safe(paymentLabel(order))}</p><table width="100%" cellpadding="0" cellspacing="0" style="margin-top:18px;border-top:1px solid rgba(255,255,255,.12);">${rows}</table><a href="${safe(atlasOrderUrl(order))}" style="display:inline-block;margin-top:24px;background:#fff;color:#050505;text-decoration:none;border-radius:999px;padding:13px 20px;font-weight:900;">Open in Atlas</a><p style="margin:28px 0 0;color:rgba(255,255,255,.38);font-size:12px;line-height:1.6;">ASORTA — automatische interne ordermelding.</p></td></tr></table></td></tr></table></body></html>`
}

async function reserveNotification(admin: SupabaseClient, key: string, order: AnyRow, items: AnyRow[]): Promise<NotificationReserve> {
  const raw = rawObject(order)
  if (raw.admin_order_notified_at) return { reserved: false, reason: 'already-notified', auditAvailable: true }

  const payload = {
    event_key: key,
    event_type: 'new_paid_order',
    order_id: order.id || null,
    order_number: orderNo(order),
    status: 'pending',
    payload: { orderId: order.id, orderNumber: orderNo(order), total: number(order.total), paymentProvider: order.payment_provider, items: items.length },
    updated_at: new Date().toISOString(),
  }

  const { data: existing, error: lookupError } = await admin
    .from('order_notification_events')
    .select('id,status')
    .eq('event_key', key)
    .maybeSingle()
    .then((result) => result, (error) => ({ data: null, error }))

  if (lookupError) {
    const code = String((lookupError as AnyRow).code || '')
    const message = String(lookupError.message || '').toLowerCase()
    if (code === '42P01' || message.includes('order_notification_events')) return { reserved: true, auditAvailable: false }
    return { reserved: true, auditAvailable: false }
  }

  if (existing?.id) {
    const status = String(existing.status || '').toLowerCase()
    if (status === 'sent' || status === 'pending') return { reserved: false, reason: status === 'sent' ? 'duplicate' : 'already-pending', auditAvailable: true }

    const { error: updateError } = await admin
      .from('order_notification_events')
      .update({ ...payload, error: null })
      .eq('id', existing.id)

    if (updateError) return { reserved: true, auditAvailable: false }
    return { reserved: true, auditAvailable: true }
  }

  const { error } = await admin.from('order_notification_events').insert(payload)
  if (!error) return { reserved: true, auditAvailable: true }

  if (String((error as AnyRow).code || '') === '23505') return { reserved: false, reason: 'duplicate', auditAvailable: true }
  if (String((error as AnyRow).code || '') === '42P01' || String(error.message || '').toLowerCase().includes('order_notification_events')) return { reserved: true, auditAvailable: false }
  return { reserved: true, auditAvailable: false }
}

async function markNotification(admin: SupabaseClient, key: string, status: string, channels: NotificationChannelResult[], error?: string) {
  await admin
    .from('order_notification_events')
    .update({
      status,
      channels: channels.map((channel) => channel.channel),
      provider_response: { channels },
      error: error || null,
      sent_at: status === 'sent' ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('event_key', key)
    .then(() => undefined, () => undefined)
}

async function markOrderNotified(admin: SupabaseClient, order: AnyRow, channels: NotificationChannelResult[]) {
  const { data: latest } = await admin
    .from('orders')
    .select('raw')
    .eq('id', order.id)
    .maybeSingle()
    .then((result) => result, () => ({ data: null } as any))

  const latestRaw = latest?.raw && typeof latest.raw === 'object' && !Array.isArray(latest.raw) ? latest.raw as AnyRow : rawObject(order)
  await admin
    .from('orders')
    .update({
      raw: {
        ...latestRaw,
        admin_order_notified_at: new Date().toISOString(),
        admin_order_notification_channels: channels.filter((channel) => channel.ok).map((channel) => channel.channel),
      },
      updated_at: new Date().toISOString(),
    })
    .eq('id', order.id)
    .then(() => undefined, () => undefined)
}

async function sendTelegram(message: string): Promise<NotificationChannelResult[]> {
  const token = envFirst('ORDER_NOTIFY_TELEGRAM_BOT_TOKEN', 'TELEGRAM_BOT_TOKEN')
  const chatIds = envList('ORDER_NOTIFY_TELEGRAM_CHAT_IDS', 'ORDER_NOTIFY_TELEGRAM_CHAT_ID', 'TELEGRAM_CHAT_ID')
  if (!token || !chatIds.length) return [{ channel: 'telegram', ok: false, skipped: true, error: 'Telegram env vars ontbreken.' }]

  const results: NotificationChannelResult[] = []
  for (const chatId of chatIds) {
    try {
      const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: message, disable_web_page_preview: true }),
        cache: 'no-store',
      })
      const data = await response.json().catch(() => ({})) as AnyRow
      results.push({ channel: 'telegram', ok: response.ok, error: response.ok ? undefined : clean(data.description || `Telegram HTTP ${response.status}`), response: { chatId, data } })
    } catch (error) {
      results.push({ channel: 'telegram', ok: false, error: error instanceof Error ? error.message : 'Telegram send failed.', response: { chatId } })
    }
  }
  return results
}

async function sendPushover(order: AnyRow, message: string): Promise<NotificationChannelResult[]> {
  const token = envFirst('ORDER_NOTIFY_PUSHOVER_APP_TOKEN', 'PUSHOVER_APP_TOKEN')
  const users = envList('ORDER_NOTIFY_PUSHOVER_USER_KEYS', 'ORDER_NOTIFY_PUSHOVER_USER_KEY', 'PUSHOVER_USER_KEY')
  if (!token || !users.length) return [{ channel: 'pushover', ok: false, skipped: true, error: 'Pushover env vars ontbreken.' }]

  const results: NotificationChannelResult[] = []
  for (const user of users) {
    try {
      const body = new URLSearchParams({
        token,
        user,
        title: `Nieuwe ASORTA order ${orderNo(order)}`.slice(0, 250),
        message: truncate(message, 1024),
        url: atlasOrderUrl(order),
        url_title: 'Open in Atlas',
        priority: '0',
      })
      const response = await fetch('https://api.pushover.net/1/messages.json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
        cache: 'no-store',
      })
      const data = await response.json().catch(() => ({})) as AnyRow
      const error = Array.isArray(data.errors) ? data.errors.join(' ') : data.error
      results.push({ channel: 'pushover', ok: response.ok, error: response.ok ? undefined : clean(error || `Pushover HTTP ${response.status}`), response: { user: `${user.slice(0, 5)}…`, data } })
    } catch (error) {
      results.push({ channel: 'pushover', ok: false, error: error instanceof Error ? error.message : 'Pushover send failed.', response: { user: `${user.slice(0, 5)}…` } })
    }
  }
  return results
}

async function sendEmail(order: AnyRow, items: AnyRow[]): Promise<NotificationChannelResult[]> {
  const recipients = envList('ORDER_NOTIFY_EMAILS', 'ORDER_NOTIFY_EMAIL')
  if (!recipients.length) return [{ channel: 'email', ok: false, skipped: true, error: 'ORDER_NOTIFY_EMAIL ontbreekt.' }]

  try {
    const result = await sendResendEmail({
      to: recipients,
      subject: `Nieuwe ASORTA order ${orderNo(order)} (${eur(order.total)})`,
      html: buildEmailHtml(order, items),
      replyTo: 'klantenservice@asorta.nl',
      from: process.env.ORDER_EMAIL_FROM || process.env.NEWSLETTER_FROM || 'ASORTA <info@asorta.nl>',
    })

    return [{ channel: 'email', ok: !result.error && !result.skipped, skipped: Boolean(result.skipped), error: result.error || undefined, response: result as AnyRow }]
  } catch (error) {
    return [{ channel: 'email', ok: false, error: error instanceof Error ? error.message : 'E-mail ordermelding mislukt.' }]
  }
}

export async function sendAdminOrderNotification(admin: SupabaseClient, order: AnyRow) {
  if (!order?.id || String(order.payment_status || '').toLowerCase() !== 'paid') return { skipped: true, reason: 'not-paid', channels: [] as NotificationChannelResult[] }

  const raw = rawObject(order)
  if (raw.admin_order_notified_at) return { skipped: true, reason: 'already-notified', channels: [] as NotificationChannelResult[] }

  const items = await loadOrderItems(admin, String(order.id))
  const key = `new-paid-order:${order.id}`
  const reserve = await reserveNotification(admin, key, order, items)
  if (!reserve.reserved) return { skipped: true, reason: reserve.reason || 'duplicate', channels: [] as NotificationChannelResult[] }

  const message = buildPlainMessage(order, items)

  if (!hasAnyNotificationChannel()) {
    const channels = [{ channel: 'none', ok: false, skipped: true, error: 'Geen ordernotificatiekanaal ingesteld.' }]
    await markNotification(admin, key, 'skipped', channels, 'Geen ordernotificatiekanaal ingesteld.')
    await safeOrderEvent(admin, {
      order_id: order.id,
      order_number: orderNo(order),
      event_type: 'admin_order_notification_skipped',
      source: 'order_notifications',
      message: 'Interne ordermelding overgeslagen: geen Telegram, Pushover of e-mail env vars ingesteld.',
      metadata: { key },
    })
    return { skipped: true, reason: 'no-channel-configured', channels }
  }

  const channelResults = [
    ...(hasTelegramConfig() ? await sendTelegram(message) : []),
    ...(hasPushoverConfig() ? await sendPushover(order, message) : []),
    ...(hasEmailConfig() ? await sendEmail(order, items) : []),
  ]

  const successful = channelResults.filter((channel) => channel.ok)
  const failed = channelResults.filter((channel) => !channel.ok && !channel.skipped)

  if (successful.length) {
    await markOrderNotified(admin, order, channelResults)
    await markNotification(admin, key, 'sent', channelResults)
    await safeOrderEvent(admin, {
      order_id: order.id,
      order_number: orderNo(order),
      event_type: 'admin_order_notification_sent',
      source: 'order_notifications',
      message: `Interne ordermelding verzonden via ${successful.map((channel) => channel.channel).join(', ')}.`,
      metadata: { key, channels: channelResults },
    })
    return { skipped: false, channels: channelResults }
  }

  const error = failed.map((channel) => `${channel.channel}: ${channel.error || 'onbekende fout'}`).join(' | ') || 'Geen melding verzonden.'
  await markNotification(admin, key, 'error', channelResults, error)
  await safeOrderEvent(admin, {
    order_id: order.id,
    order_number: orderNo(order),
    event_type: 'admin_order_notification_failed',
    source: 'order_notifications',
    message: `Interne ordermelding niet verzonden: ${error}`,
    metadata: { key, channels: channelResults },
  })

  return { skipped: true, reason: error, channels: channelResults }
}
