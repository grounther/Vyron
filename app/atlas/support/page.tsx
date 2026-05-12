import { redirect } from 'next/navigation'
import { ShieldAlert } from 'lucide-react'
import AtlasSupportClient from './AtlasSupportClient'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAtlasSupportSnapshot } from '@/lib/support-admin'

export const metadata = { title: 'Atlas Support | ASORTA', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

type SearchParams = Promise<{ id?: string }>

export default async function AtlasSupportPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email) redirect('/atlas-access?next=/atlas/support')

  const admin = createAdminClient()
  if (!admin) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-12">
        <div className="card rounded-[2rem] p-8">
          <ShieldAlert className="text-amber-200" />
          <h1 className="mt-4 text-3xl font-black">Service role key ontbreekt</h1>
          <p className="mt-3 text-white/55">Zet SUPABASE_SERVICE_ROLE_KEY in Vercel om Atlas Support te gebruiken.</p>
        </div>
      </main>
    )
  }

  const { data: adminUser } = await admin.from('admin_users').select('email').eq('email', user.email).eq('active', true).maybeSingle()
  if (!adminUser) redirect('/atlas')

  const snapshot = await getAtlasSupportSnapshot(admin, params.id || null)

  return <AtlasSupportClient initialSnapshot={snapshot} />
}
