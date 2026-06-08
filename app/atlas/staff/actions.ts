'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { assertAtlasPermission, displayNameFromEmail, type AtlasPermission } from '@/lib/atlas-auth'

const BADGES: AtlasPermission[] = [
  'support',
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

function clean(value: FormDataEntryValue | null, limit = 240) {
  return typeof value === 'string' ? value.trim().slice(0, limit) : ''
}

function checked(formData: FormData, key: string) {
  return formData.get(key) === 'on'
}

function normalizeEmail(input: string) {
  const value = input.trim().toLowerCase()
  if (!value) return ''
  return value.includes('@') ? value : `${value}@asorta.nl`
}

function isAsortaStaffEmail(email: string) {
  return email.endsWith('@asorta.nl')
}

function selectedBadges(formData: FormData) {
  return BADGES.filter((badge) => checked(formData, `badge_${badge}`))
}

function staffRedirect(params: Record<string, string>) {
  const search = new URLSearchParams(params)
  redirect(`/atlas/staff?${search.toString()}`)
}

async function logStaffAction(admin: any, row: Record<string, any>) {
  const { error } = await admin.from('atlas_staff_audit_logs').insert(row)
  if (error) console.warn('atlas_staff_audit_logs insert failed', error.message)
}

export async function createStaffMember(formData: FormData) {
  const { admin, user } = await assertAtlasPermission('settings', '/atlas/staff')
  const email = normalizeEmail(clean(formData.get('email'), 180))
  const displayNameInput = clean(formData.get('display_name'), 120)
  const badges = selectedBadges(formData)

  try {
    if (!email) throw new Error('Vul een e-mailadres of naam in.')
    if (!isAsortaStaffEmail(email)) throw new Error('Medewerkers moeten inloggen met een @asorta.nl e-mailadres.')
    if (!badges.length) throw new Error('Geef minimaal één badge/recht aan de medewerker.')

    const displayName = displayNameInput || displayNameFromEmail(email)
    const role = badges.length === 1 && badges[0] === 'support' ? 'support' : 'staff'

    const { data: member, error } = await admin
      .from('atlas_staff_members')
      .upsert({
        email,
        display_name: displayName,
        role,
        active: true,
        status: 'active',
        created_by: user.email,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'email' })
      .select('id,email')
      .single()

    if (error) throw new Error(error.message)

    const staffId = member.id
    for (const badge of BADGES) {
      if (badges.includes(badge)) {
        const { error: badgeError } = await admin
          .from('atlas_staff_badges')
          .upsert({ staff_member_id: staffId, badge, active: true, granted_by: user.email, granted_at: new Date().toISOString() }, { onConflict: 'staff_member_id,badge' })
        if (badgeError) throw new Error(badgeError.message)
      } else {
        await admin.from('atlas_staff_badges').update({ active: false }).eq('staff_member_id', staffId).eq('badge', badge)
      }
    }

    await logStaffAction(admin, {
      staff_member_id: staffId,
      action: 'created_or_reactivated',
      actor_email: user.email,
      target_email: email,
      details: { badges, displayName },
    })

    revalidatePath('/atlas/staff')
  } catch (error) {
    staffRedirect({ error: error instanceof Error ? error.message : 'Medewerker toevoegen mislukt.' })
  }

  staffRedirect({ saved: '1', staff: email })
}

export async function updateStaffMember(formData: FormData) {
  const { admin, user } = await assertAtlasPermission('settings', '/atlas/staff')
  const staffId = clean(formData.get('staff_id'), 80)
  const displayNameInput = clean(formData.get('display_name'), 120)
  const badges = selectedBadges(formData)
  const active = checked(formData, 'active')

  try {
    if (!staffId) throw new Error('Medewerker ontbreekt.')
    if (!badges.length && active) throw new Error('Geef minimaal één badge/recht aan een actieve medewerker.')

    const { data: existing, error: existingError } = await admin
      .from('atlas_staff_members')
      .select('id,email')
      .eq('id', staffId)
      .single()
    if (existingError || !existing) throw new Error('Medewerker niet gevonden.')

    const email = String(existing.email || '').toLowerCase()
    const displayName = displayNameInput || displayNameFromEmail(email)
    const role = badges.length === 1 && badges[0] === 'support' ? 'support' : 'staff'

    const { error } = await admin
      .from('atlas_staff_members')
      .update({
        display_name: displayName,
        role,
        active,
        status: active ? 'active' : 'disabled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', staffId)

    if (error) throw new Error(error.message)

    for (const badge of BADGES) {
      if (badges.includes(badge)) {
        const { error: badgeError } = await admin
          .from('atlas_staff_badges')
          .upsert({ staff_member_id: staffId, badge, active: true, granted_by: user.email, granted_at: new Date().toISOString() }, { onConflict: 'staff_member_id,badge' })
        if (badgeError) throw new Error(badgeError.message)
      } else {
        await admin.from('atlas_staff_badges').update({ active: false }).eq('staff_member_id', staffId).eq('badge', badge)
      }
    }

    await logStaffAction(admin, {
      staff_member_id: staffId,
      action: active ? 'updated' : 'disabled',
      actor_email: user.email,
      target_email: email,
      details: { badges, displayName, active },
    })

    revalidatePath('/atlas/staff')
  } catch (error) {
    staffRedirect({ error: error instanceof Error ? error.message : 'Medewerker bijwerken mislukt.' })
  }

  staffRedirect({ saved: '1' })
}
