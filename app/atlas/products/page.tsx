import Link from 'next/link'
import { redirect } from 'next/navigation'
import { products } from '@/lib/products'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { PackageSearch } from 'lucide-react'

export const metadata = { title: 'Atlas Products | ASORTA internal', robots: { index: false, follow: false } }

async function assertAdmin(){
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) redirect('/atlas-access?next=/atlas/products')
  const admin = createAdminClient()
  if (admin) {
    const { data } = await admin.from('admin_users').select('email').eq('email', user.email).eq('active', true).maybeSingle()
    if (!data) redirect('/atlas-access?next=/atlas/products')
  }
}

export default async function AtlasProducts(){
  await assertAdmin()
  return <main className="mx-auto max-w-7xl px-4 py-10 md:px-6">
    <Link href="/atlas" className="text-sm font-black text-white/50 hover:text-white">← Back to Atlas</Link>
    <section className="mt-6 card rounded-[2rem] p-6 md:p-8">
      <div className="flex items-center gap-3"><PackageSearch className="text-[#b7c8ad]"/><div><p className="kicker">Product management foundation</p><h1 className="text-4xl font-black">Products</h1></div></div>
      <p className="mt-4 max-w-2xl text-white/55">Overzicht van ASORTA launchproducten, CJ SKU mapping, varianten, kosten en voorraadindicatie. Volledige edit/save komt in de volgende management sprint.</p>
      <div className="mt-8 overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className="text-xs uppercase tracking-[.18em] text-white/35"><tr><th className="py-3">Product</th><th>Category</th><th>Price</th><th>Landed</th><th>Variants</th><th>CJ</th><th>Status</th></tr></thead><tbody>{products.map(p=><tr key={p.slug} className="border-t border-white/10 text-white/68"><td className="py-4 font-black text-white">{p.name}</td><td>{p.category}</td><td>€{p.price.toFixed(2)}</td><td>€{p.cost.toFixed(2)}</td><td>{p.variants?.length || 0}</td><td>{p.supplier?.productId || 'pending'}</td><td>{p.supplier?.status || 'draft'}</td></tr>)}</tbody></table></div>
    </section>
  </main>
}
