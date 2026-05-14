import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

type AtlasApiAuthResult =
  | {
      ok: true
      admin: NonNullable<ReturnType<typeof createAdminClient>>
      user: { id: string; email?: string | null }
      role: string
    }
  | {
      ok: false
      response: NextResponse
    }

export async function requireAtlasAdminApi(): Promise<AtlasApiAuthResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Atlas login required.' }, { status: 401 }),
    }
  }

  const admin = createAdminClient()
  if (!admin) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY ontbreekt. Admin API is fail-closed.' }, { status: 503 }),
    }
  }

  const { data, error } = await admin
    .from('admin_users')
    .select('email, role, active')
    .eq('email', user.email)
    .eq('active', true)
    .maybeSingle()

  if (error) {
    return {
      ok: false,
      response: NextResponse.json({ error: error.message }, { status: 500 }),
    }
  }

  if (!data) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Atlas admin access denied.' }, { status: 403 }),
    }
  }

  return { ok: true, admin, user, role: String(data.role || 'admin') }
}

export function requireInternalToken(request: Request, envName: string) {
  const expected = process.env[envName]
  if (!expected) return false
  const received = request.headers.get('x-internal-token') || request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || ''
  return received === expected
}
