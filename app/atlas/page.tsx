
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { products } from '@/lib/products'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ShieldCheck, Package, TrendingUp, Truck, Euro, AlertTriangle, Lock, FileText, Boxes, Activity } from 'lucide-react'

export const metadata = { title: 'Atlas | ASORTA internal', robots: { index: false, follow: false } }

type OrderRow = { id:string; customer_email?:string; total?:number; estimated_profit?:number; status?:string; supplier_status?:string; created_at?:string }

export default async function AtlasPage(){
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) redirect('/atlas-access?next=/atlas')

  const admin = createAdminClient()
  let isAdmin = false
  let adminCheckReady = false
  let orders: OrderRow[] = []
  let ordersReady = false
  if (admin) {
    const { data } = await admin.from('admin_users').select('email, role, active').eq('email', user.email).eq('active', true).maybeSingle()
    isAdmin = Boolean(data)
    adminCheckReady = true
    const result = await admin.from('orders').select('id, customer_email, total, estimated_profit, status, supplier_status, created_at').order('created_at', { ascending:false }).limit(10)
    if (!result.error && result.data) { orders = result.data as OrderRow[]; ordersReady = true }
  }

  if (adminCheckReady && !isAdmin) return <main className="mx-auto max-w-xl px-4 py-16 md:px-6"><div className="card rounded-[2rem] p-6 text-center"><Lock className="mx-auto text-[#b7c8ad]" size={42}/><h1 className="mt-4 text-3xl font-black">Access denied</h1><p className="mt-3 text-white/55">Je bent ingelogd, maar dit account heeft geen ASORTA Atlas rechten.</p></div></main>

  const revenue = orders.reduce((s,o)=>s+Number(o.total||0),0)
  const profit = orders.reduce((s,o)=>s+Number(o.estimated_profit||0),0)
  const avgMargin = revenue ? Math.round((profit/revenue)*100) : 0

  return <main className="mx-auto max-w-7xl px-4 py-10 md:px-6">
    <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(111,125,100,.18),transparent_38%),linear-gradient(145deg,rgba(255,255,255,.08),rgba(255,255,255,.02))] p-6 md:p-10">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between"><div><p className="text-xs font-black uppercase tracking-[.35em] text-[#b7c8ad]">Internal control</p><h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">Atlas</h1><p className="mt-4 max-w-2xl text-white/60">Intern ASORTA beheerpaneel voor orders, productkosten, winstindicatie, supplier status, content en launch monitoring.</p></div><div className="rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-white/55"><ShieldCheck className="mb-2 text-[#b7c8ad]"/> Protected by Supabase Auth + admin allowlist.</div></div>
    </section>

    <section className="mt-6 grid gap-4 md:grid-cols-3">
      <Link href="/atlas/pages" className="card rounded-[1.5rem] p-5 transition hover:-translate-y-1 hover:border-[#b7c8ad]/40"><FileText className="text-[#b7c8ad]"/><h2 className="mt-3 text-xl font-black">Page Editor</h2><p className="mt-2 text-sm text-white/55">Homepage teksten, promo slider en support content voorbereiden.</p></Link>
      <Link href="/atlas/products" className="card rounded-[1.5rem] p-5 transition hover:-translate-y-1 hover:border-[#b7c8ad]/40"><Boxes className="text-[#b7c8ad]"/><h2 className="mt-3 text-xl font-black">Product Center</h2><p className="mt-2 text-sm text-white/55">SKU mapping, variantdata, prijzen en supplierstatus.</p></Link>
      <div className="card rounded-[1.5rem] p-5"><Activity className="text-[#b7c8ad]"/><h2 className="mt-3 text-xl font-black">System Status</h2><p className="mt-2 text-sm text-white/55">Supabase {admin?'connected':'missing service key'} • CJ mapping prepared • Payments pending.</p></div>
    </section>

    <section className="mt-8 grid gap-4 md:grid-cols-4">
      <Stat icon={<Package/>} label="Launch products" value={String(products.length)} />
      <Stat icon={<Euro/>} label="Revenue" value={`€${revenue.toFixed(2)}`} />
      <Stat icon={<TrendingUp/>} label="Est. profit" value={`€${profit.toFixed(2)}`} />
      <Stat icon={<Truck/>} label="Avg. margin" value={`${avgMargin}%`} />
    </section>

    <section className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
      <div className="card rounded-[2rem] p-5"><div className="mb-5 flex items-center justify-between"><h2 className="text-2xl font-black">Orders overview</h2><span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-white/50">{ordersReady?'live':'waiting for orders table'}</span></div>
        {orders.length ? <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="text-xs uppercase tracking-[.18em] text-white/35"><tr><th className="py-3">Order</th><th>Customer</th><th>Total</th><th>Est. profit</th><th>Status</th><th>Supplier</th><th>Created</th></tr></thead><tbody>{orders.map(o=><tr key={o.id} className="border-t border-white/10 text-white/70"><td className="py-4 font-black text-white">{o.id}</td><td>{o.customer_email || 'guest'}</td><td>€{Number(o.total||0).toFixed(2)}</td><td>€{Number(o.estimated_profit||0).toFixed(2)}</td><td>{o.status || 'draft'}</td><td>{o.supplier_status || 'CJ: not sent'}</td><td>{o.created_at ? new Date(o.created_at).toLocaleDateString('nl-NL') : '-'}</td></tr>)}</tbody></table></div> : <div className="rounded-2xl border border-white/10 bg-black/30 p-6 text-white/55">Nog geen live orders. Zodra checkout/payments actief zijn verschijnen bestellingen hier automatisch.</div>}
      </div>
      <div className="card rounded-[2rem] p-5"><h2 className="text-2xl font-black">Next integrations</h2><div className="mt-5 grid gap-3 text-sm text-white/60"><Step title="Supabase" text="Products, customers, orders, order_items, profit logs."/><Step title="CJ mapping" text="PID, VID, SKU and shipping method per product."/><Step title="Payments" text="Mollie/iDEAL/Wero after KvK verification."/><Step title="CJ fulfilment" text="Only after payment success: createOrderV2 + confirmOrder."/></div>{!adminCheckReady && <div className="mt-5 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-100/75"><AlertTriangle size={18} className="mb-2"/> Service role key ontbreekt.</div>}</div>
    </section>
  </main>
}
function Stat({icon,label,value}:{icon:React.ReactNode;label:string;value:string}){return <div className="card rounded-[1.5rem] p-5"><div className="text-[#b7c8ad]">{icon}</div><p className="mt-4 text-xs font-black uppercase tracking-[.22em] text-white/35">{label}</p><p className="mt-2 text-3xl font-black">{value}</p></div>}
function Step({title,text}:{title:string;text:string}){return <div className="rounded-2xl border border-white/10 bg-white/[.035] p-4"><h3 className="font-black text-white">{title}</h3><p className="mt-1 leading-6">{text}</p></div>}
