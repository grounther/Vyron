import { NextResponse } from 'next/server'
import { hasAtlasPermission } from '@/lib/atlas-auth'
import { cleanText, requireAtlasAdminApi } from '@/lib/support-admin'
import { getSorkaiSettings, setSorkaiSettings } from '@/lib/sorkai'

export const dynamic = 'force-dynamic'

export async function GET() {
  const auth = await requireAtlasAdminApi()
  if ('error' in auth) return auth.error
  return NextResponse.json(await getSorkaiSettings(auth.admin))
}

export async function PATCH(request: Request) {
  const auth = await requireAtlasAdminApi()
  if ('error' in auth) return auth.error
  if (!hasAtlasPermission(auth.staff, 'settings')) {
    return NextResponse.json({ error: 'Alleen admin/head support mag Sorkai instellingen wijzigen.' }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const liveStatus = cleanText(body.liveStatus, 20)
  const mode = cleanText(body.mode, 20)
  const enabled = typeof body.enabled === 'boolean' ? body.enabled : undefined

  const settings = await setSorkaiSettings(auth.admin, {
    enabled,
    liveStatus: liveStatus === 'online' || liveStatus === 'offline' || liveStatus === 'auto' ? liveStatus : undefined,
    mode: mode === 'assist' || mode === 'intake' ? mode : undefined,
  })

  await auth.admin.from('support_sorkai_logs').insert({
    customer_email: null,
    intent: 'settings_update',
    response_body: `Sorkai settings aangepast door ${auth.user.email}`,
    live_status: settings.liveStatus,
    metadata: { enabled: settings.enabled, mode: settings.mode, updated_by: auth.user.email },
  }).then(() => undefined, () => undefined)

  return NextResponse.json(settings)
}
