import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { openTcgPack } from '@/lib/tcg-game-server'
import { getSeries, type TcgSeriesKey } from '@/lib/tcg-game'

export const runtime = 'nodejs'

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.id || !user.email) return jsonError('Login required.', 401)

  const admin = createAdminClient()
  if (!admin) return jsonError('TCG collection is tijdelijk niet beschikbaar.', 503)

  const body = await request.json().catch(() => ({}))
  const seriesKey = String(body?.seriesKey || '') as TcgSeriesKey
  if (!getSeries(seriesKey)) return jsonError('Kies Perfect Order of Chaos Rising.', 400)

  try {
    const result = await openTcgPack(admin, user, seriesKey)
    return NextResponse.json({ ok: true, opening: result.opening, series: result.series, cards: result.cards })
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Pakje openen is mislukt.', 500)
  }
}
