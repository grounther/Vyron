type SupabaseLike = {
  from: (table: string) => any
}

export type SearchAccess = {
  paid: boolean
  trialActive: boolean
  trialStartedAt: string | null
  trialExpiresAt: string | null
  trialDaysLeft: number
  canDiscover: boolean
}

export async function getSearchAccess(supabase: SupabaseLike, userId: string): Promise<SearchAccess> {
  const now = new Date()
  const nowIso = now.toISOString()
  const [{ data: profile }, { data: pass }] = await Promise.all([
    supabase.from('profiles').select('trial_started_at,trial_expires_at').eq('id', userId).maybeSingle(),
    supabase.from('access_passes').select('expires_at').eq('user_id', userId).eq('status', 'active').gt('expires_at', nowIso).maybeSingle(),
  ])
  const trialStartedAt = profile?.trial_started_at || null
  const trialExpiresAt = profile?.trial_expires_at || null
  const trialExpiry = trialExpiresAt ? new Date(trialExpiresAt).getTime() : 0
  const trialActive = trialExpiry > now.getTime()
  const paid = Boolean(pass)

  return {
    paid,
    trialActive,
    trialStartedAt,
    trialExpiresAt,
    trialDaysLeft: trialActive ? Math.max(1, Math.ceil((trialExpiry - now.getTime()) / 86_400_000)) : 0,
    canDiscover: paid || trialActive,
  }
}
