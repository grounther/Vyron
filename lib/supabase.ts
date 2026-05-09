import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

export type OrderStatus = 'draft' | 'pending_payment' | 'paid' | 'sent_to_supplier' | 'fulfilled' | 'cancelled' | 'refunded'

export type AsortaOrder = {
  id: string
  order_number: string
  customer_email: string | null
  subtotal: number
  shipping_total: number
  vat_total: number
  total: number
  estimated_cost: number
  estimated_profit: number
  payment_status: string
  fulfillment_status: OrderStatus
  created_at: string
}
