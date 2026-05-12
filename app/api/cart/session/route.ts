import { NextResponse } from 'next/server'
import { calculateCartSubtotal, type CartItem } from '@/lib/revenue'
import { createAdminClient } from '@/lib/supabase/admin'

function normalizeItems(items: unknown): CartItem[] {
  if (!Array.isArray(items)) return []
  return items
    .map((item) => {
      const source = item as Partial<CartItem>
      return {
        slug: String(source.slug || '').trim(),
        name: String(source.name || '').trim(),
        price: Number(source.price || 0),
        hero: source.hero ? String(source.hero) : undefined,
        qty: Math.max(1, Number(source.qty || 1)),
      }
    })
    .filter((item) => item.slug && item.name && item.price >= 0)
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const sessionKey = String(body.sessionKey || '').trim()
    const email = body.email ? String(body.email).trim().toLowerCase() : null
    const items = normalizeItems(body.items)
    const subtotal = calculateCartSubtotal(items)

    if (!sessionKey) return NextResponse.json({ error: 'Missing session key.' }, { status: 400 })

    const admin = createAdminClient()
    if (!admin) return NextResponse.json({ ok: true, skipped: true })

    const status = items.length ? 'active' : 'expired'

    const { data, error } = await admin
      .from('cart_sessions')
      .upsert({
        session_key: sessionKey,
        customer_email: email,
        items,
        subtotal,
        status,
        last_activity_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'session_key' })
      .select('id, session_key, status, subtotal')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true, cart: data })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Cart sync failed.' }, { status: 500 })
  }
}
