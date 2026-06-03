import type { SupabaseClient, User } from '@supabase/supabase-js'
import { getCardsForSeries, getSeries, rarityRank, type TcgCard, type TcgRarity, type TcgSeriesKey } from '@/lib/tcg-game'

type CustomerContext = {
  customer: { id: string; email: string; auth_user_id?: string | null }
}

function weightedPick<T extends string>(weights: Array<[T, number]>): T {
  const total = weights.reduce((sum, [, weight]) => sum + weight, 0)
  let roll = Math.random() * total
  for (const [value, weight] of weights) {
    roll -= weight
    if (roll <= 0) return value
  }
  return weights[weights.length - 1][0]
}

function pickOne<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)]
}

function pickCard(seriesCards: TcgCard[], rarity: TcgRarity) {
  const matching = seriesCards.filter((card) => card.rarity === rarity)
  return pickOne(matching.length ? matching : seriesCards)
}

export async function ensureTcgCustomer(admin: SupabaseClient, user: User): Promise<CustomerContext> {
  const email = String(user.email || '').trim().toLowerCase()
  if (!email) throw new Error('Account e-mailadres ontbreekt.')

  const { data, error } = await admin
    .from('customers')
    .upsert({ auth_user_id: user.id, email, updated_at: new Date().toISOString() }, { onConflict: 'email' })
    .select('id,email,auth_user_id')
    .single()

  if (error || !data?.id) throw new Error(error?.message || 'Klantprofiel kon niet worden geladen.')

  // Claim manually granted credits that were added by support before auth_user_id was known.
  await admin
    .from('customer_pack_credits')
    .update({ auth_user_id: user.id, customer_id: data.id, updated_at: new Date().toISOString() })
    .eq('customer_email', email)
    .is('auth_user_id', null)
    .then(() => undefined, () => undefined)

  return { customer: data as CustomerContext['customer'] }
}

export async function syncPackCreditsForPaidOrders(admin: SupabaseClient, user: User, customerId: string) {
  const email = String(user.email || '').trim().toLowerCase()
  if (!email) return 0

  const { data: orders } = await admin
    .from('orders')
    .select('id,order_number,customer_email,payment_status,total,created_at')
    .eq('customer_email', email)
    .in('payment_status', ['paid', 'authorized', 'partially_paid', 'open'])
    .order('created_at', { ascending: true })
    .limit(100)

  const rows = (orders || []).map((order: any) => ({
    customer_id: customerId,
    auth_user_id: user.id,
    customer_email: email,
    order_id: order.id,
    order_number: order.order_number,
    source: 'paid_order',
    status: 'available',
  }))

  if (!rows.length) return 0
  const { error } = await admin.from('customer_pack_credits').upsert(rows, { onConflict: 'order_id' })
  if (error) return 0

  const orderIds = rows.map((row: { order_id: string }) => row.order_id).filter(Boolean)
  const { data: credits } = await admin
    .from('customer_pack_credits')
    .select('id,customer_id,auth_user_id,customer_email,order_id,order_number,source')
    .in('order_id', orderIds)

  const creditIds = (credits || []).map((credit: any) => credit.id).filter(Boolean)
  const { data: existingEvents } = creditIds.length
    ? await admin.from('customer_pack_events').select('credit_id').in('credit_id', creditIds).eq('event_type', 'grant')
    : { data: [] as any[] }
  const logged = new Set((existingEvents || []).map((event: any) => String(event.credit_id)))
  const missingEvents = (credits || []).filter((credit: any) => !logged.has(String(credit.id)))

  if (missingEvents.length) {
    await admin
      .from('customer_pack_events')
      .insert(missingEvents.map((credit: any) => ({
        customer_id: credit.customer_id,
        auth_user_id: credit.auth_user_id,
        customer_email: credit.customer_email,
        credit_id: credit.id,
        order_id: credit.order_id,
        event_type: 'grant',
        source: credit.source,
        quantity: 1,
        reason: credit.order_number ? `Automatisch pakje voor betaalde order ${credit.order_number}` : 'Automatisch pakje voor betaalde order',
        created_by: 'system',
      })))
      .then(() => undefined, () => undefined)
  }

  return rows.length
}

export async function getTcgState(admin: SupabaseClient, user: User) {
  const { customer } = await ensureTcgCustomer(admin, user)
  await syncPackCreditsForPaidOrders(admin, user, customer.id)

  const [{ data: credits }, { data: collection }] = await Promise.all([
    admin
      .from('customer_pack_credits')
      .select('id,source,order_id,order_number,status,created_at')
      .eq('auth_user_id', user.id)
      .eq('status', 'available')
      .order('created_at', { ascending: true }),
    admin
      .from('customer_card_collection')
      .select('card_id,series_key,card_name,rarity,variant,quantity,first_pulled_at,updated_at')
      .eq('auth_user_id', user.id)
      .order('series_key', { ascending: true })
      .order('card_id', { ascending: true }),
  ])

  return {
    customer,
    availableCredits: credits || [],
    availablePackCount: credits?.length || 0,
    collection: collection || [],
  }
}

function generatePack(seriesKey: TcgSeriesKey) {
  const series = getSeries(seriesKey)
  if (!series) throw new Error('Onbekende serie.')

  const cards = getCardsForSeries(seriesKey)
  const result: TcgCard[] = []

  for (let i = 0; i < 5; i += 1) result.push(pickCard(cards, 'common'))
  for (let i = 0; i < 3; i += 1) result.push(pickCard(cards, weightedPick<TcgRarity>([['uncommon', 84], ['rare', 13], ['reverse_holo', 3]])))
  result.push(pickCard(cards, weightedPick<TcgRarity>([['reverse_holo', 62], ['holo', 26], ['rare', 12]])))

  const hitRarity = weightedPick<TcgRarity>([
    ['rare', 46],
    ['holo', 26],
    ['full_art', 12],
    ['ultra_rare', 9],
    ['secret_rare', 5],
    ['gold_rare', 2],
  ])
  result.push(pickCard(cards, hitRarity))

  return result.map((card, index) => ({
    ...card,
    packSlot: index + 1,
    pullId: `${card.id}:${card.rarity}:${index}:${Math.random().toString(36).slice(2, 8)}`,
  }))
}

export async function openTcgPack(admin: SupabaseClient, user: User, seriesKey: TcgSeriesKey) {
  const series = getSeries(seriesKey)
  if (!series) throw new Error('Kies een geldige serie.')

  const { customer } = await ensureTcgCustomer(admin, user)
  await syncPackCreditsForPaidOrders(admin, user, customer.id)

  const { data: credit, error: creditError } = await admin
    .from('customer_pack_credits')
    .select('id,status')
    .eq('auth_user_id', user.id)
    .eq('status', 'available')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (creditError) throw new Error(creditError.message)
  if (!credit?.id) throw new Error('Je hebt nog geen virtueel pakje beschikbaar. Plaats eerst een bestelling met je account.')

  const cards = generatePack(seriesKey)

  const { error: updateCreditError } = await admin
    .from('customer_pack_credits')
    .update({ status: 'opened', opened_at: new Date().toISOString(), series_chosen: seriesKey })
    .eq('id', credit.id)
    .eq('status', 'available')

  if (updateCreditError) throw new Error(updateCreditError.message)

  await admin
    .from('customer_pack_events')
    .insert({
      customer_id: customer.id,
      auth_user_id: user.id,
      customer_email: customer.email,
      credit_id: credit.id,
      event_type: 'opened',
      source: 'account_minigame',
      series_key: seriesKey,
      quantity: 1,
      reason: `Klant opende ${series.name}`,
      created_by: 'customer',
    })
    .then(() => undefined, () => undefined)

  const openingRows = cards.map((card) => ({
    customer_id: customer.id,
    auth_user_id: user.id,
    customer_email: customer.email,
    credit_id: credit.id,
    series_key: seriesKey,
    card_id: card.id,
    card_name: card.name,
    rarity: card.rarity,
    variant: card.variant,
    pack_slot: card.packSlot,
  }))

  const { data: opening, error: openingError } = await admin
    .from('customer_pack_openings')
    .insert({
      customer_id: customer.id,
      auth_user_id: user.id,
      customer_email: customer.email,
      credit_id: credit.id,
      series_key: seriesKey,
      cards,
    })
    .select('id,created_at')
    .single()

  if (openingError) throw new Error(openingError.message)

  await admin.from('customer_pack_opening_cards').insert(openingRows).then(() => undefined, () => undefined)

  for (const card of cards) {
    const { data: existing } = await admin
      .from('customer_card_collection')
      .select('id,quantity,rarity')
      .eq('auth_user_id', user.id)
      .eq('card_id', card.id)
      .eq('variant', card.variant)
      .maybeSingle()

    if (existing?.id) {
      await admin
        .from('customer_card_collection')
        .update({
          quantity: Number(existing.quantity || 0) + 1,
          rarity: rarityRank(card.rarity) > rarityRank(String(existing.rarity || '')) ? card.rarity : existing.rarity,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .then(() => undefined, () => undefined)
    } else {
      await admin
        .from('customer_card_collection')
        .insert({
          customer_id: customer.id,
          auth_user_id: user.id,
          customer_email: customer.email,
          card_id: card.id,
          series_key: seriesKey,
          card_name: card.name,
          card_number: card.number,
          card_type: card.type,
          rarity: card.rarity,
          variant: card.variant,
          quantity: 1,
        })
        .then(() => undefined, () => undefined)
    }
  }

  return { opening, series, cards }
}
