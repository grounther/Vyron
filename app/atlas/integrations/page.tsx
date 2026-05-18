import Link from 'next/link'
import type React from 'react'
import { assertAtlasAdmin } from '@/lib/atlas-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { Boxes, CheckCircle2, KeyRound, PlugZap, RefreshCw, ShieldCheck, Truck } from 'lucide-react'
import ShopifySyncButton from './ShopifySyncButton'

export const metadata = { title: 'Atlas Integrations | ASORTA internal', robots: { index: false, follow: false } }

type LogRow = { provider: string; event: string; status: string; message: string; created_at: string }

async function getLogs() {
  const admin = createAdminClient()
  if (!admin) return [] as LogRow[]
  const { data } = await admin.from('integration_sync_logs').select('provider,event,status,message,created_at').order('created_at', { ascending: false }).limit(12)
  return (data || []) as LogRow[]
}

export default async function AtlasIntegrationsPage() {
  await assertAtlasAdmin('/atlas/integrations')
  const logs = await getLogs()
  const shopifyReady = Boolean(process.env.SHOPIFY_STORE_DOMAIN && ((process.env.SHOPIFY_CLIENT_ID && process.env.SHOPIFY_CLIENT_SECRET) || process.env.SHOPIFY_ADMIN_ACCESS_TOKEN))
  const cjReady = Boolean(process.env.CJ_ACCESS_TOKEN || process.env.CJ_API_KEY)
  const dsersReady = Boolean(process.env.DSERS_MODE)
  const mollieReady = Boolean(process.env.MOLLIE_API_KEY)

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <Link href="/atlas" className="text-sm font-black text-white/45 hover:text-white">← Terug naar Atlas</Link>
      <section className="mt-6 rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(111,125,100,.18),transparent_38%),linear-gradient(145deg,rgba(255,255,255,.08),rgba(255,255,255,.02))] p-6 md:p-10">
        <p className="text-xs font-black uppercase tracking-[.35em] text-[#b7c8ad]">Integrations</p>
        <h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">Shopify input + multi-supplier fulfillment</h1>
        <p className="mt-4 max-w-3xl text-white/60">Gebruik Shopify als product-backoffice, sync naar Supabase, behoud je eigen site/checkout en routeer betaalde orders naar CJ, DSers of manual supplier mapping.</p>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-4">
        <StatusCard icon={<PlugZap />} label="Shopify Admin" ready={shopifyReady} text="Product sync + auto tokens" />
        <StatusCard icon={<Truck />} label="CJ" ready={cjReady} text="Direct fulfillment adapter" />
        <StatusCard icon={<Boxes />} label="DSers" ready={dsersReady} text="Bridge/direct adapter prepared" />
        <StatusCard icon={<KeyRound />} label="Mollie" ready={mollieReady} text="Eigen checkout payment" />
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_.85fr]">
        <div className="card rounded-[2rem] p-6">
          <div className="mb-5 flex items-center gap-3">
            <RefreshCw className="text-[#b7c8ad]" />
            <div>
              <h2 className="text-2xl font-black">Shopify product sync</h2>
              <p className="mt-1 text-sm text-white/50">Haalt Shopify producten, varianten, media, tags en metafields naar Supabase.</p>
            </div>
          </div>
          <ShopifySyncButton />
          <div className="mt-5 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm leading-6 text-white/55">
            Metafields die worden gelezen: <code>supplier.name</code>, <code>supplier.product_id</code>, <code>supplier.variant_id</code>, <code>supplier.sku</code>, <code>supplier.cost</code>, <code>supplier.shipping_method</code>, <code>vyron.category</code>, <code>vyron.badge</code>.
          </div>
        </div>

        <div className="card rounded-[2rem] p-6">
          <h2 className="text-2xl font-black">Laatste sync logs</h2>
          <div className="mt-5 grid gap-3">
            {logs.length ? logs.map((log, index) => (
              <div key={`${log.created_at}-${index}`} className="rounded-2xl border border-white/10 bg-white/[.035] p-4 text-sm">
                <div className="flex items-center justify-between gap-3"><strong className="uppercase text-white">{log.provider}</strong><span className="text-xs text-white/35">{new Date(log.created_at).toLocaleString('nl-NL')}</span></div>
                <p className="mt-2 text-white/60">{log.message}</p>
                <p className="mt-1 text-xs uppercase tracking-[.18em] text-white/35">{log.event} · {log.status}</p>
              </div>
            )) : <p className="rounded-2xl border border-white/10 bg-white/[.035] p-4 text-sm text-white/50">Nog geen sync logs.</p>}
          </div>
        </div>
      </section>
    </main>
  )
}

function StatusCard({ icon, label, ready, text }: { icon: React.ReactNode; label: string; ready: boolean; text: string }) {
  return <div className="card rounded-[1.5rem] p-5"><div className={ready ? 'text-emerald-300' : 'text-white/35'}>{ready ? <CheckCircle2 /> : icon}</div><p className="mt-4 text-xs font-black uppercase tracking-[.22em] text-white/35">{label}</p><p className="mt-2 font-black">{ready ? 'Configured' : 'Not configured'}</p><p className="mt-1 text-sm text-white/45">{text}</p></div>
}
