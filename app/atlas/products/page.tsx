
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { products } from '@/lib/products'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ArrowLeft, Boxes } from 'lucide-react'
export const metadata = { title:'Atlas Products | ASORTA', robots:{index:false,follow:false} }
export default async function AtlasProducts(){
 const supabase=await createClient(); const {data:{user}}=await supabase.auth.getUser(); if(!user?.email) redirect('/atlas-access?next=/atlas/products')
 const admin=createAdminClient(); if(admin){const {data}=await admin.from('admin_users').select('email').eq('email',user.email).eq('active',true).maybeSingle(); if(!data) redirect('/atlas-access?next=/atlas/products')}
 return <main className="mx-auto max-w-7xl px-5 py-10"><Link href="/atlas" className="mb-6 inline-flex items-center gap-2 text-sm font-black text-white/55 hover:text-white"><ArrowLeft size={16}/> Atlas</Link><div className="card rounded-[2rem] p-6"><Boxes className="text-[#b7c8ad]"/><p className="kicker mt-4">Product Center</p><h1 className="mt-2 text-4xl font-black">Launch product intelligence</h1><p className="mt-3 max-w-2xl text-white/55">SKU mapping, factory stock, landed cost en ASORTA prijs. Volgende stap: bewerken en publiceren via Supabase.</p><div className="mt-8 overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className="text-xs uppercase tracking-[.18em] text-white/35"><tr><th className="py-3">Product</th><th>Price</th><th>Landed</th><th>Margin</th><th>Variants</th><th>Supplier</th></tr></thead><tbody>{products.map(p=>{const landed=p.supplier?.landedCost || p.cost || 0; const margin=p.price?Math.round(((p.price-landed)/p.price)*100):0; return <tr key={p.slug} className="border-t border-white/10 text-white/70"><td className="py-4 font-black text-white">{p.name}</td><td>€{p.price.toFixed(2)}</td><td>€{landed.toFixed(2)}</td><td>{margin}%</td><td>{p.variants?.length || 0}</td><td>{p.supplier?.name || 'pending'}</td></tr>})}</tbody></table></div></div></main>
}
