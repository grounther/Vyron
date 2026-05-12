import Link from 'next/link'
import { ShoppingCart, Euro, RefreshCw, Mail } from 'lucide-react'
import { assertAtlasAdmin } from '@/lib/atlas-auth'
import { getCartRecoveryDashboard } from '@/lib/revenue'
import SendRecoveryButton from './SendRecoveryButton'

export const metadata = { title: 'Atlas Cart Recovery | ASORTA internal', robots: { index: false, follow: false } }

export default async function AtlasRecoveryPage() {
  await assertAtlasAdmin('/atlas/recovery')
  const { sessions, stats } = await getCartRecoveryDashboard()

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <Link href="/atlas" className="text-sm font-black text-white/50 hover:text-white">← Back to Atlas</Link>

      <section className="mt-6 card rounded-[2rem] p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="flex items-center gap-3">
            <ShoppingCart className="text-[#b7c8ad]" />
            <div>
              <p className="kicker">Revenue automation</p>
              <h1 className="text-4xl font-black">Abandoned Cart Recovery</h1>
            </div>
          </div>
          <div className="rounded-2xl border border-[#b7c8ad]/20 bg-[#b7c8ad]/10 px-4 py-3 text-sm font-bold text-[#dbe9d4]">€{stats.potential.toFixed(2)} potential</div>
        </div>
        <p className="mt-4 max-w-3xl text-white/55">Bekijk actieve carts, abandoned carts en verstuur handmatig recovery mails. Automatische timing kan later via Vercel Cron worden aangezet.</p>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-4">
        <Stat icon={<ShoppingCart />} label="Active carts" value={String(stats.active)} />
        <Stat icon={<RefreshCw />} label="Abandoned" value={String(stats.abandoned)} />
        <Stat icon={<Mail />} label="Recovered" value={String(stats.recovered)} />
        <Stat icon={<Euro />} label="Potential" value={`€${stats.potential.toFixed(2)}`} />
      </section>

      <section className="mt-8 card rounded-[2rem] p-5">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="text-2xl font-black">Cart sessions</h2>
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-white/45">{sessions.length} sessions</span>
        </div>
        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-white/[.04] text-xs uppercase tracking-[.18em] text-white/35"><tr><th className="px-4 py-3">Email</th><th>Status</th><th>Items</th><th>Subtotal</th><th>Stage</th><th>Last activity</th><th>Action</th></tr></thead>
            <tbody>{sessions.map((session) => (
              <tr key={session.id} className="border-t border-white/10 text-white/65">
                <td className="px-4 py-3 font-black text-white">{session.customer_email || 'anonymous'}</td>
                <td>{session.status}</td>
                <td>{Array.isArray(session.items) ? session.items.length : 0}</td>
                <td>€{Number(session.subtotal || 0).toFixed(2)}</td>
                <td>{session.recovery_stage}</td>
                <td>{new Date(session.last_activity_at || session.updated_at).toLocaleString('nl-NL')}</td>
                <td><SendRecoveryButton cartId={session.id} disabled={!session.customer_email} /></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </section>
    </main>
  )
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="card rounded-[1.5rem] p-5"><div className="text-[#b7c8ad]">{icon}</div><p className="mt-4 text-xs font-black uppercase tracking-[.22em] text-white/35">{label}</p><p className="mt-2 text-3xl font-black">{value}</p></div>
}
