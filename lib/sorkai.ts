import { cleanText } from '@/lib/support-admin'

type Admin = any

type Conversation = {
  id: string
  public_token?: string | null
  customer_name?: string | null
  customer_email?: string | null
  subject?: string | null
  status?: string | null
  metadata?: Record<string, unknown> | null
}

type SorkaiSettings = {
  enabled: boolean
  liveStatus: 'online' | 'offline' | 'auto'
  mode: 'assist' | 'intake'
}

type SorkaiResult = {
  inserted: boolean
  reply?: string
  intent?: string
  needsHuman?: boolean
  confidence?: number
}

function normalize(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function lower(value: unknown) {
  return normalize(value).toLowerCase()
}

function money(value: unknown) {
  const n = Number(value || 0)
  if (!Number.isFinite(n)) return '€0,00'
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(n)
}

function formatDate(value?: string | null) {
  if (!value) return 'onbekend'
  try {
    return new Date(value).toLocaleString('nl-NL')
  } catch {
    return value
  }
}

function findOrderNumber(text: string) {
  const match = text.match(/\bAS[-\s]?[A-Z0-9-]{6,}\b/i)
  return match?.[0]?.replace(/\s+/g, '') || ''
}

function findTrackingNumber(text: string) {
  const match = text.match(/\b(?:3S[A-Z0-9]{8,}|JVGL[A-Z0-9]{8,}|[A-Z]{2}\d{9}[A-Z]{2}|[A-Z0-9]{10,24})\b/i)
  const candidate = match?.[0] || ''
  if (/^AS[-\s]?/i.test(candidate)) return ''
  return candidate
}

function detectIntent(message: string) {
  const text = lower(message)
  if (/(pakje|minigame|booster|reward|beloning|collectie|kaart|cards?)/i.test(text)) return 'minigame'
  if (/(track|trace|tracking|verzend|bezorg|pakket|lever|zending|waar.*bestelling|waar.*order)/i.test(text)) return 'shipping'
  if (/(order|bestelling|status|betaald|betaling|paypal|factuur)/i.test(text)) return 'order'
  if (/(retour|terugstuur|refund|geld terug|annuleer|annuleren|ruilen)/i.test(text)) return 'return'
  if (/(korting|coupon|code|grandopening|prijs)/i.test(text)) return 'discount'
  return 'general'
}

export async function getSorkaiSettings(admin: Admin): Promise<SorkaiSettings> {
  const defaults: SorkaiSettings = { enabled: true, liveStatus: 'offline', mode: 'assist' }

  const { data, error } = await admin
    .from('support_settings')
    .select('key,value')
    .in('key', ['sorkai_enabled', 'live_support_status', 'sorkai_mode'])

  if (error || !data) return defaults
  const map = new Map((data || []).map((row: any) => [String(row.key), String(row.value)]))
  const liveStatus = ['online', 'offline', 'auto'].includes(String(map.get('live_support_status'))) ? String(map.get('live_support_status')) as SorkaiSettings['liveStatus'] : defaults.liveStatus
  const mode = ['assist', 'intake'].includes(String(map.get('sorkai_mode'))) ? String(map.get('sorkai_mode')) as SorkaiSettings['mode'] : defaults.mode

  return {
    enabled: map.get('sorkai_enabled') !== 'false',
    liveStatus,
    mode,
  }
}

export async function setSorkaiSettings(admin: Admin, input: Partial<SorkaiSettings>) {
  const rows: Array<{ key: string; value: string; updated_at: string }> = []
  const now = new Date().toISOString()
  if (typeof input.enabled === 'boolean') rows.push({ key: 'sorkai_enabled', value: String(input.enabled), updated_at: now })
  if (input.liveStatus && ['online', 'offline', 'auto'].includes(input.liveStatus)) rows.push({ key: 'live_support_status', value: input.liveStatus, updated_at: now })
  if (input.mode && ['assist', 'intake'].includes(input.mode)) rows.push({ key: 'sorkai_mode', value: input.mode, updated_at: now })
  if (!rows.length) return getSorkaiSettings(admin)
  await admin.from('support_settings').upsert(rows, { onConflict: 'key' })
  return getSorkaiSettings(admin)
}

async function findOrder(admin: Admin, conversation: Conversation, message: string) {
  const email = lower(conversation.customer_email)
  const orderNumber = findOrderNumber(message)
  const tracking = findTrackingNumber(message)

  let query = admin
    .from('orders')
    .select('id,order_number,customer_email,total,payment_status,fulfillment_status,tracking_number,tracking_url,created_at,updated_at')
    .limit(1)

  if (orderNumber) query = query.ilike('order_number', orderNumber)
  else if (tracking) query = query.ilike('tracking_number', tracking)
  else if (email) query = query.eq('customer_email', email).order('created_at', { ascending: false })
  else return { order: null, orderNumber, tracking }

  const { data } = await query.maybeSingle()
  const order = data as any | null
  if (order?.customer_email && email && lower(order.customer_email) !== email) return { order: null, orderNumber, tracking, mismatch: true }
  return { order, orderNumber, tracking }
}

async function getPackSummary(admin: Admin, conversation: Conversation) {
  const email = lower(conversation.customer_email)
  if (!email) return null
  const { data } = await admin
    .from('customer_pack_credits')
    .select('id,status,source,order_number,created_at,opened_at,series_chosen')
    .eq('customer_email', email)
    .order('created_at', { ascending: false })
    .limit(80)
  const credits = (data || []) as any[]
  return {
    total: credits.length,
    available: credits.filter((credit) => credit.status === 'available').length,
    opened: credits.filter((credit) => credit.status === 'opened').length,
    voided: credits.filter((credit) => ['void', 'voided', 'cancelled'].includes(String(credit.status))).length,
    latest: credits[0] || null,
  }
}

function orderReply(order: any) {
  if (!order) return ''
  const tracking = order.tracking_number
    ? `\n\nTrack & trace: ${order.tracking_number}${order.tracking_url ? `\nLink: ${order.tracking_url}` : ''}`
    : '\n\nIk zie nog geen track & trace bij deze order. Zodra de zending is aangemeld, wordt die zichtbaar in je orderupdates.'

  return `Ik heb je order gevonden: ${order.order_number || order.id}.\n\nBetaalstatus: ${order.payment_status || 'onbekend'}\nVerzendstatus: ${order.fulfillment_status || 'in behandeling'}\nTotaal: ${money(order.total)}\nAangemaakt: ${formatDate(order.created_at)}${tracking}\n\nAls iets niet klopt, laat ik dit gesprek openstaan zodat ASORTA Support het kan controleren.`
}

export async function buildSorkaiReply(admin: Admin, conversation: Conversation, message: string) {
  const intent = detectIntent(message)
  const { order, orderNumber, tracking, mismatch } = await findOrder(admin, conversation, message)
  const packSummary = intent === 'minigame' ? await getPackSummary(admin, conversation) : null
  let needsHuman = false
  let confidence = 0.72
  let reply = ''

  if (mismatch) {
    needsHuman = true
    confidence = 0.55
    reply = 'Ik vind een order/tracking die niet overeenkomt met het e-mailadres van deze chat. Om klantgegevens veilig te houden laat ik dit door ASORTA Support controleren. Stuur eventueel ook het ordernummer en het e-mailadres waarmee is besteld.'
  } else if (intent === 'order' || intent === 'shipping') {
    if (order) {
      reply = orderReply(order)
      confidence = 0.86
    } else {
      needsHuman = true
      reply = `Ik help je graag met je bestelling. Stuur je ordernummer${tracking ? '' : ' of track & trace nummer'} en het e-mailadres waarmee je hebt besteld. Dan kan ik de status beter controleren.`
    }
  } else if (intent === 'minigame') {
    if (packSummary) {
      const latest = packSummary.latest
      reply = `Ik heb je minigame pakjes gecontroleerd.\n\nTotaal toegekend: ${packSummary.total}\nOngeopend: ${packSummary.available}\nGeopend: ${packSummary.opened}\nVervallen/gecorrigeerd: ${packSummary.voided}${latest ? `\n\nLaatste pakje: ${formatDate(latest.created_at)} · status ${latest.status}${latest.order_number ? ` · order ${latest.order_number}` : ''}` : ''}\n\nAls je denkt dat er na een betaalde aankoop een pakje mist, stuur dan je ordernummer. Dan kan ASORTA Support de pack-log controleren en eventueel handmatig corrigeren.`
      confidence = 0.84
    } else {
      reply = 'Ik kan je pakjes pas goed controleren als ik je account/e-mailadres kan koppelen. Stuur je ordernummer of log in op je account en probeer daarna je collectiepagina opnieuw.'
      needsHuman = true
    }
  } else if (intent === 'return') {
    needsHuman = true
    reply = 'Ik kan je retour- of annuleringverzoek alvast voorbereiden. Stuur je ordernummer, e-mailadres en de reden van retour/annulering. ASORTA Support beoordeelt dit handmatig en komt erop terug.'
  } else if (intent === 'discount') {
    reply = 'Kortingscodes worden vóór betaling berekend. Zie je een fout in je korting of totaalbedrag? Stuur de code, je winkelmand/product en eventueel een screenshot. Dan kan ASORTA Support dit nakijken.'
  } else {
    reply = 'Ik ben Sorkai, de ASORTA support-assistent. Live support is nu niet direct beschikbaar, maar ik kan alvast helpen. Voor ordervragen: stuur je ordernummer en e-mailadres. Voor verzending: stuur je track & trace. Voor minigame-pakjes: stuur je ordernummer of accountmail.'
    confidence = 0.62
  }

  return { reply, intent, needsHuman, confidence }
}

export async function maybeRunSorkai(admin: Admin, conversation: Conversation, customerMessage: string): Promise<SorkaiResult> {
  const settings = await getSorkaiSettings(admin)
  if (!settings.enabled || settings.liveStatus === 'online') return { inserted: false }
  if (!conversation?.id) return { inserted: false }

  const { data: recent } = await admin
    .from('support_messages')
    .select('id,sender_type,author_name,created_at')
    .eq('conversation_id', conversation.id)
    .order('created_at', { ascending: false })
    .limit(1)

  const latest = Array.isArray(recent) ? recent[0] : null
  // maybeRunSorkai is called after a customer message is inserted. The previous version
  // checked the last two messages and skipped when one of them was Sorkai. That made
  // Sorkai answer only once per conversation because the previous Sorkai reply was
  // still within the last two rows. Only skip when the actual latest message is already
  // from Sorkai, which prevents duplicate bot replies while allowing normal follow-ups.
  if (latest?.sender_type === 'operator' && String(latest?.author_name || '').toLowerCase() === 'sorkai') {
    return { inserted: false }
  }

  const result = await buildSorkaiReply(admin, conversation, customerMessage)
  const body = `${result.reply}\n\n— Sorkai, ASORTA support-assistent`
  const now = new Date().toISOString()

  const { error } = await admin.from('support_messages').insert({
    conversation_id: conversation.id,
    sender_type: 'operator',
    author_name: 'Sorkai',
    body,
  })

  if (error) return { inserted: false }

  await admin
    .from('support_conversations')
    .update({
      status: result.needsHuman ? 'pending' : 'answered',
      last_message_at: now,
      updated_at: now,
      metadata: {
        ...(conversation.metadata || {}),
        sorkai_last_intent: result.intent,
        sorkai_last_confidence: result.confidence,
        sorkai_needs_human: result.needsHuman,
        sorkai_last_reply_at: now,
      },
    })
    .eq('id', conversation.id)
    .then(() => undefined, () => undefined)

  await admin
    .from('support_tickets')
    .update({ status: result.needsHuman ? 'pending' : 'answered', updated_at: now })
    .eq('conversation_id', conversation.id)
    .then(() => undefined, () => undefined)

  await admin
    .from('support_sorkai_logs')
    .insert({
      conversation_id: conversation.id,
      customer_email: conversation.customer_email || null,
      customer_message: cleanText(customerMessage, 3000),
      response_body: result.reply,
      intent: result.intent,
      confidence: result.confidence,
      needs_human: result.needsHuman,
      live_status: settings.liveStatus,
      metadata: { subject: conversation.subject || null, mode: settings.mode },
    })
    .then(() => undefined, () => undefined)

  return { inserted: true, ...result }
}
