import type { SupabaseClient } from '@supabase/supabase-js'
import { deflateRawSync } from 'zlib'

export type BookkeepingFilters = {
  from?: string | null
  to?: string | null
  limit?: number
}

type AnyRow = Record<string, any>

type BookkeepingEntryPayload = {
  order_id: string
  order_number: string
  entry_type: string
  entry_status: string
  booked_at: string
  order_created_at: string | null
  payment_completed_at: string | null
  customer_email: string | null
  customer_name: string | null
  products_summary: string | null
  payment_provider: string | null
  payment_method: string | null
  currency: string
  subtotal: number
  shipping_total: number
  vat_total: number
  total: number
  estimated_cost: number
  payment_fee: number
  gross_profit: number
  margin_percent: number
  fulfillment_status: string | null
  payment_status: string | null
  tracking_number: string | null
  tracking_url: string | null
  external_payment_id: string | null
  source: string
  notes: string | null
  metadata: AnyRow
  updated_at: string
}

export type BookkeepingExportRow = {
  bookedAt: string
  period: string
  orderCreatedAt: string
  paymentCompletedAt: string
  orderNumber: string
  entryType: string
  customerName: string
  customerEmail: string
  productsSummary: string
  lineCount: number
  itemCount: number
  currency: string
  subtotal: number
  shippingTotal: number
  vatTotal: number
  total: number
  estimatedCost: number
  paymentFee: number
  grossProfit: number
  marginPercent: number
  paymentProvider: string
  paymentMethod: string
  externalPaymentId: string
  paymentStatus: string
  fulfillmentStatus: string
  trackingNumber: string
  trackingUrl: string
  notes: string
}

function objectValue(value: unknown): AnyRow {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as AnyRow : {}
}

function arrayValue(value: unknown): AnyRow[] {
  return Array.isArray(value) ? value.filter((item) => item && typeof item === 'object') as AnyRow[] : []
}

function number(value: unknown, fallback = 0) {
  const parsed = typeof value === 'number' ? value : Number(String(value ?? '').replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : fallback
}

function money(value: unknown) {
  return Math.round(number(value) * 100) / 100
}

function isoDate(value: unknown): string | null {
  const raw = String(value || '').trim()
  if (!raw) return null
  const parsed = new Date(raw)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
}

function isoDateOnly(value: unknown) {
  const iso = isoDate(value)
  return iso ? iso.slice(0, 10) : ''
}

function accountingPeriod(value: unknown) {
  const iso = isoDate(value)
  return iso ? iso.slice(0, 7) : ''
}

function customerNameFromOrder(order: AnyRow) {
  const shipping = objectValue(order.shipping_address)
  const billing = objectValue(order.billing_address)
  return String(shipping.name || billing.name || order.customer_name || '').trim()
}

function paymentMethodFromOrder(order: AnyRow) {
  const raw = objectValue(order.raw)
  const molliePayment = objectValue(raw.mollie_payment)
  const mollieMetadata = objectValue(molliePayment.metadata)
  const paypalCapture = objectValue(raw.paypal_capture)
  const provider = String(order.payment_provider || '').toLowerCase()

  return String(
    molliePayment.method ||
    mollieMetadata.method ||
    raw.mollie_method ||
    raw.payment_method ||
    paypalCapture.payment_source ||
    (provider.startsWith('mollie:') ? provider.replace('mollie:', '') : provider) ||
    'unknown'
  ).trim()
}

function externalPaymentIdFromOrder(order: AnyRow) {
  const raw = objectValue(order.raw)
  const molliePayment = objectValue(raw.mollie_payment)
  const paypalCapture = objectValue(raw.paypal_capture)
  const paypalUnits = arrayValue(paypalCapture.purchase_units)
  const paypalPayments = objectValue(objectValue(paypalUnits[0]).payments)
  const paypalCaptures = arrayValue(paypalPayments.captures)
  return String(order.payment_id || molliePayment.id || objectValue(paypalCaptures[0]).id || order.supplier_order_id || '').trim()
}

function paymentCompletedAtFromOrder(order: AnyRow) {
  const raw = objectValue(order.raw)
  const molliePayment = objectValue(raw.mollie_payment)
  const paypalCapture = objectValue(raw.paypal_capture)
  const paypalUnits = arrayValue(paypalCapture.purchase_units)
  const paypalPayments = objectValue(objectValue(paypalUnits[0]).payments)
  const paypalCaptures = arrayValue(paypalPayments.captures)
  const paypalFirstCapture = objectValue(paypalCaptures[0])
  return isoDate(
    raw.payment_completed_at ||
    molliePayment.paidAt ||
    molliePayment.createdAt ||
    paypalFirstCapture.update_time ||
    paypalFirstCapture.create_time ||
    raw.finalized_at ||
    order.updated_at ||
    order.created_at
  )
}

function productsSummary(items: AnyRow[]) {
  if (!items.length) return ''
  return items
    .map((item) => {
      const qty = Math.max(1, number(item.quantity, 1))
      const name = String(item.product_name || item.product_slug || 'Product').trim()
      return `${qty}x ${name}`
    })
    .join(' | ')
    .slice(0, 1000)
}

function lineCount(items: AnyRow[]) {
  return items.length
}

function itemCount(items: AnyRow[]) {
  return items.reduce((sum, item) => sum + Math.max(0, number(item.quantity, 0)), 0)
}

function estimatedCostFromOrder(order: AnyRow, items: AnyRow[]) {
  const stored = money(order.estimated_cost)
  if (stored > 0) return stored
  return money(items.reduce((sum, item) => sum + number(item.estimated_unit_cost) * Math.max(1, number(item.quantity, 1)), 0))
}

function paymentFeeFromOrder(order: AnyRow) {
  const raw = objectValue(order.raw)
  const explicit = raw.payment_fee ?? raw.paymentFee ?? raw.provider_fee ?? raw.providerFee ?? raw.fees_total
  return money(explicit)
}

function sourceFromOrder(order: AnyRow) {
  const provider = String(order.payment_provider || '').trim()
  if (!provider) return 'checkout'
  return provider.startsWith('mollie:') ? 'mollie' : provider
}

function isMissingTableError(error: unknown) {
  const message = String((error as { message?: unknown })?.message || error || '').toLowerCase()
  return message.includes('bookkeeping_entries') && (
    message.includes('does not exist') ||
    message.includes('not found') ||
    message.includes('schema cache') ||
    message.includes('could not find') ||
    message.includes('relation')
  )
}

function normalizeLimit(limit: unknown) {
  const parsed = Math.max(1, Math.min(5000, Math.floor(number(limit, 1000))))
  return Number.isFinite(parsed) ? parsed : 1000
}

export function isPaidOrder(order: AnyRow) {
  return String(order.payment_status || '').toLowerCase() === 'paid'
}

export function buildBookkeepingEntryPayload(order: AnyRow, items: AnyRow[] = []): BookkeepingEntryPayload | null {
  if (!order?.id || !isPaidOrder(order)) return null

  const now = new Date().toISOString()
  const subtotal = money(order.subtotal)
  const shippingTotal = money(order.shipping_total)
  const vatTotal = money(order.vat_total)
  const total = money(order.total || subtotal + shippingTotal + vatTotal)
  const estimatedCost = estimatedCostFromOrder(order, items)
  const paymentFee = paymentFeeFromOrder(order)
  const grossProfit = money(total - estimatedCost - paymentFee)
  const marginPercent = total > 0 ? money((grossProfit / total) * 100) : 0
  const paymentCompletedAt = paymentCompletedAtFromOrder(order)
  const bookedAt = paymentCompletedAt || isoDate(order.updated_at) || now
  const raw = objectValue(order.raw)

  return {
    order_id: String(order.id),
    order_number: String(order.order_number || order.id),
    entry_type: 'sale',
    entry_status: 'ready',
    booked_at: bookedAt,
    order_created_at: isoDate(order.created_at),
    payment_completed_at: paymentCompletedAt,
    customer_email: String(order.customer_email || '').trim().toLowerCase() || null,
    customer_name: customerNameFromOrder(order) || null,
    products_summary: productsSummary(items) || null,
    payment_provider: String(order.payment_provider || '').trim() || null,
    payment_method: paymentMethodFromOrder(order) || null,
    currency: String(order.currency || 'EUR').trim() || 'EUR',
    subtotal,
    shipping_total: shippingTotal,
    vat_total: vatTotal,
    total,
    estimated_cost: estimatedCost,
    payment_fee: paymentFee,
    gross_profit: grossProfit,
    margin_percent: marginPercent,
    fulfillment_status: String(order.fulfillment_status || '').trim() || null,
    payment_status: String(order.payment_status || '').trim() || null,
    tracking_number: String(order.tracking_number || '').trim() || null,
    tracking_url: String(order.tracking_url || '').trim() || null,
    external_payment_id: externalPaymentIdFromOrder(order) || null,
    source: sourceFromOrder(order),
    notes: raw.bookkeeping_note ? String(raw.bookkeeping_note).slice(0, 500) : null,
    metadata: {
      order_id: String(order.id),
      line_count: lineCount(items),
      item_count: itemCount(items),
      payment_provider_raw: order.payment_provider || null,
      source: sourceFromOrder(order),
    },
    updated_at: now,
  }
}

async function loadOrderItems(admin: SupabaseClient, orderId: string) {
  const { data, error } = await admin
    .from('order_items')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: true })

  if (error) return [] as AnyRow[]
  return (data || []) as AnyRow[]
}

export async function ensureBookkeepingEntryForOrder(admin: SupabaseClient, order: AnyRow, options: { actorEmail?: string | null; source?: string } = {}) {
  try {
    if (!order?.id || !isPaidOrder(order)) return { ok: true, synced: false, skipped: true, reason: 'not_paid' }

    const items = await loadOrderItems(admin, String(order.id))
    const payload = buildBookkeepingEntryPayload(order, items)
    if (!payload) return { ok: true, synced: false, skipped: true, reason: 'no_payload' }

    const { error } = await admin
      .from('bookkeeping_entries')
      .upsert(payload, { onConflict: 'order_id' })

    if (error) {
      if (isMissingTableError(error)) return { ok: false, synced: false, skipped: true, reason: 'missing_table', error: error.message }
      return { ok: false, synced: false, skipped: true, reason: 'upsert_failed', error: error.message }
    }

    const raw = objectValue(order.raw)
    const syncedAt = new Date().toISOString()
    const shouldLogEvent = !raw.bookkeeping_entry_synced_at || options.source !== 'bookkeeping_sync'

    await admin
      .from('orders')
      .update({ raw: { ...raw, bookkeeping_entry_synced_at: syncedAt }, updated_at: syncedAt })
      .eq('id', order.id)
      .then(() => undefined, () => undefined)

    if (shouldLogEvent) {
      await admin
        .from('order_processing_events')
        .insert({
          order_id: order.id,
          order_number: order.order_number,
          event_type: 'bookkeeping_entry_synced',
          source: options.source || 'bookkeeping',
          message: 'Boekhoudregel automatisch bijgewerkt voor export naar Excel/Sheets.',
          actor_email: options.actorEmail || null,
          metadata: { orderId: order.id, total: payload.total, grossProfit: payload.gross_profit },
        })
        .then(() => undefined, () => undefined)
    }

    return { ok: true, synced: true, skipped: false, reason: 'synced' }
  } catch (error) {
    return { ok: false, synced: false, skipped: true, reason: 'exception', error: error instanceof Error ? error.message : String(error) }
  }
}

export async function syncBookkeepingEntryForOrderId(admin: SupabaseClient, orderId: string, options: { actorEmail?: string | null; source?: string } = {}) {
  if (!orderId) return { ok: false, synced: false, skipped: true, reason: 'missing_order_id' }
  const { data: order, error } = await admin.from('orders').select('*').eq('id', orderId).maybeSingle()
  if (error || !order?.id) return { ok: false, synced: false, skipped: true, reason: 'order_not_found', error: error?.message }
  return ensureBookkeepingEntryForOrder(admin, order as AnyRow, options)
}

export async function syncBookkeepingForPaidOrders(admin: SupabaseClient, filters: BookkeepingFilters = {}) {
  const limit = normalizeLimit(filters.limit || 500)
  let query = admin
    .from('orders')
    .select('*')
    .eq('payment_status', 'paid')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (filters.from) query = query.gte('created_at', `${filters.from}T00:00:00.000Z`)
  if (filters.to) query = query.lte('created_at', `${filters.to}T23:59:59.999Z`)

  const { data, error } = await query
  if (error) return { ok: false, synced: 0, skipped: 0, missingTable: false, error: error.message }

  let synced = 0
  let skipped = 0
  let missingTable = false
  let lastError = ''

  for (const order of (data || []) as AnyRow[]) {
    const result = await ensureBookkeepingEntryForOrder(admin, order, { source: 'bookkeeping_sync' })
    if (result.synced) synced += 1
    else skipped += 1
    if (result.reason === 'missing_table') {
      missingTable = true
      lastError = String(result.error || '')
      break
    }
    if (!result.ok && result.error) lastError = String(result.error)
  }

  return { ok: !lastError || missingTable, synced, skipped, missingTable, error: lastError || undefined }
}

function entryToExportRow(entry: AnyRow): BookkeepingExportRow {
  const metadata = objectValue(entry.metadata)
  return {
    bookedAt: isoDateOnly(entry.booked_at),
    period: accountingPeriod(entry.booked_at),
    orderCreatedAt: isoDateOnly(entry.order_created_at),
    paymentCompletedAt: isoDateOnly(entry.payment_completed_at),
    orderNumber: String(entry.order_number || ''),
    entryType: String(entry.entry_type || 'sale'),
    customerName: String(entry.customer_name || ''),
    customerEmail: String(entry.customer_email || ''),
    productsSummary: String(entry.products_summary || ''),
    lineCount: Math.max(0, number(metadata.line_count, 0)),
    itemCount: Math.max(0, number(metadata.item_count, 0)),
    currency: String(entry.currency || 'EUR'),
    subtotal: money(entry.subtotal),
    shippingTotal: money(entry.shipping_total),
    vatTotal: money(entry.vat_total),
    total: money(entry.total),
    estimatedCost: money(entry.estimated_cost),
    paymentFee: money(entry.payment_fee),
    grossProfit: money(entry.gross_profit),
    marginPercent: money(entry.margin_percent),
    paymentProvider: String(entry.payment_provider || ''),
    paymentMethod: String(entry.payment_method || ''),
    externalPaymentId: String(entry.external_payment_id || ''),
    paymentStatus: String(entry.payment_status || ''),
    fulfillmentStatus: String(entry.fulfillment_status || ''),
    trackingNumber: String(entry.tracking_number || ''),
    trackingUrl: String(entry.tracking_url || ''),
    notes: String(entry.notes || ''),
  }
}

function payloadToExportRow(payload: BookkeepingEntryPayload): BookkeepingExportRow {
  return entryToExportRow(payload)
}

async function fallbackRowsFromPaidOrders(admin: SupabaseClient, filters: BookkeepingFilters = {}) {
  const limit = normalizeLimit(filters.limit || 1000)
  let query = admin
    .from('orders')
    .select('*')
    .eq('payment_status', 'paid')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (filters.from) query = query.gte('created_at', `${filters.from}T00:00:00.000Z`)
  if (filters.to) query = query.lte('created_at', `${filters.to}T23:59:59.999Z`)

  const { data: orders, error } = await query
  if (error) return { rows: [] as BookkeepingExportRow[], error: error.message }

  const rows: BookkeepingExportRow[] = []
  for (const order of (orders || []) as AnyRow[]) {
    const items = await loadOrderItems(admin, String(order.id))
    const payload = buildBookkeepingEntryPayload(order, items)
    if (payload) rows.push(payloadToExportRow(payload))
  }
  return { rows, error: null as string | null }
}

export async function loadBookkeepingRows(admin: SupabaseClient, filters: BookkeepingFilters = {}) {
  const sync = await syncBookkeepingForPaidOrders(admin, { ...filters, limit: filters.limit || 1000 })
  const limit = normalizeLimit(filters.limit || 1000)

  if (!sync.missingTable) {
    let query = admin
      .from('bookkeeping_entries')
      .select('*')
      .order('booked_at', { ascending: false })
      .limit(limit)

    if (filters.from) query = query.gte('booked_at', `${filters.from}T00:00:00.000Z`)
    if (filters.to) query = query.lte('booked_at', `${filters.to}T23:59:59.999Z`)

    const { data, error } = await query
    if (!error) {
      return {
        rows: ((data || []) as AnyRow[]).map(entryToExportRow),
        source: 'bookkeeping_entries' as const,
        synced: sync.synced,
        warning: sync.error && !sync.missingTable ? sync.error : null,
      }
    }

    if (!isMissingTableError(error)) {
      return { rows: [] as BookkeepingExportRow[], source: 'bookkeeping_entries' as const, synced: sync.synced, warning: error.message }
    }
  }

  const fallback = await fallbackRowsFromPaidOrders(admin, filters)
  return {
    rows: fallback.rows,
    source: 'orders_fallback' as const,
    synced: sync.synced,
    warning: fallback.error || 'De tabel public.bookkeeping_entries bestaat nog niet. Export werkt tijdelijk vanuit betaalde orders; draai supabase/v5_42_bookkeeping_export_ledger.sql voor automatische opslag.',
  }
}

export const bookkeepingExportHeaders: Array<{ key: keyof BookkeepingExportRow; title: string; kind: 'text' | 'number' }> = [
  { key: 'bookedAt', title: 'Boekdatum', kind: 'text' },
  { key: 'period', title: 'Periode', kind: 'text' },
  { key: 'orderCreatedAt', title: 'Orderdatum', kind: 'text' },
  { key: 'paymentCompletedAt', title: 'Betaaldatum', kind: 'text' },
  { key: 'orderNumber', title: 'Ordernummer', kind: 'text' },
  { key: 'entryType', title: 'Type', kind: 'text' },
  { key: 'customerName', title: 'Klant', kind: 'text' },
  { key: 'customerEmail', title: 'E-mail', kind: 'text' },
  { key: 'productsSummary', title: 'Producten', kind: 'text' },
  { key: 'lineCount', title: 'Orderregels', kind: 'number' },
  { key: 'itemCount', title: 'Stuks', kind: 'number' },
  { key: 'currency', title: 'Valuta', kind: 'text' },
  { key: 'subtotal', title: 'Subtotaal', kind: 'number' },
  { key: 'shippingTotal', title: 'Verzending', kind: 'number' },
  { key: 'vatTotal', title: 'BTW', kind: 'number' },
  { key: 'total', title: 'Totaal', kind: 'number' },
  { key: 'estimatedCost', title: 'Inkoopwaarde', kind: 'number' },
  { key: 'paymentFee', title: 'Betaalkosten', kind: 'number' },
  { key: 'grossProfit', title: 'Brutomarge', kind: 'number' },
  { key: 'marginPercent', title: 'Marge %', kind: 'number' },
  { key: 'paymentProvider', title: 'Betaalprovider', kind: 'text' },
  { key: 'paymentMethod', title: 'Betaalmethode', kind: 'text' },
  { key: 'externalPaymentId', title: 'Payment ID', kind: 'text' },
  { key: 'paymentStatus', title: 'Betaalstatus', kind: 'text' },
  { key: 'fulfillmentStatus', title: 'Fulfillment', kind: 'text' },
  { key: 'trackingNumber', title: 'Trackingnummer', kind: 'text' },
  { key: 'trackingUrl', title: 'Tracking URL', kind: 'text' },
  { key: 'notes', title: 'Notitie', kind: 'text' },
]

function csvEscape(value: unknown, kind: 'text' | 'number') {
  const raw = kind === 'number'
    ? money(value).toFixed(2).replace('.', ',')
    : String(value ?? '')
  return `"${raw.replace(/"/g, '""').replace(/\r?\n/g, ' ')}"`
}

export function bookkeepingRowsToCsv(rows: BookkeepingExportRow[]) {
  const header = bookkeepingExportHeaders.map((column) => csvEscape(column.title, 'text')).join(';')
  const body = rows.map((row) => bookkeepingExportHeaders.map((column) => csvEscape(row[column.key], column.kind)).join(';'))
  return `\uFEFF${[header, ...body].join('\r\n')}`
}

function escapeXml(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function columnName(index: number) {
  let dividend = index + 1
  let name = ''
  while (dividend > 0) {
    const modulo = (dividend - 1) % 26
    name = String.fromCharCode(65 + modulo) + name
    dividend = Math.floor((dividend - modulo) / 26)
  }
  return name
}

function sheetCell(row: number, col: number, value: unknown, kind: 'text' | 'number', style = 0) {
  const ref = `${columnName(col)}${row + 1}`
  const styleAttr = style ? ` s="${style}"` : ''
  if (kind === 'number') return `<c r="${ref}"${styleAttr}><v>${money(value).toFixed(2)}</v></c>`
  const text = escapeXml(value)
  return `<c r="${ref}" t="inlineStr"${styleAttr}><is><t>${text}</t></is></c>`
}

function sheetXml(rows: BookkeepingExportRow[]) {
  const allRows: Array<Array<{ value: unknown; kind: 'text' | 'number'; style?: number }>> = [
    bookkeepingExportHeaders.map((column) => ({ value: column.title, kind: 'text' as const, style: 1 })),
    ...rows.map((row) => bookkeepingExportHeaders.map((column) => ({ value: row[column.key], kind: column.kind, style: column.kind === 'number' ? 2 : 0 }))),
  ]

  const rowXml = allRows.map((cells, rowIndex) => {
    const c = cells.map((cell, colIndex) => sheetCell(rowIndex, colIndex, cell.value, cell.kind, cell.style || 0)).join('')
    return `<row r="${rowIndex + 1}">${c}</row>`
  }).join('')

  const colXml = bookkeepingExportHeaders.map((column, index) => {
    const width = column.key === 'productsSummary' ? 48 : column.key === 'trackingUrl' ? 42 : ['customerEmail', 'externalPaymentId'].includes(String(column.key)) ? 30 : 16
    const n = index + 1
    return `<col min="${n}" max="${n}" width="${width}" customWidth="1"/>`
  }).join('')

  const lastCol = columnName(bookkeepingExportHeaders.length - 1)
  const lastRow = Math.max(1, rows.length + 1)

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <dimension ref="A1:${lastCol}${lastRow}"/>
  <sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>
  <cols>${colXml}</cols>
  <sheetData>${rowXml}</sheetData>
  <autoFilter ref="A1:${lastCol}${lastRow}"/>
</worksheet>`
}

function stylesXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <numFmts count="1"><numFmt numFmtId="164" formatCode="€ #,##0.00"/></numFmts>
  <fonts count="2"><font><sz val="11"/><name val="Aptos"/></font><font><b/><sz val="11"/><name val="Aptos"/></font></fonts>
  <fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>
  <borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/><xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs>
  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`
}

function workbookXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets><sheet name="Boekhouding" sheetId="1" r:id="rId1"/></sheets>
</workbook>`
}

function workbookRelsXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`
}

function rootRelsXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`
}

function contentTypesXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>`
}

function docPropsCoreXml() {
  const now = new Date().toISOString()
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:creator>ASORTA Atlas</dc:creator><cp:lastModifiedBy>ASORTA Atlas</cp:lastModifiedBy><dcterms:created xsi:type="dcterms:W3CDTF">${now}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">${now}</dcterms:modified>
</cp:coreProperties>`
}

function docPropsAppXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Application>ASORTA Atlas</Application></Properties>`
}

const crcTable = (() => {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n += 1) {
    let c = n
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c >>> 0
  }
  return table
})()

function crc32(buffer: Buffer) {
  let crc = 0xffffffff
  for (const byte of buffer) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

function dosDateTime(date = new Date()) {
  const year = Math.max(1980, date.getFullYear())
  const dosTime = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2)
  const dosDate = ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate()
  return { dosTime, dosDate }
}

function createZip(files: Array<{ path: string; content: string | Buffer }>) {
  const localParts: Buffer[] = []
  const centralParts: Buffer[] = []
  let offset = 0
  const { dosTime, dosDate } = dosDateTime()

  for (const file of files) {
    const filename = Buffer.from(file.path, 'utf8')
    const data = Buffer.isBuffer(file.content) ? file.content : Buffer.from(file.content, 'utf8')
    const compressed = deflateRawSync(data)
    const crc = crc32(data)

    const localHeader = Buffer.alloc(30)
    localHeader.writeUInt32LE(0x04034b50, 0)
    localHeader.writeUInt16LE(20, 4)
    localHeader.writeUInt16LE(0, 6)
    localHeader.writeUInt16LE(8, 8)
    localHeader.writeUInt16LE(dosTime, 10)
    localHeader.writeUInt16LE(dosDate, 12)
    localHeader.writeUInt32LE(crc, 14)
    localHeader.writeUInt32LE(compressed.length, 18)
    localHeader.writeUInt32LE(data.length, 22)
    localHeader.writeUInt16LE(filename.length, 26)
    localHeader.writeUInt16LE(0, 28)

    localParts.push(localHeader, filename, compressed)

    const centralHeader = Buffer.alloc(46)
    centralHeader.writeUInt32LE(0x02014b50, 0)
    centralHeader.writeUInt16LE(20, 4)
    centralHeader.writeUInt16LE(20, 6)
    centralHeader.writeUInt16LE(0, 8)
    centralHeader.writeUInt16LE(8, 10)
    centralHeader.writeUInt16LE(dosTime, 12)
    centralHeader.writeUInt16LE(dosDate, 14)
    centralHeader.writeUInt32LE(crc, 16)
    centralHeader.writeUInt32LE(compressed.length, 20)
    centralHeader.writeUInt32LE(data.length, 24)
    centralHeader.writeUInt16LE(filename.length, 28)
    centralHeader.writeUInt16LE(0, 30)
    centralHeader.writeUInt16LE(0, 32)
    centralHeader.writeUInt16LE(0, 34)
    centralHeader.writeUInt16LE(0, 36)
    centralHeader.writeUInt32LE(0, 38)
    centralHeader.writeUInt32LE(offset, 42)
    centralParts.push(centralHeader, filename)

    offset += localHeader.length + filename.length + compressed.length
  }

  const centralDirectory = Buffer.concat(centralParts)
  const end = Buffer.alloc(22)
  end.writeUInt32LE(0x06054b50, 0)
  end.writeUInt16LE(0, 4)
  end.writeUInt16LE(0, 6)
  end.writeUInt16LE(files.length, 8)
  end.writeUInt16LE(files.length, 10)
  end.writeUInt32LE(centralDirectory.length, 12)
  end.writeUInt32LE(offset, 16)
  end.writeUInt16LE(0, 20)

  return Buffer.concat([...localParts, centralDirectory, end])
}

export function bookkeepingRowsToXlsx(rows: BookkeepingExportRow[]) {
  return createZip([
    { path: '[Content_Types].xml', content: contentTypesXml() },
    { path: '_rels/.rels', content: rootRelsXml() },
    { path: 'docProps/core.xml', content: docPropsCoreXml() },
    { path: 'docProps/app.xml', content: docPropsAppXml() },
    { path: 'xl/workbook.xml', content: workbookXml() },
    { path: 'xl/_rels/workbook.xml.rels', content: workbookRelsXml() },
    { path: 'xl/styles.xml', content: stylesXml() },
    { path: 'xl/worksheets/sheet1.xml', content: sheetXml(rows) },
  ])
}

export function bookkeepingFilename(format: 'csv' | 'xlsx', filters: BookkeepingFilters = {}) {
  const today = new Date().toISOString().slice(0, 10)
  const range = filters.from || filters.to ? `_${filters.from || 'start'}_${filters.to || today}` : `_${today}`
  return `asorta-boekhouding${range}.${format}`
}
