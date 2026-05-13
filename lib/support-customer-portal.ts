import { createAdminClient } from '@/lib/supabase/admin'

type SupabaseAdmin = NonNullable<ReturnType<typeof createAdminClient>>
type JsonRecord = Record<string, unknown>

export type PortalCustomer = {
  id: string | null
  auth_user_id: string | null
  email: string | null
  full_name: string | null
  phone: string | null
  created_at: string | null
  updated_at?: string | null
  source: 'customers' | 'orders' | 'support' | 'search'
}

export type PortalOrder = {
  id: string
  order_number: string | null
  customer_id: string | null
  auth_user_id: string | null
  customer_email: string | null
  subtotal: number | null
  shipping_total: number | null
  vat_total: number | null
  total: number | null
  payment_provider: string | null
  payment_status: string | null
  fulfillment_status: string | null
  cj_order_id: string | null
  tracking_number: string | null
  tracking_url: string | null
  created_at: string | null
  updated_at: string | null
}

export type PortalOrderItem = {
  id: string
  order_id: string
  product_slug: string | null
  product_name: string | null
  quantity: number | null
  unit_price: number | null
  cj_product_id: string | null
  cj_variant_id: string | null
  cj_sku: string | null
  created_at: string | null
}

export type PortalSupportConversation = {
  id: string
  public_token: string | null
  customer_name: string | null
  customer_email: string | null
  customer_phone?: string | null
  subject: string | null
  status: string
  source: string | null
  priority?: string | null
  assigned_to?: string | null
  linked_customer_id?: string | null
  linked_order_id?: string | null
  tags?: string[] | null
  metadata?: JsonRecord | null
  last_message_at: string | null
  created_at: string | null
  updated_at: string | null
}

export type PortalTicket = {
  id: string
  ticket_number: string | null
  conversation_id: string | null
  name: string | null
  email: string | null
  customer_phone?: string | null
  subject: string | null
  message: string | null
  source: string | null
  status: string | null
  priority: string | null
  page_url?: string | null
  order_id?: string | null
  customer_id?: string | null
  metadata?: JsonRecord | null
  created_at: string | null
  updated_at: string | null
}

export type PortalArchive = {
  id: string
  original_conversation_id: string | null
  public_token: string | null
  customer_name: string | null
  customer_email: string | null
  subject: string | null
  source: string | null
  status: string | null
  emailed_to_customer: boolean | null
  archived_by: string | null
  archived_at: string | null
}

export type PortalCart = {
  id: string
  session_key: string | null
  customer_email: string | null
  customer_id: string | null
  auth_user_id: string | null
  items: unknown
  subtotal: number | null
  currency: string | null
  status: string | null
  source: string | null
  recovery_stage: number | null
  converted_order_id: string | null
  last_activity_at: string | null
  created_at: string | null
  updated_at: string | null
}

export type PortalWishlistItem = {
  id: string
  auth_user_id: string | null
  customer_id: string | null
  product_slug: string | null
  created_at: string | null
}

export type PortalLoyalty = {
  id: string
  customer_id: string | null
  auth_user_id: string | null
  points: number | null
  lifetime_spend: number | null
  tier: string | null
  updated_at: string | null
}

export type PortalNote = {
  id: string
  customer_id: string | null
  customer_email: string | null
  order_id: string | null
  conversation_id: string | null
  note_type: string | null
  note: string
  created_by: string | null
  created_at: string | null
  updated_at: string | null
}

export type SupportCustomerPortal = {
  query: string
  matchedBy: string[]
  customer: PortalCustomer | null
  customers: PortalCustomer[]
  orders: PortalOrder[]
  orderItems: PortalOrderItem[]
  conversations: PortalSupportConversation[]
  tickets: PortalTicket[]
  archives: PortalArchive[]
  carts: PortalCart[]
  wishlist: PortalWishlistItem[]
  loyalty: PortalLoyalty | null
  notes: PortalNote[]
  metrics: {
    totalOrders: number
    totalSpent: number
    lastOrderAt: string | null
    openSupport: number
    carts: number
    wishlist: number
    loyaltyPoints: number
    loyaltyTier: string
  }
  warnings: string[]
  serverTime: string
}

const customerSelect = 'id, auth_user_id, email, full_name, phone, created_at, updated_at'
const orderSelect = 'id, order_number, customer_id, auth_user_id, customer_email, subtotal, shipping_total, vat_total, total, payment_provider, payment_status, fulfillment_status, cj_order_id, tracking_number, tracking_url, created_at, updated_at'
const orderItemSelect = 'id, order_id, product_slug, product_name, quantity, unit_price, cj_product_id, cj_variant_id, cj_sku, created_at'
const conversationSelect = 'id, public_token, customer_name, customer_email, customer_phone, subject, status, source, priority, assigned_to, linked_customer_id, linked_order_id, tags, metadata, last_message_at, created_at, updated_at'
const ticketSelect = 'id, ticket_number, conversation_id, name, email, customer_phone, subject, message, source, status, priority, page_url, order_id, customer_id, metadata, created_at, updated_at'
const archiveSelect = 'id, original_conversation_id, public_token, customer_name, customer_email, subject, source, status, emailed_to_customer, archived_by, archived_at'
const cartSelect = 'id, session_key, customer_email, customer_id, auth_user_id, items, subtotal, currency, status, source, recovery_stage, converted_order_id, last_activity_at, created_at, updated_at'
const wishlistSelect = 'id, auth_user_id, customer_id, product_slug, created_at'
const loyaltySelect = 'id, customer_id, auth_user_id, points, lifetime_spend, tier, updated_at'
const noteSelect = 'id, customer_id, customer_email, order_id, conversation_id, note_type, note, created_by, created_at, updated_at'

function clean(value: unknown, limit = 180) {
  return typeof value === 'string' ? value.trim().slice(0, limit) : ''
}

function lowerEmail(value: unknown) {
  const text = clean(value, 240).toLowerCase()
  return text.includes('@') ? text : ''
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function like(value: string) {
  return value.replace(/[%,]/g, '').replace(/\*/g, '').slice(0, 120)
}

function add(set: Set<string>, value: unknown) {
  const text = clean(value, 300)
  if (text) set.add(text)
}

function addEmail(set: Set<string>, value: unknown) {
  const text = lowerEmail(value)
  if (text) set.add(text)
}

function uniq<T>(items: T[]) {
  return Array.from(new Set(items))
}

function uniqueById<T extends { id: string | null }>(...groups: T[][]) {
  const map = new Map<string, T>()
  groups.flat().forEach((item) => {
    if (item?.id) map.set(item.id, item)
  })
  return Array.from(map.values())
}

async function safeRows<T>(warnings: string[], label: string, query: PromiseLike<{ data: unknown; error: unknown }>) {
  let result: { data?: unknown; error?: unknown }
  try {
    result = await query
  } catch (error) {
    result = { data: [], error }
  }

  if (result.error) {
    const message = result.error && typeof result.error === 'object' && 'message' in result.error ? String((result.error as { message?: unknown }).message || '') : String(result.error || '')
    warnings.push(`${label}: ${message || 'niet beschikbaar'}`)
    return [] as T[]
  }
  return ((result.data || []) as T[])
}

function getMetaUuid(record: PortalSupportConversation | null, key: string) {
  const raw = record?.metadata?.[key]
  return typeof raw === 'string' && isUuid(raw) ? raw : ''
}

function inferCustomerFromSupport(conversation: PortalSupportConversation | null): PortalCustomer | null {
  if (!conversation) return null
  return {
    id: conversation.linked_customer_id || getMetaUuid(conversation, 'matched_customer_id') || null,
    auth_user_id: null,
    email: conversation.customer_email || null,
    full_name: conversation.customer_name || null,
    phone: conversation.customer_phone || null,
    created_at: conversation.created_at || new Date().toISOString(),
    source: 'support',
  }
}

function inferCustomerFromOrder(order: PortalOrder): PortalCustomer | null {
  if (!order.customer_id && !order.customer_email) return null
  return {
    id: order.customer_id || null,
    auth_user_id: order.auth_user_id || null,
    email: order.customer_email || null,
    full_name: null,
    phone: null,
    created_at: order.created_at,
    updated_at: order.updated_at || null,
    source: 'orders',
  }
}

export async function getSupportCustomerPortal(admin: SupabaseAdmin, input: { query?: string; conversationId?: string | null }): Promise<SupportCustomerPortal> {
  const warnings: string[] = []
  const query = clean(input.query, 180)
  const normalizedEmail = lowerEmail(query)
  const q = like(query)

  const customerIds = new Set<string>()
  const authIds = new Set<string>()
  const emails = new Set<string>()
  const orderIds = new Set<string>()
  const matchedBy = new Set<string>()

  let selectedConversation: PortalSupportConversation | null = null

  if (input.conversationId && isUuid(input.conversationId)) {
    const conversations = await safeRows<PortalSupportConversation>(
      warnings,
      'Geselecteerd supportgesprek',
      admin.from('support_conversations').select(conversationSelect).eq('id', input.conversationId).limit(1),
    )
    selectedConversation = conversations[0] || null
    if (selectedConversation) {
      matchedBy.add('geselecteerde chat')
      add(customerIds, selectedConversation.linked_customer_id)
      add(orderIds, selectedConversation.linked_order_id)
      add(customerIds, getMetaUuid(selectedConversation, 'matched_customer_id'))
      add(orderIds, getMetaUuid(selectedConversation, 'matched_order_id'))
      addEmail(emails, selectedConversation.customer_email)
    }
  }

  if (normalizedEmail) {
    addEmail(emails, normalizedEmail)
    matchedBy.add('e-mail')
  }

  if (query && isUuid(query)) {
    add(customerIds, query)
    add(authIds, query)
    add(orderIds, query)
    matchedBy.add('uuid')
  }

  let orders: PortalOrder[] = []
  if (orderIds.size) {
    orders = uniqueById(
      orders,
      await safeRows<PortalOrder>(warnings, 'Orders op order-ID', admin.from('orders').select(orderSelect).in('id', Array.from(orderIds)).order('created_at', { ascending: false }).limit(20)),
    )
    matchedBy.add('gekoppelde order')
  }

  if (emails.size) {
    orders = uniqueById(
      orders,
      await safeRows<PortalOrder>(warnings, 'Orders op e-mail', admin.from('orders').select(orderSelect).in('customer_email', Array.from(emails)).order('created_at', { ascending: false }).limit(40)),
    )
  }

  if (customerIds.size) {
    orders = uniqueById(
      orders,
      await safeRows<PortalOrder>(warnings, 'Orders op klant-ID', admin.from('orders').select(orderSelect).in('customer_id', Array.from(customerIds)).order('created_at', { ascending: false }).limit(40)),
    )
  }

  if (query) {
    const orderOr = [
      `order_number.ilike.%${q}%`,
      `customer_email.ilike.%${q}%`,
      `tracking_number.ilike.%${q}%`,
      `tracking_url.ilike.%${q}%`,
      `cj_order_id.ilike.%${q}%`,
    ]
    if (isUuid(query)) orderOr.push(`id.eq.${query}`, `customer_id.eq.${query}`, `auth_user_id.eq.${query}`)
    const foundOrders = await safeRows<PortalOrder>(warnings, 'Orders zoeken', admin.from('orders').select(orderSelect).or(orderOr.join(',')).order('created_at', { ascending: false }).limit(40))
    if (foundOrders.length) matchedBy.add('ordergegevens')
    orders = uniqueById(orders, foundOrders)
  }

  orders.forEach((order) => {
    add(customerIds, order.customer_id)
    add(authIds, order.auth_user_id)
    addEmail(emails, order.customer_email)
    add(orderIds, order.id)
  })

  let customers = [] as PortalCustomer[]
  if (customerIds.size) {
    customers = uniqueById(
      customers,
      (await safeRows<Omit<PortalCustomer, 'source'>>(warnings, 'Klanten op klant-ID', admin.from('customers').select(customerSelect).in('id', Array.from(customerIds)).limit(20))).map((customer) => ({ ...customer, source: 'customers' as const })),
    )
  }

  if (emails.size) {
    customers = uniqueById(
      customers,
      (await safeRows<Omit<PortalCustomer, 'source'>>(warnings, 'Klanten op e-mail', admin.from('customers').select(customerSelect).in('email', Array.from(emails)).limit(20))).map((customer) => ({ ...customer, source: 'customers' as const })),
    )
  }

  if (query) {
    const customerOr = [`email.ilike.%${q}%`, `full_name.ilike.%${q}%`, `phone.ilike.%${q}%`]
    if (isUuid(query)) customerOr.push(`id.eq.${query}`, `auth_user_id.eq.${query}`)
    const foundCustomers = await safeRows<Omit<PortalCustomer, 'source'>>(warnings, 'Klanten zoeken', admin.from('customers').select(customerSelect).or(customerOr.join(',')).limit(20))
    if (foundCustomers.length) matchedBy.add('klantgegevens')
    customers = uniqueById(customers, foundCustomers.map((customer) => ({ ...customer, source: 'customers' as const })))
  }

  if (!customers.length) {
    const inferred = inferCustomerFromSupport(selectedConversation)
    if (inferred) customers = uniqueById(customers, [inferred])
  }

  orders.map(inferCustomerFromOrder).filter(Boolean).forEach((customer) => {
    customers = uniqueById(customers, [customer as PortalCustomer])
  })

  customers.forEach((customer) => {
    add(customerIds, customer.id)
    add(authIds, customer.auth_user_id)
    addEmail(emails, customer.email)
  })

  if (customerIds.size) {
    orders = uniqueById(
      orders,
      await safeRows<PortalOrder>(warnings, 'Orders na klantmatch', admin.from('orders').select(orderSelect).in('customer_id', Array.from(customerIds)).order('created_at', { ascending: false }).limit(60)),
    )
  }
  if (emails.size) {
    orders = uniqueById(
      orders,
      await safeRows<PortalOrder>(warnings, 'Orders na e-mailmatch', admin.from('orders').select(orderSelect).in('customer_email', Array.from(emails)).order('created_at', { ascending: false }).limit(60)),
    )
  }

  orders.forEach((order) => add(orderIds, order.id))

  const [orderItems, conversationsByEmail, conversationsByCustomer, ticketsByEmail, ticketsByCustomer, archives, cartsByEmail, cartsByCustomer, wishlistByCustomer, loyaltyByCustomer, notesByCustomer, notesByEmail, notesByOrder] = await Promise.all([
    orderIds.size ? safeRows<PortalOrderItem>(warnings, 'Orderregels', admin.from('order_items').select(orderItemSelect).in('order_id', Array.from(orderIds)).order('created_at', { ascending: true }).limit(240)) : Promise.resolve([]),
    emails.size ? safeRows<PortalSupportConversation>(warnings, 'Supportgesprekken op e-mail', admin.from('support_conversations').select(conversationSelect).in('customer_email', Array.from(emails)).order('last_message_at', { ascending: false }).limit(40)) : Promise.resolve([]),
    customerIds.size ? safeRows<PortalSupportConversation>(warnings, 'Supportgesprekken op klant-ID', admin.from('support_conversations').select(conversationSelect).in('linked_customer_id', Array.from(customerIds)).order('last_message_at', { ascending: false }).limit(40)) : Promise.resolve([]),
    emails.size ? safeRows<PortalTicket>(warnings, 'Tickets op e-mail', admin.from('support_tickets').select(ticketSelect).in('email', Array.from(emails)).order('created_at', { ascending: false }).limit(40)) : Promise.resolve([]),
    customerIds.size ? safeRows<PortalTicket>(warnings, 'Tickets op klant-ID', admin.from('support_tickets').select(ticketSelect).in('customer_id', Array.from(customerIds)).order('created_at', { ascending: false }).limit(40)) : Promise.resolve([]),
    emails.size ? safeRows<PortalArchive>(warnings, 'Supportarchieven', admin.from('support_conversation_archives').select(archiveSelect).in('customer_email', Array.from(emails)).order('archived_at', { ascending: false }).limit(30)) : Promise.resolve([]),
    emails.size ? safeRows<PortalCart>(warnings, 'Cart sessions op e-mail', admin.from('cart_sessions').select(cartSelect).in('customer_email', Array.from(emails)).order('last_activity_at', { ascending: false }).limit(20)) : Promise.resolve([]),
    customerIds.size ? safeRows<PortalCart>(warnings, 'Cart sessions op klant-ID', admin.from('cart_sessions').select(cartSelect).in('customer_id', Array.from(customerIds)).order('last_activity_at', { ascending: false }).limit(20)) : Promise.resolve([]),
    customerIds.size ? safeRows<PortalWishlistItem>(warnings, 'Wishlist', admin.from('customer_wishlists').select(wishlistSelect).in('customer_id', Array.from(customerIds)).order('created_at', { ascending: false }).limit(30)) : Promise.resolve([]),
    customerIds.size ? safeRows<PortalLoyalty>(warnings, 'Loyalty', admin.from('customer_loyalty').select(loyaltySelect).in('customer_id', Array.from(customerIds)).order('updated_at', { ascending: false }).limit(3)) : Promise.resolve([]),
    customerIds.size ? safeRows<PortalNote>(warnings, 'Interne notities op klant-ID', admin.from('support_customer_notes').select(noteSelect).in('customer_id', Array.from(customerIds)).order('created_at', { ascending: false }).limit(50)) : Promise.resolve([]),
    emails.size ? safeRows<PortalNote>(warnings, 'Interne notities op e-mail', admin.from('support_customer_notes').select(noteSelect).in('customer_email', Array.from(emails)).order('created_at', { ascending: false }).limit(50)) : Promise.resolve([]),
    orderIds.size ? safeRows<PortalNote>(warnings, 'Interne notities op order-ID', admin.from('support_customer_notes').select(noteSelect).in('order_id', Array.from(orderIds)).order('created_at', { ascending: false }).limit(50)) : Promise.resolve([]),
  ])

  let searchConversations: PortalSupportConversation[] = []
  let searchTickets: PortalTicket[] = []
  if (query) {
    const supportOr = [`customer_email.ilike.%${q}%`, `customer_name.ilike.%${q}%`, `subject.ilike.%${q}%`, `customer_phone.ilike.%${q}%`]
    if (isUuid(query)) supportOr.push(`id.eq.${query}`, `public_token.eq.${query}`, `linked_customer_id.eq.${query}`, `linked_order_id.eq.${query}`)
    searchConversations = await safeRows<PortalSupportConversation>(warnings, 'Supportgesprekken zoeken', admin.from('support_conversations').select(conversationSelect).or(supportOr.join(',')).order('last_message_at', { ascending: false }).limit(30))

    const ticketOr = [`ticket_number.ilike.%${q}%`, `email.ilike.%${q}%`, `name.ilike.%${q}%`, `subject.ilike.%${q}%`, `customer_phone.ilike.%${q}%`, `order_id.ilike.%${q}%`]
    if (isUuid(query)) ticketOr.push(`id.eq.${query}`, `conversation_id.eq.${query}`, `customer_id.eq.${query}`)
    searchTickets = await safeRows<PortalTicket>(warnings, 'Tickets zoeken', admin.from('support_tickets').select(ticketSelect).or(ticketOr.join(',')).order('created_at', { ascending: false }).limit(30))
  }

  const conversations = uniqueById(
    selectedConversation ? [selectedConversation] : [],
    conversationsByEmail,
    conversationsByCustomer,
    searchConversations,
  ).sort((a, b) => String(b.last_message_at || b.created_at || '').localeCompare(String(a.last_message_at || a.created_at || '')))

  const tickets = uniqueById(ticketsByEmail, ticketsByCustomer, searchTickets).sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')))
  const carts = uniqueById(cartsByEmail, cartsByCustomer).sort((a, b) => String(b.last_activity_at || b.created_at || '').localeCompare(String(a.last_activity_at || a.created_at || '')))
  const notes = uniqueById(notesByCustomer, notesByEmail, notesByOrder).sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')))
  const loyalty = loyaltyByCustomer[0] || null

  const customer = customers.find((item) => item.source === 'customers') || customers[0] || inferCustomerFromSupport(selectedConversation)
  const totalSpent = orders.reduce((sum, order) => sum + Number(order.total || 0), 0)
  const lastOrderAt = orders.map((order) => order.created_at).filter(Boolean).sort().pop() || null

  return {
    query,
    matchedBy: uniq(Array.from(matchedBy)).slice(0, 8),
    customer: customer || null,
    customers,
    orders: orders.sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || ''))),
    orderItems,
    conversations,
    tickets,
    archives,
    carts,
    wishlist: wishlistByCustomer,
    loyalty,
    notes,
    metrics: {
      totalOrders: orders.length,
      totalSpent,
      lastOrderAt,
      openSupport: conversations.filter((item) => item.status !== 'closed').length + tickets.filter((item) => item.status !== 'closed').length,
      carts: carts.length,
      wishlist: wishlistByCustomer.length,
      loyaltyPoints: Number(loyalty?.points || 0),
      loyaltyTier: loyalty?.tier || 'n.v.t.',
    },
    warnings: uniq(warnings).slice(0, 10),
    serverTime: new Date().toISOString(),
  }
}

export async function linkSupportConversation(
  admin: SupabaseAdmin,
  input: { conversationId: string; customerId?: string | null; orderId?: string | null; linkedBy?: string | null },
) {
  const conversationId = clean(input.conversationId)
  if (!isUuid(conversationId)) throw new Error('Ongeldig gesprek.')

  const updates: JsonRecord = { updated_at: new Date().toISOString() }
  const metadata: JsonRecord = { linked_by: input.linkedBy || 'Atlas', linked_at: new Date().toISOString() }

  if (input.customerId && isUuid(input.customerId)) {
    updates.linked_customer_id = input.customerId
    metadata.matched_customer_id = input.customerId
  }
  if (input.orderId && isUuid(input.orderId)) {
    updates.linked_order_id = input.orderId
    metadata.matched_order_id = input.orderId
  }

  const { data: current } = await admin.from('support_conversations').select('metadata').eq('id', conversationId).maybeSingle()
  updates.metadata = { ...((current?.metadata as JsonRecord | null) || {}), ...metadata }

  const { error } = await admin.from('support_conversations').update(updates).eq('id', conversationId)
  if (error) throw new Error(error.message || 'Koppelen lukte niet.')
}

export async function updateSupportOrder(
  admin: SupabaseAdmin,
  input: {
    orderId: string
    paymentStatus?: string
    fulfillmentStatus?: string
    trackingNumber?: string
    trackingUrl?: string
    cjOrderId?: string
  },
) {
  const orderId = clean(input.orderId)
  if (!isUuid(orderId)) throw new Error('Ongeldige order.')

  const updates: JsonRecord = { updated_at: new Date().toISOString() }
  const fields = [
    ['payment_status', input.paymentStatus],
    ['fulfillment_status', input.fulfillmentStatus],
    ['tracking_number', input.trackingNumber],
    ['tracking_url', input.trackingUrl],
    ['cj_order_id', input.cjOrderId],
  ] as const

  fields.forEach(([key, value]) => {
    if (typeof value === 'string') updates[key] = value.trim().slice(0, 300) || null
  })

  const { error } = await admin.from('orders').update(updates).eq('id', orderId)
  if (error) throw new Error(error.message || 'Order bijwerken lukte niet.')
}
