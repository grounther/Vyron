import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Megaphone, Save, Tag } from 'lucide-react'

export const metadata = { title: 'Atlas Promotions | ASORTA internal', robots: { index: false, follow: false } }

async function assertAdmin(){
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) redirect('/atlas-access?next=/atlas/promotions')
  const admin = createAdminClient()
  if (admin) {
    const { data } = await admin.from('admin_users').select('email').eq('email', user.email).eq('active', true).maybeSingle()
    if (!data) redirect('/atlas-access?next=/atlas/promotions')
  }
}

const promos = [
  {
    title: 'Openingsactie: 10% korting',
    subtitle: 'Op de gehele bestelling',
    status: 'Foundation ready',
    code: 'ASORTA10',
    placement: 'Homepage hero slider',
  },
  {
    title: 'Best seller highlight',
    subtitle: 'Promoot tijdelijk een launchproduct',
    status: 'Draft',
    code: 'Later',
    placement: 'Homepage / product spotlight',
  },
]

export default async function AtlasPromotions(){
  await assertAdmin()
  return <main className="mx-auto max-w-6xl px-4 py-10 md:px-6">
    <Link href="/atlas" className="text-sm font-black text-white/50 hover:text-white">← Back to Atlas</Link>
    <section className="mt-6 card rounded-[2rem] p-6 md:p-8">
      <div className="flex items-center gap-3"><Megaphone className="text-[#b7c8ad]"/><div><p className="kicker">Atlas promotions foundation</p><h1 className="text-4xl font-black">Acties</h1></div></div>
      <p className="mt-4 max-w-2xl text-white/55">Foundation voor homepage acties, kortingsslides en launchdeals. In de volgende managementfase koppelen we deze velden aan Supabase writes zodat jij acties live kunt aanpassen.</p>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {promos.map((promo)=><article key={promo.title} className="rounded-2xl border border-white/10 bg-white/[.035] p-5">
          <div className="flex items-start justify-between gap-4"><Tag className="text-[#b7c8ad]"/><span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-white/48">{promo.status}</span></div>
          <h2 className="mt-4 text-2xl font-black">{promo.title}</h2>
          <p className="mt-2 text-white/56">{promo.subtitle}</p>
          <div className="mt-5 grid gap-3 text-sm text-white/55">
            <div className="rounded-xl border border-white/10 bg-black/35 p-3"><b className="text-white/82">Code:</b> {promo.code}</div>
            <div className="rounded-xl border border-white/10 bg-black/35 p-3"><b className="text-white/82">Plaatsing:</b> {promo.placement}</div>
          </div>
        </article>)}
      </div>
      <button className="btn-primary mt-6"><Save size={18} className="mr-2"/> Save promo draft foundation</button>
    </section>
  </main>
}
