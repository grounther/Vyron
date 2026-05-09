import { redirect } from 'next/navigation'
import { products } from '@/lib/products'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ShieldCheck, Package, TrendingUp, Truck, Euro, AlertTriangle, Lock } from 'lucide-react'

const mockOrders = [
  { id:'AS-1001', customer:'demo@asorta.nl', product:'ASORTA AmbientDrive RGB', total:89.95, cost:42, status:'Payment pending', supplier:'CJ: not sent' },
  { id:'AS-1002', customer:'guest checkout', product:'ASORTA Urban Sling Pro', total:69.95, cost:35, status:'Draft', supplier:'CJ: not sent' }
]

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

  const revenue = mockOrders.reduce((s,o)=>s+o.total,0)
  const cost = mockOrders.reduce((s,o)=>s+o.cost,0)
  const profit = revenue - cost
  const avgMargin = revenue ? Math.round((profit/revenue)*100) : 0

  return <main className="mx-auto max-w-7xl px-4 py-10 md:px-6">
    <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(111,125,100,.18),transparent_38%),linear-gradient(145deg,rgba(255,255,255,.08),rgba(255,255,255,.02))] p-6 md:p-10">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[.35em] text-[#b7c8ad]">Internal control</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">Atlas</h1>
          <p className="mt-4 max-w-2xl text-white/60">Intern ASORTA beheerpaneel voor orders, productkosten, winstindicatie, supplier status en launch monitoring.</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-white/55"><ShieldCheck className="mb-2 text-[#b7c8ad]"/> Protected by Supabase Auth + admin allowlist.</div>
      </div>
    </section>

    <section className="mt-8 grid gap-4 md:grid-cols-4">
      <Stat icon={<Package/>} label="Launch products" value={String(products.length)} />
      <Stat icon={<Euro/>} label="Demo revenue" value={`€${revenue.toFixed(2)}`} />
      <Stat icon={<TrendingUp/>} label="Est. profit" value={`€${profit.toFixed(2)}`} />
      <Stat icon={<Truck/>} label="Avg. margin" value={`${avgMargin}%`} />
    </section>

    <section className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
      <div className="card rounded-[2rem] p-5">
        <div className="mb-5 flex items-center justify-between"><h2 className="text-2xl font-black">Orders overview</h2><span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-white/50">demo mode</span></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm">
          <thead className="text-xs uppercase tracking-[.18em] text-white/35"><tr><th className="py-3">Order</th><th>Customer</th><th>Product</th><th>Total</th><th>Est. profit</th><th>Status</th><th>Supplier</th></tr></thead>
          <tbody>{mockOrders.map(o=><tr key={o.id} className="border-t border-white/10 text-white/70"><td className="py-4 font-black text-white">{o.id}</td><td>{o.customer}</td><td>{o.product}</td><td>€{o.total.toFixed(2)}</td><td>€{(o.total-o.cost).toFixed(2)}</td><td>{o.status}</td><td>{o.supplier}</td></tr>)}</tbody>
        </table></div>
      </div>

      <div className="card rounded-[2rem] p-5">
        <h2 className="text-2xl font-black">Next integrations</h2>
        <div className="mt-5 grid gap-3 text-sm text-white/60">
          <Step title="Supabase" text="Products, customers, orders, order_items, profit logs." />
          <Step title="CJ mapping" text="PID, VID, SKU and shipping method per product." />
          <Step title="Payments" text="Mollie/iDEAL/Wero after KvK verification." />
          <Step title="CJ fulfilment" text="Only after payment success: createOrderV2 + confirmOrder." />
        </div>
        {!adminCheckReady && <div className="mt-5 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-100/75"><AlertTriangle size={18} className="mb-2"/> Service role key ontbreekt. Atlas login werkt, maar admin allowlist kan nog niet server-side worden gecontroleerd.</div>}
      </div>
    </section>
  </main>
}

function Stat({icon,label,value}:{icon:React.ReactNode;label:string;value:string}){
  return <div className="card rounded-[1.5rem] p-5"><div className="text-[#b7c8ad]">{icon}</div><p className="mt-4 text-xs font-black uppercase tracking-[.22em] text-white/35">{label}</p><p className="mt-2 text-3xl font-black">{value}</p></div>
}
function Step({title,text}:{title:string;text:string}){return <div className="rounded-2xl border border-white/10 bg-white/[.035] p-4"><h3 className="font-black text-white">{title}</h3><p className="mt-1 leading-6">{text}</p></div>}
