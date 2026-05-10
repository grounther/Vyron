import Link from 'next/link'
import { redirect } from 'next/navigation'
import { products } from '@/lib/products'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Boxes, Euro, Link2, PackagePlus, Percent, Truck } from 'lucide-react'

export const metadata = { title: 'Atlas Products | ASORTA internal', robots: { index: false, follow: false } }

export default async function AtlasProducts(){
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) redirect('/atlas-access?next=/atlas/products')

  const admin = createAdminClient()
  if (admin) {
    const { data } = await admin.from('admin_users').select('email, active').eq('email', user.email).eq('active', true).maybeSingle()
    if (!data) redirect('/account')
  }

  return <main className="mx-auto max-w-7xl px-4 py-10 md:px-6">
    <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="text-xs font-black uppercase tracking-[.35em] text-[#b7c8ad]">Atlas product foundation</p>
        <h1 className="mt-3 text-4xl font-black md:text-6xl">Product Editor</h1>
        <p className="mt-3 max-w-2xl text-white/55">Voorbereiding voor productbeheer: CJ mapping, prijzen, varianten, voorraad, media en publicatie-status.</p>
      </div>
      <Link href="/atlas" className="btn-secondary">Back to Atlas</Link>
    </div>

    <section className="grid gap-4 md:grid-cols-4">
      <Stat icon={<PackagePlus/>} label="Products" value={String(products.length)} />
      <Stat icon={<Boxes/>} label="Mapped variants" value={String(products.reduce((s,p)=>s+(p.variants?.length||0),0))} />
      <Stat icon={<Truck/>} label="Supplier" value="CJ" />
      <Stat icon={<Percent/>} label="Pricing" value="VAT incl." />
    </section>

    <section className="card mt-8 rounded-[2rem] p-5">
      <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div><h2 className="text-2xl font-black">Launch product management</h2><p className="mt-2 text-sm text-white/50">Read-only foundation. v5.1 wordt dit een echte editor met Supabase writes.</p></div>
        <span className="rounded-full bg-[#b7c8ad]/10 px-3 py-1 text-xs font-black text-[#b7c8ad]">v4.9 foundation</span>
      </div>
      <div className="overflow-x-auto"><table className="w-full min-w-[980px] text-left text-sm">
        <thead className="text-xs uppercase tracking-[.18em] text-white/35"><tr><th className="py-3">Product</th><th>Price</th><th>Landed</th><th>Gross room</th><th>Variants</th><th>Main SKU</th><th>CJ PID</th><th>Status</th><th>Action</th></tr></thead>
        <tbody>{products.map(p=>{
          const landed = p.supplier?.landedCost || p.cost || 0
          const room = p.price - landed
          return <tr key={p.slug} className="border-t border-white/10 text-white/68">
            <td className="py-4"><strong className="text-white">{p.name}</strong><br/><span className="text-xs text-white/38">{p.category}</span></td>
            <td>€{p.price.toFixed(2)}</td>
            <td>{landed ? `€${landed.toFixed(2)}` : 'Pending'}</td>
            <td>{landed ? `€${room.toFixed(2)}` : 'Pending'}</td>
            <td>{p.variants?.length || 0}</td>
            <td>{p.variants?.[0]?.sku || 'Pending'}</td>
            <td>{p.supplier?.productId || 'Pending'}</td>
            <td>{p.supplier?.status || 'pending'}</td>
            <td><Link href={`/product/${p.slug}`} className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-xs font-black text-white/70 hover:bg-white/10 hover:text-white"><Link2 size={13}/> View</Link></td>
          </tr>
        })}</tbody>
      </table></div>
    </section>
  </main>
}

function Stat({icon,label,value}:{icon:React.ReactNode;label:string;value:string}){return <div className="card rounded-[1.5rem] p-5"><div className="text-[#b7c8ad]">{icon}</div><p className="mt-4 text-xs font-black uppercase tracking-[.22em] text-white/35">{label}</p><p className="mt-2 text-2xl font-black">{value}</p></div>}
