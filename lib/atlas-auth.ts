import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

type SupabaseAdmin = NonNullable<ReturnType<typeof createAdminClient>>
type AtlasUser = { id: string; email?: string | null }

type AnyRow = Record<string, any>

export type AtlasPermission =
  | 'support'
  | 'head_support'
  | 'products'
  | 'orders'
  | 'pricing'
  | 'inventory'
  | 'pages'
  | 'promotions'
  | 'newsletter'
  | 'recovery'
  | 'seo'
  | 'integrations'
  | 'settings'

export type AtlasStaffAccess = {
  email: string
  displayName: string
  role: string
  active: boolean
  source: 'admin_users' | 'atlas_staff_members'
  permissions: Record<AtlasPermission, boolean>
}

const ALL_PERMISSIONS: AtlasPermission[] = [
  'support',
  'head_support',
  'products',
  'orders',
  'pricing',
  'inventory',
  'pages',
  'promotions',
  'newsletter',
  'recovery',
  'seo',
  'integrations',
  'settings',
]

function titleCase(value: string) {
  return value
    .split(/[-_.\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ')
}

export function displayNameFromEmail(email: string, fallback = 'ASORTA Support') {
  const normalized = String(email || '').trim().toLowerCase()
  if (!normalized) return fallback
  if (normalized === 'o.kelder.raalte@gmail.com') return 'Oscar'
  const local = normalized.split('@')[0] || fallback
  return titleCase(local) || fallback
}

function emptyPermissions(): Record<AtlasPermission, boolean> {
  return ALL_PERMISSIONS.reduce((acc, permission) => {
    acc[permission] = false
    return acc
  }, {} as Record<AtlasPermission, boolean>)
}

function allPermissions(): Record<AtlasPermission, boolean> {
  return ALL_PERMISSIONS.reduce((acc, permission) => {
    acc[permission] = true
    return acc
  }, {} as Record<AtlasPermission, boolean>)
}

function accessFromAdminRow(row: AnyRow, email: string): AtlasStaffAccess {
  const role = String(row.role || '').toLowerCase()
  const ownerOrAdmin = role === 'owner' || role === 'admin' || row.is_owner === true
  const permissions = ownerOrAdmin ? allPermissions() : emptyPermissions()

  if (!ownerOrAdmin) {
    permissions.support = row.can_support === true || role === 'support'
    permissions.products = row.can_products === true || row.can_inventory === true || role === 'products' || role === 'inventory'
    permissions.inventory = row.can_inventory === true || row.can_products === true || role === 'inventory'
    permissions.orders = row.can_orders === true || role === 'orders'
    permissions.pricing = row.can_pricing === true || role === 'pricing'
    permissions.pages = row.can_pages === true || role === 'pages'
    permissions.promotions = row.can_promotions === true || role === 'promotions'
    permissions.newsletter = row.can_newsletter === true || role === 'newsletter'
    permissions.recovery = row.can_recovery === true || role === 'recovery'
    permissions.seo = row.can_seo === true || role === 'seo'
    permissions.integrations = row.can_integrations === true || role === 'integrations'
    permissions.settings = row.can_settings === true || role === 'settings'
  }

  return {
    email,
    displayName: String(row.display_name || '').trim() || displayNameFromEmail(email),
    role: role || 'admin',
    active: row.active !== false,
    source: 'admin_users',
    permissions,
  }
}

function accessFromStaffRow(row: AnyRow, badges: string[], email: string): AtlasStaffAccess {
  const permissions = emptyPermissions()
  for (const badge of badges.map((item) => String(item || '').toLowerCase())) {
    if (badge in permissions) permissions[badge as AtlasPermission] = true
  }
  if (String(row.role || '').toLowerCase() === 'support') permissions.support = true

  return {
    email,
    displayName: String(row.display_name || '').trim() || displayNameFromEmail(email),
    role: String(row.role || 'staff'),
    active: row.active !== false && row.status !== 'disabled',
    source: 'atlas_staff_members',
    permissions,
  }
}

export function hasAtlasPermission(access: AtlasStaffAccess | null | undefined, permission: AtlasPermission) {
  return Boolean(access?.permissions?.[permission] || access?.role === 'owner' || access?.role === 'admin')
}

export function isSupportOnly(access: AtlasStaffAccess) {
  const enabled = ALL_PERMISSIONS.filter((permission) => hasAtlasPermission(access, permission))
  return enabled.length === 1 && enabled[0] === 'support'
}

export async function resolveAtlasStaffAccess(admin: SupabaseAdmin, email: string): Promise<AtlasStaffAccess | null> {
  const normalized = String(email || '').trim().toLowerCase()
  if (!normalized) return null

  const { data: adminUser } = await admin
    .from('admin_users')
    .select('*')
    .eq('email', normalized)
    .eq('active', true)
    .maybeSingle()

  if (adminUser) return accessFromAdminRow(adminUser as AnyRow, normalized)

  const { data: staffMember, error: staffError } = await admin
    .from('atlas_staff_members')
    .select('*')
    .eq('email', normalized)
    .eq('active', true)
    .maybeSingle()

  if (staffError || !staffMember) return null

  const { data: badges = [] } = await admin
    .from('atlas_staff_badges')
    .select('badge')
    .eq('staff_member_id', (staffMember as AnyRow).id)
    .eq('active', true)

  return accessFromStaffRow(staffMember as AnyRow, (badges || []).map((row: AnyRow) => String(row.badge || '')), normalized)
}

export async function assertAtlasAccess(next = '/atlas'): Promise<{ admin: SupabaseAdmin; user: AtlasUser; staff: AtlasStaffAccess; role: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email) redirect(`/atlas-access?next=${encodeURIComponent(next)}`)
  const email = user.email

  const admin = createAdminClient()
  if (!admin) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY ontbreekt. Atlas heeft deze nodig voor admin acties.')
  }

  const staff = await resolveAtlasStaffAccess(admin, email)
  if (!staff || !staff.active) redirect(`/atlas-access?next=${encodeURIComponent(next)}`)

  const activeStaff = staff as AtlasStaffAccess
  return { admin, user: user as AtlasUser, staff: activeStaff, role: activeStaff.role }
}

export async function assertAtlasPermission(permission: AtlasPermission, next = '/atlas'): Promise<{ admin: SupabaseAdmin; user: AtlasUser; staff: AtlasStaffAccess; role: string }> {
  const auth = await assertAtlasAccess(next)
  if (!hasAtlasPermission(auth.staff, permission)) redirect('/atlas')
  return auth
}

export async function assertAtlasAdmin(next = '/atlas') {
  return assertAtlasAccess(next)
}
