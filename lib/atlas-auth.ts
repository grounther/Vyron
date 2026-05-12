import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function assertAtlasAdmin(next = '/atlas') {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email) redirect(`/atlas-access?next=${encodeURIComponent(next)}`)

  const admin = createAdminClient()
  if (!admin) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY ontbreekt. Atlas heeft deze nodig voor admin acties.')
  }

  const { data } = await admin
    .from('admin_users')
    .select('email, role, active')
    .eq('email', user.email)
    .eq('active', true)
    .maybeSingle()

  if (!data) redirect(`/atlas-access?next=${encodeURIComponent(next)}`)

  return { admin, user, role: data.role as string }
}
