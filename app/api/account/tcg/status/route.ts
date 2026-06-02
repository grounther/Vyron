import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getTcgState } from '@/lib/tcg-game-server'
import { tcgCardCatalog, tcgSeries } from '@/lib/tcg-game'

export const runtime = 'nodejs'

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status })
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.id || !user.email) return jsonError('Login required.', 401)

  const admin = createAdminClient()
  if (!admin) return jsonError('TCG collection is tijdelijk niet beschikbaar.', 503)

  try {
    const state = await getTcgState(admin, user)
    return NextResponse.json({
      ok: true,
      series: tcgSeries,
      catalogSize: tcgCardCatalog.length,
      availablePackCount: state.availablePackCount,
      availableCredits: state.availableCredits,
      collection: state.collection,
    })
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'TCG status kon niet worden geladen.', 500)
  }
}
