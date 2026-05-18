'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { siteContentDefaults } from '@/lib/site-content'

async function assertAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email) redirect('/atlas-access?next=/atlas/pages')

  const admin = createAdminClient()
  if (!admin) throw new Error('SUPABASE_SERVICE_ROLE_KEY ontbreekt. Atlas kan niet opslaan zonder service role key.')

  const { data } = await admin
    .from('admin_users')
    .select('email')
    .eq('email', user.email)
    .eq('active', true)
    .maybeSingle()

  if (!data) redirect('/atlas-access?next=/atlas/pages')

  return admin
}

function encodeError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error || 'Onbekende fout')
  return encodeURIComponent(message.slice(0, 360))
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
    value: String(formData.get(field.key) || '').trim() || field.value,
    type: field.type,
    updated_at: now,
  }))

  const { error } = await admin.from('site_content').upsert(rows, { onConflict: 'key' })

  if (error) {
    // Some older installs created site_content without the optional type column.
    // Retry without it so the editor keeps working, then ask the owner to run the migration.
    if (/type|column/i.test(error.message)) {
      const fallbackRows = rows.map(({ type: _type, ...row }) => row)
      const retry = await admin.from('site_content').upsert(fallbackRows, { onConflict: 'key' })
      if (retry.error) redirect(`/atlas/pages?error=${encodeError(retry.error.message)}`)
    } else {
      redirect(`/atlas/pages?error=${encodeError(error.message)}`)
    }
  }

  for (const path of ['/', '/shop', '/contact', '/faq', '/shipping', '/returns', '/privacy', '/terms', '/atlas/pages']) {
    revalidatePath(path)
  }

  redirect('/atlas/pages?saved=1')
}
