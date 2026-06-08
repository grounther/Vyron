import { ShieldAlert } from 'lucide-react'
import AtlasSupportClient from './AtlasSupportClient'
import { getAtlasSupportSnapshot } from '@/lib/support-admin'
import { assertAtlasPermission } from '@/lib/atlas-auth'

export const metadata = { title: 'Atlas Support | ASORTA', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

type SearchParams = Promise<{ id?: string }>

export default async function AtlasSupportPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams

  try {
    const { admin } = await assertAtlasPermission('support', '/atlas/support')
    const snapshot = await getAtlasSupportSnapshot(admin, params.id || null)
    return <AtlasSupportClient initialSnapshot={snapshot} />
  } catch (error) {
    if (error instanceof Error && error.message.includes('SUPABASE_SERVICE_ROLE_KEY')) {
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
    throw error
  }
}
