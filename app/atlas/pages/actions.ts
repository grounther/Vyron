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

export async function saveSiteContent(formData: FormData) {
  const admin = await assertAdmin()

  const rows = siteContentDefaults.map((field) => ({
    key: field.key,
    value: String(formData.get(field.key) || '').trim() || field.value,
    type: field.type,
    updated_at: new Date().toISOString(),
  }))

  const { error } = await admin.from('site_content').upsert(rows, { onConflict: 'key' })

  if (error) throw new Error(error.message)

  revalidatePath('/')
  revalidatePath('/atlas/pages')
}
