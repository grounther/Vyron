import { createAdminClient } from '@/lib/supabase/admin'

export type CartItem = {
  slug: string
  name: string
  price: number
  hero?: string
  qty: number
}

export type CartSession = {
  id: string
  session_key: string
  customer_email: string | null
  items: CartItem[]
  subtotal: number
  status: string
  recovery_stage: number
  recovery_token: string | null
  last_activity_at: string
  created_at: string
  updated_at: string
}

export function calculateCartSubtotal(items: CartItem[]) {
  return items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.qty || 0), 0)
}

export async function getCartRecoveryDashboard() {
  const admin = createAdminClient()
  if (!admin) return { sessions: [] as CartSession[], stats: { active: 0, abandoned: 0, recovered: 0, potential: 0 } }

  const { data } = await admin
    .from('cart_sessions')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(80)

  const sessions = (data || []) as CartSession[]
  const stats = {
    active: sessions.filter((session) => session.status === 'active' || session.status === 'checkout_started').length,
    abandoned: sessions.filter((session) => session.status === 'abandoned').length,
    recovered: sessions.filter((session) => session.status === 'recovered' || session.status === 'converted').length,
    potential: sessions.reduce((sum, session) => sum + Number(session.subtotal || 0), 0),
  }

  return { sessions, stats }
}
