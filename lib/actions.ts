import { createAdminClient } from '@/lib/supabase/admin'
import { supabase } from '@/lib/supabase'
import type { Product } from '@/lib/products'

export type SiteAction = {
  id?: string
  slug: string
  title: string
  subtitle: string
  body: string
  code: string
  discountType: 'percentage' | 'fixed' | 'free_shipping' | 'custom'
  discountValue: number | null
  buttonText: string
  buttonHref: string
  badgeText: string
  placement: 'homepage' | 'shop' | 'product' | 'global'
  active: boolean
  startsAt: string | null
  endsAt: string | null
  appliesToAll: boolean
  productSlugs: string[]
  categorySlugs: string[]
  priority: number
  theme: string
}

type ActionRow = Record<string, unknown>

function str(value: unknown, fallback = '') {
  return typeof value === 'string' && value.trim() ? value : fallback
}

function arr(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String).filter(Boolean) : []
}

function num(value: unknown, fallback: number | null = null) {
  if (value === null || value === undefined || value === '') return fallback
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function bool(value: unknown, fallback = false) {
  return typeof value === 'boolean' ? value : fallback
}

export function mapActionRow(row: ActionRow): SiteAction {
  return {
    id: str(row.id),
    slug: str(row.slug),
    title: str(row.title, 'Action'),
    subtitle: str(row.subtitle),
    body: str(row.body),
    code: str(row.code),
    discountType: str(row.discount_type, 'percentage') as SiteAction['discountType'],
    discountValue: num(row.discount_value),
    buttonText: str(row.button_text, 'Shop action'),
    buttonHref: str(row.button_href, '/shop'),
    badgeText: str(row.badge_text, 'Action'),
    placement: str(row.placement, 'global') as SiteAction['placement'],
    active: bool(row.active),
    startsAt: str(row.starts_at) || null,
    endsAt: str(row.ends_at) || null,
    appliesToAll: bool(row.applies_to_all, true),
    productSlugs: arr(row.product_slugs),
    categorySlugs: arr(row.category_slugs),
    priority: num(row.priority, 100) || 100,
    theme: str(row.theme, 'blue-red'),
  }
}

export const fallbackAction: SiteAction = {
  slug: 'launch-offer-10',
  title: 'Launch offer',
  subtitle: '10% on every order',
  body: 'Vier de ASORTA launch met tijdelijke openingskorting op de volledige collectie.',
  code: 'ASORTA10',
  discountType: 'percentage',
  discountValue: 10,
  buttonText: 'Shop launch offer',
  buttonHref: '/shop',
  badgeText: '10% OFF',
  placement: 'global',
  active: true,
  startsAt: null,
  endsAt: null,
  appliesToAll: true,
  productSlugs: [],
  categorySlugs: [],
  priority: 10,
  theme: 'blue-red',
}

export async function getActiveActions(): Promise<SiteAction[]> {
  const client = createAdminClient() || supabase
  if (!client) return [fallbackAction]

  const now = new Date().toISOString()
  const { data, error } = await client
    .from('site_actions')
    .select('*')
    .eq('active', true)
    .or(`starts_at.is.null,starts_at.lte.${now}`)
    .or(`ends_at.is.null,ends_at.gte.${now}`)
    .order('priority', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) return [fallbackAction]
  if (!data?.length) return []
  return data.map((row) => mapActionRow(row as ActionRow)).filter((action) => action.slug)
}

export async function getAllActions(): Promise<SiteAction[]> {
  const client = createAdminClient()
  if (!client) return [fallbackAction]

  const { data, error } = await client
    .from('site_actions')
    .select('*')
    .order('priority', { ascending: true })
    .order('created_at', { ascending: false })

  if (error || !data) return []
  return data.map((row) => mapActionRow(row as ActionRow)).filter((action) => action.slug)
}

export function getPrimaryAction(actions: SiteAction[], placement?: SiteAction['placement']) {
  return actions.find((action) => action.placement === placement) || actions.find((action) => action.placement === 'global') || actions[0]
}

export function actionAppliesToProduct(action: SiteAction, product: Product) {
  if (action.appliesToAll) return true
  if (action.productSlugs.includes(product.slug)) return true
  if (action.categorySlugs.includes(product.category)) return true
  return false
}

export function getProductAction(actions: SiteAction[], product: Product) {
  return actions.find((action) => actionAppliesToProduct(action, product))
}

export function formatActionDiscount(action: SiteAction) {
  if (action.discountType === 'percentage' && action.discountValue) return `${action.discountValue}% korting`
  if (action.discountType === 'fixed' && action.discountValue) return `€${action.discountValue.toFixed(2)} korting`
  if (action.discountType === 'free_shipping') return 'Gratis verzending'
  return action.subtitle || action.badgeText
}
