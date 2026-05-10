import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { FileText, Save } from 'lucide-react'

export const metadata = { title: 'Atlas Pages | ASORTA internal', robots: { index: false, follow: false } }

async function assertAdmin(){
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) redirect('/atlas-access?next=/atlas/pages')
  const admin = createAdminClient()
  if (admin) {
    const { data } = await admin.from('admin_users').select('email').eq('email', user.email).eq('active', true).maybeSingle()
    if (!data) redirect('/atlas-access?next=/atlas/pages')
  }
}

export default async function AtlasPages(){
  await assertAdmin()
  const blocks = [
    ['Homepage hero title','ASORTA'],
    ['Homepage slogan','Just what you need.'],
    ['Promo slide 1','Launch deals and product highlights.'],
    ['Shipping message','Estimated delivery: 6–12 business days with tracked shipping.']
  ]
  return <main className="mx-auto max-w-6xl px-4 py-10 md:px-6">
    <Link href="/atlas" className="text-sm font-black text-white/50 hover:text-white">← Back to Atlas</Link>
    <section className="mt-6 card rounded-[2rem] p-6 md:p-8">
      <div className="flex items-center gap-3"><FileText className="text-[#b7c8ad]"/><div><p className="kicker">Atlas editor foundation</p><h1 className="text-4xl font-black">Page Editor</h1></div></div>
      <p className="mt-4 max-w-2xl text-white/55">Foundation voor live pagina-content. In v5.1 staat de structuur klaar; in de volgende stap koppelen we deze velden volledig aan Supabase writes en live homepage rendering.</p>
      <div className="mt-8 grid gap-4">{blocks.map(([label,value])=><label key={label} className="grid gap-2 rounded-2xl border border-white/10 bg-white/[.035] p-4"><span className="text-xs font-black uppercase tracking-[.22em] text-white/38">{label}</span><input defaultValue={value} className="rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-white outline-none focus:border-[#b7c8ad]"/></label>)}</div>
      <button className="btn-primary mt-6"><Save size={18} className="mr-2"/> Save draft foundation</button>
    </section>
  </main>
}
