import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Heart, Package, Trophy, User } from 'lucide-react'

export const metadata = { title: 'Account | ASORTA' }

export default async function AccountPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) redirect('/login?next=/account')

  const admin = createAdminClient()
  let isAdmin = false
  let orders: any[] = []
  let loyalty: any = null
  let wishlistCount = 0

  if (admin) {
    const { data: adminUser } = await admin.from('admin_users').select('email').eq('email', user.email).eq('active', true).maybeSingle()
    isAdmin = Boolean(adminUser)

    const { data: customer } = await admin.from('customers').select('id').eq('email', user.email).maybeSingle()
    if (customer?.id) {
      const { data: orderRows } = await admin.from('orders').select('order_number,total,payment_status,fulfillment_status,created_at,tracking_url').eq('customer_id', customer.id).order('created_at', { ascending: false }).limit(8)
      orders = orderRows || []
    }

    const { data: loyaltyRow } = await admin.from('customer_loyalty').select('*').eq('auth_user_id', user.id).maybeSingle()
    loyalty = loyaltyRow

    const { count } = await admin.from('customer_wishlists').select('*', { count: 'exact', head: true }).eq('auth_user_id', user.id)
    wishlistCount = count || 0
  }

  const points = Number(loyalty?.points || 0)
  const tier = loyalty?.tier || 'bronze'

  return (
    <main className="mx-auto max-w-6xl px-4 py-16 md:px-6">
      <p className="text-xs font-black uppercase tracking-[.35em] text-[#b7c8ad]">Customer portal</p>
      <h1 className="mt-4 text-5xl font-black">Your ASORTA account</h1>
      <p className="mt-4 text-white/60">Ingelogd als <span className="font-black text-white">{user.email}</span>. Hier beheer je straks orders, tracking, wishlist en loyalty.</p>

      <section className="mt-8 grid gap-4 md:grid-cols-4">
        <AccountStat icon={<Package />} label="Orders" value={String(orders.length)} />
        <AccountStat icon={<Heart />} label="Wishlist" value={String(wishlistCount)} />
        <AccountStat icon={<Trophy />} label="Points" value={String(points)} />
        <AccountStat icon={<User />} label="Tier" value={tier.toUpperCase()} />
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
        <div className="card rounded-[2rem] p-6">
          <h2 className="text-2xl font-black">Order history</h2>
          {!orders.length ? <p className="mt-3 text-white/55">Nog geen orders gekoppeld aan dit account.</p> : <div className="mt-5 grid gap-3">{orders.map((order) => <div key={order.order_number} className="rounded-2xl border border-white/10 bg-white/[.03] p-4"><div className="flex flex-wrap justify-between gap-3"><strong>{order.order_number}</strong><span>€{Number(order.total || 0).toFixed(2)}</span></div><p className="mt-2 text-sm text-white/50">{order.payment_status} • {order.fulfillment_status}</p>{order.tracking_url && <a href={order.tracking_url} className="mt-3 inline-block text-sm font-black text-[#b7c8ad]">Track order →</a>}</div>)}</div>}
        </div>

        <div className="card rounded-[2rem] p-6">
          <h2 className="text-2xl font-black">Loyalty foundation</h2>
          <p className="mt-3 text-white/55">ASORTA loyalty is voorbereid voor punten, tiers, exclusive drops en member-only korting.</p>
          <div className="mt-5 rounded-2xl border border-[#b7c8ad]/20 bg-[#b7c8ad]/10 p-4"><p className="text-sm font-black text-[#dbe9d4]">Current tier</p><p className="mt-1 text-3xl font-black">{tier.toUpperCase()}</p></div>
        </div>
      </section>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/shop" className="btn-primary inline-flex">Continue shopping</Link>
        {isAdmin && <Link href="/atlas" className="rounded-full border border-[#b7c8ad]/30 px-5 py-3 text-sm font-black text-[#b7c8ad] hover:bg-[#b7c8ad]/10">Open Atlas</Link>}
        <form action="/auth/signout" method="post"><button className="rounded-full border border-white/10 px-5 py-3 text-sm font-black text-white/55 hover:bg-white/10 hover:text-white">Log out</button></form>
      </div>
    </main>
  )
}

function AccountStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="card rounded-[1.5rem] p-5"><div className="text-[#b7c8ad]">{icon}</div><p className="mt-4 text-xs font-black uppercase tracking-[.22em] text-white/35">{label}</p><p className="mt-2 text-3xl font-black">{value}</p></div>
}
