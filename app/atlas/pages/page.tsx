
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ArrowLeft, FileText } from 'lucide-react'
export const metadata = { title:'Atlas Pages | ASORTA', robots:{index:false,follow:false} }
export default async function AtlasPages(){
 const supabase=await createClient(); const {data:{user}}=await supabase.auth.getUser(); if(!user?.email) redirect('/atlas-access?next=/atlas/pages')
 const admin=createAdminClient(); if(admin){const {data}=await admin.from('admin_users').select('email').eq('email',user.email).eq('active',true).maybeSingle(); if(!data) redirect('/atlas-access?next=/atlas/pages')}
 const rows=[['homepage.hero.title','ASORTA'],['homepage.hero.subtitle','Just what you need.'],['homepage.promo.1','Launch picks now live.'],['support.shipping.notice','Estimated delivery: 7–15 business days after processing.']]
 return <main className="mx-auto max-w-6xl px-5 py-10"><Link href="/atlas" className="mb-6 inline-flex items-center gap-2 text-sm font-black text-white/55 hover:text-white"><ArrowLeft size={16}/> Atlas</Link><div className="card rounded-[2rem] p-6"><FileText className="text-[#b7c8ad]"/><p className="kicker mt-4">Atlas foundation</p><h1 className="mt-2 text-4xl font-black">Page Editor</h1><p className="mt-3 max-w-2xl text-white/55">Voorbereiding voor live contentbeheer. In v5.1 maken we dit bewerkbaar met save-knoppen naar Supabase <code>site_content</code>.</p><div className="mt-8 grid gap-3">{rows.map(([k,v])=><div key={k} className="grid gap-2 rounded-2xl border border-white/10 bg-black/30 p-4 md:grid-cols-[260px_1fr]"><div className="font-mono text-xs text-[#b7c8ad]">{k}</div><div className="font-bold text-white/75">{v}</div></div>)}</div></div></main>
}
