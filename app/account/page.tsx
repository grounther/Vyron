import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Heart, LifeBuoy, LockKeyhole, MessageCircle, Package, ShieldCheck, Trophy, User } from 'lucide-react'
import { getSiteContent } from '@/lib/site-content'
import AccountWishlistClient from '@/components/AccountWishlistClient'
import TcgPackOpener from '@/components/TcgPackOpener'
import { getTcgState } from '@/lib/tcg-game-server'
import { isSupportOnly, resolveAtlasStaffAccess, type AtlasStaffAccess } from '@/lib/atlas-auth'
import { shippingCarrierLabel } from '@/lib/checkout/shipping'

export const metadata = { title: 'Account | ASORTA' }

export default async function AccountPage() {
  const content = await getSiteContent()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) redirect('/login?next=/account')

  const admin = createAdminClient()
  let staffAccess: AtlasStaffAccess | null = null
  let atlasHref: string | null = null
  let orders: any[] = []
  let loyalty: any = null
  let wishlistCount = 0
  let wishlistItems: any[] = []
  let tcgPackCount = 0
  let tcgCollectionCount = 0

  if (admin) {
    const email = user.email.toLowerCase().trim()
    staffAccess = await resolveAtlasStaffAccess(admin, email)
    if (staffAccess?.active) {
      atlasHref = isSupportOnly(staffAccess) ? '/atlas/support' : '/atlas'
    }

    if (staffAccess?.active && isSupportOnly(staffAccess)) {
      return <SupportAccountPage email={email} staff={staffAccess} />
    }

    const { data: customer } = await admin.from('customers').select('id').eq('email', email).maybeSingle()
    if (customer?.id) {
      const { data: orderRows } = await admin
        .from('orders')
        .select('order_number,total,payment_status,fulfillment_status,created_at,tracking_number,tracking_url,raw')
        .or(`customer_id.eq.${customer.id},customer_email.eq.${email}`)
        .order('created_at', { ascending: false })
        .limit(8)
      orders = orderRows || []
    } else {
      const { data: orderRows } = await admin
        .from('orders')
        .select('order_number,total,payment_status,fulfillment_status,created_at,tracking_number,tracking_url,raw')
        .eq('customer_email', email)
        .order('created_at', { ascending: false })
        .limit(8)
      orders = orderRows || []
    }

    try {
      const tcgState = await getTcgState(admin, user)
      tcgPackCount = tcgState.availablePackCount
      tcgCollectionCount = tcgState.collection.reduce((sum: number, card: any) => sum + Number(card.quantity || 0), 0)
    } catch {
      tcgPackCount = 0
      tcgCollectionCount = 0
    }

    const { data: loyaltyRow } = await admin.from('customer_loyalty').select('*').eq('auth_user_id', user.id).maybeSingle()
    loyalty = loyaltyRow

    const { data: wishlistRows, count } = await admin
      .from('customer_wishlists')
      .select('id, product_slug, created_at', { count: 'exact' })
      .eq('auth_user_id', user.id)
      .order('created_at', { ascending: false })
    wishlistCount = count || 0

    const wishlistSlugs = Array.from(new Set((wishlistRows || []).map((item) => item.product_slug).filter(Boolean)))
    if (wishlistSlugs.length) {
      const { data: wishlistProducts } = await admin
        .from('products')
        .select('slug,name,category,price,compare_at,hero_image,short_description,status')
        .in('slug', wishlistSlugs)

      const productsBySlug = new Map((wishlistProducts || []).map((product) => [product.slug, product]))
      wishlistItems = (wishlistRows || []).map((item) => ({
        id: item.id,
        productSlug: item.product_slug,
        createdAt: item.created_at,
        product: productsBySlug.get(item.product_slug) || null,
      }))
    }
  }

  const points = Number(loyalty?.points || 0)
  const tier = loyalty?.tier || 'bronze'

  return (
    <main className="mx-auto max-w-6xl px-4 py-16 md:px-6">
      <p className="text-xs font-black uppercase tracking-[.35em] text-[#b7c8ad]">{content['account.kicker']}</p>
      <h1 className="mt-4 text-5xl font-black">{content['account.title']}</h1>
      <p className="mt-4 text-white/60" dangerouslySetInnerHTML={{__html: content['account.intro'].replace('{email}', `<span class="font-black text-white">${user.email}</span>`)}} />

      <section className="mt-8 grid gap-4 md:grid-cols-4">
        <AccountStat icon={<Package />} label="Orders" value={String(orders.length)} />
        <AccountStat icon={<Heart />} label="Wishlist" value={String(wishlistCount)} />
        <AccountStat icon={<Trophy />} label="Points" value={String(points)} />
        <AccountStat icon={<User />} label="Tier" value={tier.toUpperCase()} />
      </section>

      <section className="mt-8 card rounded-[2rem] p-6">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[.25em] text-[#f6d36c]">ASORTA TCG minigame</p>
            <h2 className="mt-2 text-2xl font-black">Perfect Order & Chaos Rising</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">Verzamel virtuele kaarten uit beide series. Bij elke aankoop met je account verdien je een pakje.</p>
          </div>
          <div className="text-right text-sm text-white/45">
            <p><strong className="text-white">{tcgPackCount}</strong> pakje(s) klaar</p>
            <p><strong className="text-white">{tcgCollectionCount}</strong> kaarten verzameld</p>
          </div>
        </div>
        <TcgPackOpener initialPackCount={tcgPackCount} />
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
        <div className="card rounded-[2rem] p-6">
          <h2 className="text-2xl font-black">{content['account.orders.title']}</h2>
          {!orders.length ? <p className="mt-3 text-white/55">{content['account.orders.empty']}</p> : <div className="mt-5 grid gap-3">{orders.map((order) => {
            const raw = order.raw && typeof order.raw === 'object' ? order.raw : {}
            return <div key={order.order_number} className="rounded-2xl border border-white/10 bg-white/[.03] p-4"><div className="flex flex-wrap justify-between gap-3"><strong>{order.order_number}</strong><span>€{Number(order.total || 0).toFixed(2)}</span></div><p className="mt-2 text-sm text-white/50">{order.payment_status} • {order.fulfillment_status}</p>{order.tracking_number ? <p className="mt-2 text-sm text-white/60">{shippingCarrierLabel(raw.shipping_carrier)} track & trace: <span className="font-black text-white">{order.tracking_number}</span></p> : null}{order.tracking_url && <a href={order.tracking_url} className="mt-3 inline-block text-sm font-black text-[#b7c8ad]">Track order →</a>}</div>
          })}</div>}
        </div>

        <div className="card rounded-[2rem] p-6">
          <h2 className="text-2xl font-black">{content['account.loyalty.title']}</h2>
          <p className="mt-3 text-white/55">{content['account.loyalty.text']}</p>
          <div className="mt-5 rounded-2xl border border-[#b7c8ad]/20 bg-[#b7c8ad]/10 p-4"><p className="text-sm font-black text-[#dbe9d4]">Current tier</p><p className="mt-1 text-3xl font-black">{tier.toUpperCase()}</p></div>
        </div>
      </section>

      <section className="mt-8 card rounded-[2rem] p-6">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[.25em] text-[#b7c8ad]">Saved items</p>
            <h2 className="mt-2 text-2xl font-black">Wishlist</h2>
          </div>
          <Link href="/shop" className="rounded-full border border-white/10 px-4 py-2 text-sm font-black text-white/60 hover:bg-white/10 hover:text-white">Discover products</Link>
        </div>
        <AccountWishlistClient initialItems={wishlistItems} />
      </section>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/shop" className="btn-primary inline-flex">{content['account.continue']}</Link>
        {atlasHref && <Link href={atlasHref} className="rounded-full border border-[#b7c8ad]/30 px-5 py-3 text-sm font-black text-[#b7c8ad] hover:bg-[#b7c8ad]/10">{atlasHref === '/atlas/support' ? 'Open Atlas Support' : 'Open Atlas'}</Link>}
        <form action="/auth/signout" method="post"><button className="rounded-full border border-white/10 px-5 py-3 text-sm font-black text-white/55 hover:bg-white/10 hover:text-white">Log out</button></form>
      </div>
    </main>
  )
}


function SupportAccountPage({ email, staff }: { email: string; staff: AtlasStaffAccess }) {
  return (
    <main className="mx-auto max-w-5xl px-4 py-16 md:px-6">
      <p className="text-xs font-black uppercase tracking-[.35em] text-[#b7c8ad]">ASORTA support account</p>
      <h1 className="mt-4 text-5xl font-black">Welkom, {staff.displayName}</h1>
      <p className="mt-4 max-w-2xl text-white/60">
        Ingelogd als <span className="font-black text-white">{email}</span>. Dit account is ingericht voor klantenservice en krijgt alleen toegang tot de supportomgeving.
      </p>

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        <SupportStat icon={<LifeBuoy />} label="Portaal" value="Support" />
        <SupportStat icon={<ShieldCheck />} label="Rol" value="Medewerker" />
        <SupportStat icon={<LockKeyhole />} label="Toegang" value="Beperkt" />
      </section>

      <section className="mt-8 card rounded-[2rem] p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[.25em] text-[#f6d36c]">Klantenservice</p>
            <h2 className="mt-2 text-3xl font-black">Atlas Support</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/55">
              Open hier gesprekken, klantdossiers, orderstatussen, pakjeslogs en Sorkai-checks. Productbeheer, pricing en instellingen blijven verborgen voor supportaccounts.
            </p>
          </div>
          <Link href="/atlas/support" className="btn-primary inline-flex whitespace-nowrap">
            Open Atlas Support <MessageCircle size={18} className="ml-2" />
          </Link>
        </div>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="card rounded-[2rem] p-6">
          <h2 className="text-2xl font-black">Wat je kunt doen</h2>
          <div className="mt-5 grid gap-3 text-sm leading-6 text-white/58">
            <p>• Klantgesprekken beantwoorden</p>
            <p>• Ordernummer, e-mail en track & trace controleren</p>
            <p>• Minigame pakjesstatus en logs bekijken</p>
            <p>• Sorkai als interne assistent aanroepen</p>
          </div>
        </div>
        <div className="card rounded-[2rem] p-6">
          <h2 className="text-2xl font-black">Beperkte toegang</h2>
          <p className="mt-3 text-sm leading-6 text-white/55">
            Dit account ziet geen persoonlijke winkeldata zoals wishlist, loyalty of minigame collectie. Zo blijft de accountpagina overzichtelijk en gericht op supportwerk.
          </p>
        </div>
      </section>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/atlas/support" className="btn-primary inline-flex">Open Atlas Support</Link>
        <form action="/auth/signout" method="post"><button className="rounded-full border border-white/10 px-5 py-3 text-sm font-black text-white/55 hover:bg-white/10 hover:text-white">Log out</button></form>
      </div>
    </main>
  )
}

function SupportStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="card rounded-[1.5rem] p-5"><div className="text-[#b7c8ad]">{icon}</div><p className="mt-4 text-xs font-black uppercase tracking-[.22em] text-white/35">{label}</p><p className="mt-2 text-2xl font-black">{value}</p></div>
}

function AccountStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="card rounded-[1.5rem] p-5"><div className="text-[#b7c8ad]">{icon}</div><p className="mt-4 text-xs font-black uppercase tracking-[.22em] text-white/35">{label}</p><p className="mt-2 text-3xl font-black">{value}</p></div>
}
