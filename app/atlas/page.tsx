import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { AlertTriangle, FileText, Lock, Mail, Megaphone, MessageCircle, PackageSearch, PlugZap, ShieldCheck, ShoppingCart } from 'lucide-react'
import AtlasMetricsClient from '@/components/atlas/AtlasMetricsClient'
import { getAtlasMetrics } from '@/lib/atlas-metrics'

export const metadata = { title: 'Atlas | ASORTA internal', robots: { index: false, follow: false } }

export default async function AtlasPage(){
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) redirect('/atlas-access?next=/atlas')

  const admin = createAdminClient()
  let isAdmin = false
  let adminCheckReady = false

  if (admin) {
    const { data } = await admin.from('admin_users').select('email, role, active').eq('email', user.email).eq('active', true).maybeSingle()
    isAdmin = Boolean(data)
    adminCheckReady = true
  }

  if (adminCheckReady && !isAdmin) {
    return <main className="mx-auto max-w-xl px-4 py-16 md:px-6">
      <div className="card rounded-[2rem] p-6 text-center">
        <Lock className="mx-auto text-[#b7c8ad]" size={42}/>
        <h1 className="mt-4 text-3xl font-black">Access denied</h1>
        <p className="mt-3 text-white/55">Je bent ingelogd, maar dit account heeft geen ASORTA Atlas rechten. Voeg dit e-mailadres toe aan de Supabase tabel <code>admin_users</code>.</p>
      </div>
    </main>
  }

  const metrics = await getAtlasMetrics()

  return <main className="mx-auto max-w-7xl px-4 py-10 md:px-6">
    <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(111,125,100,.18),transparent_38%),linear-gradient(145deg,rgba(255,255,255,.08),rgba(255,255,255,.02))] p-6 md:p-10">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[.35em] text-[#b7c8ad]">Internal control</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">Atlas</h1>
          <p className="mt-4 max-w-2xl text-white/60">Intern ASORTA beheerpaneel voor Shopify orders, productkosten, winstindicatie, DSers status en launch monitoring.</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-white/55"><ShieldCheck className="mb-2 text-[#b7c8ad]"/> Protected by Supabase Auth + admin allowlist.</div>
      </div>
    </section>

    <AtlasMetricsClient metrics={metrics}/>

    <section className="mt-8 grid gap-4 md:grid-cols-4">
      <Link href="/atlas/pages" className="card group rounded-[1.7rem] p-6 transition hover:-translate-y-1 hover:border-white/25"><FileText className="text-[#b7c8ad]"/><h2 className="mt-4 text-2xl font-black">Page Editor</h2><p className="mt-2 text-sm leading-6 text-white/55">Beheer homepage teksten, promo slider content en support snippets.</p></Link>
      <Link href="/atlas/products" className="card group rounded-[1.7rem] p-6 transition hover:-translate-y-1 hover:border-white/25"><PackageSearch className="text-[#b7c8ad]"/><h2 className="mt-4 text-2xl font-black">Product Editor</h2><p className="mt-2 text-sm leading-6 text-white/55">Bekijk Shopify producten, variant IDs, DSers costs en marge-indicatie.</p></Link>
      <Link href="/atlas/promotions" className="card group rounded-[1.7rem] p-6 transition hover:-translate-y-1 hover:border-white/25"><Megaphone className="text-[#b7c8ad]"/><h2 className="mt-4 text-2xl font-black">Acties</h2><p className="mt-2 text-sm leading-6 text-white/55">Beheer openingsacties, kortingsslides en promo placements.</p></Link>
      <Link href="/atlas/newsletter" className="card group rounded-[1.7rem] p-6 transition hover:-translate-y-1 hover:border-white/25"><Mail className="text-[#b7c8ad]"/><h2 className="mt-4 text-2xl font-black">Exclusive Drops</h2><p className="mt-2 text-sm leading-6 text-white/55">Beheer e-mail inschrijvingen, welcome mails en drop campagnes.</p></Link>
      <Link href="/atlas/recovery" className="card group rounded-[1.7rem] p-6 transition hover:-translate-y-1 hover:border-white/25"><ShoppingCart className="text-[#b7c8ad]"/><h2 className="mt-4 text-2xl font-black">Cart Recovery</h2><p className="mt-2 text-sm leading-6 text-white/55">Bekijk abandoned carts en verstuur recovery mails.</p></Link>
      <Link href="/atlas/support" className="card group rounded-[1.7rem] p-6 transition hover:-translate-y-1 hover:border-white/25"><MessageCircle className="text-[#b7c8ad]"/><h2 className="mt-4 text-2xl font-black">Support Center</h2><p className="mt-2 text-sm leading-6 text-white/55">Live chats, klantdossiers, orders, tracking en klantenservice antwoorden beheren.</p></Link>
      <Link href="/atlas/integrations" className="card group rounded-[1.7rem] p-6 transition hover:-translate-y-1 hover:border-white/25"><PlugZap className="text-[#b7c8ad]"/><h2 className="mt-4 text-2xl font-black">Integrations</h2><p className="mt-2 text-sm leading-6 text-white/55">Shopify product-input, DSers routing en automatische sync monitoring.</p></Link>
    </section>

    {!adminCheckReady && <section className="mt-8 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-100/75"><AlertTriangle size={18} className="mb-2"/> Service role key ontbreekt. Atlas login werkt, maar admin allowlist en live order metrics kunnen nog niet server-side worden geladen.</section>}
  </main>
}
