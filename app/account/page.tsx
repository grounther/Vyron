import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const metadata = { title: 'Account | ASORTA' }

export default async function AccountPage(){
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) redirect('/login?next=/account')

  const admin = createAdminClient()
  let isAdmin = false
  if (admin) {
    const { data } = await admin.from('admin_users').select('email').eq('email', user.email).eq('active', true).maybeSingle()
    isAdmin = Boolean(data)
  }

  return <main className="mx-auto max-w-4xl px-4 py-16 md:px-6">
    <p className="text-xs font-black uppercase tracking-[.35em] text-[#b7c8ad]">Customer portal</p>
    <h1 className="mt-4 text-5xl font-black">Your ASORTA account</h1>
    <p className="mt-4 text-white/60">Ingelogd als <span className="font-black text-white">{user.email}</span>. Hier komen straks je bestellingen, tracking, facturen en retourstatus.</p>
    <div className="mt-8 grid gap-4 md:grid-cols-2">
      <div className="card rounded-[2rem] p-6"><h2 className="text-2xl font-black">Order tracking</h2><p className="mt-3 text-white/55">Tracking sync wordt gekoppeld zodra CJ fulfilment actief is.</p></div>
      <div className="card rounded-[2rem] p-6"><h2 className="text-2xl font-black">Profile</h2><p className="mt-3 text-white/55">Magic-link login is actief. Gastbestellingen blijven mogelijk bij checkout.</p></div>
    </div>
    <div className="mt-8 flex flex-wrap gap-3">
      <Link href="/shop" className="btn-primary inline-flex">Continue shopping</Link>
      {isAdmin && <Link href="/atlas" className="rounded-full border border-[#b7c8ad]/30 px-5 py-3 text-sm font-black text-[#b7c8ad] hover:bg-[#b7c8ad]/10">Open Atlas</Link>}
      <form action="/auth/signout" method="post"><button className="rounded-full border border-white/10 px-5 py-3 text-sm font-black text-white/55 hover:bg-white/10 hover:text-white">Log out</button></form>
    </div>
  </main>
}
