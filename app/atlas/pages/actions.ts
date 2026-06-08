'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { assertAtlasPermission } from '@/lib/atlas-auth'
import { siteContentDefaults } from '@/lib/site-content'

async function assertAdmin() {
  const { admin } = await assertAtlasPermission('pages', '/atlas/pages')
  return admin
}

function encodeError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error || 'Onbekende fout')
  return encodeURIComponent(message.slice(0, 480))
}

function cleanValue(value: FormDataEntryValue | null, fallback: string) {
  const text = typeof value === 'string' ? value.trim() : ''
  return text || fallback
}

async function upsertWithSchemaFallback(admin: Awaited<ReturnType<typeof assertAdmin>>, rows: Array<Record<string, unknown>>) {
  const attempts = [
    rows,
    rows.map(({ page: _page, group_name: _groupName, label: _label, type: _type, ...row }) => row),
    rows.map(({ page: _page, group_name: _groupName, label: _label, type: _type, updated_at: _updatedAt, ...row }) => row),
  ]

  let lastError: unknown = null
  for (const attempt of attempts) {
    const { error } = await admin.from('site_content').upsert(attempt, { onConflict: 'key' })
    if (!error) return
    lastError = error
    if (!/column|schema|type|label|page|group/i.test(error.message || '')) break
  }

  throw new Error(lastError instanceof Error ? lastError.message : String((lastError as any)?.message || lastError || 'Opslaan mislukt'))
}

export async function saveSiteContent(formData: FormData) {
  let admin
  try {
    admin = await assertAdmin()
  } catch (error) {
    redirect(`/atlas/pages?error=${encodeError(error)}`)
  }

  const now = new Date().toISOString()
  const rows = siteContentDefaults.map((field) => ({
    key: field.key,
    value: cleanValue(formData.get(field.key), field.value),
    type: field.type,
    label: field.label,
    page: field.page,
    group_name: field.group,
    updated_at: now,
  }))

  if (!admin) redirect(`/atlas/pages?error=${encodeError('Atlas admin niet beschikbaar')}`)

  try {
    await upsertWithSchemaFallback(admin, rows)
  } catch (error) {
    redirect(`/atlas/pages?error=${encodeError(error)}`)
  }

  for (const path of [
    '/',
    '/shop',
    '/search',
    '/cart',
    '/checkout',
    '/checkout/success',
    '/account',
    '/about',
    '/track-order',
    '/contact',
    '/faq',
    '/shipping',
    '/returns',
    '/privacy',
    '/terms',
    '/atlas',
    '/atlas/pages',
  ]) {
    revalidatePath(path)
  }

  for (const slug of ['booster-packs', 'elite-trainer-boxes', 'collection-boxes', 'singles', 'accessories', 'market-deals']) {
    revalidatePath(`/category/${slug}`)
  }

  redirect('/atlas/pages?saved=1')
}
